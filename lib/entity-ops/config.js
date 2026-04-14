import { z } from "zod";

const envSchema = z.object({
  APP_BASE_URL: z.string().url().optional(),
  ENTITY_OPS_BASE_URL: z.string().url().optional(),
  ENTITY_OPS_USERNAME: z.string().trim().default(""),
  ENTITY_OPS_PASSWORD: z.string().trim().default(""),
  ENTITY_OPS_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  SEED_SUPERADMIN_USERNAME: z.string().trim().default(""),
  SEED_SUPERADMIN_PASSWORD: z.string().trim().default("")
});

export function getEntityOpsConfig(env = process.env, overrides = {}) {
  const parsed = envSchema.parse(env);
  const baseUrl = String(
    overrides.baseUrl
    || parsed.ENTITY_OPS_BASE_URL
    || parsed.APP_BASE_URL
    || ""
  ).trim();
  const username = String(
    overrides.username
    || parsed.ENTITY_OPS_USERNAME
    || parsed.SEED_SUPERADMIN_USERNAME
    || ""
  ).trim();
  const password = String(
    overrides.password
    || parsed.ENTITY_OPS_PASSWORD
    || parsed.SEED_SUPERADMIN_PASSWORD
    || ""
  ).trim();
  const timeoutMs = Number(overrides.timeoutMs ?? parsed.ENTITY_OPS_TIMEOUT_MS);

  if (!baseUrl) {
    throw new Error("ENTITY_OPS_BASE_URL or APP_BASE_URL is required.");
  }

  if (!username || !password) {
    throw new Error("ENTITY_OPS_USERNAME and ENTITY_OPS_PASSWORD are required.");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    username,
    password,
    timeoutMs
  };
}
