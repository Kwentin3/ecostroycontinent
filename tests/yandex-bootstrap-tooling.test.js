import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  bootstrapMetricaGoals,
  buildEnvCheck,
  buildOAuthCodeExchangeRequest,
  buildOAuthAuthorizationUrl,
  checkMetricaAccess,
  checkWebmasterAccess,
  diffMetricaGoals,
  maskSecret,
  redactSensitive,
  requestOAuthTokenByCode,
  summarizeOAuthTokenResponse,
  updateDotenvFileValues,
  REQUIRED_METRICA_GOALS
} from "../scripts/yandex/bootstrap-lib.mjs";

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

test("Yandex env check masks secrets and treats missing OAuth tokens as next action, not fatal", () => {
  const env = {
    YANDEX_METRICA_COUNTER_ID: "109037342",
    YANDEX_OAUTH_CLIENT_ID: "client-id-for-test",
    YANDEX_OAUTH_CLIENT_SECRET: "client-secret-must-not-leak",
    YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
  };

  const result = buildEnvCheck(env);
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "ok");
  assert.deepEqual(result.missing_required, []);
  assert.deepEqual(result.missing_oauth_tokens, [
    "YANDEX_METRICA_OAUTH_TOKEN",
    "YANDEX_WEBMASTER_OAUTH_TOKEN"
  ]);
  assert.match(serialized, /YANDEX_OAUTH_CLIENT_SECRET/);
  assert.match(serialized, /YANDEX_METRICA_OAUTH_TOKEN/);
  assert.doesNotMatch(serialized, /client-secret-must-not-leak/);
  assert.match(serialized, /109037342/);
  assert.match(serialized, /oauth-url/);
});

test("OAuth URL includes requested Yandex scopes and does not include client secret", () => {
  const result = buildOAuthAuthorizationUrl({
    YANDEX_OAUTH_CLIENT_ID: "client-id-for-test",
    YANDEX_OAUTH_CLIENT_SECRET: "client-secret-must-not-leak",
    YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
  });

  const decodedUrl = decodeURIComponent(result.auth_url);

  assert.equal(result.status, "ok");
  assert.match(decodedUrl, /response_type=code/);
  assert.match(decodedUrl, /client_id=client-id-for-test/);
  assert.match(decodedUrl, /metrika:read/);
  assert.match(decodedUrl, /metrika:write/);
  assert.match(decodedUrl, /webmaster:hostinfo/);
  assert.match(decodedUrl, /webmaster:verify/);
  assert.doesNotMatch(JSON.stringify(result), /client-secret-must-not-leak/);
});

test("Metrica goal diff avoids duplicates by action condition or existing name", () => {
  const existingGoals = [
    {
      id: 101,
      name: "Phone click",
      type: "action",
      conditions: [{ type: "exact", url: "click_to_call" }]
    },
    {
      id: 102,
      name: "cta_click",
      type: "action",
      conditions: [{ type: "action", url: "legacy_cta" }]
    }
  ];

  const diff = diffMetricaGoals(existingGoals, [
    "click_to_call",
    "cta_click",
    "form_submit"
  ]);

  assert.deepEqual(diff.already_existed.map((item) => item.goal_id), ["click_to_call"]);
  assert.deepEqual(diff.needs_review.map((item) => item.goal_id), ["cta_click"]);
  assert.deepEqual(diff.missing, ["form_submit"]);
  assert.deepEqual(diff.create_plan.map((item) => item.goal_id), ["form_submit"]);
});

test("Metrica check and Webmaster check return not_configured when tokens are missing", async () => {
  const metrica = await checkMetricaAccess({
    env: {
      YANDEX_METRICA_COUNTER_ID: "109037342"
    },
    fetchImpl: async () => {
      throw new Error("fetch should not be called without token");
    }
  });
  const webmaster = await checkWebmasterAccess({
    env: {},
    fetchImpl: async () => {
      throw new Error("fetch should not be called without token");
    }
  });

  assert.equal(metrica.status, "not_configured");
  assert.equal(metrica.counter_id, "109037342");
  assert.equal(metrica.missing.length, REQUIRED_METRICA_GOALS.length);
  assert.equal(webmaster.status, "not_configured");
});

test("Metrica bootstrap creates only missing goals and does not duplicate existing or review-needed goals", async () => {
  const postedGoals = [];
  const existingGoals = [
    {
      id: 101,
      name: "Phone click",
      type: "action",
      conditions: [{ type: "exact", url: "click_to_call" }]
    },
    {
      id: 102,
      name: "cta_click",
      type: "action",
      conditions: [{ type: "action", url: "legacy_cta" }]
    }
  ];

  const fetchImpl = async (url, options = {}) => {
    if (options.method === "POST") {
      const body = JSON.parse(options.body);
      postedGoals.push(body.goal.name);
      return jsonResponse({
        goal: {
          id: 200 + postedGoals.length,
          ...body.goal
        }
      });
    }

    const createdGoals = postedGoals.map((goalName, index) => ({
      id: 200 + index,
      name: goalName,
      type: "action",
      conditions: [{ type: "exact", url: goalName }]
    }));

    assert.match(url, /\/goals$/);
    return jsonResponse({
      goals: [...existingGoals, ...createdGoals]
    });
  };

  const result = await bootstrapMetricaGoals({
    env: {
      YANDEX_METRICA_COUNTER_ID: "109037342",
      YANDEX_METRICA_OAUTH_TOKEN: "token-must-not-leak"
    },
    fetchImpl
  });

  assert.equal(result.status, "ok");
  assert.equal(postedGoals.includes("click_to_call"), false);
  assert.equal(postedGoals.includes("cta_click"), false);
  assert.equal(postedGoals.includes("form_submit"), true);
  assert.equal(result.before.needs_review.length, 1);
  assert.equal(result.failed.length, 0);
});

test("Yandex API errors are formatted safely without token-like values", async () => {
  const result = await checkMetricaAccess({
    env: {
      YANDEX_METRICA_COUNTER_ID: "109037342",
      YANDEX_METRICA_OAUTH_TOKEN: "AQAAA-token-must-not-leak"
    },
    fetchImpl: async () => jsonResponse({
      error: "forbidden",
      access_token: "AQAAA-token-must-not-leak",
      client_secret: "client-secret-must-not-leak",
      error_message: "Access denied"
    }, { status: 403 })
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "failed");
  assert.match(result.safe_error_message, /Token lacks required permissions/);
  assert.doesNotMatch(serialized, /AQAAA-token-must-not-leak/);
  assert.doesNotMatch(serialized, /client-secret-must-not-leak/);
});

test("generic redaction removes authorization and token-like material from nested output", () => {
  const redacted = redactSensitive({
    headers: {
      authorization: "OAuth AQAAA-secret-token-value"
    },
    nested: {
      refresh_token: "1:secret",
      authorization_code: "code-must-not-leak",
      message: "Authorization: Bearer y0_super_secret_token_value",
      normal_note: "Yandex OAuth application should stay readable"
    }
  });
  const serialized = JSON.stringify(redacted);

  assert.doesNotMatch(serialized, /AQAAA-secret-token-value/);
  assert.doesNotMatch(serialized, /y0_super_secret_token_value/);
  assert.doesNotMatch(serialized, /1:secret/);
  assert.doesNotMatch(serialized, /code-must-not-leak/);
  assert.match(serialized, /OAuth application/);
});

test("OAuth code exchange validation fails safely when code or client secret is missing", () => {
  const missingCode = buildOAuthCodeExchangeRequest({
    YANDEX_OAUTH_CLIENT_ID: "client-id",
    YANDEX_OAUTH_CLIENT_SECRET: "client-secret-must-not-leak",
    YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
  }, "");
  const missingSecret = buildOAuthCodeExchangeRequest({
    YANDEX_OAUTH_CLIENT_ID: "client-id",
    YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
  }, "code-must-not-leak");
  const serialized = JSON.stringify([missingCode, missingSecret]);

  assert.equal(missingCode.status, "failed");
  assert.deepEqual(missingCode.missing, ["YANDEX_OAUTH_AUTH_CODE"]);
  assert.equal(missingSecret.status, "failed");
  assert.match(JSON.stringify(missingSecret.missing), /YANDEX_OAUTH_CLIENT_SECRET/);
  assert.doesNotMatch(serialized, /client-secret-must-not-leak/);
  assert.doesNotMatch(serialized, /code-must-not-leak/);
});

test("OAuth token response summary masks access and refresh tokens", () => {
  const summary = summarizeOAuthTokenResponse({
    token_type: "bearer",
    access_token: "AQAAA-access-token-must-not-leak",
    refresh_token: "1:refresh-token-must-not-leak",
    expires_in: 3600,
    scope: "metrika:read metrika:write"
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.status, "ok");
  assert.equal(summary.access_token_present, true);
  assert.equal(summary.refresh_token_present, true);
  assert.equal(summary.access_token_masked, maskSecret("AQAAA-access-token-must-not-leak"));
  assert.doesNotMatch(serialized, /access-token-must-not-leak/);
  assert.doesNotMatch(serialized, /refresh-token-must-not-leak/);
  assert.match(serialized, /AQAA/);
});

test("OAuth code exchange posts form data and returns raw token only to caller boundary", async () => {
  const calls = [];
  const tokenResponse = await requestOAuthTokenByCode({
    env: {
      YANDEX_OAUTH_CLIENT_ID: "client-id",
      YANDEX_OAUTH_CLIENT_SECRET: "client-secret-must-not-leak",
      YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
    },
    authorizationCode: "code-must-not-leak",
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "application/x-www-form-urlencoded");
      const body = new URLSearchParams(options.body);
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("client_id"), "client-id");
      assert.equal(body.get("client_secret"), "client-secret-must-not-leak");
      assert.equal(body.get("code"), "code-must-not-leak");
      return jsonResponse({
        access_token: "AQAAA-access-token-must-not-leak",
        refresh_token: "1:refresh-token-must-not-leak",
        token_type: "bearer"
      });
    }
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /oauth\.yandex\.ru\/token$/);
  assert.equal(tokenResponse.access_token, "AQAAA-access-token-must-not-leak");
});

test("OAuth exchange API errors are redacted before formatting", async () => {
  await assert.rejects(
    requestOAuthTokenByCode({
      env: {
        YANDEX_OAUTH_CLIENT_ID: "client-id",
        YANDEX_OAUTH_CLIENT_SECRET: "client-secret-must-not-leak",
        YANDEX_OAUTH_REDIRECT_URI: "https://oauth.yandex.ru/verification_code"
      },
      authorizationCode: "code-must-not-leak",
      fetchImpl: async () => jsonResponse({
        error: "invalid_grant",
        error_description: "invalid grant for code=code-must-not-leak",
        access_token: "AQAAA-access-token-must-not-leak",
        refresh_token: "1:refresh-token-must-not-leak",
        client_secret: "client-secret-must-not-leak"
      }, { status: 400 })
    }),
    (error) => {
      const serialized = JSON.stringify(redactSensitive(error.safeBody));
      assert.doesNotMatch(serialized, /AQAAA-access-token-must-not-leak/);
      assert.doesNotMatch(serialized, /refresh-token-must-not-leak/);
      assert.doesNotMatch(serialized, /client-secret-must-not-leak/);
      return true;
    }
  );
});

test("dotenv writer updates token keys without duplicates and keeps values out of summary", () => {
  const dir = mkdtempSync(join(tmpdir(), "yandex-env-"));
  const envPath = join(dir, ".env");

  try {
    writeFileSync(envPath, [
      "PORT=3000",
      "YANDEX_METRICA_OAUTH_TOKEN=old-token",
      "YANDEX_METRICA_OAUTH_TOKEN=duplicate-old-token",
      "YANDEX_WEBMASTER_OAUTH_TOKEN=",
      ""
    ].join("\n"), "utf8");

    const result = updateDotenvFileValues(envPath, {
      YANDEX_METRICA_OAUTH_TOKEN: "AQAAA-access-token-must-not-leak",
      YANDEX_WEBMASTER_OAUTH_TOKEN: "AQAAA-access-token-must-not-leak",
      YANDEX_OAUTH_REFRESH_TOKEN: "1:refresh-token-must-not-leak"
    });
    const text = readFileSync(envPath, "utf8");
    const serialized = JSON.stringify(result);

    assert.equal(result.status, "ok");
    assert.equal((text.match(/^YANDEX_METRICA_OAUTH_TOKEN=/gm) ?? []).length, 1);
    assert.equal((text.match(/^YANDEX_WEBMASTER_OAUTH_TOKEN=/gm) ?? []).length, 1);
    assert.equal((text.match(/^YANDEX_OAUTH_REFRESH_TOKEN=/gm) ?? []).length, 1);
    assert.match(text, /AQAAA-access-token-must-not-leak/);
    assert.match(text, /1:refresh-token-must-not-leak/);
    assert.doesNotMatch(serialized, /access-token-must-not-leak/);
    assert.doesNotMatch(serialized, /refresh-token-must-not-leak/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
