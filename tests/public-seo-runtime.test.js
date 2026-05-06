import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildPublicRobotsSpec,
  buildPublishedSitemapEntries,
  toPublicUrl
} from "../lib/public-launch/seo-runtime.js";

test("public robots spec exposes sitemap and blocks admin surfaces", () => {
  const robots = buildPublicRobotsSpec({ baseUrl: "https://ecostroycontinent.ru/" });

  assert.equal(robots.sitemap, "https://ecostroycontinent.ru/sitemap.xml");
  assert.equal(Array.isArray(robots.rules), true);
  assert.equal(robots.rules[0].userAgent, "*");
  assert.equal(robots.rules[0].allow, "/");
  assert.deepEqual(robots.rules[0].disallow, ["/admin", "/admin/*", "/api/admin", "/api/admin/*"]);
});

test("public robots spec can hard-stop indexation for operational non-launch modes", () => {
  const robots = buildPublicRobotsSpec({
    baseUrl: "https://ecostroycontinent.ru/",
    blockPublicIndexation: true
  });

  assert.equal(robots.sitemap, undefined);
  assert.equal(Array.isArray(robots.rules), true);
  assert.equal(robots.rules[0].userAgent, "*");
  assert.deepEqual(robots.rules[0].disallow, ["/"]);
});

test("sitemap entries include launch-core routes and published detail routes only", () => {
  const entries = buildPublishedSitemapEntries({
    baseUrl: "https://ecostroycontinent.ru",
    services: [
      { entityId: "service-1", slug: "drainage" },
      { entityId: "service-2", slug: "" }
    ],
    cases: [
      { entityId: "case-1", slug: "slope-fix" },
      { entityId: "case-2", slug: null }
    ],
    aboutPage: { entityId: "page-about" },
    contactsPage: null
  });

  const urls = entries.map((entry) => entry.url);

  assert.equal(urls.includes("https://ecostroycontinent.ru/"), true);
  assert.equal(urls.includes("https://ecostroycontinent.ru/services"), true);
  assert.equal(urls.includes("https://ecostroycontinent.ru/cases"), true);
  assert.equal(urls.includes("https://ecostroycontinent.ru/about"), true);
  assert.equal(urls.includes("https://ecostroycontinent.ru/contacts"), false);
  assert.equal(urls.includes("https://ecostroycontinent.ru/services/drainage"), true);
  assert.equal(urls.includes("https://ecostroycontinent.ru/cases/slope-fix"), true);
});

test("seo routes wire to published truth sources and avoid placeholder fixtures", () => {
  const robotsSource = readFileSync(new URL("../app/robots.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const sitemapSource = readFileSync(new URL("../app/sitemap.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(robotsSource, /buildPublicRobotsSpec/);
  assert.match(sitemapSource, /buildPublishedSitemapEntries/);
  assert.match(sitemapSource, /getPublishedServices/);
  assert.match(sitemapSource, /getPublishedCases/);
  assert.match(sitemapSource, /getPublishedAboutPage/);
  assert.match(sitemapSource, /getPublishedContactsPage/);
  assert.doesNotMatch(sitemapSource, /getPlaceholder/);
});

test("public route metadata generation uses canonical helper on launch routes", () => {
  const homeSource = readFileSync(new URL("../app/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const servicesSource = readFileSync(new URL("../app/services/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const casesSource = readFileSync(new URL("../app/cases/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const contactsSource = readFileSync(new URL("../app/contacts/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(homeSource, /buildPublicRouteMetadata/);
  assert.match(servicesSource, /buildPublicRouteMetadata/);
  assert.match(casesSource, /buildPublicRouteMetadata/);
  assert.match(contactsSource, /buildPublicRouteMetadata/);
});

test("public URL helper keeps route composition stable", () => {
  assert.equal(toPublicUrl("https://ecostroycontinent.ru/", "/services"), "https://ecostroycontinent.ru/services");
  assert.equal(toPublicUrl("https://ecostroycontinent.ru", "/cases/slope-fix"), "https://ecostroycontinent.ru/cases/slope-fix");
});
