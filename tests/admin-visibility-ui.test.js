import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { GET } from "../app/api/admin/visibility/read-model/route.js";

test("admin visibility UI route is wired to read model and minimal operational SEO panel", () => {
  const pageSource = readFileSync(new URL("../app/admin/(console)/visibility/page.js", import.meta.url), "utf8");
  const componentSource = readFileSync(new URL("../components/admin/SeoVisibilityDashboard.js", import.meta.url), "utf8");
  const rendererSource = readFileSync(new URL("../components/public/PublicRenderers.js", import.meta.url), "utf8");
  const trackingBoundarySource = readFileSync(new URL("../components/public/PublicTrackingBoundary.js", import.meta.url), "utf8");
  const uiSource = `${pageSource}\n${componentSource}`;

  assert.match(pageSource, /buildSeoDashboardReadModel/);
  assert.match(pageSource, /activeHref="\/admin\/visibility"/);
  assert.match(componentSource, /Минимальная SEO-панель/);
  assert.match(componentSource, /Внутренние визиты/);
  assert.match(componentSource, /Источники, устройства и география/);
  assert.match(componentSource, /Страницы входа/);
  assert.match(componentSource, /Внутренние действия/);
  assert.match(componentSource, /Семантическая карта кликов/);
  assert.match(componentSource, /Поиск и Вебмастер/);
  assert.match(componentSource, /Ограничения данных/);
  assert.match(componentSource, /Существующие диагностические сигналы/);
  assert.match(componentSource, /Метрика — внешний слой/);
  assert.match(componentSource, /read model only/);
  assert.match(componentSource, /нельзя трактовать как нулевой спрос/);
  assert.match(componentSource, /Google Search Console/);
  assert.match(componentSource, /Домен лидов/);
  assert.match(componentSource, /Content Core/);
  assert.doesNotMatch(componentSource, /Что делать сейчас|Очередь рекомендаций|Создать рекомендацию/);
  assert.doesNotMatch(uiSource, /api-metrika|api\.webmaster|webmaster\.yandex|mc\.yandex|Authorization|fetch\s*\(/i);
  assert.match(rendererSource, /data-analytics-id/);
  assert.match(rendererSource, /PublicTrackingBoundary/);
  assert.match(trackingBoundarySource, /AnalyticsTracker/);
});

test("read model endpoint requires auth and returns terminal redirect for unauthorized users", async () => {
  const response = await GET(new Request("http://localhost/api/admin/visibility/read-model"), {}, {
    requireRouteUser: async () => ({
      user: null,
      response: new Response(null, {
        status: 303,
        headers: { location: "http://localhost/admin/login" }
      })
    }),
    buildSeoDashboardReadModel: async () => {
      throw new Error("read model should not build without auth");
    }
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost/admin/login");
});

test("read model endpoint returns required contract sections for authorized users", async () => {
  const response = await GET(new Request("http://localhost/api/admin/visibility/read-model?period=28"), {}, {
    requireRouteUser: async () => ({ user: { id: "user_1", role: "seo_manager" }, response: null }),
    buildSeoDashboardReadModel: async () => ({
      version: "seo_dashboard_analytics_read_model.v0.1",
      overview: {},
      traffic_sources: [],
      page_list: [],
      selected_page_detail: null,
      recommendations: [],
      evidence_items: [],
      external_source_readiness: {},
      external_evidence: {},
      analytics_history: {}
    })
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  for (const key of ["overview", "traffic_sources", "page_list", "selected_page_detail", "recommendations", "evidence_items", "external_source_readiness", "external_evidence", "analytics_history"]) {
    assert.equal(key in body.data, true);
  }
});
