import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PLACEHOLDER_COOKIE_NAME,
  PLACEHOLDER_QUERY_PARAM,
  buildPlaceholderRobotsMetadata,
  isPublicCorePath,
  parsePlaceholderToggle
} from "../lib/public-launch/placeholder-mode.js";
import {
  getPlaceholderAboutPage,
  getPlaceholderCaseBySlug,
  getPlaceholderCases,
  getPlaceholderContactsPage,
  getPlaceholderServiceBySlug,
  getPlaceholderServices
} from "../lib/public-launch/placeholder-fixtures.js";

test("placeholder mode parser accepts explicit on/off tokens only", () => {
  assert.equal(parsePlaceholderToggle("1"), true);
  assert.equal(parsePlaceholderToggle("ON"), true);
  assert.equal(parsePlaceholderToggle("true"), true);
  assert.equal(parsePlaceholderToggle("0"), false);
  assert.equal(parsePlaceholderToggle("off"), false);
  assert.equal(parsePlaceholderToggle("false"), false);
  assert.equal(parsePlaceholderToggle(undefined), null);
  assert.equal(parsePlaceholderToggle("maybe"), null);
});

test("placeholder controls target only public launch-core paths", () => {
  assert.equal(isPublicCorePath("/"), true);
  assert.equal(isPublicCorePath("/services"), true);
  assert.equal(isPublicCorePath("/services/placeholder-drainage"), true);
  assert.equal(isPublicCorePath("/cases"), true);
  assert.equal(isPublicCorePath("/cases/placeholder-case-drainage-pit"), true);
  assert.equal(isPublicCorePath("/about"), true);
  assert.equal(isPublicCorePath("/contacts"), true);
  assert.equal(isPublicCorePath("/admin"), false);
  assert.equal(isPublicCorePath("/api/health"), false);
});

test("placeholder robots metadata is noindex and nofollow", () => {
  const enabled = buildPlaceholderRobotsMetadata(true);
  const disabled = buildPlaceholderRobotsMetadata(false);

  assert.equal(enabled.robots.index, false);
  assert.equal(enabled.robots.follow, false);
  assert.equal(enabled.robots.googleBot.index, false);
  assert.equal(enabled.robots.googleBot.follow, false);
  assert.deepEqual(disabled, {});
});

test("placeholder fixtures expose route stubs for services, cases and standalone pages", () => {
  const services = getPlaceholderServices();
  const cases = getPlaceholderCases();
  const about = getPlaceholderAboutPage();
  const contacts = getPlaceholderContactsPage();

  assert.ok(services.length >= 3);
  assert.ok(cases.length >= 2);
  assert.equal(about.pageType, "about");
  assert.equal(contacts.pageType, "contacts");
  assert.ok(getPlaceholderServiceBySlug(services[0].slug));
  assert.ok(getPlaceholderCaseBySlug(cases[0].slug));
});

test("public placeholder layer wiring is present in routes and middleware", () => {
  const servicesIndex = readFileSync(new URL("../app/services/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const serviceDetail = readFileSync(new URL("../app/services/[slug]/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const contactsPage = readFileSync(new URL("../app/contacts/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runtimeDisplayModeSource = readFileSync(new URL("../lib/public-launch/runtime-display-mode.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const middlewareSource = readFileSync(new URL("../middleware.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(servicesIndex, /resolvePublicRuntimeDisplayMode/);
  assert.match(servicesIndex, /placeholderFallbackEnabled/);
  assert.match(servicesIndex, /buildPublicRouteMetadata|buildPlaceholderRobotsMetadata/);
  assert.match(servicesIndex, /placeholderMarker=\{usingPlaceholder\}/);
  assert.match(serviceDetail, /getPlaceholderServiceBySlug/);
  assert.match(contactsPage, /getPlaceholderContactsPage/);
  assert.match(runtimeDisplayModeSource, /PUBLIC_DISPLAY_MODE_QUERY_PARAM/);
  assert.match(runtimeDisplayModeSource, /PLACEHOLDER_QUERY_PARAM/);
  assert.match(rendererSource, /placeholderMarker/);
  assert.match(rendererSource, /ТЕХНИЧЕСКАЯ ЗАГЛУШКА - НЕ БОЕВОЙ КОНТЕНТ|PLACEHOLDER_MARKER_TEXT/);

  assert.match(middlewareSource, /PLACEHOLDER_QUERY_PARAM/);
  assert.match(middlewareSource, /PLACEHOLDER_COOKIE_NAME/);
  assert.match(middlewareSource, /X-Robots-Tag/);
  assert.match(middlewareSource, /noindex, nofollow/);
});
