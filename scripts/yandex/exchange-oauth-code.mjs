#!/usr/bin/env node

import {
  isPresent,
  loadLocalEnvFile,
  normalizeApiError,
  redactSensitive,
  requestOAuthTokenByCode,
  summarizeOAuthTokenResponse,
  updateDotenvFileValues
} from "./bootstrap-lib.mjs";

function parseArgs(argv) {
  const options = {
    code: "",
    writeEnvFile: "",
    writeTokenKeys: [],
    writeRefreshToken: false
  };

  for (const arg of argv) {
    if (arg.startsWith("--code=")) {
      options.code = arg.slice("--code=".length);
      continue;
    }

    if (arg.startsWith("--write-env-file=")) {
      options.writeEnvFile = arg.slice("--write-env-file=".length);
      continue;
    }

    if (arg.startsWith("--write-token-keys=")) {
      options.writeTokenKeys = arg
        .slice("--write-token-keys=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    if (arg === "--write-refresh-token") {
      options.writeRefreshToken = true;
    }
  }

  return options;
}

async function readStdinIfPiped(stdin = process.stdin) {
  if (stdin.isTTY) {
    return "";
  }

  let text = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) {
    text += chunk;
  }

  return text.trim();
}

function printSafeJson(payload) {
  // Token exchange output must stay redacted: no full OAuth token, refresh
  // token, client secret or auth code in reports/git/logs. See SEO/Yandex handoff.
  console.log(JSON.stringify(redactSensitive(payload), null, 2));
}

function buildWriteUpdates(tokenResponse, options) {
  const updates = {};

  if (isPresent(tokenResponse.access_token)) {
    for (const key of options.writeTokenKeys) {
      updates[key] = tokenResponse.access_token;
    }
  }

  if (options.writeRefreshToken && isPresent(tokenResponse.refresh_token)) {
    updates.YANDEX_OAUTH_REFRESH_TOKEN = tokenResponse.refresh_token;
  }

  return updates;
}

async function main() {
  loadLocalEnvFile();

  const options = parseArgs(process.argv.slice(2));
  const stdinCode = await readStdinIfPiped();
  const authorizationCode = process.env.YANDEX_OAUTH_AUTH_CODE || stdinCode || options.code;
  const unsafeCodeSource = options.code ? "cli_argument" : (process.env.YANDEX_OAUTH_AUTH_CODE ? "env" : (stdinCode ? "stdin" : "missing"));

  if (!isPresent(authorizationCode)) {
    printSafeJson({
      command: "exchange-oauth-code",
      status: "failed",
      safe_error_message: "Authorization code is missing.",
      accepted_inputs: [
        "YANDEX_OAUTH_AUTH_CODE env variable",
        "stdin",
        "--code=... CLI argument (supported, but not recommended because shell history may retain it)"
      ],
      next_actions: [
        "Run `npm run yandex:oauth-url`, authorize in Yandex and pass the one-time code through env or stdin.",
        "Do not paste the authorization code into reports, git or logs."
      ]
    });
    process.exitCode = 1;
    return;
  }

  try {
    const tokenResponse = await requestOAuthTokenByCode({
      env: process.env,
      authorizationCode
    });
    const safeSummary = summarizeOAuthTokenResponse(tokenResponse);
    const writeSummary = {
      status: "skipped",
      reason: "No --write-env-file was provided.",
      updated_keys: []
    };

    if (isPresent(options.writeEnvFile)) {
      const updates = buildWriteUpdates(tokenResponse, options);
      Object.assign(writeSummary, updateDotenvFileValues(options.writeEnvFile, updates));
      delete writeSummary.reason;
    }

    printSafeJson({
      command: "exchange-oauth-code",
      code_source: unsafeCodeSource,
      ...safeSummary,
      write_env_file: writeSummary,
      warnings: [
        ...(unsafeCodeSource === "cli_argument" ? ["CLI argument input is supported but not recommended because shell history may retain the authorization code."] : []),
        "Full access token, refresh token, client secret and authorization code are intentionally not printed."
      ]
    });
  } catch (error) {
    printSafeJson({
      command: "exchange-oauth-code",
      status: "failed",
      ...normalizeApiError(error),
      next_actions: [
        "If the code expired, generate a new OAuth URL and authorize again.",
        "Verify that YANDEX_OAUTH_CLIENT_ID, YANDEX_OAUTH_CLIENT_SECRET and YANDEX_OAUTH_REDIRECT_URI are present in server env."
      ]
    });
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    command: "exchange-oauth-code",
    status: "failed",
    safe_error_message: redactSensitive(error.message)
  }, null, 2));
  process.exitCode = 1;
});
