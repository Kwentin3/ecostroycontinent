import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildEntityPayload } from "../lib/admin/entity-form-data.js";
import { ENTITY_TYPES, PAGE_SECTION_TYPES, PAGE_TYPES, SERVICE_SCOPE_DISPLAY_MODES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";
import { buildFormattedPlainTextBlocks } from "../lib/public-launch/formatted-plain-text.js";

const FORMATTED_TEXT = "Первая строка\r\n\r\nВторая строка";

test("entity form payload and normalization preserve internal line breaks in public content text", () => {
  const formData = new FormData();
  formData.set("title", "Форматированная услуга");
  formData.set("h1", "Форматированная услуга");
  formData.set("summary", FORMATTED_TEXT);
  formData.set("serviceScope", FORMATTED_TEXT);
  formData.set("serviceScopeDisplayMode", SERVICE_SCOPE_DISPLAY_MODES.COLUMNS);
  formData.set("problemsSolved", FORMATTED_TEXT);
  formData.set("methods", FORMATTED_TEXT);
  formData.set("ctaVariant", "Позвонить");

  const payload = buildEntityPayload(ENTITY_TYPES.SERVICE, formData);

  assert.equal(payload.summary, FORMATTED_TEXT);
  assert.equal(payload.serviceScope, FORMATTED_TEXT);
  assert.equal(payload.serviceScopeDisplayMode, SERVICE_SCOPE_DISPLAY_MODES.COLUMNS);
  assert.equal(payload.problemsSolved, FORMATTED_TEXT);
  assert.equal(payload.methods, FORMATTED_TEXT);

  const service = normalizeEntityInput(ENTITY_TYPES.SERVICE, payload);

  assert.equal(service.summary, FORMATTED_TEXT);
  assert.equal(service.serviceScope, FORMATTED_TEXT);
  assert.equal(service.serviceScopeDisplayMode, SERVICE_SCOPE_DISPLAY_MODES.COLUMNS);
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
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  const css = readFileSync(new URL("../components/public/public-ui.module.css", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");

  assert.match(rendererSource, /function FormattedPlainText/);
  assert.match(rendererSource, /buildFormattedPlainTextBlocks/);
  assert.match(rendererSource, /hasOrderedList/);
  assert.match(rendererSource, /id="preview-service-methods"/);
  assert.match(rendererSource, /variant=\{service\.serviceScopeDisplayMode === SERVICE_SCOPE_DISPLAY_MODES\.COLUMNS/);
  assert.match(rendererSource, /<FormattedPlainText text=\{service\.methods\}/);
  assert.match(css, /\.page :where\(p, figcaption\)\s*\{[\s\S]*white-space:\s*pre-line;/);
  assert.match(css, /\.formattedText\s*\{/);
  assert.match(css, /\.formattedTextColumns\s*\{/);
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\);/);
  assert.match(css, /\.formattedList\s*\{/);
});

test("formatted plain text parser turns blank-line paragraphs and numbered lines into semantic blocks", () => {
  const blocks = buildFormattedPlainTextBlocks([
    "Первый абзац",
    "",
    "Второй абзац",
    "",
    "1. Первый шаг",
    "2. Второй шаг",
    "продолжение второго шага",
    "3) Третий шаг"
  ].join("\r\n"));

  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      text: "Первый абзац"
    },
    {
      type: "paragraph",
      text: "Второй абзац"
    },
    {
      type: "orderedList",
      items: [
        {
          number: 1,
          text: "Первый шаг"
        },
        {
          number: 2,
          text: "Второй шаг\nпродолжение второго шага"
        },
        {
          number: 3,
          text: "Третий шаг"
        }
      ]
    }
  ]);
});
