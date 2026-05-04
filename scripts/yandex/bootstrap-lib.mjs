import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export const YANDEX_OAUTH_SCOPES = [
  "metrika:read",
  "metrika:write",
  "webmaster:hostinfo",
  "webmaster:verify"
];

export const REQUIRED_ENV_KEYS = [
  "YANDEX_METRICA_COUNTER_ID",
  "YANDEX_OAUTH_CLIENT_ID",
  "YANDEX_OAUTH_CLIENT_SECRET",
  "YANDEX_OAUTH_REDIRECT_URI"
];

export const OPTIONAL_ENV_KEYS = [
  "YANDEX_METRICA_OAUTH_TOKEN",
  "YANDEX_WEBMASTER_OAUTH_TOKEN",
  "YANDEX_WEBMASTER_HOST_ID",
  "YANDEX_OAUTH_REFRESH_TOKEN",
  "PUBLIC_SITE_URL"
];

export const SECRET_ENV_KEYS = new Set([
  "YANDEX_OAUTH_CLIENT_SECRET",
  "YANDEX_METRICA_OAUTH_TOKEN",
  "YANDEX_WEBMASTER_OAUTH_TOKEN",
  "YANDEX_OAUTH_REFRESH_TOKEN"
]);

export const DISPLAY_VALUE_ENV_KEYS = new Set([
  "YANDEX_METRICA_COUNTER_ID",
  "NEXT_PUBLIC_YANDEX_METRICA_COUNTER_ID",
  "NEXT_PUBLIC_YANDEX_METRICA_ENABLED",
  "PUBLIC_SITE_URL",
  "YANDEX_WEBMASTER_HOST_ID"
]);

export const REQUIRED_METRICA_GOALS = [
  "click_to_call",
  "click_to_telegram",
  "click_to_whatsapp",
  "form_start",
  "form_submit",
  "cta_click",
  "contact_link_click",
  "gallery_open",
  "faq_expand",
  "case_card_click",
  "service_link_click"
];

const DEFAULT_MISSING_TOKEN_NEXT_ACTION = [
  "Run `npm run yandex:oauth-url`, authorize in Yandex, then store the OAuth token only in server/local env.",
  "If one token has both Metrica and Webmaster scopes, it may be copied into both server-only token env keys."
];

function stripBom(value) {
  return value.replace(/^\uFEFF/, "");
}

function parseDotenvLine(line) {
  const cleaned = stripBom(line);
  const trimmed = cleaned.trim();

  if (!trimmed || trimmed.startsWith("#") || !cleaned.includes("=")) {
    return null;
  }

  const index = cleaned.indexOf("=");
  const key = cleaned.slice(0, index).trim();
  let value = cleaned.slice(index + 1).trim();

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return key ? { key, value } : null;
}

export function loadLocalEnvFile({ env = process.env, path = ".env", override = false } = {}) {
  const absolutePath = resolve(path);
  if (!existsSync(absolutePath)) {
    return { loaded: false, path: absolutePath, keysLoaded: [] };
  }

  const keysLoaded = [];
  const text = readFileSync(absolutePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseDotenvLine(line);
    if (!parsed) {
      continue;
    }

    if (override || env[parsed.key] === undefined) {
      env[parsed.key] = parsed.value;
      keysLoaded.push(parsed.key);
    }
  }

  return { loaded: true, path: absolutePath, keysLoaded };
}

export function isPresent(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function maskEnvValue(key, value) {
  if (!isPresent(value)) {
    return "";
  }

  if (SECRET_ENV_KEYS.has(key)) {
    return "present";
  }

  if (DISPLAY_VALUE_ENV_KEYS.has(key)) {
    return value;
  }

  return "present";
}

export function buildEnvCheck(env = process.env) {
  const required = REQUIRED_ENV_KEYS.map((key) => ({
    key,
    required: true,
    status: isPresent(env[key]) ? "present" : "missing",
    value: maskEnvValue(key, env[key])
  }));
  const optional = OPTIONAL_ENV_KEYS.map((key) => ({
    key,
    required: false,
    status: isPresent(env[key]) ? "present" : "missing",
    value: maskEnvValue(key, env[key])
  }));
  const missingRequired = required.filter((item) => item.status === "missing").map((item) => item.key);
  const missingTokens = optional
    .filter((item) => item.status === "missing" && item.key.endsWith("_OAUTH_TOKEN"))
    .map((item) => item.key);

  return {
    status: missingRequired.length > 0 ? "failed" : "ok",
    required,
    optional,
    missing_required: missingRequired,
    missing_oauth_tokens: missingTokens,
    next_actions: [
      ...(missingRequired.length > 0 ? ["Fill missing required Yandex env keys before API checks."] : []),
      ...(missingTokens.length > 0 ? DEFAULT_MISSING_TOKEN_NEXT_ACTION : [])
    ]
  };
}

export function buildOAuthAuthorizationUrl(env = process.env, options = {}) {
  const clientId = env.YANDEX_OAUTH_CLIENT_ID;
  if (!isPresent(clientId)) {
    return {
      status: "failed",
      safe_error_message: "YANDEX_OAUTH_CLIENT_ID is missing."
    };
  }

  const responseType = options.responseType ?? "code";
  const url = new URL("https://oauth.yandex.ru/authorize");
  url.searchParams.set("response_type", responseType);
  url.searchParams.set("client_id", clientId.trim());
  url.searchParams.set("scope", YANDEX_OAUTH_SCOPES.join(" "));

  if (isPresent(env.YANDEX_OAUTH_REDIRECT_URI)) {
    url.searchParams.set("redirect_uri", env.YANDEX_OAUTH_REDIRECT_URI.trim());
  }

  return {
    status: "ok",
    response_type: responseType,
    auth_url: url.toString(),
    required_scopes: [...YANDEX_OAUTH_SCOPES],
    manual_steps: [
      "Open the authorization URL in a browser and authorize with the Yandex account that owns the Metrica counter and Webmaster host.",
      "Do not paste authorization codes, OAuth tokens or client secret into chats, reports or logs.",
      "Exchange the authorization code for an OAuth token using a secure operator flow.",
      "Store the token in server-only env: YANDEX_METRICA_OAUTH_TOKEN and, if it has Webmaster scopes, YANDEX_WEBMASTER_OAUTH_TOKEN.",
      "Rerun `npm run yandex:check-metrica` and `npm run yandex:check-webmaster`."
    ],
    notes: [
      "Yandex OAuth only grants scopes that are allowed for the OAuth application.",
      "The client secret is intentionally not printed."
    ]
  };
}

export function maskSecret(value) {
  if (!isPresent(value)) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length <= 8) {
    return "[masked]";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function buildOAuthCodeExchangeRequest(env = process.env, authorizationCode = "") {
  const missing = [];

  if (!isPresent(authorizationCode)) {
    missing.push("YANDEX_OAUTH_AUTH_CODE");
  }

  for (const key of [
    "YANDEX_OAUTH_CLIENT_ID",
    "YANDEX_OAUTH_CLIENT_SECRET",
    "YANDEX_OAUTH_REDIRECT_URI"
  ]) {
    if (!isPresent(env[key])) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    return {
      status: "failed",
      missing,
      safe_error_message: "Missing required OAuth exchange input."
    };
  }

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", authorizationCode.trim());
  body.set("client_id", env.YANDEX_OAUTH_CLIENT_ID.trim());
  body.set("client_secret", env.YANDEX_OAUTH_CLIENT_SECRET.trim());

  return {
    status: "ok",
    url: "https://oauth.yandex.ru/token",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    redirect_uri_present: true
  };
}

export async function requestOAuthTokenByCode({
  env = process.env,
  authorizationCode = "",
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new YandexApiError("fetch is unavailable in this Node runtime.");
  }

  const request = buildOAuthCodeExchangeRequest(env, authorizationCode);
  if (request.status !== "ok") {
    throw new YandexApiError(request.safe_error_message, {
      safeBody: {
        missing: request.missing
      }
    });
  }

  let response;
  try {
    response = await fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  } catch (error) {
    throw new YandexApiError(`Network error while calling Yandex OAuth: ${error.message}`);
  }

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new YandexApiError(`Yandex OAuth returned HTTP ${response.status}.`, {
      status: response.status,
      safeBody: redactSensitive(parsed)
    });
  }

  if (!parsed || typeof parsed !== "object" || !isPresent(parsed.access_token)) {
    throw new YandexApiError("Yandex OAuth response did not include an access token.", {
      safeBody: redactSensitive(parsed)
    });
  }

  return parsed;
}

export function summarizeOAuthTokenResponse(tokenResponse = {}) {
  const accessToken = typeof tokenResponse.access_token === "string" ? tokenResponse.access_token : "";
  const refreshToken = typeof tokenResponse.refresh_token === "string" ? tokenResponse.refresh_token : "";

  return {
    status: "ok",
    token_type: tokenResponse.token_type ?? null,
    access_token_present: isPresent(accessToken),
    access_token_masked: maskSecret(accessToken),
    refresh_token_present: isPresent(refreshToken),
    refresh_token_masked: maskSecret(refreshToken),
    expires_in: tokenResponse.expires_in ?? null,
    scope: tokenResponse.scope ?? null,
    next_actions: [
      "Store the access token only in server env/secrets.",
      "Use YANDEX_METRICA_OAUTH_TOKEN for Metrica API checks.",
      "Use YANDEX_WEBMASTER_OAUTH_TOKEN for Webmaster API checks if the token has Webmaster scopes.",
      ...(isPresent(refreshToken) ? ["Store refresh token only in YANDEX_OAUTH_REFRESH_TOKEN if long-lived rotation is needed."] : [])
    ]
  };
}

function serializeDotenvValue(value) {
  const normalized = String(value ?? "");
  if (/^[A-Za-z0-9_:/@.,+\-=]*$/.test(normalized)) {
    return normalized;
  }

  return JSON.stringify(normalized);
}

export function updateDotenvFileValues(path, updates) {
  const absolutePath = resolve(path);
  const updateEntries = Object.entries(updates)
    .filter(([key, value]) => isPresent(key) && value !== undefined && value !== null);

  if (updateEntries.length === 0) {
    return {
      status: "skipped",
      path: absolutePath,
      updated_keys: [],
      added_keys: [],
      removed_duplicate_keys: []
    };
  }

  const updatesByKey = new Map(updateEntries);
  const originalText = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
  const originalLines = originalText ? originalText.split(/\r?\n/) : [];
  const outputLines = [];
  const updatedKeys = new Set();
  const removedDuplicateKeys = [];

  for (const line of originalLines) {
    const parsed = parseDotenvLine(line);
    if (!parsed || !updatesByKey.has(parsed.key)) {
      outputLines.push(line);
      continue;
    }

    if (updatedKeys.has(parsed.key)) {
      removedDuplicateKeys.push(parsed.key);
      continue;
    }

    outputLines.push(`${parsed.key}=${serializeDotenvValue(updatesByKey.get(parsed.key))}`);
    updatedKeys.add(parsed.key);
  }

  const addedKeys = [];
  for (const [key, value] of updatesByKey.entries()) {
    if (updatedKeys.has(key)) {
      continue;
    }

    addedKeys.push(key);
  }

  if (addedKeys.length > 0) {
    if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== "") {
      outputLines.push("");
    }
    outputLines.push("# Yandex OAuth operator tokens");
    for (const key of addedKeys) {
      outputLines.push(`${key}=${serializeDotenvValue(updatesByKey.get(key))}`);
      updatedKeys.add(key);
    }
  }

  writeFileSync(absolutePath, `${outputLines.join("\n").replace(/\n+$/u, "")}\n`, "utf8");

  return {
    status: "ok",
    path: absolutePath,
    updated_keys: Array.from(updatedKeys),
    added_keys: addedKeys,
    removed_duplicate_keys: removedDuplicateKeys
  };
}

export function requiredGoalToPayload(goalId) {
  return {
    goal: {
      name: goalId,
      type: "action",
      conditions: [
        {
          type: "action",
          url: goalId
        }
      ]
    }
  };
}

export function goalActionConditions(goal) {
  if (!goal || !Array.isArray(goal.conditions)) {
    return [];
  }

  return goal.conditions
    .filter((condition) => condition && typeof condition === "object")
    .filter((condition) => condition.type === "action" && typeof condition.url === "string")
    .map((condition) => condition.url);
}

export function matchGoalForRequiredId(goal, requiredGoalId) {
  const hasMatchingCondition = goalActionConditions(goal).includes(requiredGoalId);
  const hasMatchingName = goal?.name === requiredGoalId;

  if (hasMatchingCondition) {
    return "condition";
  }

  if (hasMatchingName) {
    return "name";
  }

  return null;
}

export function diffMetricaGoals(existingGoals = [], requiredGoalIds = REQUIRED_METRICA_GOALS) {
  const alreadyExisted = [];
  const needsReview = [];
  const missing = [];

  for (const goalId of requiredGoalIds) {
    const exactMatch = existingGoals.find((goal) => matchGoalForRequiredId(goal, goalId) === "condition");
    if (exactMatch) {
      alreadyExisted.push({
        goal_id: goalId,
        match: "condition",
        metrica_goal_id: exactMatch.id ?? null,
        metrica_goal_name: exactMatch.name ?? goalId
      });
      continue;
    }

    const nameMatch = existingGoals.find((goal) => matchGoalForRequiredId(goal, goalId) === "name");
    if (nameMatch) {
      needsReview.push({
        goal_id: goalId,
        match: "name",
        metrica_goal_id: nameMatch.id ?? null,
        metrica_goal_name: nameMatch.name ?? goalId,
        reason: "Goal name already exists, but JavaScript action condition was not confirmed. No duplicate will be created."
      });
      continue;
    }

    missing.push(goalId);
  }

  return {
    already_existed: alreadyExisted,
    needs_review: needsReview,
    missing,
    create_plan: missing.map((goalId) => ({
      goal_id: goalId,
      request_body: requiredGoalToPayload(goalId)
    }))
  };
}

export function redactSensitive(value) {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .replace(/(OAuth\s+)(?=[A-Za-z0-9._~+/=-]{12,}\b)(?=[A-Za-z0-9._~+/=-]*\d)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]")
      .replace(/(Bearer\s+)(?=[A-Za-z0-9._~+/=-]{12,}\b)(?=[A-Za-z0-9._~+/=-]*\d)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]")
      .replace(/\bAQ[A-Za-z0-9_-]{12,}\b/g, "[redacted-token]")
      .replace(/\by0_[A-Za-z0-9_-]{12,}\b/g, "[redacted-token]")
      .replace(/(client_secret=)[^&\s]+/gi, "$1[redacted]")
      .replace(/(code=)[^&\s]+/gi, "$1[redacted]")
      .replace(/(access_token=)[^&\s]+/gi, "$1[redacted]")
      .replace(/(refresh_token=)[^&\s]+/gi, "$1[redacted]")
      .slice(0, 1500);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => {
        if (isSensitiveOutputKey(key)) {
          return [key, "[redacted]"];
        }

        return [key, redactSensitive(nested)];
      })
    );
  }

  return value;
}

function isSensitiveOutputKey(key) {
  const normalized = key.toLowerCase();

  return [
    "authorization",
    "access_token",
    "refresh_token",
    "oauth_token",
    "client_secret",
    "authorization_code",
    "code_verifier",
    "password",
    "secret"
  ].includes(normalized)
    || normalized.endsWith("_oauth_token")
    || normalized.endsWith("_client_secret")
    || normalized.endsWith("_password")
    || normalized.endsWith("_secret");
}

export function normalizeApiError(error) {
  if (!error) {
    return {
      safe_error_message: "Unknown Yandex API error."
    };
  }

  if (error.status === 401 || error.status === 403) {
    return {
      http_status: error.status,
      safe_error_message: "Token lacks required permissions, is invalid or expired.",
      safe_body: redactSensitive(error.safeBody)
    };
  }

  if (error.status === 404) {
    return {
      http_status: error.status,
      safe_error_message: "Requested Yandex resource was not found or is not accessible for this token.",
      safe_body: redactSensitive(error.safeBody)
    };
  }

  if (error.status) {
    return {
      http_status: error.status,
      safe_error_message: error.message || "Yandex API request failed.",
      safe_body: redactSensitive(error.safeBody)
    };
  }

  return {
    safe_error_message: error.message ? redactSensitive(error.message) : "Network or local tooling error."
  };
}

export class YandexApiError extends Error {
  constructor(message, { status = null, safeBody = null } = {}) {
    super(message);
    this.name = "YandexApiError";
    this.status = status;
    this.safeBody = safeBody;
  }
}

export async function yandexJsonRequest(url, {
  method = "GET",
  token,
  body,
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new YandexApiError("fetch is unavailable in this Node runtime.");
  }

  const headers = {
    Accept: "application/json"
  };

  if (token) {
    headers.Authorization = `OAuth ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw new YandexApiError(`Network error while calling Yandex API: ${error.message}`);
  }

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new YandexApiError(`Yandex API returned HTTP ${response.status}.`, {
      status: response.status,
      safeBody: redactSensitive(parsed)
    });
  }

  return parsed ?? {};
}

export function summarizeCounter(counter) {
  if (!counter || typeof counter !== "object") {
    return null;
  }

  return {
    id: counter.id ?? null,
    name: counter.name ?? null,
    status: counter.status ?? null,
    permission: counter.permission ?? null,
    site: counter.site ?? null
  };
}

export async function checkMetricaAccess({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const counterId = env.YANDEX_METRICA_COUNTER_ID;
  const token = env.YANDEX_METRICA_OAUTH_TOKEN;

  if (!isPresent(counterId)) {
    return {
      status: "failed",
      safe_error_message: "YANDEX_METRICA_COUNTER_ID is missing."
    };
  }

  if (!isPresent(token)) {
    return {
      status: "not_configured",
      counter_id: counterId,
      existing_goals_count: null,
      already_existed: [],
      missing: [...REQUIRED_METRICA_GOALS],
      next_actions: DEFAULT_MISSING_TOKEN_NEXT_ACTION
    };
  }

  try {
    const counterData = await yandexJsonRequest(
      `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}`,
      { token, fetchImpl }
    );
    const goalsData = await yandexJsonRequest(
      `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}/goals`,
      { token, fetchImpl }
    );
    const goals = Array.isArray(goalsData.goals) ? goalsData.goals : [];
    const diff = diffMetricaGoals(goals);

    return {
      status: "ok",
      counter_id: counterId,
      counter: summarizeCounter(counterData.counter),
      existing_goals_count: goals.length,
      already_existed: diff.already_existed.map((item) => item.goal_id),
      needs_review: diff.needs_review,
      missing: diff.missing
    };
  } catch (error) {
    return {
      status: "failed",
      counter_id: counterId,
      ...normalizeApiError(error)
    };
  }
}

export async function bootstrapMetricaGoals({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const counterId = env.YANDEX_METRICA_COUNTER_ID;
  const token = env.YANDEX_METRICA_OAUTH_TOKEN;

  if (!isPresent(counterId)) {
    return {
      status: "failed",
      safe_error_message: "YANDEX_METRICA_COUNTER_ID is missing."
    };
  }

  if (!isPresent(token)) {
    return {
      status: "not_configured",
      counter_id: counterId,
      created: [],
      failed: [],
      missing: [...REQUIRED_METRICA_GOALS],
      next_actions: DEFAULT_MISSING_TOKEN_NEXT_ACTION
    };
  }

  try {
    const goalsData = await yandexJsonRequest(
      `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}/goals`,
      { token, fetchImpl }
    );
    const goals = Array.isArray(goalsData.goals) ? goalsData.goals : [];
    const before = diffMetricaGoals(goals);
    const created = [];
    const failed = [];

    for (const plan of before.create_plan) {
      try {
        const response = await yandexJsonRequest(
          `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}/goals`,
          {
            method: "POST",
            token,
            body: plan.request_body,
            fetchImpl
          }
        );
        created.push({
          goal_id: plan.goal_id,
          metrica_goal_id: response.goal?.id ?? null
        });
      } catch (error) {
        failed.push({
          goal_id: plan.goal_id,
          ...normalizeApiError(error)
        });
      }
    }

    const afterGoalsData = await yandexJsonRequest(
      `https://api-metrika.yandex.net/management/v1/counter/${encodeURIComponent(counterId)}/goals`,
      { token, fetchImpl }
    );
    const afterGoals = Array.isArray(afterGoalsData.goals) ? afterGoalsData.goals : [];
    const after = diffMetricaGoals(afterGoals);

    return {
      status: failed.length > 0 ? "partial" : "ok",
      counter_id: counterId,
      before: {
        existing_goals_count: goals.length,
        already_existed: before.already_existed.map((item) => item.goal_id),
        needs_review: before.needs_review,
        missing: before.missing
      },
      created,
      failed,
      after: {
        existing_goals_count: afterGoals.length,
        already_existed: after.already_existed.map((item) => item.goal_id),
        needs_review: after.needs_review,
        missing: after.missing
      }
    };
  } catch (error) {
    return {
      status: "failed",
      counter_id: counterId,
      ...normalizeApiError(error)
    };
  }
}

export function normalizeSiteUrl(value) {
  if (!isPresent(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    const port = url.port ? `:${url.port}` : "";

    return `${protocol}//${hostname}${port}/`;
  } catch {
    return null;
  }
}

export function findMatchingWebmasterHost(hosts = [], publicSiteUrl) {
  const normalizedSite = normalizeSiteUrl(publicSiteUrl);
  if (!normalizedSite) {
    return null;
  }

  return hosts.find((host) => {
    const candidates = [
      host.ascii_host_url,
      host.unicode_host_url,
      host.main_mirror?.ascii_host_url,
      host.main_mirror?.unicode_host_url
    ].map(normalizeSiteUrl);

    return candidates.includes(normalizedSite);
  }) ?? null;
}

export function summarizeWebmasterHost(host) {
  if (!host || typeof host !== "object") {
    return null;
  }

  return {
    host_id: host.host_id ?? null,
    ascii_host_url: host.ascii_host_url ?? null,
    unicode_host_url: host.unicode_host_url ?? null,
    verified: typeof host.verified === "boolean" ? host.verified : null,
    main_mirror_host_id: host.main_mirror?.host_id ?? null
  };
}

export async function checkWebmasterAccess({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const token = env.YANDEX_WEBMASTER_OAUTH_TOKEN;

  if (!isPresent(token)) {
    return {
      status: "not_configured",
      next_actions: DEFAULT_MISSING_TOKEN_NEXT_ACTION
    };
  }

  try {
    const userData = await yandexJsonRequest("https://api.webmaster.yandex.net/v4/user", {
      token,
      fetchImpl
    });
    const userId = userData.user_id;
    if (!userId) {
      return {
        status: "failed",
        safe_error_message: "Yandex Webmaster API did not return user_id."
      };
    }

    const hostsData = await yandexJsonRequest(
      `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(userId)}/hosts`,
      { token, fetchImpl }
    );
    const hosts = Array.isArray(hostsData.hosts) ? hostsData.hosts : [];
    const configuredHostId = env.YANDEX_WEBMASTER_HOST_ID;
    const configuredHost = isPresent(configuredHostId)
      ? hosts.find((host) => host.host_id === configuredHostId)
      : null;
    const matchedByPublicUrl = findMatchingWebmasterHost(hosts, env.PUBLIC_SITE_URL);
    const selectedHost = configuredHost ?? matchedByPublicUrl ?? null;
    let verification = null;

    if (selectedHost?.host_id) {
      try {
        verification = await yandexJsonRequest(
          `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(selectedHost.host_id)}/verification`,
          { token, fetchImpl }
        );
      } catch (error) {
        verification = {
          status: "failed",
          ...normalizeApiError(error)
        };
      }
    }

    return {
      status: "ok",
      user_id: userId,
      hosts_count: hosts.length,
      configured_host_id_status: isPresent(configuredHostId)
        ? (configuredHost ? "found" : "not_found_in_host_list")
        : "missing",
      public_site_match: matchedByPublicUrl ? summarizeWebmasterHost(matchedByPublicUrl) : null,
      suggested_env: matchedByPublicUrl?.host_id ? {
        YANDEX_WEBMASTER_HOST_ID: matchedByPublicUrl.host_id
      } : null,
      selected_host: summarizeWebmasterHost(selectedHost),
      verification: redactSensitive(verification),
      next_actions: selectedHost ? [] : [
        "Add the public site to Yandex Webmaster or verify that PUBLIC_SITE_URL uses the same protocol/host as Webmaster.",
        "After the site is visible in Webmaster, rerun `npm run yandex:check-webmaster` and copy the suggested host id into server-only env."
      ]
    };
  } catch (error) {
    return {
      status: "failed",
      ...normalizeApiError(error)
    };
  }
}

export function isFailureStatus(status) {
  return status === "failed" || status === "partial";
}
