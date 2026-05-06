import { checkDatabaseConnectivity } from "../db/client.js";
import { getRuntimeConfig } from "../runtime-config.js";

const SERVICE_NAME = "next-app";

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function safeVersion(value) {
  const marker = nonEmpty(value);

  if (!marker || !/^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$/.test(marker)) {
    return null;
  }

  return marker;
}

function safeCommit(value) {
  const marker = nonEmpty(value);

  if (!marker || !/^[0-9a-f]{7,40}$/i.test(marker)) {
    return null;
  }

  return marker.toLowerCase();
}

function safeBuildTime(value) {
  const marker = nonEmpty(value);

  if (!marker || marker.length > 64) {
    return null;
  }

  const parsed = new Date(marker);

  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return marker;
}

export function buildRuntimeMarker({ env = process.env } = {}) {
  return {
    node: process.version,
    version: safeVersion(env.APP_VERSION) || safeVersion(env.npm_package_version),
    commit:
      safeCommit(env.APP_COMMIT_SHA)
      || safeCommit(env.GITHUB_SHA)
      || safeCommit(env.VERCEL_GIT_COMMIT_SHA)
      || null,
    buildTime: safeBuildTime(env.BUILD_TIME)
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
