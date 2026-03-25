import path from "node:path";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default(""),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().min(1).default("ecostroy_admin_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  MEDIA_STORAGE_MODE: z.enum(["local"]).default("local"),
  MEDIA_STORAGE_DIR: z.string().min(1).default("var/media"),
  BOOTSTRAP_SUPERADMIN_USERNAME: z.string().min(1).default("superadmin"),
  BOOTSTRAP_SUPERADMIN_DISPLAY_NAME: z.string().min(1).default("System Superadmin"),
  BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN: z.string().default("")
});

let cachedConfig;

export function getAppConfig() {
  if (!cachedConfig) {
    const parsed = envSchema.parse(process.env);

    cachedConfig = {
      nodeEnv: parsed.NODE_ENV,
      port: parsed.PORT,
      databaseUrl: parsed.DATABASE_URL,
      databaseConfigured: parsed.DATABASE_URL.length > 0,
      appBaseUrl: parsed.APP_BASE_URL,
      sessionCookieName: parsed.SESSION_COOKIE_NAME,
      sessionTtlHours: parsed.SESSION_TTL_HOURS,
      mediaStorageMode: parsed.MEDIA_STORAGE_MODE,
      mediaStorageDir: path.resolve(parsed.MEDIA_STORAGE_DIR),
      bootstrapSuperadminUsername: parsed.BOOTSTRAP_SUPERADMIN_USERNAME,
      bootstrapSuperadminDisplayName: parsed.BOOTSTRAP_SUPERADMIN_DISPLAY_NAME,
      bootstrapSuperadminAccessToken: parsed.BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN,
      bootstrapSuperadminConfigured: parsed.BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN.length > 0
    };
  }

  return cachedConfig;
}

export function assertDatabaseConfigured() {
  const config = getAppConfig();

  if (!config.databaseConfigured) {
    throw new Error("DATABASE_URL is required for admin and published content operations.");
  }

  return config;
}

export function assertBootstrapConfigured() {
  const config = getAppConfig();

  if (!config.bootstrapSuperadminConfigured) {
    throw new Error("BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN is required for superadmin bootstrap operations.");
  }

  return config;
}
