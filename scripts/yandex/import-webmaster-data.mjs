#!/usr/bin/env node

import { withTransaction } from "../../lib/db/client.js";
import { isFailureStatus, loadLocalEnvFile, redactSensitive } from "./bootstrap-lib.mjs";
import { runWebmasterR3a } from "./webmaster-import-lib.mjs";

function parseArgs(argv) {
  const args = {
    mode: "dry-run",
    date1: "",
    date2: "",
    observedDate: "",
    days: undefined,
    limit: undefined
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.mode = "dry-run";
      continue;
    }

    if (arg === "--write") {
      args.mode = "write";
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

    if (arg.startsWith("--observed-date=")) {
      args.observedDate = arg.slice("--observed-date=".length);
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
    "R3A Yandex Webmaster host/indexation/query import tooling",
    "",
    "Usage:",
    "  node scripts/yandex/import-webmaster-data.mjs --dry-run [--date1=YYYY-MM-DD --date2=YYYY-MM-DD] [--observed-date=YYYY-MM-DD] [--limit=10]",
    "  node scripts/yandex/import-webmaster-data.mjs --write [--date1=YYYY-MM-DD --date2=YYYY-MM-DD] [--observed-date=YYYY-MM-DD] [--limit=10]",
    "",
    "Defaults to a dry-run over the last 14 completed Europe/Moscow dates for query analytics and today's Moscow date for snapshots.",
    "The tool uses only server-side YANDEX_WEBMASTER_OAUTH_TOKEN and redacts output."
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

  loadLocalEnvFile();

  const result = await runWebmasterR3a({
    mode: args.mode,
    env: process.env,
    withTransactionFn: withTransaction,
    date1: args.date1,
    date2: args.date2,
    observedDate: args.observedDate,
    days: args.days,
    limit: args.limit
  });

  printSafeJson({
    command: args.mode === "write" ? "webmaster-import-r3a" : "webmaster-import-dry-run",
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
