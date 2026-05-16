import { fileURLToPath } from "url";
import { join, dirname } from "path";
import Papa from "papaparse";

const csvPath = join(dirname(fileURLToPath(import.meta.url)), "Quotes.csv");

const file = await Bun.file(csvPath).text();

const parsed = Papa.parse(file, {
  header: true,
  delimiter: ";",
});

const rows = parsed.data as { QUOTE?: string; AUTHOR?: string; GENRE?: string }[];

const cleaned = rows.map((row) => ({
  QUOTE: row.QUOTE,
  AUTHOR: row.AUTHOR,
}));

const output = Papa.unparse(cleaned, {
  delimiter: ";",
});

const outPath = join(dirname(fileURLToPath(import.meta.url)), "Quotes.csv");
await Bun.write(outPath, output);

console.log(`Done. ${cleaned.length} rows written.`);