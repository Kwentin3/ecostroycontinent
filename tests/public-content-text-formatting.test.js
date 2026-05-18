import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildEntityPayload } from "../lib/admin/entity-form-data.js";
import { ENTITY_TYPES, PAGE_SECTION_TYPES, PAGE_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";

const FORMATTED_TEXT = "Первая строка\r\n\r\nВторая строка";

test("entity form payload and normalization preserve internal line breaks in public content text", () => {
  const formData = new FormData();
  formData.set("title", "Форматированная услуга");
  formData.set("h1", "Форматированная услуга");
  formData.set("summary", FORMATTED_TEXT);
  formData.set("serviceScope", FORMATTED_TEXT);
  formData.set("problemsSolved", FORMATTED_TEXT);
  formData.set("methods", FORMATTED_TEXT);
  formData.set("ctaVariant", "Позвонить");

  const payload = buildEntityPayload(ENTITY_TYPES.SERVICE, formData);

  assert.equal(payload.summary, FORMATTED_TEXT);
  assert.equal(payload.serviceScope, FORMATTED_TEXT);
  assert.equal(payload.problemsSolved, FORMATTED_TEXT);
  assert.equal(payload.methods, FORMATTED_TEXT);

  const service = normalizeEntityInput(ENTITY_TYPES.SERVICE, payload);

  assert.equal(service.summary, FORMATTED_TEXT);
  assert.equal(service.serviceScope, FORMATTED_TEXT);
  assert.equal(service.problemsSolved, FORMATTED_TEXT);
  assert.equal(service.methods, FORMATTED_TEXT);
});

test("page sections keep internal blank lines through public payload normalization", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.ABOUT,
    title: "О компании",
    h1: "О компании",
    intro: FORMATTED_TEXT,
    sections: [
      {
        type: PAGE_SECTION_TYPES.HERO_OFFER,
        order: 0,
        title: "",
        body: FORMATTED_TEXT,
        ctaLabel: "",
        trustText: FORMATTED_TEXT
      },
      {
        type: PAGE_SECTION_TYPES.RICH_TEXT,
        order: 1,
        title: "",
        body: FORMATTED_TEXT
      }
    ]
  });

  assert.equal(page.intro, FORMATTED_TEXT);
  assert.equal(page.sections[0].body, FORMATTED_TEXT);
  assert.equal(page.sections[0].trustText, FORMATTED_TEXT);
  assert.equal(page.sections[1].body, FORMATTED_TEXT);
  assert.equal(page.blocks.find((block) => block.type === "hero")?.body, FORMATTED_TEXT);
  assert.equal(page.blocks.find((block) => block.type === "rich_text")?.body, FORMATTED_TEXT);
});

test("public text rendering keeps textarea line breaks visible", () => {
  const css = readFileSync(new URL("../components/public/public-ui.module.css", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");

  assert.match(css, /\.page :where\(p, figcaption\)\s*\{[\s\S]*white-space:\s*pre-line;/);
});
