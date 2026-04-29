import test from "node:test";
import assert from "node:assert/strict";

import { EntityOpsAdminClient } from "../lib/entity-ops/client.js";

function createClient() {
  return new EntityOpsAdminClient({
    baseUrl: "https://example.com",
    username: "superadmin",
    password: "secret",
    timeoutMs: 5000
  });
}

test("entity ops client login stores cookie from redirect response", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => new Response("", {
      status: 303,
      headers: {
        location: "/admin",
        "set-cookie": "session=abc123; Path=/; HttpOnly"
      }
    });

    const client = createClient();
    await client.login();

    assert.equal(client.cookieJar, "session=abc123");
  } finally {
    global.fetch = originalFetch;
  }
});

test("entity ops client parses redirect-backed display mode action", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => new Response("", {
      status: 303,
      headers: {
        location: "/admin?message=Display+mode+updated"
      }
    });

    const client = createClient();
    const result = await client.setDisplayMode(new FormData());

    assert.equal(result.ok, true);
    assert.equal(result.message, "Display mode updated");
    assert.equal(result.path, "/admin?message=Display+mode+updated");
  } finally {
    global.fetch = originalFetch;
  }
});

test("entity ops client posts page workspace JSON action with session cookie", async () => {
  const originalFetch = global.fetch;
  const calls = [];

  try {
    global.fetch = async (url, options) => {
      calls.push({
        url,
        method: options.method,
        contentType: options.headers.get("content-type"),
        cookie: options.headers.get("cookie"),
        body: JSON.parse(options.body)
      });

      return new Response(JSON.stringify({
        ok: true,
        message: "Page workspace saved",
        revision: {
          id: "rev_1"
        }
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    };

    const client = createClient();
    client.cookieJar = "session=abc123";

    const result = await client.runPageWorkspaceAction("page_1", {
      action: "save_composition",
      composition: {
        title: "Page title"
      }
    });

    assert.equal(result.ok, true);
    assert.equal(calls[0].url, "https://example.com/api/admin/entities/page/page_1/workspace");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].contentType, "application/json");
    assert.equal(calls[0].cookie, "session=abc123");
    assert.equal(calls[0].body.action, "save_composition");
  } finally {
    global.fetch = originalFetch;
  }
});

test("entity ops client surfaces page workspace JSON errors", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => new Response(JSON.stringify({
      ok: false,
      error: "Page workspace blocked"
    }), {
      status: 409,
      headers: {
        "content-type": "application/json"
      }
    });

    const client = createClient();

    await assert.rejects(
      () => client.runPageWorkspaceAction("page_1", { action: "send_to_review" }),
      /Page workspace blocked/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("entity ops client surfaces redirect-backed removal errors", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => new Response("", {
      status: 303,
      headers: {
        location: "/admin?error=Removal+blocked"
      }
    });

    const client = createClient();

    await assert.rejects(
      () => client.markRemoval("service", "entity_1", new FormData()),
      /Removal blocked/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
