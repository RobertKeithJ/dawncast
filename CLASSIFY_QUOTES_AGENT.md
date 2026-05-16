# Agent Task: Quote Classifier & Seed Script

## Read First

Read `AGENTS.md` at the project root in full before doing anything. It is the
source of truth for commands, structure, and conventions. This prompt extends it —
it does not replace it.

---

## What You Are Building

A one-shot seed script that:
1. Reads `apps/server/scripts/raw-quotes.csv` — a raw dataset of quotes
2. Calls the **Gemini API** to classify each quote into a tone category
3. Inserts tone categories + classified quotes into the PostgreSQL database
   via **Drizzle ORM**

This script is a dev utility. It runs once manually. It is not part of the server
runtime and must not affect `apps/web/` in any way.

---

## Step 1 — Inspect Before Writing

Do this before touching any file:

- Read `packages/db/` fully — understand the existing schema structure, how the
  Drizzle client is exported, and what tables already exist
- Read `packages/env/server.ts` — understand how env vars are validated and
  exported for server-side use
- Read `apps/server/package.json` — check existing scripts and dependencies
- Read `apps/server/src/index.ts` — understand the Elysia setup and any
  existing patterns
- Check if `packages/db/src/schema/` exists and what files are inside
- Do NOT assume any file structure beyond what AGENTS.md describes. Verify first.

---

## Step 2 — Drizzle Schema

Schema files live in `packages/db/`. Find the schema directory by reading the
package first. Follow the exact same file naming and export conventions already
used there.

Create or update two schema files:

### `tone-categories` table
Columns:
- `id` — `text`, primary key, human-readable slug e.g. `"resilience_growth"`
- `label` — `text`, not null e.g. `"Resilience & Growth"`
- `description` — `text`, nullable
- `weather_codes` — `jsonb`, typed as `number[]`, not null
- `created_at` — `timestamp with time zone`, not null, `defaultNow()`

### `quotes` table
Columns:
- `id` — `uuid`, primary key, `defaultRandom()`
- `text` — `text`, not null
- `author` — `text`, not null, default `"Unknown"`
- `tone_category_id` — `text`, not null, foreign key → `tone_categories.id`
- `language` — `pgEnum("language", ["en", "fil"])`, not null, default `"en"`
- `is_active` — `boolean`, not null, default `true`
- `created_at` — `timestamp with time zone`, not null, `defaultNow()`

After adding the schema files:
- Export them from the package's barrel/index file (wherever existing schemas
  are exported from — find it, don't guess)
- Run `pnpm run db:push` from the project root to push the schema to the database
- Confirm it succeeds before moving on

> If either table already exists in the schema, read it first and modify in place.

---

## Step 3 — Environment Variable

`packages/env/server.ts` handles server-side env validation. Add `GEMINI_API_KEY`
there following the exact same pattern already used for other variables.

Then add the actual value to `apps/server/.env`:

```env
# Google AI Studio — classifier script only, not used at runtime
GEMINI_API_KEY=your_key_here
```

Do NOT add `GEMINI_API_KEY` to anything inside `apps/web/` or `packages/env/web.ts`.
Vite exposes web env vars to the browser at build time.

---

## Step 4 — Install Dependencies

Check `apps/server/package.json` first. Only install what is missing:

- `@google/generative-ai` — Gemini SDK
- `papaparse` — CSV parser
- `@types/papaparse` — devDependency

Install from the project root using pnpm workspace filter:

```bash
pnpm add @google/generative-ai papaparse --filter @project-dailyquotes/server
pnpm add -D @types/papaparse --filter @project-dailyquotes/server
```

Verify the filter name matches the `name` field in `apps/server/package.json`
before running.

---

## Step 5 — Write the Classifier Script

Create `apps/server/scripts/classify-quotes.ts`.

### Full behavior

**1. Read the CSV**
- File path: `apps/server/scripts/raw-quotes.csv`
- Use `papaparse` with `header: true` to parse
- Read the actual column headers from the file first — do not hardcode `quote`
  or `text` without checking. Log the headers on first run so it's visible.
- Skip any row where the quote text is empty or shorter than 20 characters
- Skip any row where both the quote and author fields are missing

**2. Seed tone categories**
- Insert all 8 tone categories before processing any quotes
- Use `onConflictDoNothing()` so re-runs are safe
- The full category list with their WMO weather code arrays:

  | id | label | weatherCodes |
  |----|-------|-------------|
  | `energy_action` | Energy & Action | `[0, 1, 2]` |
  | `patience_perseverance` | Patience & Perseverance | `[3]` |
  | `resilience_growth` | Resilience & Growth | `[51, 53, 55, 61, 63, 65, 80, 81, 82]` |
  | `courage_strength` | Courage & Strength | `[95, 96, 99]` |
  | `clarity_focus` | Clarity & Focus | `[45, 48]` |
  | `rest_renewal` | Rest & Renewal | `[71, 73, 75, 77, 85, 86]` |
  | `endurance_grit` | Endurance & Grit | `[]` |
  | `rest_reflection` | Rest & Reflection | `[]` |

  > `endurance_grit` and `rest_reflection` have empty arrays intentionally —
  > they are triggered by temperature threshold and local time respectively,
  > not by WMO code.

**3. Classify quotes using Gemini**
- Model: `gemini-2.0-flash`
- Import the Gemini client from `@google/generative-ai`
- Read `GEMINI_API_KEY` from env through `packages/env/server.ts` if it exports
  it there — otherwise fall back to `process.env.GEMINI_API_KEY` directly
- System instruction to the model (set as `systemInstruction` on the model):

  ```
  You are a quote tone classifier. Given a quote, return ONLY the most fitting
  tone category ID from this list — nothing else, no punctuation, no explanation:

  energy_action
  patience_perseverance
  resilience_growth
  courage_strength
  clarity_focus
  rest_renewal
  endurance_grit
  rest_reflection

  If the quote does not fit any category meaningfully, return: skip
  ```

- After receiving the model response, trim whitespace and validate it strictly
  against the known ID list. If it is not a valid ID and not `"skip"`, discard
  and log a warning.

**4. Batch processing**
- Process in batches of 10 quotes
- Use `Promise.all` within each batch for concurrent calls
- After each batch, wait **4500ms** before the next one (free tier: 15 RPM)
- Log to console after each batch: `Processed X / Y`

**5. Insert into database**
- Import the `db` client and schema from `packages/db` using the workspace
  package name found in `packages/db/package.json`
- Use `onConflictDoNothing()` on the insert
- Set `language: "en"` for all CSV quotes
- Collect all valid classified quotes across all batches, then do a single
  bulk insert at the end

**6. Summary log**
At the end, print:
```
Done.
Total rows read:    X
Skipped (short):    X
Skipped (no class): X
Inserted:           X
```

### Error handling
- Wrap each individual Gemini call in try/catch — one failure must not abort
  the run. Log the error and skip that quote.
- If the DB insert fails, throw — something structural is wrong and the user
  needs to know immediately.
- If `GEMINI_API_KEY` is missing from env, throw immediately with a clear message
  before any processing begins.

---

## Step 6 — Add Script to package.json

In `apps/server/package.json`, add under `"scripts"`:

```json
"seed:quotes": "bun run scripts/classify-quotes.ts"
```

Check existing script entries first — if they use a different runner for `.ts`
files, match that pattern instead.

---

## Step 7 — Type Check

Run `pnpm run check-types` from the project root. Fix any TypeScript errors before
finishing. Do not leave the codebase in a broken type state.

---

## Step 8 — Report Back

When done, summarize:
- Which files were created
- Which files were modified
- Whether `db:push` succeeded
- Whether `check-types` passed
- The exact command the user should run to execute the script

Do NOT run `seed:quotes` against the real database. Leave that to the user.

---

## Hard Constraints

- Only touch `apps/server/scripts/`, `packages/db/`, and `packages/env/server.ts`
- Do NOT modify `apps/web/` for any reason
- Do NOT modify root `turbo.json` unless a pipeline entry is strictly required
  to make `seed:quotes` work — if so, explain why before doing it
- Do NOT use raw `fetch` to call the Gemini API — use `@google/generative-ai`
- Do NOT hardcode any secrets or connection strings
- Do NOT run `db:migrate` — use `db:push` as specified in AGENTS.md
