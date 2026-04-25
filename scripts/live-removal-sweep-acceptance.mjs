import fs from "node:fs/promises";

function getSetCookieHeader(headers) {
  if (typeof headers.getSetCookie === "function") {
    const values = headers.getSetCookie();
    return Array.isArray(values) ? values : [];
  }

  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function extractCookieJar(response) {
  return getSetCookieHeader(response.headers)
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 240)}`);
  }
}

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormValue(formData, key, item);
    }
    return;
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }

  formData.append(key, String(value));
}

function createTinyPngFile(name = "test-removal.png") {
  // 1x1 transparent PNG for live media upload smoke.
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0i8AAAAASUVORK5CYII=",
    "base64"
  );

  return new File([bytes], name, {
    type: "image/png"
  });
}

class AdminSessionClient {
  constructor({ baseUrl, username, password }) {
    this.baseUrl = String(baseUrl ?? "").replace(/\/+$/, "");
    this.username = String(username ?? "");
    this.password = String(password ?? "");
    this.cookieJar = "";
  }

  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});

    if (this.cookieJar) {
      headers.set("cookie", this.cookieJar);
    }

    return fetch(`${this.baseUrl}${path}`, {
      method: options.method || "GET",
      body: options.body,
      headers,
      redirect: options.redirect || "manual"
    });
  }

  async login() {
    const formData = new FormData();
    formData.set("username", this.username);
    formData.set("password", this.password);

    const response = await this.request("/api/admin/login", {
      method: "POST",
      body: formData
    });
    const cookieJar = extractCookieJar(response);

    if (response.status !== 303 || !cookieJar) {
      throw new Error(`Admin login failed with status ${response.status}.`);
    }

    this.cookieJar = cookieJar;
  }

  async uploadMedia({ prefix }) {
    const formData = new FormData();
    formData.set("file", createTinyPngFile(`${prefix}.png`));
    formData.set("title", `${prefix}_media`);
    formData.set("alt", `${prefix} media`);
    formData.set("caption", `${prefix} acceptance media`);
    formData.set("sourceNote", "test_removal_live acceptance");
    formData.set("ownershipNote", "test_removal_live acceptance");
    formData.set("changeIntent", "Live removal sweep acceptance upload");

    const response = await this.request("/api/admin/media/library/create", {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok || !payload.item?.id) {
      throw new Error(payload.error || payload.message || `Media upload failed with status ${response.status}.`);
    }

    return payload.item;
  }

  async saveEntity(entityType, fields, options = {}) {
    const formData = new FormData();
    formData.set("responseMode", "json");
    formData.set("changeIntent", options.changeIntent || "Live removal sweep acceptance save");

    if (options.entityId) {
      formData.set("entityId", options.entityId);
    }

    for (const [key, value] of Object.entries(fields)) {
      appendFormValue(formData, key, value);
    }

    const response = await this.request(`/api/admin/entities/${entityType}/save`, {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok || !payload.entity?.id) {
      throw new Error(payload.error || payload.message || `Save for ${entityType} failed with status ${response.status}.`);
    }

    return payload;
  }

  async lookupEntity(entityType, query) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query || {})) {
      if (value) {
        params.set(key, value);
      }
    }

    const response = await this.request(`/api/admin/entities/${entityType}/lookup?${params.toString()}`, {
      redirect: "follow"
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.error || payload.message || `Lookup for ${entityType} failed with status ${response.status}.`);
    }

    return payload;
  }

  async markRemoval(entityType, entityId) {
    const formData = new FormData();
    formData.set("redirectTo", `/admin/entities/${entityType}/${entityId}`);
    formData.set("failureRedirectTo", `/admin/entities/${entityType}/${entityId}`);

    const response = await this.request(`/api/admin/entities/${entityType}/${entityId}/mark-removal`, {
      method: "POST",
      body: formData
    });

    if (response.status !== 303) {
      throw new Error(`Mark removal for ${entityType}/${entityId} failed with status ${response.status}.`);
    }
  }

  async fetchHtml(path) {
    const response = await this.request(path, {
      redirect: "follow"
    });
    const html = await response.text();

    if (!response.ok) {
      throw new Error(`Expected HTML ${path} to return 200, received ${response.status}.`);
    }

    return html;
  }

  async purge(entityType, entityId) {
    const formData = new FormData();
    formData.set("entityType", entityType);
    formData.set("entityId", entityId);
    formData.set("responseMode", "json");

    const response = await this.request("/api/admin/removal-sweep/purge", {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Purge failed with status ${response.status}.`);
    }

    return payload;
  }
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Expected ${label} to include "${needle}".`);
  }
}

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanupPageContainsPurgeEntityId(html, entityId) {
  if (!entityId) {
    return false;
  }

  const pattern = new RegExp(`name="entityId" value="${escapeRegExp(entityId)}"`, "i");
  return pattern.test(html);
}

async function writeReport(report) {
  const outputFile = String(process.env.OUTPUT_FILE ?? "").trim();

  if (!outputFile) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Acceptance report written to ${outputFile}`);
}

async function main() {
  const baseUrl = process.env.APP_BASE_URL;
  const username = process.env.TEST_ACCEPTANCE_USERNAME;
  const password = process.env.TEST_ACCEPTANCE_PASSWORD;
  const prefix = process.env.TEST_ACCEPTANCE_PREFIX || `test_removal_live_${Date.now()}`;

  if (!baseUrl || !username || !password) {
    throw new Error("APP_BASE_URL, TEST_ACCEPTANCE_USERNAME and TEST_ACCEPTANCE_PASSWORD are required.");
  }

  const client = new AdminSessionClient({
    baseUrl,
    username,
    password
  });

  const report = {
    ok: false,
    baseUrl,
    prefix,
    actor: username,
    created: {},
    deletedIds: [],
    checks: {},
    startedAt: new Date().toISOString()
  };

  try {
    await client.login();
    report.checks.login = true;

    const media = await client.uploadMedia({ prefix });
    report.created.media = {
      id: media.id,
      title: media.title
    };

    const serviceFields = {
      slug: `${prefix}-service`,
      title: `${prefix}_service`,
      h1: `${prefix}_service`,
      summary: "Тестовая услуга для live acceptance удаления.",
      serviceScope: "Тестовый контур удаления.",
      problemsSolved: "",
      methods: "",
      ctaVariant: "default",
      relatedCaseIds: [],
      galleryIds: [],
      primaryMediaAssetId: media.id
    };
    const serviceCreate = await client.saveEntity("service", serviceFields);
    const serviceId = serviceCreate.entity.id;
    report.created.service = {
      id: serviceId,
      slug: serviceFields.slug,
      title: serviceFields.title
    };

    const caseFields = {
      slug: `${prefix}-case`,
      title: `${prefix}_case`,
      location: "Тестовый серверный контур",
      projectType: "acceptance",
      task: "Проверка удаления связанного графа.",
      workScope: "Media + service + case",
      result: "Граф должен удаляться из одного cleanup-центра.",
      serviceIds: [serviceId],
      galleryIds: [],
      primaryMediaAssetId: media.id
    };
    const caseCreate = await client.saveEntity("case", caseFields);
    const caseId = caseCreate.entity.id;
    report.created.case = {
      id: caseId,
      slug: caseFields.slug,
      title: caseFields.title
    };

    serviceFields.relatedCaseIds = [caseId];
    await client.saveEntity("service", serviceFields, {
      entityId: serviceId,
      changeIntent: "Live removal sweep acceptance graph link"
    });

    const serviceLookup = await client.lookupEntity("service", { entityId: serviceId });
    const caseLookup = await client.lookupEntity("case", { entityId: caseId });
    report.checks.graphLinked =
      serviceLookup?.latestRevision?.payload?.primaryMediaAssetId === media.id
      && Array.isArray(serviceLookup?.latestRevision?.payload?.relatedCaseIds)
      && serviceLookup.latestRevision.payload.relatedCaseIds.includes(caseId)
      && caseLookup?.latestRevision?.payload?.primaryMediaAssetId === media.id
      && Array.isArray(caseLookup?.latestRevision?.payload?.serviceIds)
      && caseLookup.latestRevision.payload.serviceIds.includes(serviceId);

    if (!report.checks.graphLinked) {
      throw new Error("The linked live test graph was not persisted as expected.");
    }

    await client.markRemoval("media_asset", media.id);
    await client.markRemoval("service", serviceId);
    await client.markRemoval("case", caseId);
    report.checks.markRemoval = true;

    const cleanupHtml = await client.fetchHtml("/admin/removal-sweep");
    assertIncludes(cleanupHtml, serviceFields.title, "cleanup center");
    assertIncludes(cleanupHtml, caseFields.title, "cleanup center");
    assertIncludes(cleanupHtml, media.title, "cleanup center");
    assertIncludes(cleanupHtml, "Очистить граф", "cleanup center");
    report.checks.cleanupCenterHasActiveRoot = cleanupPageContainsPurgeEntityId(cleanupHtml, serviceId);

    if (!report.checks.cleanupCenterHasActiveRoot) {
      throw new Error("Cleanup center did not expose an active purge target for the test graph.");
    }

    report.checks.cleanupCenterVisible = true;

    const purge = await client.purge("case", caseId);
    report.deletedIds = (purge.deleted ?? []).map((item) => item.entityId);
    report.checks.purgeDeletedGraph =
      report.deletedIds.includes(caseId)
      && report.deletedIds.includes(serviceId)
      && report.deletedIds.includes(media.id);

    if (!report.checks.purgeDeletedGraph) {
      throw new Error(`Purge did not delete the expected graph. Deleted ids: ${report.deletedIds.join(", ")}`);
    }

    const cleanupAfterHtml = await client.fetchHtml("/admin/removal-sweep");
    report.checks.cleanupCenterCleared = !cleanupPageContainsPurgeEntityId(cleanupAfterHtml, serviceId);

    if (!report.checks.cleanupCenterCleared) {
      throw new Error("Cleanup center still shows the deleted test graph.");
    }

    const serviceAfter = await client.lookupEntity("service", { entityId: serviceId });
    const caseAfter = await client.lookupEntity("case", { entityId: caseId });
    const mediaAfter = await client.lookupEntity("media_asset", { entityId: media.id });
    report.checks.lookupGone =
      serviceAfter.matched === false
      && caseAfter.matched === false
      && mediaAfter.matched === false;

    if (!report.checks.lookupGone) {
      throw new Error("One or more test entities still resolve through lookup after purge.");
    }

    report.ok = true;
  } catch (error) {
    report.ok = false;
    report.error = error?.message || String(error);
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeReport(report);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
