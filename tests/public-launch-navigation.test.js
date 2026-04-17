import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildPublicBreadcrumbs,
  buildServiceQuickLinks,
  getPublicNavItems,
  resolvePublicNavSection
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
});

test("public renderers include global nav shell, breadcrumbs and quick-access services surface", () => {
  const source = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const css = readFileSync(new URL("../components/public/public-ui.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /aria-label="Главная навигация"/);
  assert.match(source, /aria-label="Хлебные крошки"/);
  assert.match(source, /servicesQuickAccess/);
  assert.match(source, /publicShellFooterNav/);
  assert.match(source, /buildPublicBreadcrumbs/);

  assert.match(css, /\.publicShellNav\s*\{/);
  assert.match(css, /\.publicShellNavLinkActive\s*\{/);
  assert.match(css, /\.servicesQuickAccess\s*\{/);
  assert.match(css, /\.breadcrumbs\s*\{/);
  assert.match(css, /\.publicShellFooterNav\s*\{/);
});
