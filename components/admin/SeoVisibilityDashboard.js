import Link from "next/link";

import styles from "./SeoVisibilityDashboard.module.css";

const PERIODS = [7, 28, 90];

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "недоступно";
  }

  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "недоступно";
  }

  return `${(Number(value || 0) * 100).toLocaleString("ru-RU", {
    maximumFractionDigits: Number(value || 0) < 0.01 && Number(value || 0) > 0 ? 2 : 1
  })}%`;
}

function sourceTone(status) {
  if (status === "ok" || status === "fresh") {
    return "Ok";
  }

  if (status === "failed") {
    return "Bad";
  }

  if (status === "not_configured" || status === "not_ready" || status === "stale" || status === "partial") {
    return "Warn";
  }

  return "Info";
}

function sourceLabel(source) {
  return {
    first_party_events: "Внутренние события",
    yandex_metrica: "Яндекс Метрика",
    yandex_webmaster: "Яндекс Вебмастер",
    google_search_console: "Google Search Console",
    lead_domain: "Домен лидов",
    content_core: "Контентное ядро"
  }[source] || source;
}

function statusLabel(status) {
  return {
    ok: "ok",
    stale: "stale",
    failed: "failed",
    partial: "partial",
    not_configured: "не подключён",
    not_ready: "не готов",
    not_applicable: "не применимо"
  }[status] || status;
}

function actionabilityLabel(value) {
  if (value === "limited_external_evidence") {
    return "limited external evidence";
  }

  return {
    readiness_only: "только готовность источника",
    limited_external_diagnostic: "ограниченная внешняя диагностика",
    readiness_and_limited_indexation_evidence: "готовность и ограниченная индексация",
    limited_search_visibility_evidence: "ограниченная поисковая видимость"
  }[value] || value || "нет данных";
}

function readinessSourceLabel(source) {
  return {
    yandex_metrica: "Метрика: внешний слой",
    yandex_webmaster: "Вебмастер: внешний слой"
  }[source] || sourceLabel(source);
}

function formatSourcePeriod(item) {
  if (!item?.imported_period_start && !item?.imported_period_end) {
    return "период не задан";
  }

  return `${item.imported_period_start || "?"} - ${item.imported_period_end || "?"}`;
}

function externalMetricLine(totals = {}) {
  return `${formatNumber(totals.visits)} visits - ${formatNumber(totals.users)} users - ${formatNumber(totals.pageviews)} pageviews`;
}

function firstLabel(row = {}, keys = []) {
  for (const key of keys) {
    if (row[key]) {
      return row[key];
    }
  }

  return "n/a";
}

function priorityLabel(priority) {
  return {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий"
  }[priority] || priority || "Низкий";
}

function typeLabel(type) {
  return {
    service: "Услуга",
    case: "Кейс",
    page: "Страница"
  }[type] || "Маршрут";
}

function publishStatusLabel(status) {
  return {
    published: "Опубликовано",
    draft: "Черновик",
    review: "На проверке"
  }[status] || "Нет данных";
}

function recommendationStatusLabel(status) {
  return {
    new: "Новая",
    accepted: "Принята",
    in_progress: "В работе",
    done: "Готово",
    dismissed: "Отклонена",
    not_needed: "Не требуется"
  }[status] || status || "Нет данных";
}

function attributionSafetyLabel(value) {
  return {
    clean_single_change: "Одиночное изменение",
    mixed_change: "Смешанное изменение",
    tracking_changed_nearby: "Менялся трекинг",
    insufficient_after_period: "Мало данных после публикации",
    source_stale: "Источник устарел",
    source_missing: "Источник отсутствует",
    lead_domain_missing: "Лиды недоступны",
    not_attributable: "Нельзя атрибутировать",
    unknown: "Неизвестно"
  }[value] || "Неизвестно";
}

function metricValue(key, metric) {
  if (key === "ctr" || key.includes("conversion")) {
    return formatPercent(metric.value);
  }

  return formatNumber(metric.value);
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return "нет сравнения";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}% к прошлому периоду`;
}

function renderSourceBadges(readModel) {
  return (
    <div className={styles.sourceBadges} aria-label="Состояние источников">
      {Object.entries(readModel.sources || {}).map(([source, item]) => (
        <span key={source} className={`${styles.badge} ${styles[`badge${sourceTone(item.status)}`]}`}>
          {sourceLabel(source)}: {statusLabel(item.status)}
        </span>
      ))}
    </div>
  );
}

function ActionCard({ item }) {
  return (
    <article className={`${styles.actionCard} ${styles[`actionCard${priorityLabel(item.priority) === "Высокий" ? "High" : "Medium"}`]}`}>
      <div className={styles.topBarHeader}>
        <p className={styles.actionTitle}>{item.label}</p>
        <span className={`${styles.badge} ${item.priority === "high" ? styles.badgeBad : styles.badgeWarn}`}>
          {priorityLabel(item.priority)}
        </span>
      </div>
      <p className={styles.muted}>{item.linked_page?.title || item.linked_page?.page_path}</p>
      <p className={styles.smallText}>{item.evidence}</p>
      <p className={styles.smallText}>{item.recommended_action}</p>
      <div className={styles.actions}>
        {item.linked_page?.page_path ? (
          <Link className={styles.secondaryButton} href={item.linked_page.page_path} target="_blank">
            Открыть страницу
          </Link>
        ) : null}
        <span className={styles.disabledButton} aria-disabled="true">Создать рекомендацию</span>
      </div>
    </article>
  );
}

function OverviewCards({ overview }) {
  const items = [
    ["visits", "Визиты"],
    ["organic_visits", "Органический трафик"],
    ["yandex_impressions", "Показы в Яндексе"],
    ["yandex_clicks", "Клики из поиска"],
    ["ctr", "CTR"],
    ["contact_actions", "Контактные действия"],
    ["leads", "Заявки / лиды"],
    ["visit_to_intent_conversion", "Визит -> контакт"]
  ];

  return (
    <section className={styles.panel} aria-labelledby="visibility-overview">
      <div className={styles.panelHeader}>
        <h3 id="visibility-overview">Ключевые метрики</h3>
        <p className={styles.muted}>Цифры всегда идут с пояснением и ограничениями.</p>
      </div>
      <div className={styles.metricGrid}>
        {items.map(([key, label]) => {
          const item = overview[key];

          return (
            <article key={key} className={styles.metricCard}>
              <p className={styles.muted}>{label}</p>
              <p className={styles.metricValue}>
                {key === "leads" ? "не подключено" : metricValue(key, item)}
              </p>
              <p className={styles.metricHint}>
                {key === "leads" ? item.explanation : formatDelta(item.delta_vs_previous_period)}
              </p>
              <p className={styles.smallText}>{item.explanation}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TrafficSources({ sources }) {
  return (
    <section className={styles.panel} aria-labelledby="traffic-sources">
      <div className={styles.panelHeader}>
        <h3 id="traffic-sources">Источники трафика</h3>
        <p className={styles.muted}>Яндекс расположен первым; Google остаётся вторым контуром.</p>
      </div>
      <div className={styles.sourceGrid}>
        {sources.map((item) => (
          <article key={item.source} className={styles.sourceCard}>
            <p className={styles.muted}>{item.label}</p>
            <p className={styles.sourceValue}>{formatNumber(item.visits)} визитов</p>
            <p className={styles.smallText}>
              {formatNumber(item.contact_actions)} контактных действий, конверсия {formatPercent(item.conversion_rate)}
            </p>
            <p className={styles.metricHint}>{formatDelta(item.delta_vs_previous_period)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PagesTable({ pages, selectedPagePath, period }) {
  if (!pages.length) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyBox}>
          <h3>Страницы не найдены</h3>
          <p className={styles.muted}>Нет опубликованных страниц контентного ядра или агрегированных адресов за период.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.tablePanel} aria-labelledby="page-list">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 id="page-list">Рабочий список страниц</h3>
          <p className={styles.muted}>SEO Manager видит проблему и следующее действие рядом с метриками.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Страница</th>
              <th>Тип</th>
              <th>Приоритет</th>
              <th>Публикация</th>
              <th>Индексация</th>
              <th>Показы</th>
              <th>Клики</th>
              <th>CTR</th>
              <th>Визиты</th>
              <th>Контактные действия</th>
              <th>Proof path</th>
              <th>Проблема</th>
              <th>Следующее действие</th>
              <th>Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.page_path}>
                <td>
                  <Link
                    className={styles.pageLink}
                    href={`/admin/visibility?period=${period}&page=${encodeURIComponent(page.page_path)}`}
                    aria-current={selectedPagePath === page.page_path ? "page" : undefined}
                  >
                    {page.page_title}
                  </Link>
                  <p className={styles.smallText}>{page.page_path}</p>
                </td>
                <td>{typeLabel(page.entity_type)}</td>
                <td>{priorityLabel(page.priority || page.commercial_priority)}</td>
                <td><span className={styles.statusText}>{publishStatusLabel(page.publish_status)}</span></td>
                <td>{page.indexation_state}</td>
                <td>{formatNumber(page.impressions)}</td>
                <td>{formatNumber(page.clicks)}</td>
                <td>{formatPercent(page.ctr)}</td>
                <td>{formatNumber(page.visits)}</td>
                <td>{formatNumber(page.contact_actions)}</td>
                <td>{page.proof_path_summary?.summary}</td>
                <td>{page.primary_issue}</td>
                <td>{page.recommended_next_action}</td>
                <td>{recommendationStatusLabel(page.recommendation_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetailList({ items }) {
  return (
    <dl className={styles.definitionList}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PageDetail({ detail }) {
  if (!detail) {
    return (
      <section className={styles.detailPanel}>
        <div className={styles.emptyBox}>
          <h3>Страница не выбрана</h3>
          <p className={styles.muted}>Выберите строку в таблице, чтобы увидеть диагностику.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.detailPanel} aria-labelledby="page-detail">
      <div className={styles.detailHeader}>
        <div className={styles.titleStack}>
          <h3 id="page-detail">{detail.page_identity.page_title}</h3>
          <p className={styles.muted}>{detail.page_identity.page_path}</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>
          {attributionSafetyLabel(detail.before_after_summary.attribution_safety)}
        </span>
      </div>
      <div className={styles.detailColumns}>
        <DetailList
          items={[
            ["Тип", typeLabel(detail.page_identity.entity_type)],
            ["Ревизия", detail.current_published_revision?.revision_id || "нет данных"],
            ["Заголовок title", detail.seo_fields_summary?.title || "не указан"],
            ["Описание description", detail.seo_fields_summary?.description || "не указан"],
            ["H1", detail.seo_fields_summary?.h1 || "не указан"],
            ["Индексация", detail.indexation_summary.indexation_state],
            ["Карта сайта", detail.indexation_summary.sitemap_state],
            ["Канонический адрес", detail.indexation_summary.canonical_state]
          ]}
        />
        <DetailList
          items={[
            ["Показы", formatNumber(detail.visibility_summary.impressions)],
            ["Клики", formatNumber(detail.visibility_summary.clicks)],
            ["CTR", formatPercent(detail.visibility_summary.ctr)],
            ["Визиты", formatNumber(detail.traffic_summary.visits)],
            ["Мобильный трафик", formatPercent(detail.traffic_summary.mobile_share)],
            ["Клик по телефону", formatNumber(detail.intent_events_summary.click_to_call)],
            ["Telegram", formatNumber(detail.intent_events_summary.click_to_telegram)],
            ["WhatsApp", formatNumber(detail.intent_events_summary.click_to_whatsapp)],
            ["Начали форму", formatNumber(detail.intent_events_summary.form_start)],
            ["Отправили форму", formatNumber(detail.intent_events_summary.form_submit)]
          ]}
        />
      </div>
      <div className={styles.warningBox}>
        <strong>Интерпретация before/after</strong>
        <p className={styles.muted}>{detail.before_after_summary.explanation}</p>
      </div>
      <div className={styles.chips}>
        {detail.active_issues.length ? detail.active_issues.map((issue) => (
          <span key={issue.recommendation_id} className={`${styles.badge} ${styles.badgeWarn}`}>{issue.label}</span>
        )) : <span className={`${styles.badge} ${styles.badgeOk}`}>Критичных сигналов нет</span>}
      </div>
    </section>
  );
}

function SemanticClickMap({ items }) {
  const max = Math.max(...items.map((item) => item.actions || 0), 1);

  return (
    <section className={styles.detailPanel} aria-labelledby="semantic-click-map">
      <div className={styles.detailHeader}>
        <h3 id="semantic-click-map">Семантическая карта кликов</h3>
        <p className={styles.muted}>Не pixel heatmap: только смысловые элементы страницы.</p>
      </div>
      <div className={styles.clickMap}>
        {items.map((item) => (
          <article key={item.element_id} className={styles.clickMapItem}>
            <div>
              <strong>{item.label}</strong>
              <p className={styles.smallText}>
                {item.views !== null && item.views !== undefined ? `показы: ${formatNumber(item.views)}, ` : ""}
                действия: {formatNumber(item.actions)}
              </p>
            </div>
            <span className={`${styles.badge} ${item.drop_off_signal === "strong_drop_off" ? styles.badgeWarn : styles.badgeInfo}`}>
              {item.confidence}
            </span>
            <div className={styles.clickBar} aria-hidden="true">
              <span style={{ width: `${Math.min(100, ((item.actions || 0) / max) * 100)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Recommendations({ recommendations }) {
  return (
    <section className={styles.panel} aria-labelledby="recommendations">
      <div className={styles.panelHeader}>
        <h3 id="recommendations">Очередь рекомендаций</h3>
        <p className={styles.muted}>Рекомендация не публикует контент и не доказывает эффект.</p>
      </div>
      <div className={styles.recommendations}>
        {recommendations.length ? recommendations.slice(0, 12).map((item) => (
          <article key={item.recommendation_id} className={styles.recommendationRow}>
            <div>
              <strong>{item.label}</strong>
              <p className={styles.smallText}>{item.linked_page?.page_path}</p>
              <p className={styles.muted}>{item.evidence}</p>
            </div>
            <div className={styles.metaList}>
              <span className={`${styles.badge} ${item.priority === "high" ? styles.badgeBad : styles.badgeWarn}`}>{priorityLabel(item.priority)}</span>
              <span className={styles.badge}>владелец: {item.owner_role}</span>
              <span className={styles.badge}>статус: {item.status}</span>
              <span className={styles.badge}>проверка: {item.next_check_date || "после данных"}</span>
            </div>
          </article>
        )) : (
          <div className={styles.emptyBox}>
            <strong>Рекомендаций пока нет</strong>
            <p className={styles.muted}>Нет достаточных сигналов или опубликованных страниц для диагностики.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Keep limitations visible: this block renders prepared read model evidence only.
function ExternalEvidence({ evidence }) {
  const metrica = evidence?.yandex_metrica;
  const webmaster = evidence?.yandex_webmaster;

  if (!metrica && !webmaster) {
    return null;
  }

  const metricaCards = [
    {
      key: "metrica-sources",
      title: "Metrica sources",
      totals: metrica?.traffic_sources?.totals,
      items: metrica?.traffic_sources?.rows || [],
      keys: ["traffic_source_name", "traffic_source"]
    },
    {
      key: "metrica-devices",
      title: "Metrica devices",
      totals: metrica?.devices?.totals,
      items: metrica?.devices?.rows || [],
      keys: ["device_category_name", "device_category"]
    },
    {
      key: "metrica-geo",
      title: "Metrica geo",
      totals: metrica?.geography?.country_totals,
      items: metrica?.geography?.countries || [],
      keys: ["country_name", "country"]
    },
    {
      key: "metrica-landings",
      title: "Metrica landings",
      totals: metrica?.landings?.totals,
      items: metrica?.landings?.rows || [],
      keys: ["page_path", "normalized_url"]
    }
  ];

  return (
    <section className={styles.panel} aria-labelledby="external-evidence">
      <div className={styles.panelHeader}>
        <h3 id="external-evidence">External evidence</h3>
        <p className={styles.muted}>Read-only external aggregates for context; primary metrics stay internal.</p>
      </div>
      <div className={styles.sourceGrid}>
        {metricaCards.map((card) => (
          <article key={card.key} className={styles.diagnosticCard}>
            <div className={styles.diagnosticRow}>
              <strong>{card.title}</strong>
              <span className={`${styles.badge} ${styles[`badge${sourceTone(metrica?.freshness?.status || metrica?.status)}`]}`}>
                {statusLabel(metrica?.freshness?.status || metrica?.status)}
              </span>
            </div>
            <p className={styles.sourceValue}>{externalMetricLine(card.totals)}</p>
            {card.items.slice(0, 3).map((row) => (
              <p key={`${card.key}-${firstLabel(row, card.keys)}`} className={styles.smallText}>
                {firstLabel(row, card.keys)} - {formatNumber(row.visits)} visits
              </p>
            ))}
          </article>
        ))}
        <article className={styles.diagnosticCard}>
          <div className={styles.diagnosticRow}>
            <strong>Webmaster search state</strong>
            <span className={`${styles.badge} ${styles[`badge${sourceTone(webmaster?.freshness?.status || webmaster?.status)}`]}`}>
              {statusLabel(webmaster?.freshness?.status || webmaster?.status)}
            </span>
          </div>
          <p className={styles.smallText}>
            pages: {formatNumber(webmaster?.host_indexation?.searchable_pages_count)} - excluded: {formatNumber(webmaster?.host_indexation?.excluded_pages_count)}
          </p>
          <p className={styles.smallText}>
            URL samples: {formatNumber(webmaster?.url_samples?.sample_count)} - resolved: {formatNumber(webmaster?.url_samples?.resolved_count)}
          </p>
          <p className={styles.smallText}>
            query evidence count {formatNumber(webmaster?.query_visibility?.row_count)}
          </p>
        </article>
      </div>
      <div className={styles.chips}>
        {[...(metrica?.limitations || []), ...(webmaster?.limitations || [])].slice(0, 8).map((item) => (
          <span key={item} className={`${styles.badge} ${styles.badgeInfo}`}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function Diagnostics({ readModel }) {
  const states = readModel.source_diagnostics?.states || {};
  const unmapped = readModel.source_diagnostics?.unmapped_urls || [];
  const readiness = readModel.external_source_readiness || readModel.source_diagnostics?.external_source_readiness || {};

  return (
    <section className={styles.panel} aria-labelledby="source-diagnostics">
      <div className={styles.panelHeader}>
        <h3 id="source-diagnostics">Диагностика данных</h3>
        <p className={styles.muted}>Интерфейс и будущий копилот видят одинаковые состояния источников.</p>
      </div>
      <div className={styles.diagnostics}>
        {Object.entries(states).map(([source, item]) => (
          <article key={source} className={styles.diagnosticCard}>
            <div className={styles.diagnosticRow}>
              <strong>{sourceLabel(source)}</strong>
              <span className={`${styles.badge} ${styles[`badge${sourceTone(item.status)}`]}`}>
                {statusLabel(item.status)}
              </span>
            </div>
            <p className={styles.smallText}>
              строк импортировано: {formatNumber(item.rows_imported)} · несопоставленных URL: {formatNumber(item.unmapped_url_count)}
            </p>
            {item.safe_error_message ? <p className={styles.muted}>{item.safe_error_message}</p> : null}
          </article>
        ))}
        {Object.entries(readiness).map(([source, item]) => (
          <article key={`readiness-${source}`} className={styles.diagnosticCard}>
            <div className={styles.diagnosticRow}>
              <strong>{readinessSourceLabel(source)}</strong>
              <span className={`${styles.badge} ${styles[`badge${sourceTone(item.freshness?.status || item.status)}`]}`}>
                {statusLabel(item.freshness?.status || item.status)}
              </span>
            </div>
            <p className={styles.smallText}>
              период: {formatSourcePeriod(item)} · строк: {formatNumber(item.rows_imported)} · {actionabilityLabel(item.data_actionability)}
            </p>
            {item.limitations?.length ? (
              <p className={styles.muted}>ограничения: {item.limitations.slice(0, 3).join(", ")}</p>
            ) : null}
          </article>
        ))}
        {unmapped.length ? (
          <article className={styles.warningBox}>
            <strong>Unmapped URL warning</strong>
            <p className={styles.muted}>{readModel.source_diagnostics.warning}</p>
            {unmapped.slice(0, 5).map((item) => (
              <p key={item.id || item.page_path} className={styles.smallText}>{item.page_path} · {item.safe_reason}</p>
            ))}
          </article>
        ) : null}
      </div>
    </section>
  );
}

export function SeoVisibilityDashboard({ readModel, period }) {
  const selectedPagePath = readModel.selected_page_detail?.page_identity?.page_path || "";
  const topActions = readModel.overview.top_recommendations || [];

  return (
    <div className={styles.dashboard}>
      <section className={styles.topBar} aria-labelledby="visibility-title">
        <div className={styles.topBarHeader}>
          <div className={styles.titleStack}>
            <h3 id="visibility-title">Трафик, поисковая видимость, обращения и рекомендации</h3>
            <p className={styles.subtitle}>
              Что нужно сделать сейчас, чтобы получить больше целевого трафика и больше обращений.
            </p>
          </div>
          <div className={styles.periodTabs} aria-label="Период">
            {PERIODS.map((days) => (
              <Link
                key={days}
                className={`${styles.periodLink} ${period === days ? styles.periodLinkActive : ""}`}
                href={`/admin/visibility?period=${days}${selectedPagePath ? `&page=${encodeURIComponent(selectedPagePath)}` : ""}`}
                aria-current={period === days ? "page" : undefined}
              >
                {days} дней
              </Link>
            ))}
          </div>
        </div>
        {renderSourceBadges(readModel)}
        <div className={styles.actions}>
          <Link className={styles.secondaryButton} href="/api/admin/visibility/read-model" target="_blank">
            Проверить источники
          </Link>
          <span className={styles.disabledButton} aria-disabled="true">Настройки интеграций</span>
        </div>
        {readModel.warnings.length ? (
          <div className={styles.warningBox} role="status">
            {readModel.warnings.map((warning) => <p key={warning} className={styles.muted}>{warning}</p>)}
          </div>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="now-actions">
        <div className={styles.panelHeader}>
          <h3 id="now-actions">Что делать сейчас</h3>
          <p className={styles.muted}>Сначала действия, потом графики.</p>
        </div>
        {topActions.length ? (
          <div className={styles.actionGrid}>
            {topActions.slice(0, 5).map((item) => <ActionCard key={item.recommendation_id} item={item} />)}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <strong>Нет достаточных сигналов для приоритизации</strong>
            <p className={styles.muted}>Проверьте first-party events и источники поисковой видимости.</p>
          </div>
        )}
      </section>

      <OverviewCards overview={readModel.overview} />
      <PagesTable pages={readModel.page_list} selectedPagePath={selectedPagePath} period={period} />

      <div className={styles.detailGrid}>
        <PageDetail detail={readModel.selected_page_detail} />
        <SemanticClickMap items={readModel.semantic_click_map || []} />
      </div>

      <Recommendations recommendations={readModel.recommendations || []} />
      <TrafficSources sources={readModel.traffic_sources || []} />
      <ExternalEvidence evidence={readModel.external_evidence} />
      <Diagnostics readModel={readModel} />
    </div>
  );
}
