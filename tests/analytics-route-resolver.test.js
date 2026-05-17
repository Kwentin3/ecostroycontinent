import test from "node:test";
import assert from "node:assert/strict";

import { resolveRouteEntity } from "../lib/analytics/route-resolver.js";

test("route resolver maps home, service, case, about and contacts routes", async () => {
  const deps = {
    getPublishedHomePage: async () => ({ entityId: "page_home", revisionId: "revision_home" }),
    getPublishedServiceBySlug: async (slug) => slug === "monolitnye-raboty"
      ? { entityId: "service_1", revisionId: "revision_service_1" }
      : null,
    getPublishedCaseBySlug: async (slug) => slug === "dom-v-sochi"
      ? { entityId: "case_1", revisionId: "revision_case_1" }
      : null,
    getPublishedAboutPage: async () => ({ entityId: "page_about", revisionId: "revision_about" }),
    getPublishedContactsPage: async () => ({ entityId: "page_contacts", revisionId: "revision_contacts" })
  };

  assert.deepEqual(await resolveRouteEntity("/", deps), {
    page_path: "/",
    entity_type: "page",
    entity_id: "page_home",
    page_kind: "home",
    published_revision_id: "revision_home",
    resolution_status: "resolved"
  });
  assert.deepEqual(await resolveRouteEntity("/services/monolitnye-raboty?utm_source=yandex", deps), {
    page_path: "/services/monolitnye-raboty",
    entity_type: "service",
    entity_id: "service_1",
    page_kind: "service_detail",
    published_revision_id: "revision_service_1",
    resolution_status: "resolved"
  });
  assert.equal((await resolveRouteEntity("/cases/dom-v-sochi", deps)).entity_id, "case_1");
  assert.equal((await resolveRouteEntity("/about", deps)).entity_id, "page_about");
  assert.equal((await resolveRouteEntity("/contacts", deps)).entity_id, "page_contacts");
});

test("route resolver returns unmapped safely instead of dropping unknown URLs", async () => {
  const result = await resolveRouteEntity("/old-service?foo=bar", {
    getPublishedServiceBySlug: async () => null,
    getPublishedCaseBySlug: async () => null,
    getPublishedHomePage: async () => null,
    getPublishedAboutPage: async () => null,
    getPublishedContactsPage: async () => null
  });

  assert.equal(result.page_path, "/old-service");
  assert.equal(result.resolution_status, "unmapped");
  assert.equal(result.entity_id, null);
});

test("route resolver keeps blog as future article branch without fake entity mapping", async () => {
  const result = await resolveRouteEntity("/blog/seo-test");

  assert.equal(result.entity_type, "article");
  assert.equal(result.page_kind, "future_article_detail");
  assert.equal(result.resolution_status, "future_not_supported");
});
