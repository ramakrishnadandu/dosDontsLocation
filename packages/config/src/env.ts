import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Central environment schema. The application MUST start in demo/mock mode
 * when optional external provider credentials are absent - only DATABASE_URL,
 * REDIS_URL and JWT_SECRET are required.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  // Provider credentials are all OPTIONAL. Absence => mock provider is used.
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  AMAZON_API_KEY: z.string().optional(),
  AMAZON_API_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Local/open-source model via Ollama (https://ollama.com) - no API key,
  // runs entirely on-machine. Defaults assume a locally running server.
  OLLAMA_BASE_URL: z.string().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2:3b"),

  AI_CONFIG_PATH: z.string().default("./config/ai.yaml"),
  POLICY_CONFIG_PATH: z.string().default("./config/policies.yaml"),

  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. See logs above.");
  }
  cached = parsed.data;
  return cached;
}

export function hasCredential(key: keyof Env): boolean {
  const env = loadEnv();
  const value = env[key];
  return typeof value === "string" && value.length > 0;
}
