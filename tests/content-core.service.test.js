import test from "node:test";
import assert from "node:assert/strict";

import { CHANGE_CLASSES, ENTITY_TYPES, PAGE_TYPES } from "../lib/content-core/content-types.js";
import {
  assertEntityType,
  buildChangeSummary,
  determineChangeClass,
  normalizeEntityInput,
  toBoolean,
  requiresOwnerReview
} from "../lib/content-core/pure.js";

test("normalizeEntityInput keeps fixed page route truth for contacts pages", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.CONTACTS,
    title: "Contacts",
    h1: "Contact us",
    intro: "Reach the team",
    contactNote: "Call before arrival",
    serviceIds: [],
    caseIds: [],
    galleryIds: [],
    primaryMediaAssetId: "",
    defaultBlockCtaLabel: ""
  });

  assert.equal(page.slug, "contacts");
  assert.equal(page.pageType, PAGE_TYPES.CONTACTS);
  assert.equal(page.blocks.some((block) => block.type === "contact"), true);
  assert.equal(page.blocks.some((block) => block.type === "cta"), false);
});

test("normalizeEntityInput applies product media defaults for page type when editor left media presentation untouched", () => {
  const servicePage = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.SERVICE_LANDING,
    slug: "foundation",
    title: "Foundation works",
    h1: "Foundation works",
    intro: "Reliable groundwork",
    primaryMediaAssetId: "media_1",
    sourceRefs: {
      primaryServiceId: "service_1",
      primaryEquipmentId: "",
      caseIds: [],
      galleryIds: ["gallery_1"]
    },
    sections: [],
    seo: {}
  });
  const contactsPage = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.CONTACTS,
    title: "Contacts",
    h1: "Contacts",
    intro: "Reach us",
    contactNote: "Call before arrival",
    sourceRefs: {
      primaryServiceId: "",
      primaryEquipmentId: "",
      caseIds: [],
      galleryIds: ["gallery_2"]
    },
    sections: [],
    seo: {}
  });

  assert.deepEqual(servicePage.mediaSettings, {
    heroLayout: "split",
    galleryLayout: "grid",
    galleryAspectRatio: "landscape",
    galleryGrouping: "by_collection",
    showGalleryCaptions: true
  });
  assert.deepEqual(contactsPage.mediaSettings, {
    heroLayout: "stacked",
    galleryLayout: "strip",
    galleryAspectRatio: "landscape",
    galleryGrouping: "flat",
    showGalleryCaptions: false
  });
});

test("normalizeEntityInput keeps service and case references inside page blocks only", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.ABOUT,
    pageThemeKey: "forest_contrast",
    title: "About",
    h1: "About company",
    intro: "Company intro",
    body: "Body text",
    serviceIds: ["service-1"],
    caseIds: ["case-1"],
    galleryIds: ["gallery-1"],
    primaryMediaAssetId: "media-1",
    ctaTitle: "Need a quote?",
    ctaBody: "Send us details",
    defaultBlockCtaLabel: "Request quote"
  });

  assert.equal(page.slug, "about");
  assert.equal(page.pageThemeKey, "forest_contrast");
  assert.deepEqual(
    page.blocks.map((block) => block.type),
    ["hero", "rich_text", "service_list", "case_list", "gallery", "cta"]
  );
  assert.equal(page.blocks[0].textEmphasisPreset, "standard");
  assert.equal(page.blocks[0].surfaceTone, "plain");
  assert.equal(page.blocks[1].textEmphasisPreset, "standard");
  assert.equal("serviceIds" in page, false);
  assert.equal("caseIds" in page, false);
});

test("normalizeEntityInput persists bounded landing visual semantics without opening raw styling freedom", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.ABOUT,
    pageThemeKey: "slate_editorial",
    title: "About",
    h1: "About company",
    intro: "Company intro",
    body: "Body text",
    heroTextEmphasisPreset: "strong",
    heroSurfaceTone: "tinted",
    contentBandTextEmphasisPreset: "quiet",
    contentBandSurfaceTone: "emphasis",
    ctaTextEmphasisPreset: "strong",
    ctaSurfaceTone: "emphasis",
    serviceIds: [],
    caseIds: [],
    galleryIds: [],
    primaryMediaAssetId: "media-1",
    ctaTitle: "Need a quote?",
    ctaBody: "Send us details",
    defaultBlockCtaLabel: "Request quote"
  });

  assert.equal(page.pageThemeKey, "slate_editorial");
  assert.equal(page.blocks[0].type, "hero");
  assert.equal(page.blocks[0].textEmphasisPreset, "strong");
  assert.equal(page.blocks[0].surfaceTone, "tinted");
  assert.equal(page.blocks[1].type, "rich_text");
  assert.equal(page.blocks[1].textEmphasisPreset, "quiet");
  assert.equal(page.blocks[1].surfaceTone, "emphasis");
  assert.equal(page.blocks.at(-1).type, "cta");
  assert.equal(page.blocks.at(-1).textEmphasisPreset, "strong");
  assert.equal(page.blocks.at(-1).surfaceTone, "emphasis");
  assert.equal("heroFontSize" in page, false);
  assert.equal("pagePaletteOverride" in page, false);
});

test("normalizeEntityInput preserves bounded page media settings and projects them into hero/gallery blocks", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.ABOUT,
    pageThemeKey: "earth_sand",
    title: "About",
    h1: "About company",
    intro: "Company intro",
    body: "Body text",
    caseIds: [],
    galleryIds: ["gallery-1", "gallery-2"],
    primaryMediaAssetId: "media-1",
    mediaSettings: {
      heroLayout: "split",
      galleryLayout: "featured",
      galleryAspectRatio: "square",
      galleryGrouping: "by_collection",
      showGalleryCaptions: false
    },
    ctaTitle: "Need a quote?",
    ctaBody: "Send us details",
    defaultBlockCtaLabel: "Request quote"
  });
  const heroBlock = page.blocks.find((block) => block.type === "hero");
  const galleryBlock = page.blocks.find((block) => block.type === "gallery");

  assert.deepEqual(page.mediaSettings, {
    heroLayout: "split",
    galleryLayout: "featured",
    galleryAspectRatio: "square",
    galleryGrouping: "by_collection",
    showGalleryCaptions: false
  });
  assert.equal(heroBlock.mediaLayout, "split");
  assert.equal(galleryBlock.layoutPreset, "featured");
  assert.equal(galleryBlock.aspectRatioPreset, "square");
  assert.equal(galleryBlock.groupingMode, "by_collection");
  assert.equal(galleryBlock.showCaptions, false);
});

test("normalizeEntityInput reads page seo from either top-level fields or nested seo payload", () => {
  const page = normalizeEntityInput(ENTITY_TYPES.PAGE, {
    pageType: PAGE_TYPES.ABOUT,
    title: "About",
    h1: "About company",
    intro: "Company intro",
    body: "Body text",
    serviceIds: ["service-1"],
    caseIds: ["case-1"],
    galleryIds: ["gallery-1"],
    primaryMediaAssetId: "media-1",
    seo: {
      metaTitle: "About",
      metaDescription: "About us",
      canonicalIntent: "/about",
      indexationFlag: "index",
      openGraphTitle: "About",
      openGraphDescription: "About us",
      openGraphImageAssetId: "media-1"
    }
  });

  assert.equal(page.seo.metaTitle, "About");
  assert.equal(page.seo.metaDescription, "About us");
  assert.equal(page.seo.canonicalIntent, "/about");
  assert.equal(page.seo.openGraphImageAssetId, "media-1");
});

test("change classification and owner review rules follow first-slice canon", () => {
  const newServicePayload = {
    slug: "drainage",
    title: "Drainage",
    h1: "Drainage works",
    summary: "Summary",
    serviceScope: "Scope",
    problemsSolved: "",
    methods: "",
    ctaVariant: "default",
    relatedCaseIds: [],
    galleryIds: [],
    primaryMediaAssetId: "",
    seo: {}
  };

  assert.equal(
    determineChangeClass(ENTITY_TYPES.SERVICE, null, newServicePayload),
    CHANGE_CLASSES.NEW_LAUNCH_CRITICAL
  );
  assert.equal(requiresOwnerReview(ENTITY_TYPES.SERVICE, null, newServicePayload), true);

  const previousPublished = { ...newServicePayload, slug: "drainage" };
  const routeChanged = { ...newServicePayload, slug: "storm-drainage" };

  assert.equal(
    determineChangeClass(ENTITY_TYPES.SERVICE, previousPublished, routeChanged),
    CHANGE_CLASSES.ROUTE
  );
  assert.equal(requiresOwnerReview(ENTITY_TYPES.SERVICE, previousPublished, routeChanged), true);

  const previousCasePayload = { slug: "resort-case" };
  const nextCasePayload = { slug: "resort-case", title: "Case" };
  assert.equal(
    determineChangeClass(ENTITY_TYPES.CASE, previousCasePayload, nextCasePayload),
    CHANGE_CLASSES.MINOR_EDITORIAL
  );
});

test("buildChangeSummary reports top-level field deltas only for the target entity type", () => {
  const changedFields = buildChangeSummary(
    ENTITY_TYPES.SERVICE,
    {
      slug: "drainage",
      title: "Drainage",
      h1: "Drainage works",
      summary: "Old summary",
      serviceScope: "Scope",
      problemsSolved: "",
      methods: "",
      ctaVariant: "default",
      relatedCaseIds: [],
      galleryIds: [],
      primaryMediaAssetId: "",
      seo: {}
    },
    {
      slug: "drainage",
      title: "Drainage",
      h1: "Drainage works",
      summary: "New summary",
      serviceScope: "Scope",
      problemsSolved: "",
      methods: "",
      ctaVariant: "call-now",
      relatedCaseIds: [],
      galleryIds: [],
      primaryMediaAssetId: "",
      seo: {}
    }
  );

  assert.deepEqual(changedFields.sort(), ["ctaVariant", "summary"]);
});

test("global settings normalization preserves boolean truth and reusable defaults", () => {
  const settings = normalizeEntityInput(ENTITY_TYPES.GLOBAL_SETTINGS, {
    publicBrandName: "Ekostroykontinent",
    legalName: "OOO Ekostroykontinent",
    primaryPhone: "+7 900 000 00 00",
    activeMessengers: ["telegram"],
    publicEmail: "hello@example.com",
    serviceArea: "Sochi and nearby region",
    primaryRegion: "Sochi",
    defaultCtaLabel: "Request estimate",
    defaultCtaDescription: "Tell us about the site",
    organizationCity: "Sochi",
    organizationCountry: "RU",
    contactTruthConfirmed: "true"
  });

  assert.equal(settings.contactTruthConfirmed, true);
  assert.deepEqual(settings.activeMessengers, ["telegram"]);
  assert.equal(settings.organization.city, "Sochi");
  assert.equal(settings.organization.country, "RU");
});

test("media normalization keeps only the supported V1 metadata contract", () => {
  const media = normalizeEntityInput(ENTITY_TYPES.MEDIA_ASSET, {
    title: "Фасад",
    alt: "Фасад дома после работ",
    caption: "Фасад после утепления",
    sourceNote: "Съёмка бригады",
    ownershipNote: "Собственный архив",
    storageKey: "media/facade.jpg",
    mimeType: "image/jpeg",
    originalFilename: "facade.jpg",
    uploadedBy: "seo",
    uploadedAt: "2026-03-27T10:00:00.000Z",
    sizeBytes: 1024,
    status: "ready",
    lifecycleState: "archived",
    metaTitle: "Этого поля не должно быть в media payload",
    canonicalIntent: "https://example.test/facade"
  });

  assert.equal("metaTitle" in media, false);
  assert.equal("canonicalIntent" in media, false);
  assert.equal(media.title, "Фасад");
  assert.equal(media.alt, "Фасад дома после работ");
  assert.equal(media.lifecycleState, "archived");
});

test("media normalization defaults lifecycleState to active when it is omitted", () => {
  const media = normalizeEntityInput(ENTITY_TYPES.MEDIA_ASSET, {
    title: "Тестовое изображение",
    alt: "",
    caption: "",
    sourceNote: "",
    ownershipNote: "",
    storageKey: "media/test.jpg",
    mimeType: "image/jpeg",
    originalFilename: "test.jpg",
    uploadedBy: "seo",
    uploadedAt: "2026-03-27T10:00:00.000Z",
    sizeBytes: 512,
    status: "draft_asset"
  });

  assert.equal(media.lifecycleState, "active");
});

test("entity type parsing and owner-review rules stay narrow and contract-safe", () => {
  assert.equal(assertEntityType("service"), ENTITY_TYPES.SERVICE);
  assert.throws(() => assertEntityType("article"));

  assert.equal(toBoolean("true"), true);
  assert.equal(toBoolean("on"), true);
  assert.equal(toBoolean("false"), false);

  assert.equal(
    requiresOwnerReview(ENTITY_TYPES.GLOBAL_SETTINGS, null, { contactTruthConfirmed: true }),
    true
  );
  assert.equal(
    requiresOwnerReview(ENTITY_TYPES.PAGE, { pageType: PAGE_TYPES.ABOUT, slug: "about" }, { pageType: PAGE_TYPES.ABOUT, slug: "about" }),
    true
  );
  assert.equal(
    requiresOwnerReview(ENTITY_TYPES.PAGE, { pageType: PAGE_TYPES.CONTACTS, slug: "contacts" }, { pageType: PAGE_TYPES.CONTACTS, slug: "contacts" }),
    false
  );
});
