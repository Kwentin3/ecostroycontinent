import fs from "node:fs/promises";
import path from "node:path";

import { getAppConfig } from "../config";

async function ensureStorageDir() {
  const config = getAppConfig();
  await fs.mkdir(config.mediaStorageDir, { recursive: true });
  return config.mediaStorageDir;
}

export async function storeMediaFile({ storageKey, bytes }) {
  const dir = await ensureStorageDir();
  const targetPath = path.join(dir, storageKey);
  await fs.writeFile(targetPath, bytes);
}

export async function readMediaFile(storageKey) {
  const dir = await ensureStorageDir();
  const targetPath = path.join(dir, storageKey);
  return fs.readFile(targetPath);
}
