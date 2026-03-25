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

test("normalizeEntityInput keeps service and case references inside page blocks only", () => {
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
    ctaTitle: "Need a quote?",
    ctaBody: "Send us details",
    defaultBlockCtaLabel: "Request quote"
  });

  assert.equal(page.slug, "about");
  assert.deepEqual(
    page.blocks.map((block) => block.type),
    ["hero", "rich_text", "service_list", "case_list", "gallery", "cta"]
  );
  assert.equal("serviceIds" in page, false);
  assert.equal("caseIds" in page, false);
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
