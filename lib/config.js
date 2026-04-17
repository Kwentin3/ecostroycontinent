import { z } from "zod";

const TRUTHY_TOKENS = new Set(["1", "true", "on", "yes", "enabled"]);

function parseBooleanToken(value) {
  if (typeof value !== "string") {
    return false;
  }

  return TRUTHY_TOKENS.has(value.trim().toLowerCase());
}

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
  LLM_PROVIDER: z.string().trim().default(""),
  LLM_MODEL: z.string().trim().default(""),
  LLM_GEMINI_API_KEY: z.string().trim().default(""),
  LLM_GEMINI_BASE_URL: z.string().trim().default(""),
  LLM_SOCKS5_ENABLED: z.string().trim().default(""),
  LLM_SOCKS5_HOST: z.string().trim().default(""),
  LLM_SOCKS5_PORT: z.string().trim().default(""),
  LLM_SOCKS5_USERNAME: z.string().trim().default(""),
  LLM_SOCKS5_PASSWORD: z.string().trim().default(""),
  BOOTSTRAP_SUPERADMIN_USERNAME: z.string().min(1).default("superadmin"),
  BOOTSTRAP_SUPERADMIN_DISPLAY_NAME: z.string().min(1).default("System Superadmin"),
  BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN: z.string().default(""),
  PUBLIC_DISPLAY_MODE_DEBUG_OVERRIDE_ENABLED: z.string().default("")
});

let cachedConfig;

export function getAppConfig() {
  if (!cachedConfig) {
    const parsed = envSchema.parse(process.env);
    const resolvedMediaStorageDir = parsed.MEDIA_STORAGE_DIR?.trim() || "var/media";

    if (parsed.MEDIA_STORAGE_MODE === "s3") {
      const missing = [
        ["MEDIA_S3_BUCKET", parsed.MEDIA_S3_BUCKET],
        ["MEDIA_S3_REGION", parsed.MEDIA_S3_REGION],
        ["MEDIA_S3_ENDPOINT_URL", parsed.MEDIA_S3_ENDPOINT_URL],
        ["MEDIA_S3_ACCESS_KEY_ID", parsed.MEDIA_S3_ACCESS_KEY_ID],
        ["MEDIA_S3_SECRET_ACCESS_KEY", parsed.MEDIA_S3_SECRET_ACCESS_KEY],
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
      mediaStorageDir: resolvedMediaStorageDir,
      mediaS3Bucket: parsed.MEDIA_S3_BUCKET,
      mediaS3Region: parsed.MEDIA_S3_REGION,
      mediaS3EndpointUrl: parsed.MEDIA_S3_ENDPOINT_URL,
      mediaS3AccessKeyId: parsed.MEDIA_S3_ACCESS_KEY_ID,
      mediaS3SecretAccessKey: parsed.MEDIA_S3_SECRET_ACCESS_KEY,
      mediaPublicBaseUrl: parsed.MEDIA_PUBLIC_BASE_URL.replace(/\/+$/, ""),
      llmProvider: parsed.LLM_PROVIDER,
      llmModel: parsed.LLM_MODEL,
      llmGeminiApiKey: parsed.LLM_GEMINI_API_KEY,
      llmGeminiBaseUrl: parsed.LLM_GEMINI_BASE_URL,
      llmSocks5Enabled: parsed.LLM_SOCKS5_ENABLED,
      llmSocks5Host: parsed.LLM_SOCKS5_HOST,
      llmSocks5Port: parsed.LLM_SOCKS5_PORT,
      llmSocks5Username: parsed.LLM_SOCKS5_USERNAME,
      llmSocks5Password: parsed.LLM_SOCKS5_PASSWORD,
      bootstrapSuperadminUsername: parsed.BOOTSTRAP_SUPERADMIN_USERNAME,
      bootstrapSuperadminDisplayName: parsed.BOOTSTRAP_SUPERADMIN_DISPLAY_NAME,
      bootstrapSuperadminAccessToken: parsed.BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN,
      bootstrapSuperadminConfigured: parsed.BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN.length > 0,
      publicDisplayModeDebugOverrideEnabled: parsed.NODE_ENV === "production"
        ? parseBooleanToken(parsed.PUBLIC_DISPLAY_MODE_DEBUG_OVERRIDE_ENABLED)
        : true
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
