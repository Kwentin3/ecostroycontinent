import test from "node:test";
import assert from "node:assert/strict";

import { normalizePageRegistryRecord, normalizePageRegistryRecords } from "../../lib/admin/page-registry-records.js";

test("normalizePageRegistryRecord restores safe metadata defaults when legacy registry record is incomplete", () => {
  const record = normalizePageRegistryRecord({
    id: "page_1",
    title: "Контакты",
    slug: "",
    metadata: null
  });

  assert.equal(record.slug, "about");
  assert.equal(record.metadata.slug, "about");
  assert.equal(record.metadata.pageType, "about");
  assert.equal(record.metadata.pageThemeKey, "earth_sand");
  assert.equal(record.metadata.seo.indexationFlag, "index");
});

test("normalizePageRegistryRecords keeps valid contacts record semantics", () => {
  const [record] = normalizePageRegistryRecords([
    {
      id: "page_2",
      title: "Контакты",
      metadata: {
        pageType: "contacts",
        slug: "contacts",
        seo: {
          metaTitle: "Контакты"
        }
      }
    }
  ]);

  assert.equal(record.slug, "contacts");
  assert.equal(record.metadata.pageType, "contacts");
  assert.equal(record.metadata.slug, "contacts");
  assert.equal(record.metadata.seo.metaTitle, "Контакты");
});
