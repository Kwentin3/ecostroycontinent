import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ENTITY_TYPES } from "../lib/content-core/content-types.js";
import { normalizeEntityInput } from "../lib/content-core/pure.js";
import {
  buildServiceAreaReadinessResults,
  resolveEffectiveServiceArea
} from "../lib/content-core/geography.js";
import {
  buildLocalBusinessStructuredData,
  buildServiceStructuredData
} from "../lib/public-launch/seo-structured-data.js";

function serviceInput(overrides = {}) {
  return {
    slug: "arenda-tehniki",
    title: "Equipment rental",
    h1: "Equipment rental",
    summary: "Rental service summary",
    serviceScope: "Rental with operator",
    ctaVariant: "Ask availability",
    equipmentIds: [],
    relatedCaseIds: [],
    galleryIds: [],
    primaryMediaAssetId: "",
    seo: {},
    ...overrides
  };
}

test("service normalization supports optional service area and note", () => {
  const service = normalizeEntityInput(ENTITY_TYPES.SERVICE, serviceInput({
    serviceArea: "  Adler district  ",
    serviceAreaNote: "  Owner-approved coverage note.  "
  }));

  assert.equal(service.serviceArea, "Adler district");
  assert.equal(service.serviceAreaNote, "Owner-approved coverage note.");

  const inherited = normalizeEntityInput(ENTITY_TYPES.SERVICE, serviceInput({
    serviceArea: "   ",
    serviceAreaNote: ""
  }));

  assert.equal(inherited.serviceArea, "");
  assert.equal(inherited.serviceAreaNote, "");
});

test("effective service area prefers service override and falls back to global default", () => {
  const withOverride = resolveEffectiveServiceArea({
    service: { serviceArea: "Adler", serviceAreaNote: "Only confirmed districts." },
    globalSettings: { serviceArea: "Sochi and Greater Sochi", primaryRegion: "Sochi" }
  });

  assert.equal(withOverride.effectiveServiceArea, "Adler");
  assert.equal(withOverride.serviceAreaNote, "Only confirmed districts.");
  assert.equal(withOverride.source, "service");
  assert.equal(withOverride.inheritedFromGlobal, false);

  const inherited = resolveEffectiveServiceArea({
    service: { serviceArea: "   " },
    globalSettings: { serviceArea: "Sochi and Greater Sochi", primaryRegion: "Sochi" }
  });

  assert.equal(inherited.effectiveServiceArea, "Sochi and Greater Sochi");
  assert.equal(inherited.source, "global");
  assert.equal(inherited.inheritedFromGlobal, true);

  const primaryRegionFallback = resolveEffectiveServiceArea({
    service: {},
    globalSettings: { serviceArea: " ", primaryRegion: "Sochi" }
  });

  assert.equal(primaryRegionFallback.effectiveServiceArea, "Sochi");
  assert.equal(primaryRegionFallback.hasEffectiveServiceArea, true);

  const missing = resolveEffectiveServiceArea({ service: {}, globalSettings: {} });

  assert.equal(missing.effectiveServiceArea, "");
  assert.equal(missing.hasEffectiveServiceArea, false);
});

test("service area readiness blocks missing effective area and marks global inheritance", () => {
  const missing = buildServiceAreaReadinessResults({
    service: { serviceArea: "" },
    globalSettings: { serviceArea: "", primaryRegion: "" }
  });

  assert.equal(missing.length, 1);
  assert.equal(missing[0].severity, "blocking");
  assert.equal(missing[0].code, "missing_effective_service_area");
  assert.equal(missing[0].field, "serviceArea");

  const inherited = buildServiceAreaReadinessResults({
    service: { serviceArea: "" },
    globalSettings: { serviceArea: "Sochi and Greater Sochi" }
  });

  assert.equal(inherited.length, 1);
  assert.equal(inherited[0].severity, "info");
  assert.equal(inherited[0].code, "inherits_global_service_area");

  const explicit = buildServiceAreaReadinessResults({
    service: { serviceArea: "Adler" },
    globalSettings: { serviceArea: "Sochi and Greater Sochi" }
  });

  assert.deepEqual(explicit, []);
});

test("service structured data uses effective service area without physical address", () => {
  const serviceSchema = buildServiceStructuredData({
    service: {
      slug: "arenda-tehniki",
      title: "Equipment rental",
      h1: "Equipment rental",
      summary: "Rental with operator"
    },
    currentPath: "/services/arenda-tehniki",
    effectiveServiceArea: "Adler"
  });

  assert.equal(serviceSchema.kind, "service");
  assert.equal(serviceSchema.payload["@type"], "Service");
  assert.equal(serviceSchema.payload.areaServed, "Adler");
  assert.equal(serviceSchema.payload.name, "Equipment rental");
  assert.equal(serviceSchema.payload.description, "Rental with operator");
  assert.equal(Object.hasOwn(serviceSchema.payload, "address"), false);
  assert.equal(serviceSchema.payload.provider["@id"].endsWith("/#organization"), true);

  assert.equal(buildServiceStructuredData({
    service: { title: "Equipment rental" },
    currentPath: "/services/arenda-tehniki",
    effectiveServiceArea: " "
  }), null);

  const localBusiness = buildLocalBusinessStructuredData({
    globalSettings: {
      publicBrandName: "Ecostroycontinent",
      organization: { city: "Sochi", country: "RU" }
    },
    contactProjection: {
      truthConfirmed: true,
      phone: "+7 000 000 00 00",
      serviceArea: "Sochi and Greater Sochi",
      primaryRegion: "Sochi"
    }
  });

  assert.equal(localBusiness.payload.areaServed, "Sochi and Greater Sochi");
  assert.equal(Object.hasOwn(localBusiness.payload, "address"), false);
});

test("public renderer keeps local geography inside services and proof cases without equipment routes", () => {
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8");
  const servicePageSource = readFileSync(new URL("../app/services/[slug]/page.js", import.meta.url), "utf8");

  assert.match(rendererSource, /resolveEffectiveServiceArea/);
  assert.match(rendererSource, /ServiceAreaNote/);
  assert.match(rendererSource, /serviceAreaModel/);
  assert.match(rendererSource, /CaseLocationLabel/);
  assert.match(rendererSource, /Локация:/);
  assert.match(servicePageSource, /buildServiceDescriptionWithArea/);
  assert.equal(existsSync(resolve("app/equipment")), false);
});
