#!/usr/bin/env node

import { withTransaction } from "../../lib/db/client.js";
import { isFailureStatus, loadLocalEnvFile, redactSensitive } from "./bootstrap-lib.mjs";
import { runMetricaR2a, runMetricaR2b } from "./metrica-import-lib.mjs";

function parseArgs(argv) {
  const args = {
    runMode: "dry-run",
    importMode: "r2a",
    date1: "",
    date2: "",
    days: undefined,
    limit: undefined,
    maxPages: undefined,
    maxRows: undefined,
    landingMaxRows: undefined,
    attribution: undefined
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.runMode = "dry-run";
      continue;
    }

    if (arg === "--write") {
      args.runMode = "write";
      continue;
    }

    if (arg.startsWith("--mode=")) {
      args.importMode = arg.slice("--mode=".length).toLowerCase();
      continue;
    }

    if (arg.startsWith("--date1=")) {
      args.date1 = arg.slice("--date1=".length);
      continue;
    }

    if (arg.startsWith("--date2=")) {
      args.date2 = arg.slice("--date2=".length);
      continue;
    }

    if (arg.startsWith("--days=")) {
      args.days = Number(arg.slice("--days=".length));
      continue;
    }

    if (arg.startsWith("--limit=")) {
      args.limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg.startsWith("--max-pages=")) {
      args.maxPages = Number(arg.slice("--max-pages=".length));
      continue;
    }

    if (arg.startsWith("--max-rows=")) {
      args.maxRows = Number(arg.slice("--max-rows=".length));
      continue;
    }

    if (arg.startsWith("--landing-max-rows=")) {
      args.landingMaxRows = Number(arg.slice("--landing-max-rows=".length));
      continue;
    }

    if (arg.startsWith("--attribution=")) {
      args.attribution = arg.slice("--attribution=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    args.unknown ??= [];
    args.unknown.push(arg);
  }

  return args;
}

function printUsage() {
  console.log([
    "Yandex Metrica aggregate import tooling",
    "",
    "Usage:",
    "  node scripts/yandex/import-metrica-aggregates.mjs --dry-run [--mode=r2a|r2b] [--date1=YYYY-MM-DD --date2=YYYY-MM-DD]",
    "  node scripts/yandex/import-metrica-aggregates.mjs --write [--mode=r2a|r2b] [--date1=YYYY-MM-DD --date2=YYYY-MM-DD]",
    "",
    "Defaults to R2A dry-run over the last 3 completed Europe/Moscow dates.",
    "R2B adds bounded source/device/country/landing external aggregate imports.",
    "The tool uses only server-side YANDEX_METRICA_OAUTH_TOKEN and redacts output."
  ].join("\n"));
}

function printSafeJson(payload) {
  console.log(JSON.stringify(redactSensitive(payload), null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (args.unknown?.length > 0) {
    printSafeJson({
      status: "failed",
      safe_error_message: `Unknown arguments: ${args.unknown.join(", ")}`
    });
    process.exitCode = 1;
    return;
  }

  if (!["r2a", "r2b"].includes(args.importMode)) {
    printSafeJson({
      status: "failed",
      safe_error_message: `Unknown import mode: ${args.importMode}`
    });
    process.exitCode = 1;
    return;
  }

  loadLocalEnvFile();

  const runner = args.importMode === "r2b" ? runMetricaR2b : runMetricaR2a;
  const result = await runner({
    mode: args.runMode,
    env: process.env,
    withTransactionFn: withTransaction,
    date1: args.date1,
    date2: args.date2,
    days: args.days,
    limit: args.limit,
    maxPages: args.maxPages,
    maxRows: args.maxRows,
    landingMaxRows: args.landingMaxRows,
    attribution: args.attribution
  });

  printSafeJson({
    command: args.runMode === "write" ? `metrica-import-${args.importMode}` : `metrica-import-${args.importMode}-dry-run`,
    ...result
  });

  if (isFailureStatus(result.status) || result.status === "not_configured") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "failed",
    safe_error_message: redactSensitive(error.message)
  }, null, 2));
  process.exitCode = 1;
});
