import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBreadcrumbStructuredData,
  buildLocalBusinessStructuredData,
  serializeStructuredData
} from "../lib/public-launch/seo-structured-data.js";

test("breadcrumb structured data resolves current route for the final crumb", () => {
  const schema = buildBreadcrumbStructuredData({
    currentPath: "/services/drainage",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Услуги", href: "/services" },
      { label: "Дренаж" }
    ]
  });

  assert.equal(schema.kind, "breadcrumb");
  assert.equal(schema.payload["@type"], "BreadcrumbList");
  assert.equal(schema.payload.itemListElement.length, 3);
  assert.equal(schema.payload.itemListElement[0].item.endsWith("/"), true);
  assert.equal(schema.payload.itemListElement[1].item.endsWith("/services"), true);
  assert.equal(schema.payload.itemListElement[2].item.endsWith("/services/drainage"), true);
});

test("breadcrumb schema is skipped when there is no breadcrumb chain", () => {
  const schema = buildBreadcrumbStructuredData({
    currentPath: "/",
    breadcrumbs: []
  });

  assert.equal(schema, null);
});

test("local business schema is rendered only for confirmed truth", () => {
  const missing = buildLocalBusinessStructuredData({
    globalSettings: {
      publicBrandName: "Экостройконтинент"
    },
    contactProjection: {
      truthConfirmed: false
    }
  });

  assert.equal(missing, null);

  const factual = buildLocalBusinessStructuredData({
    globalSettings: {
      publicBrandName: "Экостройконтинент",
      organization: {
        city: "Москва",
        country: "RU"
      }
    },
    contactProjection: {
      truthConfirmed: true,
      phone: "+7 (999) 000-00-00",
      email: "mail@example.test",
      serviceArea: "Москва и Московская область",
      primaryRegion: "Москва"
    }
  });

  assert.equal(factual.kind, "local-business");
  assert.equal(factual.payload["@type"], "LocalBusiness");
  assert.equal(factual.payload.name, "Экостройконтинент");
  assert.equal(factual.payload.telephone, "+7 (999) 000-00-00");
  assert.equal(factual.payload.email, "mail@example.test");
  assert.equal(factual.payload.areaServed, "Москва и Московская область");
});

test("structured data serialization escapes angle brackets", () => {
  const serialized = serializeStructuredData({
    "@context": "https://schema.org",
    "@type": "Thing",
    name: "<danger>"
  });

  assert.equal(serialized.includes("<danger>"), false);
  assert.equal(serialized.includes("\\u003cdanger>"), true);
});
