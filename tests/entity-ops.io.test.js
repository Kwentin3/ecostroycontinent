import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeEntityOpsTextBuffer,
  formatEntityOpsTextReport,
  resolveEntityOpsOutputFormat,
  serializeEntityOpsReport
} from "../lib/entity-ops/io.js";

test("entity ops input decoder strips UTF-8 BOM safely", () => {
  const text = decodeEntityOpsTextBuffer(Buffer.concat([
    Buffer.from([0xEF, 0xBB, 0xBF]),
    Buffer.from('{"title":"Привет"}', "utf8")
  ]));

  assert.equal(text, '{"title":"Привет"}');
});

test("entity ops input decoder accepts UTF-16LE batches from Windows tooling", () => {
  const text = decodeEntityOpsTextBuffer(Buffer.concat([
    Buffer.from([0xFF, 0xFE]),
    Buffer.from('{"title":"Привет"}', "utf16le")
  ]));

  assert.equal(text, '{"title":"Привет"}');
});

test("entity ops input decoder detects UTF-16 without BOM heuristically", () => {
  const text = decodeEntityOpsTextBuffer(Buffer.from('{"title":"Привет"}', "utf16le"));

  assert.equal(text, '{"title":"Привет"}');
});

test("entity ops resolves explicit json output mode", () => {
  assert.equal(resolveEntityOpsOutputFormat({ json: true }), "json");
  assert.equal(resolveEntityOpsOutputFormat({ format: "JSON" }), "json");
  assert.equal(resolveEntityOpsOutputFormat({}), "text");
});

test("entity ops serializes text report with extended runtime fields", () => {
  const output = formatEntityOpsTextReport({
    execute: false,
    total: 1,
    summary: { dryRun: 1 },
    items: [{
      ok: true,
      action: "update",
      kind: "media",
      entityType: "media_asset",
      label: "Тестовый ассет",
      entityId: "media_1",
      previewDiff: {
        title: {
          before: "Старый заголовок",
          after: "Новый заголовок"
        }
      },
      changedFields: ["title"],
      currentMode: "mixed_placeholder",
      filePath: "D:/tmp/test-image.png",
      message: "Медиа обновлено"
    }]
  });

  assert.match(output, /Тестовый ассет/);
  assert.match(output, /currentMode: mixed_placeholder/);
  assert.match(output, /file: D:\/tmp\/test-image\.png/);
  assert.match(output, /message: Медиа обновлено/);
});

test("entity ops serializes json report for machine-readable stdout", () => {
  const json = serializeEntityOpsReport({
    execute: true,
    total: 1,
    summary: { updated: 1 },
    items: [{
      ok: true,
      action: "update",
      kind: "entity",
      entityType: "service",
      label: "test_service",
      entityId: "entity_1",
      previewDiff: {}
    }]
  }, { format: "json" });

  const parsed = JSON.parse(json);

  assert.equal(parsed.summary.updated, 1);
  assert.equal(parsed.items[0].entityType, "service");
});
