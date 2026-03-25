const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const seoUsername = process.env.SEED_SEO_USERNAME ?? "seo";
const seoPassword = process.env.SEED_SEO_PASSWORD ?? "change-me-seo";
const ownerUsername = process.env.SEED_OWNER_USERNAME ?? "owner";
const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-owner";
const superadminUsername = process.env.SEED_SUPERADMIN_USERNAME ?? "superadmin";
const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function logStep(message) {
  console.log(`\n[proof] ${message}`);
}

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
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: cookie ? { cookie } : undefined,
    body,
    redirect
  });

  return response;
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

function parseRedirectPath(response) {
  const location = response.headers.get("location");
  ensureOk(location, "Redirect location header is missing.");
  return new URL(location, baseUrl);
}

function parseEntityIdFromPath(path, entityType) {
  const match = path.match(new RegExp(`/admin/entities/${entityType}/([^/?]+)`));
  ensureOk(match, `Could not parse entity id from redirect path: ${path}`);
  return match[1];
}

function parseFirstEntityIdFromList(html, entityType) {
  const match = html.match(new RegExp(`/admin/entities/${entityType}/([^"?#/]+)`));
  ensureOk(match, `Could not find any ${entityType} entity link in list HTML.`);
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

function parsePublishedRevisionIdFromHistory(html) {
  const match = html.match(/Revision ([0-9]+)[\s\S]*?\/api\/admin\/entities\/[^/]+\/[^/]+\/rollback[\s\S]*?name="targetRevisionId" value="([^"]+)"/);

  if (match) {
    return match[2];
  }

  const fallback = html.match(/Revision [0-9]+[\s\S]*?published[\s\S]*?rev_[a-z0-9-]+/i);
  ensureOk(fallback, "Could not infer any published revision from history HTML.");
  return fallback[0].match(/rev_[a-z0-9-]+/i)[0];
}

async function getHtml(path, cookie) {
  const response = await request(path, { cookie, redirect: "follow" });
  ensureOk(response.ok, `GET ${path} failed with ${response.status}.`);
  return response.text();
}

async function saveEntityDraft({ cookie, entityType, fields }) {
  const response = await request(`/api/admin/entities/${entityType}/save`, {
    method: "POST",
    cookie,
    body: buildFormData(fields)
  });

  ensureOk(response.status >= 300 && response.status < 400, `Save draft redirect expected for ${entityType}.`);
  const redirectUrl = parseRedirectPath(response);
  const entityId = parseEntityIdFromPath(redirectUrl.pathname, entityType);

  return {
    entityId,
    path: redirectUrl.pathname
  };
}

async function submitForReview({ cookie, revisionId }) {
  const response = await request(`/api/admin/revisions/${revisionId}/submit`, {
    method: "POST",
    cookie,
    body: buildFormData([])
  });

  ensureOk(response.status >= 300 && response.status < 400, `Review submission redirect expected for ${revisionId}.`);
}

async function ownerApprove({ cookie, revisionId, comment }) {
  const response = await request(`/api/admin/revisions/${revisionId}/owner-action`, {
    method: "POST",
    cookie,
    body: buildFormData([
      ["action", "approve"],
      ["comment", comment]
    ])
  });

  ensureOk(response.status >= 300 && response.status < 400, `Owner approve redirect expected for ${revisionId}.`);
}

async function publishRevisionById({ cookie, revisionId }) {
  const response = await request(`/api/admin/revisions/${revisionId}/publish`, {
    method: "POST",
    cookie,
    body: buildFormData([])
  });

  ensureOk(response.status >= 300 && response.status < 400, `Publish redirect expected for ${revisionId}.`);
}

async function rollbackEntity({ cookie, entityType, entityId, targetRevisionId }) {
  const response = await request(`/api/admin/entities/${entityType}/${entityId}/rollback`, {
    method: "POST",
    cookie,
    body: buildFormData([
      ["targetRevisionId", targetRevisionId]
    ])
  });

  ensureOk(response.status >= 300 && response.status < 400, `Rollback redirect expected for ${entityType}/${entityId}.`);
}

function createProofPngFile() {
  const pngBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0xc9, 0xfe, 0x92,
    0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  return new File([pngBytes], "proof.png", { type: "image/png" });
}

async function uploadProofMedia({ cookie, title }) {
  const form = new FormData();
  form.append("redirectTo", "/admin/entities/media_asset");
  form.append("title", title);
  form.append("alt", "Proof asset alt");
  form.append("ownershipNote", "Proof ownership note");
  form.append("sourceNote", "Generated proof fixture");
  form.append("file", createProofPngFile());

  const response = await request("/api/admin/media/upload", {
    method: "POST",
    cookie,
    body: form
  });

  ensureOk(response.status >= 300 && response.status < 400, "Media upload redirect expected.");
  const redirectUrl = parseRedirectPath(response);
  const entityId = redirectUrl.searchParams.get("entityId");

  if (entityId) {
    return entityId;
  }

  const html = await getHtml("/admin/entities/media_asset", cookie);
  return parseFirstEntityIdFromList(html, "media_asset");
}

async function getCurrentRevisionId({ cookie, entityType, entityId }) {
  const html = await getHtml(`/admin/entities/${entityType}/${entityId}`, cookie);
  return parseRevisionIdFromEditor(html);
}

async function getHistoryHtml({ cookie, entityType, entityId }) {
  return getHtml(`/admin/entities/${entityType}/${entityId}/history`, cookie);
}

async function verifyPublicPage(path, expectedText) {
  const response = await request(path, { redirect: "follow" });
  ensureOk(response.ok, `Public route ${path} failed with ${response.status}.`);
  const html = await response.text();
  ensureOk(html.includes(expectedText), `Public route ${path} does not include expected text: ${expectedText}`);
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("Runs the admin first-slice validating vertical proof against a live canonical runtime.");
    console.log("Required env: APP_BASE_URL and seeded credentials or SEED_* defaults.");
    return;
  }

  const proofId = Date.now().toString(36);
  const assetTitle = `Proof Asset ${proofId}`;
  const galleryTitle = `Proof Gallery ${proofId}`;
  const caseTitle = `Proof Case ${proofId}`;
  const serviceTitle = `Proof Service ${proofId}`;
  const caseSlug = `proof-case-${proofId}`;
  const serviceSlug = `proof-service-${proofId}`;

  logStep(`Logging in against ${baseUrl}`);
  const seoCookie = await login(seoUsername, seoPassword);
  const ownerCookie = await login(ownerUsername, ownerPassword);
  const superadminCookie = await login(superadminUsername, superadminPassword);

  logStep("Uploading and publishing proof media asset");
  const mediaAssetId = await uploadProofMedia({ cookie: seoCookie, title: assetTitle });

  logStep("Creating gallery draft");
  const galleryDraft = await saveEntityDraft({
    cookie: seoCookie,
    entityType: "gallery",
    fields: [
      ["entityId", ""],
      ["changeIntent", "Create proof gallery"],
      ["title", galleryTitle],
      ["caption", "Proof gallery caption"],
      ["assetIds", [mediaAssetId]],
      ["primaryAssetId", mediaAssetId]
    ]
  });
  const galleryRevisionId = await getCurrentRevisionId({ cookie: seoCookie, entityType: "gallery", entityId: galleryDraft.entityId });
  await submitForReview({ cookie: seoCookie, revisionId: galleryRevisionId });
  await publishRevisionById({ cookie: superadminCookie, revisionId: galleryRevisionId });

  logStep("Creating case draft");
  const caseDraft = await saveEntityDraft({
    cookie: seoCookie,
    entityType: "case",
    fields: [
      ["entityId", ""],
      ["changeIntent", "Create proof case"],
      ["slug", caseSlug],
      ["title", caseTitle],
      ["location", "Sochi"],
      ["projectType", "Drainage"],
      ["task", "Stabilize the slope"],
      ["workScope", "Drainage and retaining works"],
      ["result", "Water flow controlled"],
      ["galleryIds", [galleryDraft.entityId]],
      ["primaryMediaAssetId", mediaAssetId]
    ]
  });
  const caseRevisionId = await getCurrentRevisionId({ cookie: seoCookie, entityType: "case", entityId: caseDraft.entityId });
  await submitForReview({ cookie: seoCookie, revisionId: caseRevisionId });
  await ownerApprove({ cookie: ownerCookie, revisionId: caseRevisionId, comment: "Approved for proof slice." });
  await publishRevisionById({ cookie: superadminCookie, revisionId: caseRevisionId });
  const casePublishedRevisionId = caseRevisionId;

  logStep("Creating service draft");
  const serviceDraft = await saveEntityDraft({
    cookie: seoCookie,
    entityType: "service",
    fields: [
      ["entityId", ""],
      ["changeIntent", "Create proof service"],
      ["slug", serviceSlug],
      ["title", serviceTitle],
      ["h1", serviceTitle],
      ["summary", "Proof service summary"],
      ["serviceScope", "Proof service scope"],
      ["problemsSolved", "Drainage-related proof problem"],
      ["methods", "Retaining walls and drainage"],
      ["ctaVariant", "proof-cta"],
      ["relatedCaseIds", [caseDraft.entityId]],
      ["galleryIds", [galleryDraft.entityId]],
      ["primaryMediaAssetId", mediaAssetId]
    ]
  });
  const serviceRevisionId = await getCurrentRevisionId({ cookie: seoCookie, entityType: "service", entityId: serviceDraft.entityId });
  await submitForReview({ cookie: seoCookie, revisionId: serviceRevisionId });
  await ownerApprove({ cookie: ownerCookie, revisionId: serviceRevisionId, comment: "Approved for proof slice." });
  await publishRevisionById({ cookie: superadminCookie, revisionId: serviceRevisionId });
  const firstPublishedServiceRevisionId = serviceRevisionId;

  logStep("Verifying public published projection");
  await verifyPublicPage(`/cases/${caseSlug}`, caseTitle);
  await verifyPublicPage(`/services/${serviceSlug}`, serviceTitle);

  logStep("Creating a second service revision for rollback proof");
  const secondServiceDraft = await saveEntityDraft({
    cookie: seoCookie,
    entityType: "service",
    fields: [
      ["entityId", serviceDraft.entityId],
      ["changeIntent", "Create rollback candidate"],
      ["slug", serviceSlug],
      ["title", serviceTitle],
      ["h1", serviceTitle],
      ["summary", "Rollback candidate summary"],
      ["serviceScope", "Proof service scope"],
      ["problemsSolved", "Drainage-related proof problem"],
      ["methods", "Retaining walls and drainage"],
      ["ctaVariant", "proof-cta"],
      ["relatedCaseIds", [caseDraft.entityId]],
      ["galleryIds", [galleryDraft.entityId]],
      ["primaryMediaAssetId", mediaAssetId]
    ]
  });
  ensureOk(secondServiceDraft.entityId === serviceDraft.entityId, "Second service revision should stay on the same entity.");
  const secondServiceRevisionId = await getCurrentRevisionId({ cookie: seoCookie, entityType: "service", entityId: serviceDraft.entityId });
  await submitForReview({ cookie: seoCookie, revisionId: secondServiceRevisionId });
  await publishRevisionById({ cookie: superadminCookie, revisionId: secondServiceRevisionId });
  await verifyPublicPage(`/services/${serviceSlug}`, "Rollback candidate summary");

  logStep("Rolling service back to the first published revision");
  await rollbackEntity({
    cookie: superadminCookie,
    entityType: "service",
    entityId: serviceDraft.entityId,
    targetRevisionId: firstPublishedServiceRevisionId
  });
  await verifyPublicPage(`/services/${serviceSlug}`, "Proof service summary");

  logStep("Checking history pages for audit visibility");
  const serviceHistory = await getHistoryHtml({ cookie: superadminCookie, entityType: "service", entityId: serviceDraft.entityId });
  ensureOk(serviceHistory.includes("Audit timeline"), "Service history should expose audit timeline.");
  ensureOk(serviceHistory.includes("published"), "Service history should show published revisions.");

  const caseHistory = await getHistoryHtml({ cookie: superadminCookie, entityType: "case", entityId: caseDraft.entityId });
  ensureOk(caseHistory.includes(casePublishedRevisionId), "Case history should include published case revision id.");

  console.log("\n[proof] Admin first-slice vertical proof completed successfully.");
  console.log(JSON.stringify({
    mediaAssetId,
    galleryEntityId: galleryDraft.entityId,
    caseEntityId: caseDraft.entityId,
    casePublishedRevisionId,
    serviceEntityId: serviceDraft.entityId,
    firstPublishedServiceRevisionId,
    secondServiceRevisionId
  }, null, 2));
}

main().catch((error) => {
  console.error(`\n[proof] FAILED: ${error.message}`);
  process.exitCode = 1;
});
