import { checkDatabaseConnectivity } from "../db/client.js";
import { getRuntimeConfig } from "../runtime-config.js";

const SERVICE_NAME = "next-app";

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function buildRuntimeMarker({ env = process.env } = {}) {
  return {
    node: process.version,
    version: nonEmpty(env.APP_VERSION) || nonEmpty(env.npm_package_version),
    commit:
      nonEmpty(env.APP_COMMIT_SHA)
      || nonEmpty(env.GITHUB_SHA)
      || nonEmpty(env.VERCEL_GIT_COMMIT_SHA)
      || null
  };
}

async function probeDatabase({ config, queryFn }) {
  if (!config.databaseConfigured) {
    return { status: "not_configured" };
  }

  try {
    const ok = await checkDatabaseConnectivity({ queryFn });
    return { status: ok ? "ok" : "error" };
  } catch {
    return { status: "error" };
  }
}

export async function buildReadinessSnapshot({
  config = getRuntimeConfig(),
  queryFn,
  now = () => new Date(),
  env = process.env
} = {}) {
  const timestamp = now().toISOString();
  const database = await probeDatabase({ config, queryFn });
  const ready = database.status === "ok";

  return {
    httpStatus: ready ? 200 : 503,
    body: {
      status: ready ? "ready" : "not_ready",
      service: SERVICE_NAME,
      nodeEnv: config.nodeEnv,
      timestamp,
      database,
      runtime: buildRuntimeMarker({ env })
    }
  };
}
