#!/usr/bin/env node

import {
  bootstrapMetricaGoals,
  buildEnvCheck,
  buildOAuthAuthorizationUrl,
  checkMetricaAccess,
  checkWebmasterAccess,
  isFailureStatus,
  loadLocalEnvFile,
  redactSensitive
} from "./bootstrap-lib.mjs";

const COMMANDS = new Set([
  "check-env",
  "oauth-url",
  "check-metrica",
  "bootstrap-goals",
  "check-webmaster"
]);

function printUsage() {
  console.log([
    "Yandex SEO Dashboard bootstrap tooling",
    "",
    "Usage:",
    "  node scripts/yandex/bootstrap.mjs check-env",
    "  node scripts/yandex/bootstrap.mjs oauth-url",
    "  node scripts/yandex/bootstrap.mjs check-metrica",
    "  node scripts/yandex/bootstrap.mjs bootstrap-goals",
    "  node scripts/yandex/bootstrap.mjs check-webmaster",
    "",
    "The tool auto-loads .env if present, without overriding already exported environment variables.",
    "It never prints OAuth tokens or client secret."
  ].join("\n"));
}

function printSafeJson(payload) {
  // All CLI output must stay redacted: no full OAuth tokens, client secret or
  // auth code in reports/git/logs. See SEO/Yandex handoff.
  console.log(JSON.stringify(redactSensitive(payload), null, 2));
}

async function run(command) {
  loadLocalEnvFile();

  switch (command) {
    case "check-env":
      return buildEnvCheck(process.env);
    case "oauth-url":
      return buildOAuthAuthorizationUrl(process.env);
    case "check-metrica":
      return checkMetricaAccess({ env: process.env });
    case "bootstrap-goals":
      return bootstrapMetricaGoals({ env: process.env });
    case "check-webmaster":
      return checkWebmasterAccess({ env: process.env });
    default:
      return null;
  }
}

async function main() {
  const command = process.argv[2] ?? "";
  if (!COMMANDS.has(command)) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = await run(command);
  printSafeJson({
    command,
    ...result
  });

  if (isFailureStatus(result?.status)) {
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
