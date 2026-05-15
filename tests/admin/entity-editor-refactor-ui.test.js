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

test("entity truth sections use the shared slug-title control for routed entities", () => {
  const source = readUtf8("components/admin/EntityTruthSections.js");
  const control = readUtf8("components/admin/SlugTitleFields.js");

  assert.match(source, /SlugTitleFields/);
  assert.match(control, /normalizeSlug/);
  assert.match(control, /slugManuallyEdited/);
  assert.match(control, /onBlur=\{handleSlugBlur\}/);
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

test("entity editor moves primary actions and status into the right rail", () => {
  const source = readUtf8("components/admin/EntityEditorForm.js");

  assert.doesNotMatch(source, /editorHero/);
  assert.doesNotMatch(source, /editorToolbar/);
  assert.match(source, /editorStatusPanel/);
  assert.match(source, /editorStatusList/);
  assert.match(source, /editorRailActions/);
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

test("shared admin ui exposes compact editor status rail patterns", () => {
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.doesNotMatch(css, /\.editorHero\s*\{/);
  assert.doesNotMatch(css, /\.editorToolbar\s*\{/);
  assert.match(css, /\.editorStatusPanel\s*\{/);
  assert.match(css, /\.editorRailActions\s*\{/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(240px, 280px\);/);
  assert.match(css, /\.editorRail\s*\{[\s\S]*position:\s*sticky;/);
  assert.match(css, /\.editorRail\s*\{[\s\S]*order:\s*-1;/);
});
