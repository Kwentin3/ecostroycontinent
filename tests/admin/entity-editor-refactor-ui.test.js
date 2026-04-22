import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

test("entity truth sections keep SEO grouped in a dedicated metadata section", () => {
  const source = readUtf8("components/admin/EntityTruthSections.js");

  assert.equal((source.match(/Поисковая оптимизация \/ данные/g) || []).length, 0);
  assert.match(source, /kicker="SEO"/);
  assert.match(source, /SeoMetaFields/);
});

test("entity truth sections use compact disclosures so secondary groups do not overload the first screen", () => {
  const source = readUtf8("components/admin/EntityTruthSections.js");
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.match(source, /collapsible = true/);
  assert.match(source, /defaultOpen = false/);
  assert.match(source, /editorSectionDisclosure/);
  assert.match(source, /defaultOpen>/);
  assert.match(css, /\.editorSectionDisclosure\s*\{/);
  assert.match(css, /\.editorSectionDisclosureBody \.label textarea\s*\{/);
});

test("entity editor keeps one primary toolbar and demotes maintenance actions into disclosure", () => {
  const source = readUtf8("components/admin/EntityEditorForm.js");

  assert.match(source, /editorToolbar/);
  assert.match(source, /showMaintenanceTools/);
  assert.match(source, /compactDisclosureSummaryMeta/);
  assert.equal((source.match(/ADMIN_COPY\.openHistory/g) || []).length, 1);
});

test("editor rail presents related-data diagnostics as a secondary disclosure", () => {
  const editorSource = readUtf8("components/admin/EntityEditorForm.js");
  const evidenceSource = readUtf8("components/admin/EvidenceRegisterPanel.js");

  assert.match(editorSource, /EvidenceRegisterPanel/);
  assert.match(editorSource, /scope="editor"/);
  assert.match(evidenceSource, /compactRail && title ===/);
  assert.match(evidenceSource, /if \(compactRail\) \{/);
  assert.match(evidenceSource, /<details id=\{panelId\} className=\{styles\.compactDisclosure\}>/);
});

test("shared admin ui exposes compact editor hero toolbar and rail patterns", () => {
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.match(css, /\.editorHero\s*\{/);
  assert.match(css, /\.editorToolbar\s*\{/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(240px, 280px\);/);
  assert.match(css, /\.editorRail\s*\{[\s\S]*position:\s*sticky;/);
});
