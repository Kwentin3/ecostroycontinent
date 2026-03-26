import path from "node:path";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default(""),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().min(1).default("ecostroy_admin_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  MEDIA_STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
  MEDIA_STORAGE_DIR: z.string().default("var/media"),
  MEDIA_S3_BUCKET: z.string().default(""),
  MEDIA_S3_REGION: z.string().default("ru-3"),
  MEDIA_S3_ENDPOINT_URL: z.string().default(""),
  MEDIA_S3_ACCESS_KEY_ID: z.string().default(""),
  MEDIA_S3_SECRET_ACCESS_KEY: z.string().default(""),
  MEDIA_PUBLIC_BASE_URL: z.string().default(""),
  AWS_ACCESS_KEY_ID: z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  AWS_DEFAULT_REGION: z.string().default(""),
  AWS_ENDPOINT_URL: z.string().default(""),
  BOOTSTRAP_SUPERADMIN_USERNAME: z.string().min(1).default("superadmin"),
  BOOTSTRAP_SUPERADMIN_DISPLAY_NAME: z.string().min(1).default("System Superadmin"),
  BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN: z.string().default("")
});

let cachedConfig;

export function getAppConfig() {
  if (!cachedConfig) {
    const parsed = envSchema.parse(process.env);
    const resolvedMediaS3AccessKeyId = parsed.MEDIA_S3_ACCESS_KEY_ID || parsed.AWS_ACCESS_KEY_ID;
    const resolvedMediaS3SecretAccessKey = parsed.MEDIA_S3_SECRET_ACCESS_KEY || parsed.AWS_SECRET_ACCESS_KEY;
    const resolvedMediaS3Region = parsed.MEDIA_S3_REGION || parsed.AWS_DEFAULT_REGION;
    const resolvedMediaS3EndpointUrl = parsed.MEDIA_S3_ENDPOINT_URL || parsed.AWS_ENDPOINT_URL;
    const resolvedMediaStorageDir = parsed.MEDIA_STORAGE_DIR?.trim() || "var/media";

    if (parsed.MEDIA_STORAGE_MODE === "s3") {
      const missing = [
        ["MEDIA_S3_BUCKET", parsed.MEDIA_S3_BUCKET],
        ["MEDIA_S3_REGION or AWS_DEFAULT_REGION", resolvedMediaS3Region],
        ["MEDIA_S3_ENDPOINT_URL or AWS_ENDPOINT_URL", resolvedMediaS3EndpointUrl],
        ["MEDIA_S3_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID", resolvedMediaS3AccessKeyId],
        ["MEDIA_S3_SECRET_ACCESS_KEY or AWS_SECRET_ACCESS_KEY", resolvedMediaS3SecretAccessKey],
        ["MEDIA_PUBLIC_BASE_URL", parsed.MEDIA_PUBLIC_BASE_URL]
      ]
        .filter(([, value]) => !value.trim())
        .map(([name]) => name);

      if (missing.length > 0) {
        throw new Error(`MEDIA_STORAGE_MODE=s3 requires: ${missing.join(", ")}.`);
      }
    }

    cachedConfig = {
      nodeEnv: parsed.NODE_ENV,
      port: parsed.PORT,
      databaseUrl: parsed.DATABASE_URL,
      databaseConfigured: parsed.DATABASE_URL.length > 0,
      appBaseUrl: parsed.APP_BASE_URL,
      sessionCookieName: parsed.SESSION_COOKIE_NAME,
      sessionTtlHours: parsed.SESSION_TTL_HOURS,
      mediaStorageMode: parsed.MEDIA_STORAGE_MODE,
      mediaStorageDir: path.resolve(resolvedMediaStorageDir),
      mediaS3Bucket: parsed.MEDIA_S3_BUCKET,
      mediaS3Region: resolvedMediaS3Region,
      mediaS3EndpointUrl: resolvedMediaS3EndpointUrl,
      mediaS3AccessKeyId: resolvedMediaS3AccessKeyId,
      mediaS3SecretAccessKey: resolvedMediaS3SecretAccessKey,
      mediaPublicBaseUrl: parsed.MEDIA_PUBLIC_BASE_URL.replace(/\/+$/, ""),
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
