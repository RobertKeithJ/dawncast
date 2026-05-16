import "dotenv/config";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import Papa from "papaparse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, toneCategories, quotes, languageEnum } from "@project-dailyquotes/db";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const TONE_CATEGORIES = [
  { id: "energy_action", label: "Energy & Action", weatherCodes: [0, 1, 2] },
  { id: "patience_perseverance", label: "Patience & Perseverance", weatherCodes: [3] },
  {
    id: "resilience_growth",
    label: "Resilience & Growth",
    weatherCodes: [51, 53, 55, 61, 63, 65, 80, 81, 82],
  },
  { id: "courage_strength", label: "Courage & Strength", weatherCodes: [95, 96, 99] },
  { id: "clarity_focus", label: "Clarity & Focus", weatherCodes: [45, 48] },
  { id: "rest_renewal", label: "Rest & Renewal", weatherCodes: [71, 73, 75, 77, 85, 86] },
  { id: "endurance_grit", label: "Endurance & Grit", weatherCodes: [] },
  { id: "rest_reflection", label: "Rest & Reflection", weatherCodes: [] },
];

const VALID_TONE_IDS = TONE_CATEGORIES.map((c) => c.id);

const SYSTEM_INSTRUCTION = `You are a quote tone classifier. Given a quote, return ONLY the most fitting tone category ID from this list — nothing else, no punctuation, no explanation:

energy_action
patience_perseverance
resilience_growth
courage_strength
clarity_focus
rest_renewal
endurance_grit
rest_reflection

If the quote does not fit any category meaningfully, return: skip`;

interface CsvRow {
  QUOTE?: string;
  AUTHOR?: string;
  GENRE?: string;
}

async function seedToneCategories() {
  console.log("Seeding tone categories...");
  for (const cat of TONE_CATEGORIES) {
    await db
      .insert(toneCategories)
      .values({
        id: cat.id,
        label: cat.label,
        weatherCodes: cat.weatherCodes,
      })
      .onConflictDoNothing();
  }
  console.log("Tone categories seeded.");
}

async function classifyQuote(
  genAI: GoogleGenerativeAI,
  quoteText: string,
  retryCount = 0
): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(quoteText);
    const response = result.response;
    const text = response.text().trim();

    if (text === "skip") {
      return null;
    }

    if (!VALID_TONE_IDS.includes(text)) {
      console.warn(`Invalid tone ID returned: "${text}"`);
      return null;
    }

    return text;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } };
    if (error.response?.status === 429 && retryCount < 3) {
      const waitMs = (retryCount + 1) * 5000;
      console.warn(`Rate limited (429), retry ${retryCount + 1}/3 after ${waitMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return classifyQuote(genAI, quoteText, retryCount + 1);
    }
    throw err;
  }
}

async function processQuotes() {
  console.log("Reading CSV...");
  const csvPath = join(dirname(fileURLToPath(import.meta.url)), "Quotes.csv");

  const file = await Bun.file(csvPath).text();

  const parsed = Papa.parse<CsvRow>(file, {
    header: true,
    delimiter: ";",
  });

  console.log("CSV Headers:", parsed.meta.fields);

  const rows = parsed.data;

  let totalRead = 0;
  let skippedShort = 0;
  let skippedNoClass = 0;
  let inserted = 0;

  await seedToneCategories();

  const batchSize = 10;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    const classifiedBatch: typeof quotes.$inferInsert[] = [];

    for (const row of batch) {
      const quoteText = row.QUOTE?.trim() ?? "";
      const author = row.AUTHOR?.trim() ?? "Unknown";

      totalRead++;

      if (!quoteText || quoteText.length < 20) {
        skippedShort++;
        continue;
      }

      if (!quoteText && !author) {
        skippedShort++;
        continue;
      }

      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
        const toneId = await classifyQuote(genAI, quoteText);

        if (!toneId) {
          skippedNoClass++;
        } else {
          classifiedBatch.push({
            text: quoteText,
            author,
            toneCategoryId: toneId,
            language: languageEnum.enumValues[0]!,
          });
        }
      } catch (err) {
        console.error("Gemini error:", err);
        skippedNoClass++;
      }

      await new Promise((resolve) => setTimeout(resolve, 2100));
    }

    if (classifiedBatch.length > 0) {
      await db
        .insert(quotes)
        .values(classifiedBatch)
        .onConflictDoNothing();
      inserted += classifiedBatch.length;
    }

    console.log(`Processed ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
  }

  console.log(`
Done.
Total rows read:    ${totalRead}
Skipped (short):    ${skippedShort}
Skipped (no class): ${skippedNoClass}
Inserted:           ${inserted}
`);
}

processQuotes().catch(console.error);
