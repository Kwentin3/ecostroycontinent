import test from "node:test";
import assert from "node:assert/strict";

import { lookupLatestRevisionId, parseRevisionIdFromEditorHtml } from "../scripts/lib/revision-id-parser.mjs";

test("parser extracts revision id from submit route", () => {
  const html = '<form action="/api/admin/revisions/rev_alpha-123/submit" method="post"></form>';
  assert.equal(parseRevisionIdFromEditorHtml(html), "rev_alpha-123");
});

test("parser extracts revision id from publish route", () => {
  const html = '<a href="/admin/revisions/rev_publish-456/publish">Publish</a>';
  assert.equal(parseRevisionIdFromEditorHtml(html), "rev_publish-456");
});

test("parser extracts revision id from review route", () => {
  const html = '<a href="/admin/review/rev_review-789">Review</a>';
  assert.equal(parseRevisionIdFromEditorHtml(html), "rev_review-789");
});

test("parser falls back to single revision id token", () => {
  const html = '<div data-revision-id="rev_single-fallback"></div>';
  assert.equal(parseRevisionIdFromEditorHtml(html), "rev_single-fallback");
});

test("parser returns null for ambiguous fallback ids", () => {
  const html = '<div>rev_first-token rev_second-token</div>';
  assert.equal(parseRevisionIdFromEditorHtml(html), null);
});

test("parser returns null for empty input", () => {
  assert.equal(parseRevisionIdFromEditorHtml(""), null);
  assert.equal(parseRevisionIdFromEditorHtml(null), null);
});

test("lookup helper resolves latest revision id from lookup endpoint payload", async () => {
  const observed = { url: "", cookieHeader: "" };
  const requestImpl = async (url, init = {}) => {
    observed.url = String(url);
    observed.cookieHeader = init.headers?.cookie || "";

    return new Response(JSON.stringify({
      ok: true,
      matched: true,
      latestRevision: { id: "rev_lookup-123" }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const revisionId = await lookupLatestRevisionId({
    baseUrl: "https://ecostroycontinent.ru",
    cookie: "session=test",
    entityType: "service",
    entityId: "entity_test",
    requestImpl
  });

  assert.equal(revisionId, "rev_lookup-123");
  assert.match(observed.url, /\/api\/admin\/entities\/service\/lookup\?entityId=entity_test/);
  assert.equal(observed.cookieHeader, "session=test");
});

test("lookup helper returns null when entity is not matched", async () => {
  const requestImpl = async () => new Response(JSON.stringify({
    ok: true,
    matched: false
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  const revisionId = await lookupLatestRevisionId({
    baseUrl: "https://ecostroycontinent.ru",
    entityType: "service",
    entityId: "entity_missing",
    requestImpl
  });

  assert.equal(revisionId, null);
});
