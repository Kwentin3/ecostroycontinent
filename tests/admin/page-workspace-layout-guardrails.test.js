import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cssPath = new URL("../../components/admin/PageWorkspaceScreen.module.css", import.meta.url);
const componentPath = new URL("../../components/admin/PageWorkspaceScreen.js", import.meta.url);

function readUtf8(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

test("page workspace wide layout keeps a compact launcher rail with bounded inputs", () => {
  const css = readUtf8(cssPath);

  assert.match(css, /sources stay compact in the rail, while full selection moves into modal pickers/i);
  assert.match(
    css,
    /\.shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(212px,\s*240px\)\s+minmax\(0,\s*1fr\)\s+minmax\(300px,\s*340px\);/
  );
  assert.match(css, /\.launcherGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(css, /\.shell > \* \{[\s\S]*min-width:\s*0;/);
  assert.match(
    css,
    /\.input,\s*\.select,\s*\.textarea\s*\{[\s\S]*width:\s*100%;[\s\S]*box-sizing:\s*border-box;[\s\S]*min-width:\s*0;[\s\S]*max-width:\s*100%;/
  );
});

test("page workspace intermediate and narrow breakpoints preserve compact rail behavior", () => {
  const css = readUtf8(cssPath);

  assert.match(
    css,
    /@media \(max-width:\s*1320px\)\s*\{[\s\S]*\.shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(212px,\s*240px\)\s+minmax\(0,\s*1fr\);[\s\S]*\.previewCard\s*\{[\s\S]*grid-column:\s*1 \/ -1;/
  );
  assert.match(
    css,
    /@media \(max-width:\s*860px\)\s*\{[\s\S]*\.shell\s*\{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*\.launcherGrid\s*\{[\s\S]*grid-template-columns:\s*1fr;/
  );
});

test("page workspace keeps inline live preview near the canvas and moves full audits into a lower support grid", () => {
  const source = readUtf8(componentPath);
  const css = readUtf8(cssPath);

  assert.match(source, /previewPacket/);
  assert.match(source, /Живое превью/);
  assert.match(source, /Режим встроенного предпросмотра/);
  assert.match(source, /zoom=\{inlinePreviewZoom\}/);
  assert.match(source, /compact/);
  assert.match(source, /supportGrid/);
  assert.match(source, /supportCardWide/);
  assert.match(css, /\.previewPacket\s*\{/);
  assert.match(css, /\.previewCompactList\s*\{/);
  assert.match(css, /\.supportGrid\s*\{/);
});

test("page workspace keeps representative source states and launcher modal flow inside the same screen", () => {
  const source = readUtf8(componentPath);

  assert.match(source, /data-layout-zone="sources"/);
  assert.match(source, /data-layout-zone="canvas"/);
  assert.match(source, /data-layout-zone="preview"/);
  assert.match(source, /launcherModels\.map/);
  assert.match(source, /SourcePickerModal/);
  assert.match(source, /setActivePicker/);
  assert.match(source, /mediaSettings/);
  assert.match(source, /PAGE_MEDIA_HERO_LAYOUTS\.map/);
  assert.match(source, /PAGE_MEDIA_GALLERY_LAYOUTS\.map/);
  assert.match(source, /metadata\.pageType === PAGE_TYPES\.SERVICE_LANDING[\s\S]*primaryServiceId/);
  assert.match(source, /metadata\.pageType === PAGE_TYPES\.EQUIPMENT_LANDING[\s\S]*primaryEquipmentId/);

  const sourceIndex = source.indexOf('data-layout-zone="sources"');
  const canvasIndex = source.indexOf('data-layout-zone="canvas"');
  const previewIndex = source.indexOf('data-layout-zone="preview"');

  assert.notEqual(sourceIndex, -1);
  assert.notEqual(canvasIndex, -1);
  assert.notEqual(previewIndex, -1);
  assert.ok(sourceIndex < canvasIndex, "source column should stay left of canvas in component order");
  assert.ok(canvasIndex < previewIndex, "preview column should stay after canvas in component order");
});
