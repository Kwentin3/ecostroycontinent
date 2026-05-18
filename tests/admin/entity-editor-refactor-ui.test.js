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

test("service editor exposes the temporary service scope display mode selector", () => {
  const truthSource = readUtf8("components/admin/EntityTruthSections.js");
  const legacySource = readUtf8("components/admin/EntityEditorForm.js");

  assert.match(truthSource, /FIELD_LABELS\.serviceScopeDisplayMode/);
  assert.match(truthSource, /name="serviceScopeDisplayMode"/);
  assert.match(truthSource, /SERVICE_SCOPE_DISPLAY_MODES\.COLUMNS/);
  assert.match(truthSource, /page-owned/);
  assert.match(legacySource, /name="serviceScopeDisplayMode"/);
});

test("entity editor keeps right rail status and actions compact", () => {
  const source = readUtf8("components/admin/EntityEditorForm.js");

  assert.doesNotMatch(source, /editorHero/);
  assert.doesNotMatch(source, /editorToolbar/);
  assert.doesNotMatch(source, /editorStatusList/);
  assert.doesNotMatch(source, /editorStatusSummary/);
  assert.match(source, /editorStatusPanel/);
  assert.match(source, /editorStatusPills/);
  assert.match(source, /editorRailIconActions/);
  assert.match(source, /role="toolbar" aria-label="Действия карточки"/);
  assert.match(source, /aria-label=\{ADMIN_COPY\.saveDraft\}/);
  assert.match(source, /title=\{ADMIN_COPY\.saveDraft\}/);
  assert.match(source, /formAction=\{`\/api\/admin\/entities\/\$\{entityType\}\/save`\}/);
  assert.match(source, /formMethod="post"/);
  assert.match(source, /editorRailPrimaryFlow/);
  assert.match(source, /\{ADMIN_COPY\.sendForReview\}/);
  assert.match(source, /EntityEditorValidationNotice formId=\{editorFormId\}/);
  assert.match(source, /RailActionIcon icon="↺"/);
  assert.match(source, /RailActionIcon icon="↩"/);
  assert.match(source, /showMaintenanceTools/);
  assert.match(source, /compactDisclosureSummaryMeta/);
});

test("entity editor reports required fields hidden inside collapsed sections", () => {
  const source = readUtf8("components/admin/EntityEditorValidationNotice.js");
  const css = readUtf8("components/admin/admin-ui.module.css");

  assert.match(source, /"use client"/);
  assert.match(source, /addEventListener\("invalid", handleInvalid, true\)/);
  assert.match(source, /getInvalidControls\(form\)/);
  assert.match(source, /!element\.validity\.valid/);
  assert.doesNotMatch(source, /checkValidity/);
  assert.match(source, /closest\("details"\)\?\.setAttribute\("open", ""\)/);
  assert.match(source, /setAttribute\("aria-invalid", "true"\)/);
  assert.match(source, /setAttribute\("aria-describedby", describedById\)/);
  assert.match(source, /role="alert" aria-live="assertive"/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /Перейти к полю/);
  assert.match(css, /\.editorValidationNotice\s*\{/);
  assert.match(css, /\.inlineTextButton:focus-visible\s*\{/);
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
  assert.doesNotMatch(css, /\.editorStatusList\s*\{/);
  assert.match(css, /\.editorStatusPanel\s*\{/);
  assert.match(css, /\.editorStatusPills\s*\{/);
  assert.match(css, /\.editorRailIconActions\s*\{/);
  assert.match(css, /\.editorRailIconAction\s*\{/);
  assert.match(css, /width:\s*38px;/);
  assert.match(css, /\.editorRailIconAction:focus-visible\s*\{/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(240px, 280px\);/);
  assert.match(css, /\.editorRail\s*\{[\s\S]*position:\s*sticky;/);
  assert.match(css, /\.editorRail\s*\{[\s\S]*order:\s*-1;/);
});
