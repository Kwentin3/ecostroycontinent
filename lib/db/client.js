import { Pool } from "pg";

import { assertDatabaseConfigured, getAppConfig } from "../config";

let pool;

export function getDbPool() {
  if (!pool) {
    const config = assertDatabaseConfigured();

    pool = new Pool({
      connectionString: config.databaseUrl,
      max: config.nodeEnv === "development" ? 5 : 10
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const db = getDbPool();

  return db.query(text, params);
}

export async function withTransaction(run) {
  const db = getDbPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function getRuntimeConfigSnapshot() {
  const config = getAppConfig();

  return {
    nodeEnv: config.nodeEnv,
    port: config.port,
    databaseConfigured: config.databaseConfigured,
    mediaStorageMode: config.mediaStorageMode
  };
}
