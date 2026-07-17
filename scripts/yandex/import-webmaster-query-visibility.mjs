#!/usr/bin/env node

import { withTransaction } from "../../lib/db/client.js";
import { isFailureStatus, loadLocalEnvFile, redactSensitive } from "./bootstrap-lib.mjs";
import { runWebmasterR3b } from "./webmaster-import-lib.mjs";

function parseArgs(argv) {
  const args = {
    mode: "dry-run",
    date1: "",
    date2: "",
    days: undefined,
    limit: undefined,
    maxPages: undefined,
    textIndicator: "URL",
    strategy: "auto"
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

    if (arg.startsWith("--text-indicator=")) {
      args.textIndicator = arg.slice("--text-indicator=".length).toUpperCase();
      continue;
    }

    if (arg.startsWith("--strategy=")) {
      args.strategy = arg.slice("--strategy=".length).toLowerCase();
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
    "R3B Yandex Webmaster query/page visibility import tooling",
    "",
    "Usage:",
    "  node scripts/yandex/import-webmaster-query-visibility.mjs --dry-run [--date1=YYYY-MM-DD --date2=YYYY-MM-DD] [--limit=100] [--max-pages=2]",
    "  node scripts/yandex/import-webmaster-query-visibility.mjs --write [--date1=YYYY-MM-DD --date2=YYYY-MM-DD] [--limit=100] [--max-pages=2]",
    "",
    "Defaults to synchronous query-analytics/list fallback after checking advanced export beta capabilities.",
    "The tool writes only aggregate Webmaster query/page visibility rows and source sync state.",
    "It uses only server-side YANDEX_WEBMASTER_OAUTH_TOKEN and redacts output."
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

  const result = await runWebmasterR3b({
    mode: args.mode,
    env: process.env,
    withTransactionFn: withTransaction,
    date1: args.date1,
    date2: args.date2,
    days: args.days,
    limit: args.limit,
    maxPages: args.maxPages,
    textIndicator: args.textIndicator,
    strategy: args.strategy
  });

  printSafeJson({
    command: args.mode === "write" ? "webmaster-query-import-r3b" : "webmaster-query-import-dry-run",
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
