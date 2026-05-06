import test from "node:test";
import assert from "node:assert/strict";

import { buildPublicRouteMetadata } from "../lib/public-launch/seo-metadata.js";

test("public route metadata applies SEO overrides for canonical and indexation", () => {
  const metadata = buildPublicRouteMetadata({
    pathname: "/services/drainage",
    title: "Fallback title",
    description: "Fallback description",
    seo: {
      metaTitle: "Drainage service",
      metaDescription: "Drainage service description",
      canonicalIntent: "/services/drainage-main",
      indexationFlag: "noindex"
    },
    siteName: "Eco"
  });

  assert.equal(metadata.title, "Drainage service");
  assert.equal(metadata.description, "Drainage service description");
  assert.equal(metadata.alternates.canonical.endsWith("/services/drainage-main"), true);
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, false);
  assert.equal(metadata.openGraph.title, "Drainage service");
  assert.equal(metadata.openGraph.siteName, "Eco");
  assert.equal(metadata.twitter.card, "summary_large_image");
});

test("placeholder mode metadata stays noindex even with SEO overrides", () => {
  const metadata = buildPublicRouteMetadata({
    pathname: "/cases/sample",
    placeholderMode: true,
    title: "Case",
    seo: {
      canonicalIntent: "https://example.test/cases/sample",
      indexationFlag: "index"
    }
  });

  assert.equal(metadata.alternates.canonical, "https://example.test/cases/sample");
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, false);
});
