function parsePort(value) {
  const parsed = Number(value ?? "3000");

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return parsed;
}

export function getRuntimeConfig() {
  const port = parsePort(process.env.PORT);
  const nodeEnv = process.env.NODE_ENV ?? "production";
  const databaseUrl = process.env.DATABASE_URL ?? "";

  return {
    nodeEnv,
    port,
    databaseUrl,
    databaseConfigured: databaseUrl.length > 0
  };
}
