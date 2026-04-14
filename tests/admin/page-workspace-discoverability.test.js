import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getPageThemeFieldHint,
  getPageWorkspaceVisualSettingsHint,
  getPrimarySourceEmptyState,
  getSourceChecklistEmptyState
} from "../../lib/admin/page-workspace-copy.js";
import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";

const metadataModalPath = new URL("../../components/admin/PageMetadataModal.js", import.meta.url);
const workspaceScreenPath = new URL("../../components/admin/PageWorkspaceScreen.js", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("page theme labels stay Russian and operator-friendly", () => {
  const themeKeys = Object.keys(LANDING_PAGE_THEME_REGISTRY);
  const labels = Object.values(LANDING_PAGE_THEME_REGISTRY).map((theme) => theme.label);

  assert.deepEqual(themeKeys, [
    "earth_sand",
    "forest_contrast",
    "slate_editorial",
    "graphite_industrial",
    "night_signal",
    "concrete_blueprint"
  ]);
  assert.equal(labels.length, 6);
  assert.ok(labels.every((label) => !/[A-Za-z]{3,}/.test(label)));
  assert.ok(labels.every((label) => label.trim().length >= 8));
});

test("discoverability copy points operators to metadata and clearer source next steps", () => {
  assert.equal(
    getPageWorkspaceVisualSettingsHint(),
    "Внешний вид страницы настраивается в «Метаданных» → «Основное»."
  );
  assert.equal(
    getPageThemeFieldHint(),
    "Тема меняет общий тон страницы и отражается в предпросмотре."
  );

  assert.deepEqual(getPrimarySourceEmptyState("service"), {
    text: "Пока нет доступных услуг. Сначала подготовьте и опубликуйте услугу, чтобы взять её за основу страницы.",
    href: "/admin/entities/service",
    linkLabel: "Открыть реестр услуг"
  });
  assert.deepEqual(getPrimarySourceEmptyState("equipment"), {
    text: "Пока нет доступной техники. Сначала подготовьте и опубликуйте карточку техники, чтобы взять её за основу страницы.",
    href: "/admin/entities/equipment",
    linkLabel: "Открыть реестр техники"
  });
  assert.deepEqual(getSourceChecklistEmptyState("cases"), {
    text: "Пока нет доступных кейсов. Добавьте и опубликуйте кейс, чтобы показать доказательства и реальные сценарии работы.",
    href: "/admin/entities/case",
    linkLabel: "Открыть реестр кейсов"
  });
});

test("metadata modal and workspace keep bounded discoverability guardrails in source", () => {
  const metadataModal = readUtf8(metadataModalPath);
  const workspaceScreen = readUtf8(workspaceScreenPath);

  assert.match(metadataModal, /event\.key === "Escape" && !busy/);
  assert.match(metadataModal, /getPageWorkspaceVisualSettingsHint\(\)/);
  assert.match(metadataModal, /getPageThemeFieldHint\(\)/);
  assert.match(workspaceScreen, /getPageWorkspaceVisualSettingsHint\(\)/);
  assert.match(workspaceScreen, /RichSourceChecklist/);
  assert.match(workspaceScreen, /getPrimarySourceEmptyState\("service"\)/);
  assert.match(workspaceScreen, /getPrimarySourceEmptyState\("equipment"\)/);
});
