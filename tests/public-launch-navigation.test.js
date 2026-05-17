import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildPublicBreadcrumbs,
  buildServiceQuickLinks,
  getPublicNavItems,
  resolvePublicNavSection,
  shouldRenderServiceQuickAccess
} from "../lib/public-launch/navigation.js";

test("public navigation resolves active section for canonical launch routes", () => {
  assert.equal(resolvePublicNavSection("/"), "home");
  assert.equal(resolvePublicNavSection("/services"), "services");
  assert.equal(resolvePublicNavSection("/services/drainage"), "services");
  assert.equal(resolvePublicNavSection("/cases"), "cases");
  assert.equal(resolvePublicNavSection("/cases/project-1"), "cases");
  assert.equal(resolvePublicNavSection("/about"), "about");
  assert.equal(resolvePublicNavSection("/contacts"), "contacts");
  assert.equal(resolvePublicNavSection("/unknown"), null);
});

test("public navigation provides bounded unique quick links for services dropdown", () => {
  const links = buildServiceQuickLinks([
    { entityId: "service_1", slug: "drainage", title: "Дренаж" },
    { entityId: "service_2", slug: "demolition", title: "Демонтаж" },
    { entityId: "service_3", slug: "drainage", title: "Дренаж дубль" },
    { entityId: "service_4", slug: "", title: "Без slug" }
  ], { limit: 2 });

  assert.equal(links.length, 2);
  assert.deepEqual(links.map((item) => item.href), ["/services/drainage", "/services/demolition"]);
});

test("service quick access renders only in service and case detail context", () => {
  const quickLinks = [
    { key: "service_1", href: "/services/drainage", label: "Дренаж" },
    { key: "service_2", href: "/services/demolition", label: "Демонтаж" }
  ];

  assert.equal(shouldRenderServiceQuickAccess("/", quickLinks), false);
  assert.equal(shouldRenderServiceQuickAccess("/services", quickLinks), false);
  assert.equal(shouldRenderServiceQuickAccess("/cases", quickLinks), false);
  assert.equal(shouldRenderServiceQuickAccess("/about", quickLinks), false);
  assert.equal(shouldRenderServiceQuickAccess("/contacts?utm=1", quickLinks), false);
  assert.equal(shouldRenderServiceQuickAccess("/services/drainage", quickLinks), true);
  assert.equal(shouldRenderServiceQuickAccess("/cases/project-x", quickLinks), true);
  assert.equal(shouldRenderServiceQuickAccess("/services/drainage", []), false);
});

test("public breadcrumbs reflect index and detail route ownership", () => {
  assert.deepEqual(buildPublicBreadcrumbs({ pathname: "/" }), []);

  assert.deepEqual(
    buildPublicBreadcrumbs({ pathname: "/services/drainage", pageTitle: "Дренаж участка" }),
    [
      { key: "home", label: "Главная", href: "/" },
      { key: "services", label: "Услуги", href: "/services" },
      { key: "service-detail", label: "Дренаж участка" }
    ]
  );

  assert.deepEqual(
    buildPublicBreadcrumbs({ pathname: "/cases/project-x", pageTitle: "Кейс X" }),
    [
      { key: "home", label: "Главная", href: "/" },
      { key: "cases", label: "Кейсы", href: "/cases" },
      { key: "case-detail", label: "Кейс X" }
    ]
  );
});

test("public nav model keeps launch-core menu entries stable", () => {
  const navItems = getPublicNavItems();

  assert.deepEqual(
    navItems.map((item) => item.href),
    ["/", "/services", "/cases", "/about", "/contacts"]
  );

  assert.deepEqual(
    getPublicNavItems({ includeCases: false }).map((item) => item.href),
    ["/", "/services", "/about", "/contacts"]
  );
});

test("public renderers include global nav shell and contextual quick-access services surface", () => {
  const source = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const css = readFileSync(new URL("../components/public/public-ui.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /aria-label="Главная навигация"/);
  assert.doesNotMatch(source, /styles\.breadcrumbs/);
  assert.doesNotMatch(source, /function Breadcrumbs/);
  assert.match(source, /servicesQuickAccess/);
  assert.match(source, /className=\{styles\.publicShellBrand\}/);
  assert.match(source, /id: "nav_brand"/);
  assert.match(source, /shouldRenderServiceQuickAccess/);
  assert.match(source, /styles\.servicesQuickAccessLabel/);
  assert.doesNotMatch(source, /<details className=\{styles\.servicesQuickAccess\}/);
  assert.match(source, /publicShellFooterNav/);
  assert.match(source, /buildPublicBreadcrumbs/);
  assert.equal(source.includes("Публичный сайт"), false);

  assert.match(css, /\.publicShellNav\s*\{/);
  assert.match(css, /\.publicShellNavLinkActive\s*\{/);
  assert.match(css, /\.publicShellBrand\s*\{/);
  assert.match(css, /\.publicShellBrand strong\s*\{/);
  assert.match(css, /\.publicShellBrand:focus-visible/);
  assert.match(css, /grid-template-columns: minmax\(180px, 230px\) minmax\(380px, 1fr\) minmax\(250px, 340px\)/);
  assert.match(css, /\.publicShellMeta a\s*\{/);
  assert.match(css, /\.publicShellMeta a:focus-visible/);
  assert.match(css, /\.servicesQuickAccess\s*\{/);
  assert.match(css, /\.servicesQuickAccessLabel\s*\{/);
  assert.match(css, /\.servicesQuickAccess a:focus-visible/);
  assert.doesNotMatch(css, /\.breadcrumbs\s*\{/);
  assert.match(css, /\.publicShellFooterNav\s*\{/);
});
