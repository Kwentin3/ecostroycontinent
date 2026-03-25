const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const seoUsername = process.env.SEED_SEO_USERNAME ?? "seo";
const seoPassword = process.env.SEED_SEO_PASSWORD ?? "change-me-seo";
const superadminUsername = process.env.SEED_SUPERADMIN_USERNAME ?? "superadmin";
const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function ensureOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildFormData(entries) {
  const form = new FormData();

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        form.append(key, item);
      }
      continue;
    }

    form.append(key, value);
  }

  return form;
}

async function request(path, { method = "GET", cookie = "", body = null, redirect = "manual" } = {}) {
  return fetch(new URL(path, baseUrl), {
    method,
    headers: cookie ? { cookie } : undefined,
    body,
    redirect
  });
}

function extractCookies(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((item) => item.split(";")[0]).join("; ");
}

async function login(username, password) {
  const response = await request("/api/admin/login", {
    method: "POST",
    body: buildFormData([
      ["username", username],
      ["password", password]
    ])
  });

  ensureOk(response.status >= 300 && response.status < 400, `Login redirect expected for ${username}.`);
  const cookie = extractCookies(response);
  ensureOk(cookie.length > 0, `Session cookie missing for ${username}.`);
  return cookie;
}

function parseRedirectUrl(response) {
  const location = response.headers.get("location");
  ensureOk(location, "Redirect location header is missing.");
  return new URL(location, baseUrl);
}

function parseEntityIdFromPath(path, entityType) {
  const match = path.match(new RegExp(`/admin/entities/${entityType}/([^/?]+)`));
  ensureOk(match, `Could not parse entity id from redirect path: ${path}`);
  return match[1];
}

function parseRevisionIdFromEditor(html) {
  const submitMatch = html.match(/\/api\/admin\/revisions\/([^/]+)\/submit/);

  if (submitMatch) {
    return submitMatch[1];
  }

  const publishMatch = html.match(/\/admin\/revisions\/([^/]+)\/publish/);
  ensureOk(publishMatch, "Could not parse revision id from editor HTML.");
  return publishMatch[1];
}

async function getHtml(path, cookie) {
  const response = await request(path, { cookie, redirect: "follow" });
  ensureOk(response.ok, `GET ${path} failed with ${response.status}.`);
  return response.text();
}

async function main() {
  const proofId = Date.now().toString(36);
  const pageTitle = `Proof Contacts ${proofId}`;

  const seoCookie = await login(seoUsername, seoPassword);
  const superadminCookie = await login(superadminUsername, superadminPassword);

  const saveResponse = await request("/api/admin/entities/page/save", {
    method: "POST",
    cookie: seoCookie,
    body: buildFormData([
      ["entityId", ""],
      ["changeIntent", "Create proof contacts page"],
      ["pageType", "contacts"],
      ["title", pageTitle],
      ["h1", pageTitle],
      ["intro", "Proof contacts intro"],
      ["contactNote", "Contacts hard-stop proof note"]
    ])
  });

  ensureOk(saveResponse.status >= 300 && saveResponse.status < 400, "Contacts page save should redirect.");
  const redirectUrl = parseRedirectUrl(saveResponse);
  const entityId = parseEntityIdFromPath(redirectUrl.pathname, "page");
  const editorHtml = await getHtml(redirectUrl.pathname, seoCookie);
  const revisionId = parseRevisionIdFromEditor(editorHtml);

  const submitResponse = await request(`/api/admin/revisions/${revisionId}/submit`, {
    method: "POST",
    cookie: seoCookie,
    body: buildFormData([])
  });

  ensureOk(submitResponse.status >= 300 && submitResponse.status < 400, "Contacts page review submit should redirect.");

  const readinessHtml = await getHtml(`/admin/revisions/${revisionId}/publish`, superadminCookie);
  ensureOk(
    readinessHtml.includes("Contacts page cannot publish until contact truth is confirmed."),
    "Publish readiness should expose contacts truth hard-stop."
  );

  const publishResponse = await request(`/api/admin/revisions/${revisionId}/publish`, {
    method: "POST",
    cookie: superadminCookie,
    body: buildFormData([]),
    redirect: "manual"
  });

  ensureOk(publishResponse.status >= 500, `Blocked contacts publish should surface an error status, got ${publishResponse.status}.`);

  console.log(JSON.stringify({
    entityId,
    revisionId,
    readinessBlock: "contacts_truth_unconfirmed",
    publishStatus: publishResponse.status
  }, null, 2));
}

main().catch((error) => {
  console.error(`[contacts-proof] FAILED: ${error.message}`);
  process.exitCode = 1;
});
