import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublishFollowUp,
  buildPublishRevalidationPaths,
  hasSlugMutation
} from "../lib/content-ops/publish-follow-up.js";
import { ENTITY_TYPES, PAGE_TYPES } from "../lib/content-core/content-types.js";

test("service publish follow-up includes detail and index paths plus sitemap", () => {
  const paths = buildPublishRevalidationPaths({
    entityType: ENTITY_TYPES.SERVICE,
    previousPayload: { slug: "old-drainage" },
    nextPayload: { slug: "new-drainage" }
  });

  assert.equal(paths.includes("/"), true);
  assert.equal(paths.includes("/services"), true);
  assert.equal(paths.includes("/cases"), true);
  assert.equal(paths.includes("/services/new-drainage"), true);
  assert.equal(paths.includes("/services/old-drainage"), true);
  assert.equal(paths.includes("/sitemap.xml"), true);
});

test("case publish follow-up includes case paths and sitemap", () => {
  const paths = buildPublishRevalidationPaths({
    entityType: ENTITY_TYPES.CASE,
    previousPayload: { slug: "yard-2025" },
    nextPayload: { slug: "yard-2025" }
  });

  assert.equal(paths.includes("/cases"), true);
  assert.equal(paths.includes("/cases/yard-2025"), true);
  assert.equal(paths.includes("/services"), true);
  assert.equal(paths.includes("/sitemap.xml"), true);
});

test("page publish follow-up is scoped to canonical standalone routes", () => {
  const aboutPaths = buildPublishRevalidationPaths({
    entityType: ENTITY_TYPES.PAGE,
    nextPayload: { pageType: PAGE_TYPES.ABOUT }
  });
  const contactsPaths = buildPublishRevalidationPaths({
    entityType: ENTITY_TYPES.PAGE,
    nextPayload: { pageType: PAGE_TYPES.CONTACTS }
  });

  assert.equal(aboutPaths.includes("/about"), true);
  assert.equal(contactsPaths.includes("/contacts"), true);
  assert.equal(aboutPaths.includes("/sitemap.xml"), true);
  assert.equal(contactsPaths.includes("/sitemap.xml"), true);
});

test("slug mutation helper is strict for service/case and ignores other entities", () => {
  assert.equal(hasSlugMutation(ENTITY_TYPES.SERVICE, { slug: "a" }, { slug: "b" }), true);
  assert.equal(hasSlugMutation(ENTITY_TYPES.CASE, { slug: "a" }, { slug: "a" }), false);
  assert.equal(hasSlugMutation(ENTITY_TYPES.PAGE, { slug: "a" }, { slug: "b" }), false);
});

test("buildPublishFollowUp returns slug mutation summary and obligation types", () => {
  const followUp = buildPublishFollowUp({
    entityType: ENTITY_TYPES.SERVICE,
    previousPayload: { slug: "old-path" },
    nextPayload: { slug: "new-path" },
    obligationTypes: ["redirect_required", "", "sitemap_update_required"]
  });

  assert.equal(followUp.slugMutation.changed, true);
  assert.equal(followUp.slugMutation.previousSlug, "old-path");
  assert.equal(followUp.slugMutation.nextSlug, "new-path");
  assert.deepEqual(followUp.obligationTypes, ["redirect_required", "sitemap_update_required"]);
});
