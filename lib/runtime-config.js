import { getAppConfig } from "./config";

export function getRuntimeConfig() {
  const config = getAppConfig();

  return {
    nodeEnv: config.nodeEnv,
    port: config.port,
    databaseUrl: config.databaseUrl,
    databaseConfigured: config.databaseConfigured,
    mediaStorageMode: config.mediaStorageMode
  };
}
