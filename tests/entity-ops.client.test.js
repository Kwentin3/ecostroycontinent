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
