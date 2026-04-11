import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../../lib/content-core/pure.js";
import { normalizeLegacyPageCopy } from "../../lib/content-core/page-copy.js";
import {
  buildPageWorkspaceAiActionModel,
  buildPageWorkspaceLifecycleState,
  buildPageWorkspacePreviewPayload
} from "../../lib/admin/page-workspace.js";

test("page workspace preview payload stays empty-safe for pages without basics", () => {
  const preview = buildPageWorkspacePreviewPayload({
    baseValue: {
      pageType: "about",
      slug: "about",
      pageThemeKey: "earth_sand",
      seo: {}
    },
    composition: {},
    metadata: {}
  });

  assert.equal(preview, null);
});

test("page default CTA copy is generated in readable Russian", () => {
  const payload = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: "about",
    title: "О компании",
    h1: "О компании",
    intro: "Интро",
    body: "Основной текст",
    ctaTitle: "",
    ctaBody: "",
    defaultBlockCtaLabel: "",
    primaryMediaAssetId: "",
    serviceIds: [],
    caseIds: [],
    galleryIds: [],
    pageThemeKey: "earth_sand",
    metaTitle: "",
    metaDescription: "",
    canonicalIntent: "",
    indexationFlag: "index",
    openGraphTitle: "",
    openGraphDescription: "",
    openGraphImageAssetId: ""
  });
  const ctaBlock = payload.blocks.find((block) => block.type === "cta");

  assert.equal(ctaBlock.title, "Свяжитесь с нами");
  assert.equal(ctaBlock.ctaLabel, "Связаться с нами");
  assert.equal(normalizeLegacyPageCopy("РЎРІСЏР·Р°С‚СЊСЃСЏ СЃ РЅР°РјРё"), "Связаться с нами");
});

test("page lifecycle stays bounded: archive for live, delete for never-published only", () => {
  const liveLifecycle = buildPageWorkspaceLifecycleState({
    aggregate: {
      entity: { activePublishedRevisionId: "rev_live" },
      revisions: [{ id: "rev_live", state: "published" }]
    },
    permissions: {
      canArchive: true,
      canDelete: true
    }
  });
  const draftOnlyLifecycle = buildPageWorkspaceLifecycleState({
    aggregate: {
      entity: { activePublishedRevisionId: null },
      revisions: [{ id: "rev_draft", state: "draft" }]
    },
    permissions: {
      canArchive: true,
      canDelete: true
    }
  });

  assert.equal(liveLifecycle.canArchive, true);
  assert.equal(liveLifecycle.canDelete, false);
  assert.equal(draftOnlyLifecycle.canArchive, false);
  assert.equal(draftOnlyLifecycle.canDelete, true);
});

test("AI action model routes fixed actions to predictable zones", () => {
  const connective = buildPageWorkspaceAiActionModel({
    aiAction: "suggest_connective_copy",
    selectedTarget: "hero",
    pageType: "about"
  });
  const cta = buildPageWorkspaceAiActionModel({
    aiAction: "strengthen_cta",
    selectedTarget: "hero",
    pageType: "contacts"
  });

  assert.equal(connective.target, "connective_copy");
  assert.match(connective.label, /связ/i);
  assert.equal(cta.target, "cta");
  assert.match(cta.label, /контакт/i);
});
