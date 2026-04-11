import test from "node:test";
import assert from "node:assert/strict";

import {
  collectKnownLegacyPageCopyMatches,
  KNOWN_LEGACY_PAGE_COPY_ENTRIES,
  normalizeLegacyPagePayload
} from "../../lib/content-core/page-copy.js";
import {
  formatPreviewViewportWidth,
  getPreviewViewportOption
} from "../../lib/admin/preview-viewport.js";

test("preview viewport exposes tablet semantics as explicit operator affordance", () => {
  const tablet = getPreviewViewportOption("tablet");

  assert.equal(tablet.value, "tablet");
  assert.equal(tablet.width, 834);
  assert.equal(formatPreviewViewportWidth(tablet.width), "834 px");
  assert.match(tablet.hint, /перенос|CTA|секци/i);
});

test("preview viewport falls back to desktop for unknown device", () => {
  const fallback = getPreviewViewportOption("wallboard");

  assert.equal(fallback.value, "desktop");
  assert.equal(fallback.width, 1120);
});

test("legacy page copy inventory stays finite and explicit", () => {
  assert.equal(KNOWN_LEGACY_PAGE_COPY_ENTRIES.length, 6);
  assert.equal(KNOWN_LEGACY_PAGE_COPY_ENTRIES[0][1], "Связанные услуги");
  assert.equal(KNOWN_LEGACY_PAGE_COPY_ENTRIES[5][1], "Связаться с нами");
});

test("known legacy page copy matches are detectable without broad heuristic migration", () => {
  const payload = {
    blocks: [
      {
        type: "gallery",
        title: "Р вЂњР В°Р В»Р ВµРЎР‚Р ВµРЎРЏ"
      },
      {
        type: "cta",
        title: "Свяжитесь с нами",
        ctaLabel: "Р РЋР Р†РЎРЏР В·Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ РЎРѓ Р Р…Р В°Р СР С‘"
      },
      {
        type: "rich_text",
        title: "Не трогать"
      }
    ]
  };

  const matches = collectKnownLegacyPageCopyMatches(payload);
  const normalized = normalizeLegacyPagePayload(payload);

  assert.equal(matches.length, 2);
  assert.deepEqual(matches.map((item) => item.field), ["title", "ctaLabel"]);
  assert.equal(normalized.blocks[0].title, "Галерея");
  assert.equal(normalized.blocks[1].ctaLabel, "Связаться с нами");
  assert.equal(normalized.blocks[2].title, "Не трогать");
});
