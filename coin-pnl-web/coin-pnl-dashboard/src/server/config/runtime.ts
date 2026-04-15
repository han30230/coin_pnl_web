import { z } from "zod";

const RuntimeSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("UTC"),
  REFRESH_SECONDS: z.coerce.number().int().min(5).max(300).default(20),
  API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(12000),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(300).default(15),
  USE_MOCK_DATA: z
    .string()
    .optional()
    .transform((v) => v === "1" || v?.toLowerCase() === "true")
    .default("false" as unknown as boolean),
});

export type RuntimeConfig = Readonly<z.infer<typeof RuntimeSchema>>;

export function getRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  return RuntimeSchema.parse({
    NODE_ENV: env.NODE_ENV,
    APP_TIMEZONE: env.APP_TIMEZONE,
    REFRESH_SECONDS: env.REFRESH_SECONDS,
    API_TIMEOUT_MS: env.API_TIMEOUT_MS,
    CACHE_TTL_SECONDS: env.CACHE_TTL_SECONDS,
    USE_MOCK_DATA: env.USE_MOCK_DATA,
  });
}

