import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("safe removal assistant keeps delete flow as a single guided screen", () => {
  const deletePageSource = readUtf8(new URL("../../app/admin/(console)/entities/[entityType]/[entityId]/delete/page.js", import.meta.url));

  assert.match(deletePageSource, /buildSafeRemovalPlan/);
  assert.match(deletePageSource, /Безопасно убрать объект/);
  assert.match(deletePageSource, /Один экран для безопасного удаления/);
  assert.match(deletePageSource, /Пошаговый план/);
  assert.match(deletePageSource, /Если это старый тестовый объект без метки/);
});

test("entity editor routes supported objects into the safe removal assistant", () => {
  const editorSource = readUtf8(new URL("../../components/admin/EntityEditorForm.js", import.meta.url));

  assert.match(editorSource, /isDeleteToolEntityTypeSupported/);
  assert.match(editorSource, /isLiveDeactivationEntityTypeSupported/);
  assert.match(editorSource, /isTestGraphTeardownEntityTypeSupported/);
  assert.match(editorSource, /Безопасно убрать/);
});
