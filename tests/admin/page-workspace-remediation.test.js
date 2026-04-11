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
    title: "\u041e \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438",
    h1: "\u041e \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438",
    intro: "\u0418\u043d\u0442\u0440\u043e",
    body: "\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u0442\u0435\u043a\u0441\u0442",
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
  assert.equal(
    normalizeLegacyPageCopy("Р РЋР Р†РЎРЏР В·Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ РЎРѓ Р Р…Р В°Р СР С‘"),
    "Связаться с нами"
  );
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
