import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  getEditorFallbackAnchor,
  getEditorFieldAnchor,
  listEditorFieldAnchors
} from "../../lib/admin/editor-anchors.js";

test("service and page anchors resolve to stable exact field targets", () => {
  const serviceAnchor = getEditorFieldAnchor(ENTITY_TYPES.SERVICE, "summary");
  const pageAnchor = getEditorFieldAnchor(ENTITY_TYPES.PAGE, "pageType");

  assert.deepEqual(serviceAnchor, {
    entityType: ENTITY_TYPES.SERVICE,
    field: "summary",
    anchorId: "service-seo-truth",
    anchorKind: "field",
    isFallback: false,
    fallbackAnchorId: "service-fallback"
  });

  assert.deepEqual(pageAnchor, {
    entityType: ENTITY_TYPES.PAGE,
    field: "pageType",
    anchorId: "page-route-truth",
    anchorKind: "field",
    isFallback: false,
    fallbackAnchorId: "page-fallback"
  });
});

test("missing or unknown fields fall back explicitly and do not look exact", () => {
  const fallbackAnchor = getEditorFieldAnchor(ENTITY_TYPES.GLOBAL_SETTINGS, "unknownField");
  const emptyFieldAnchor = getEditorFieldAnchor(ENTITY_TYPES.CASE, null);

  assert.equal(fallbackAnchor.anchorId, "global-settings-fallback");
  assert.equal(fallbackAnchor.isFallback, true);
  assert.equal(fallbackAnchor.anchorKind, "fallback");
  assert.equal(emptyFieldAnchor.anchorId, "case-fallback");
  assert.equal(emptyFieldAnchor.isFallback, true);
  assert.equal(getEditorFallbackAnchor(ENTITY_TYPES.MEDIA_ASSET), "media-asset-fallback");
});

test("listEditorFieldAnchors exposes the mapped readiness fields for the operator surfaces", () => {
  const anchors = listEditorFieldAnchors(ENTITY_TYPES.GLOBAL_SETTINGS);

  assert.equal(anchors.some((anchor) => anchor.field === "contactTruthConfirmed"), true);
  assert.equal(anchors.some((anchor) => anchor.field === "serviceArea"), true);
  assert.equal(anchors.every((anchor) => anchor.isFallback === false), true);
});

