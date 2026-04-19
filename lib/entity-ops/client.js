function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer);
    }
  };
}

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

async function parseRedirectResponse(response, baseUrl) {
  const locationHeader = response.headers.get("location") || "";

  if (!locationHeader) {
    const text = await response.text();
    throw new Error(`Expected redirect response but location header is missing. Body: ${text.slice(0, 240)}`);
  }

  const location = new URL(locationHeader, baseUrl);
  const error = location.searchParams.get("error") || "";

  if (error) {
    throw new Error(error);
  }

  return {
    ok: true,
    location: location.toString(),
    path: `${location.pathname}${location.search}`,
    message: location.searchParams.get("message") || ""
  };
}

export class EntityOpsAdminClient {
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.username = config.username;
    this.password = config.password;
    this.timeoutMs = config.timeoutMs;
    this.cookieJar = "";
  }

  async request(path, options = {}) {
    const timeout = createTimeoutSignal(this.timeoutMs);
    const headers = new Headers(options.headers || {});

    if (this.cookieJar) {
      headers.set("cookie", this.cookieJar);
    }

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method: options.method || "GET",
        body: options.body,
        headers,
        redirect: options.redirect || "manual",
        signal: timeout.signal
      });
    } finally {
      timeout.dispose();
    }
  }

  async probeHealth() {
    const response = await this.request("/api/health", { redirect: "follow" });

    if (!response.ok) {
      throw new Error(`Health probe failed with status ${response.status}.`);
    }

    return parseJsonResponse(response);
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
      throw new Error("Admin login failed. Check ENTITY_OPS_USERNAME / ENTITY_OPS_PASSWORD.");
    }

    this.cookieJar = cookieJar;

    return {
      ok: true,
      location: response.headers.get("location") || ""
    };
  }

  async lookupEntity(entityType, match = {}) {
    const params = new URLSearchParams();

    if (match.entityId) {
      params.set("entityId", match.entityId);
    }

    if (match.slug) {
      params.set("slug", match.slug);
    }

    if (match.pageType) {
      params.set("pageType", match.pageType);
    }

    const query = params.toString();
    const response = await this.request(`/api/admin/entities/${entityType}/lookup${query ? `?${query}` : ""}`, {
      redirect: "follow"
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.error || payload.message || `Lookup failed with status ${response.status}.`);
    }

    return payload;
  }

  async saveEntity(entityType, formData) {
    const response = await this.request(`/api/admin/entities/${entityType}/save`, {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Save failed with status ${response.status}.`);
    }

    return payload;
  }

  async deleteEntity(entityType, formData) {
    const response = await this.request(`/api/admin/entities/${entityType}/delete`, {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Delete failed with status ${response.status}.`);
    }

    return payload;
  }

  async createMediaAsset(formData) {
    const response = await this.request("/api/admin/media/library/create", {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Media create failed with status ${response.status}.`);
    }

    return payload;
  }

  async updateMediaAsset(entityId, formData) {
    const response = await this.request(`/api/admin/media/library/${entityId}`, {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Media update failed with status ${response.status}.`);
    }

    return payload;
  }

  async getDisplayMode() {
    const response = await this.request("/api/public/display-mode", {
      redirect: "follow"
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload.error || payload.message || `Display mode probe failed with status ${response.status}.`);
    }

    return payload;
  }

  async setDisplayMode(formData) {
    const response = await this.request("/api/admin/system/display-mode", {
      method: "POST",
      body: formData
    });

    return parseRedirectResponse(response, this.baseUrl);
  }

  async markRemoval(entityType, entityId, formData) {
    const response = await this.request(`/api/admin/entities/${entityType}/${entityId}/mark-removal`, {
      method: "POST",
      body: formData
    });

    return parseRedirectResponse(response, this.baseUrl);
  }

  async unmarkRemoval(entityType, entityId, formData) {
    const response = await this.request(`/api/admin/entities/${entityType}/${entityId}/unmark-removal`, {
      method: "POST",
      body: formData
    });

    return parseRedirectResponse(response, this.baseUrl);
  }

  async purgeRemovalSweep(formData) {
    const response = await this.request("/api/admin/removal-sweep/purge", {
      method: "POST",
      body: formData
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.message || `Removal purge failed with status ${response.status}.`);
    }

    return payload;
  }
}
