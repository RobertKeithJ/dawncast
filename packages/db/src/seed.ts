/**
 * Seed script — run with: bun run src/seed.ts (from packages/db/)
 * Populates tone_categories and quotes tables.
 */
import { db } from "./index";
import { toneCategories, quotes } from "./schema";

const TONE_CATEGORIES = [
  {
    id: "energy_action",
    label: "Energy & Action",
    description: "For clear, sunny weather — motivates movement and momentum.",
    weatherCodes: [0, 1, 2],
  },
  {
    id: "patience_perseverance",
    label: "Patience & Perseverance",
    description: "For overcast skies — encourages steady progress.",
    weatherCodes: [3],
  },
  {
    id: "resilience_growth",
    label: "Resilience & Growth",
    description: "For rainy or drizzly weather — strength through adversity.",
    weatherCodes: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  },
  {
    id: "courage_strength",
    label: "Courage & Strength",
    description: "For thunderstorms — bravery in the face of intensity.",
    weatherCodes: [95, 96, 99],
  },
  {
    id: "clarity_focus",
    label: "Clarity & Focus",
    description: "For foggy conditions — finding direction through the haze.",
    weatherCodes: [45, 48],
  },
  {
    id: "rest_renewal",
    label: "Rest & Renewal",
    description: "For snowy weather — permission to slow down and restore.",
    weatherCodes: [71, 73, 75, 77, 85, 86],
  },
  {
    id: "general_motivation",
    label: "General Motivation",
    description: "Fallback pool — timeless inspiration for any condition.",
    weatherCodes: [],
  },
  {
    id: "endurance_grit",
    label: "Endurance & Grit",
    description: "For extreme heat — power through the burn.",
    weatherCodes: [],
  },
  {
    id: "rest_reflection",
    label: "Rest & Reflection",
    description: "For nighttime — stillness, introspection, and recovery.",
    weatherCodes: [],
  },
] as const;

const QUOTES: Array<{ text: string; author: string; toneCategoryId: string }> = [
  // energy_action
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", toneCategoryId: "energy_action" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", toneCategoryId: "energy_action" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", toneCategoryId: "energy_action" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", toneCategoryId: "energy_action" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", toneCategoryId: "energy_action" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", toneCategoryId: "energy_action" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt", toneCategoryId: "energy_action" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery", toneCategoryId: "energy_action" },

  // patience_perseverance
  { text: "A river cuts through rock not because of its power, but because of its persistence.", author: "Jim Watkins", toneCategoryId: "patience_perseverance" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy", toneCategoryId: "patience_perseverance" },
  { text: "He that can have patience can have what he will.", author: "Benjamin Franklin", toneCategoryId: "patience_perseverance" },
  { text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.", author: "Joyce Meyer", toneCategoryId: "patience_perseverance" },
  { text: "All great achievements require time.", author: "Maya Angelou", toneCategoryId: "patience_perseverance" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson", toneCategoryId: "patience_perseverance" },
  { text: "Patience, persistence and perspiration make an unbeatable combination for success.", author: "Napoleon Hill", toneCategoryId: "patience_perseverance" },
  { text: "The key to everything is patience. You get the chicken by hatching the egg, not by smashing it.", author: "Arnold H. Glasow", toneCategoryId: "patience_perseverance" },

  // resilience_growth
  { text: "Do not judge me by my successes; judge me by how many times I fell down and got back up again.", author: "Nelson Mandela", toneCategoryId: "resilience_growth" },
  { text: "You may have to fight a battle more than once to win it.", author: "Margaret Thatcher", toneCategoryId: "resilience_growth" },
  { text: "Life doesn't get easier or more forgiving; we get stronger and more resilient.", author: "Steve Maraboli", toneCategoryId: "resilience_growth" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller", toneCategoryId: "resilience_growth" },
  { text: "The oak fought the wind and was broken; the willow bent when it must and survived.", author: "Robert Jordan", toneCategoryId: "resilience_growth" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", toneCategoryId: "resilience_growth" },
  { text: "Out of difficulties grow miracles.", author: "Jean de La Bruyère", toneCategoryId: "resilience_growth" },
  { text: "The wound is the place where the light enters you.", author: "Rumi", toneCategoryId: "resilience_growth" },

  // courage_strength
  { text: "It is not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary", toneCategoryId: "courage_strength" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela", toneCategoryId: "courage_strength" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy", toneCategoryId: "courage_strength" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", toneCategoryId: "courage_strength" },
  { text: "You never know how strong you are until being strong is your only choice.", author: "Bob Marley", toneCategoryId: "courage_strength" },
  { text: "Be strong enough to stand alone, smart enough to know when you need help, and brave enough to ask for it.", author: "Ziad K. Abdelnour", toneCategoryId: "courage_strength" },
  { text: "The storm is a good opportunity for the pine and the cypress to show their strength and their stability.", author: "Ho Chi Minh", toneCategoryId: "courage_strength" },
  { text: "He who is not courageous enough to take risks will accomplish nothing in life.", author: "Muhammad Ali", toneCategoryId: "courage_strength" },

  // clarity_focus
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", toneCategoryId: "clarity_focus" },
  { text: "Clarity is the most important thing. I can compare clarity to pruning in gardening.", author: "Diane von Furstenberg", toneCategoryId: "clarity_focus" },
  { text: "Wherever you are, be all there.", author: "Jim Elliot", toneCategoryId: "clarity_focus" },
  { text: "The key to success is to focus our conscious mind on things we desire not things we fear.", author: "Brian Tracy", toneCategoryId: "clarity_focus" },
  { text: "Your mind will answer most questions if you learn to relax and wait for the answer.", author: "William S. Burroughs", toneCategoryId: "clarity_focus" },
  { text: "When you have clarity of intention, the universe conspires with you to make it happen.", author: "Fabienne Fredrickson", toneCategoryId: "clarity_focus" },
  { text: "It is not enough to be busy; the question is: what are we busy about?", author: "Henry David Thoreau", toneCategoryId: "clarity_focus" },
  { text: "Focus on what matters and let go of what does not.", author: "Marcus Aurelius", toneCategoryId: "clarity_focus" },

  // rest_renewal
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston", toneCategoryId: "rest_renewal" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", toneCategoryId: "rest_renewal" },
  { text: "Sleep is the best meditation.", author: "Dalai Lama", toneCategoryId: "rest_renewal" },
  { text: "There is virtue in work and there is virtue in rest. Use both and overlook neither.", author: "Alan Cohen", toneCategoryId: "rest_renewal" },
  { text: "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day is by no means a waste of time.", author: "John Lubbock", toneCategoryId: "rest_renewal" },
  { text: "Take rest; a field that has rested gives a bountiful crop.", author: "Ovid", toneCategoryId: "rest_renewal" },
  { text: "Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow.", author: "Eleanor Brownn", toneCategoryId: "rest_renewal" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", toneCategoryId: "rest_renewal" },

  // general_motivation
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", toneCategoryId: "general_motivation" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", toneCategoryId: "general_motivation" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", toneCategoryId: "general_motivation" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", toneCategoryId: "general_motivation" },
  { text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do.", author: "Mark Twain", toneCategoryId: "general_motivation" },
  { text: "In the end, it's not the years in your life that count; it's the life in your years.", author: "Abraham Lincoln", toneCategoryId: "general_motivation" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa", toneCategoryId: "general_motivation" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt", toneCategoryId: "general_motivation" },

  // endurance_grit
  { text: "A winner is just a loser who tried one more time.", author: "George M. Moore Jr.", toneCategoryId: "endurance_grit" },
  { text: "Do not pray for an easy life; pray for the strength to endure a difficult one.", author: "Bruce Lee", toneCategoryId: "endurance_grit" },
  { text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.", author: "Martin Luther King Jr.", toneCategoryId: "endurance_grit" },
  { text: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves to the task.", author: "Vince Lombardi", toneCategoryId: "endurance_grit" },
  { text: "Comfort is the enemy of achievement.", author: "Farrah Gray", toneCategoryId: "endurance_grit" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", toneCategoryId: "endurance_grit" },
  { text: "Grit is that 'extra something' that separates the most successful people from the rest.", author: "Travis Bradberry", toneCategoryId: "endurance_grit" },
  { text: "Sweat is the cologne of accomplishment.", author: "Heywood Hale Broun", toneCategoryId: "endurance_grit" },

  // rest_reflection
  { text: "The night is more alive and more richly colored than the day.", author: "Vincent Van Gogh", toneCategoryId: "rest_reflection" },
  { text: "Stars can't shine without darkness.", author: "Unknown", toneCategoryId: "rest_reflection" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass", toneCategoryId: "rest_reflection" },
  { text: "In the stillness of the night, the soul prepares for the richness of tomorrow.", author: "Unknown", toneCategoryId: "rest_reflection" },
  { text: "To be beautiful means to be yourself. You don't need to be accepted by others. You need to accept yourself.", author: "Thich Nhat Hanh", toneCategoryId: "rest_reflection" },
  { text: "At night, I open the window and ask the moon to come and press its face against mine.", author: "Rumi", toneCategoryId: "rest_reflection" },
  { text: "Look up at the stars and not down at your feet. Try to make sense of what you see.", author: "Stephen Hawking", toneCategoryId: "rest_reflection" },
  { text: "The most beautiful thing we can experience is the mysterious. It is the source of all true art and science.", author: "Albert Einstein", toneCategoryId: "rest_reflection" },
];

async function seed() {
  console.log("🌱 Seeding tone_categories...");
  await db
    .insert(toneCategories)
    .values(TONE_CATEGORIES.map((tc) => ({ ...tc, weatherCodes: tc.weatherCodes as number[] })))
    .onConflictDoUpdate({
      target: toneCategories.id,
      set: {
        label: toneCategories.label,
        description: toneCategories.description,
      },
    });
  console.log(`✅ Upserted ${TONE_CATEGORIES.length} tone categories.`);

  console.log("🌱 Seeding quotes...");
  await db
    .insert(quotes)
    .values(QUOTES.map((q) => ({ ...q, language: "en" as const })))
    .onConflictDoNothing();
  console.log(`✅ Inserted up to ${QUOTES.length} quotes.`);

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
