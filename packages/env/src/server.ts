import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Only required for the quote seeding script — not for the running server
    GEMINI_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
