import test from "node:test";
import assert from "node:assert/strict";

import { deriveEditorValue } from "../../lib/admin/entity-ui.js";
import { buildPageWorkspaceBaseValue } from "../../lib/admin/page-workspace.js";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";

test("buildPageWorkspaceBaseValue tolerates malformed blocks in legacy page payloads", () => {
  const value = buildPageWorkspaceBaseValue({
    payload: {
      pageType: "about",
      slug: "about",
      title: "О компании",
      blocks: [
        null,
        "legacy-string",
        42,
        { type: "rich_text", body: "Связочный текст" },
        { type: "cta", title: "CTA", body: "CTA body", ctaLabel: "Связаться" }
      ]
    }
  });

  assert.equal(value.title, "О компании");
  assert.equal(value.body, "Связочный текст");
  assert.equal(value.ctaTitle, "CTA");
  assert.equal(value.ctaBody, "CTA body");
  assert.equal(value.defaultBlockCtaLabel, "Связаться");
});

test("deriveEditorValue ignores malformed blocks instead of crashing page editor hydration", () => {
  const value = deriveEditorValue(ENTITY_TYPES.PAGE, {
    payload: {
      pageType: "contacts",
      slug: "contacts",
      title: "Контакты",
      blocks: [
        undefined,
        false,
        { type: "contact", body: "Позвоните нам" },
        { type: "gallery", galleryIds: ["gallery_1"] }
      ]
    }
  });

  assert.equal(value.title, "Контакты");
  assert.equal(value.contactNote, "Позвоните нам");
  assert.deepEqual(value.galleryIds, ["gallery_1"]);
});
