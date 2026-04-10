import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/admin/entities/page/[pageId]/workspace/route.js";
import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";

function makeFlatPagePayload(overrides = {}) {
  return {
    pageType: "about",
    slug: "about",
    pageThemeKey: "earth_sand",
    title: "About",
    h1: "About us",
    intro: "Intro",
    body: "Body",
    contactNote: "",
    ctaTitle: "Discuss the project",
    ctaBody: "Leave a request",
    defaultBlockCtaLabel: "Discuss",
    serviceIds: ["service_1"],
    caseIds: ["case_1"],
    galleryIds: ["gallery_1"],
    primaryMediaAssetId: "media_1",
    seo: {
      metaTitle: "About meta",
      metaDescription: "About description",
      canonicalIntent: "/about",
      indexationFlag: "index",
      openGraphTitle: "About OG",
      openGraphDescription: "About OG description",
      openGraphImageAssetId: "media_2"
    },
    ...overrides
  };
}

function makeCanonicalPagePayload(overrides = {}) {
  const payload = makeFlatPagePayload(overrides);

  return normalizeEntityInput(ENTITY_TYPES.PAGE, {
    ...payload,
    ...payload.seo
  });
}

function buildRequest(body) {
  return new Request("http://localhost/api/admin/entities/page/page_1/workspace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function buildRouteDeps({ captured, withDraft = true } = {}) {
  const entity = {
    id: "page_1",
    entityType: ENTITY_TYPES.PAGE
  };
  const publishedRevision = {
    id: "rev_published",
    revisionNumber: 1,
    state: "published",
    previewStatus: "preview_renderable",
    payload: makeCanonicalPagePayload()
  };
  const draftRevision = withDraft
    ? {
        id: "rev_draft",
        revisionNumber: 2,
        state: "draft",
        previewStatus: "preview_renderable",
        payload: makeCanonicalPagePayload({
          title: "About draft",
          h1: "About draft",
          intro: "Draft intro",
          body: "Draft body",
          ctaTitle: "Draft CTA"
        })
      }
    : null;

  return {
    requireRouteUser: async () => ({
      user: {
        id: "user_1",
        role: "seo_manager"
      },
      response: null
    }),
    userCanEditContent: () => true,
    getEntityAggregate: async () => ({
      entity,
      activePublishedRevision: publishedRevision,
      revisions: draftRevision ? [draftRevision, publishedRevision] : [publishedRevision]
    }),
    findEntityById: async () => entity,
    saveDraft: async (input) => {
      captured.saveDraftInput = input;

      return {
        entity,
        revision: {
          id: "rev_saved",
          revisionNumber: 3,
          state: "draft",
          previewStatus: "preview_renderable",
          payload: input.payload
        }
      };
    },
    submitRevisionForReview: async (input) => {
      captured.submitRevisionInput = input;

      return {
        revision: {
          id: input.revisionId,
          revisionNumber: 2,
          state: "review",
          previewStatus: "preview_renderable"
        }
      };
    },
    requestLandingWorkspaceCandidate: async (input) => {
      captured.aiInput = input;

      return {
        status: "ok",
        payload: makeCanonicalPagePayload({
          title: "AI About",
          h1: "AI headline",
          intro: "AI intro",
          body: "AI bridge copy",
          ctaTitle: "AI CTA title",
          ctaBody: "AI CTA body",
          defaultBlockCtaLabel: "AI CTA label",
          contactNote: "AI contact bridge"
        })
      };
    }
  };
}

test("page workspace save_composition keeps metadata canonical and updates only composition fields", async () => {
  const captured = {};
  const response = await POST(
    buildRequest({
      action: "save_composition",
      composition: {
        title: "About refreshed",
        intro: "Sharper intro",
        body: "Updated connective copy"
      }
    }),
    { params: { pageId: "page_1" } },
    buildRouteDeps({ captured })
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(captured.saveDraftInput.entityType, ENTITY_TYPES.PAGE);
  assert.equal(captured.saveDraftInput.payload.title, "About refreshed");
  assert.equal(captured.saveDraftInput.payload.intro, "Sharper intro");
  assert.equal(captured.saveDraftInput.payload.body, "Updated connective copy");
  assert.equal(captured.saveDraftInput.payload.slug, "about");
  assert.equal(captured.saveDraftInput.payload.pageType, "about");
  assert.equal(captured.saveDraftInput.payload.seo.metaTitle, "About meta");
  assert.equal(captured.saveDraftInput.payload.seo.openGraphImageAssetId, "media_2");
  assert.equal(result.metadata.slug, "about");
});

test("page workspace save_metadata keeps page composition intact and removes hidden carry-through", async () => {
  const captured = {};
  const response = await POST(
    buildRequest({
      action: "save_metadata",
      metadata: {
        slug: "contacts",
        pageType: "contacts",
        pageThemeKey: "forest_contrast",
        seo: {
          metaTitle: "Contacts meta",
          canonicalIntent: "/contacts",
          indexationFlag: "noindex"
        }
      }
    }),
    { params: { pageId: "page_1" } },
    buildRouteDeps({ captured })
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(captured.saveDraftInput.payload.title, "About draft");
  assert.equal(captured.saveDraftInput.payload.body, "Draft body");
  assert.equal(captured.saveDraftInput.payload.ctaTitle, "Draft CTA");
  assert.equal(captured.saveDraftInput.payload.slug, "contacts");
  assert.equal(captured.saveDraftInput.payload.pageType, "contacts");
  assert.equal(captured.saveDraftInput.payload.pageThemeKey, "forest_contrast");
  assert.equal(captured.saveDraftInput.payload.seo.metaTitle, "Contacts meta");
  assert.equal(captured.saveDraftInput.payload.seo.canonicalIntent, "/contacts");
  assert.equal(captured.saveDraftInput.payload.seo.indexationFlag, "noindex");
});

test("page workspace suggest_patch returns bounded AI patch without saving canonical truth", async () => {
  const captured = {};
  const response = await POST(
    buildRequest({
      action: "suggest_patch",
      aiAction: "strengthen_cta",
      target: "cta",
      composition: {
        ctaTitle: "Draft CTA",
        ctaBody: "Draft CTA body",
        defaultBlockCtaLabel: "Draft label"
      },
      metadata: {
        pageType: "about"
      }
    }),
    { params: { pageId: "page_1" } },
    buildRouteDeps({ captured })
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.suggestion.patch).sort(), ["ctaBody", "ctaTitle", "defaultBlockCtaLabel"]);
  assert.equal(result.suggestion.patch.ctaTitle, "AI CTA title");
  assert.equal(result.suggestion.patch.ctaBody, "AI CTA body");
  assert.equal(result.suggestion.patch.defaultBlockCtaLabel, "AI CTA label");
  assert.equal(captured.saveDraftInput, undefined);
  assert.equal(captured.submitRevisionInput, undefined);
  assert.equal(captured.aiInput.variantKey, "strengthen_cta");
});

test("page workspace send_to_review reuses the canonical draft revision", async () => {
  const captured = {};
  const response = await POST(
    buildRequest({
      action: "send_to_review"
    }),
    { params: { pageId: "page_1" } },
    buildRouteDeps({ captured })
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(captured.submitRevisionInput.revisionId, "rev_draft");
  assert.equal(result.reviewHref, "/admin/review/rev_draft");
  assert.equal(captured.saveDraftInput, undefined);
});
