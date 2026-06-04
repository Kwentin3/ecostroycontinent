import test from "node:test";
import assert from "node:assert/strict";

import { buildHumanReadableDiff } from "../../lib/content-core/diff.js";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";

test("human-readable diff highlights a small text punctuation edit", () => {
  const rows = buildHumanReadableDiff(
    ENTITY_TYPES.SERVICE,
    {
      serviceScope: "Земляные работы демонтаж планировка"
    },
    {
      serviceScope: "Земляные работы, демонтаж планировка"
    }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].field, "serviceScope");
  assert.equal(rows[0].beforeParts.change, "∅");
  assert.equal(rows[0].afterParts.change, ",");
});

test("human-readable diff expands blocks into content rows instead of raw JSON", () => {
  const rows = buildHumanReadableDiff(
    ENTITY_TYPES.PAGE,
    {
      blocks: [
        { type: "rich_text", order: 0, title: "Описание", body: "Работаем быстро" }
      ]
    },
    {
      blocks: [
        { type: "rich_text", order: 0, title: "Описание", body: "Работаем быстро и аккуратно" }
      ]
    }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].field, "blocks[0].body");
  assert.match(rows[0].label, /Описание/);
  assert.doesNotMatch(rows[0].before, /"type"/);
  assert.doesNotMatch(rows[0].after, /"type"/);
});

test("human-readable diff includes SEO content fields separately", () => {
  const rows = buildHumanReadableDiff(
    ENTITY_TYPES.SERVICE,
    {
      seo: {
        metaTitle: "Аренда техники"
      }
    },
    {
      seo: {
        metaTitle: "Аренда спецтехники"
      }
    }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].field, "seo.metaTitle");
  assert.match(rows[0].label, /^SEO:/);
});
