import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("entity truth sections no longer repeat the generic SEO/data kicker in every block", () => {
  const source = readUtf8("components/admin/EntityTruthSections.js");

  assert.equal((source.match(/Поисковая оптимизация \/ данные/g) || []).length, 0);
  assert.match(source, /kicker="SEO"/);
  assert.match(source, /title="Метаданные и предпросмотр"/);
});

test("entity editor keeps one primary toolbar and demotes maintenance actions into disclosure", () => {
  const source = readUtf8("components/admin/EntityEditorForm.js");

  assert.match(source, /editorToolbar/);
  assert.match(source, /showMaintenanceTools/);
  assert.match(source, /Служебные действия/);
  assert.equal((source.match(/ADMIN_COPY\.openHistory/g) || []).length, 1);
});

test("editor rail presents related-data diagnostics as a secondary disclosure", () => {
  const editorSource = readUtf8("components/admin/EntityEditorForm.js");
  const evidenceSource = readUtf8("components/admin/EvidenceRegisterPanel.js");

  assert.match(editorSource, /title="Что проверить в данных"/);
  assert.match(evidenceSource, /const effectiveTitle = compactRail && title === "Реестр доказательств" \? "Что проверить в данных" : title;/);
  assert.match(evidenceSource, /if \(compactRail\) \{/);
  assert.match(evidenceSource, /<details id=\{panelId\} className=\{styles\.compactDisclosure\}>/);
});

test("shared admin ui exposes compact editor hero and toolbar patterns", () => {
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.match(css, /\.editorHero\s*\{/);
  assert.match(css, /\.editorToolbar\s*\{/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(260px, 320px\);/);
});
