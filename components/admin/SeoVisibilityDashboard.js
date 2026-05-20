import Link from "next/link";

import styles from "./SeoVisibilityDashboard.module.css";

const PERIODS = [7, 28, 90];

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "нет данных";
  }

  return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "нет данных";
  }

  return `${(Number(value || 0) * 100).toLocaleString("ru-RU", {
    maximumFractionDigits: Number(value || 0) < 0.01 && Number(value || 0) > 0 ? 2 : 1
  })}%`;
}

function metricValue(key, metric = {}) {
  if (key === "ctr" || key.includes("conversion") || key === "mobile_share") {
    return formatPercent(metric.value ?? metric);
  }

  return formatNumber(metric.value ?? metric);
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return "нет сравнения";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}% к прошлому периоду`;
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
    content_core: "Content Core",
    organic_yandex: "Яндекс поиск",
    organic_google: "Google поиск",
    direct: "Прямые заходы",
    referral: "Переходы с сайтов",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    maps_or_business_directory: "Карты и справочники",
    paid: "Платный трафик",
    campaign_utm: "UTM-кампании",
    unknown: "Неизвестно",
    unattributed: "Без атрибуции"
  }[source] || source;
}

function statusLabel(status) {
  return {
    ok: "ok",
    fresh: "fresh",
    stale: "устарело",
    failed: "ошибка",
    partial: "частично",
    not_configured: "не подключено",
    not_ready: "не готово",
    not_applicable: "не применимо"
  }[status] || status || "нет данных";
}

function actionabilityLabel(value) {
  return {
    readiness_only: "только готовность источника",
    limited_external_evidence: "ограниченные внешние факты",
    limited_external_diagnostic: "ограниченная внешняя диагностика",
    readiness_and_limited_indexation_evidence: "готовность и ограниченная индексация",
    limited_search_visibility_evidence: "ограниченная поисковая видимость"
  }[value] || value || "нет данных";
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

function limitationLabel(value) {
  return {
    external_metrica_not_operational_truth: "Метрика не является operational truth",
    metrica_external_enrichment_only: "Метрика используется только как внешний enrichment",
    do_not_feed_metrica_into_primary_overview: "Метрика не перезаписывает первичные карточки",
    external_metrica_no_r2b_rows: "нет R2B-строк Метрики за период",
    low_external_sample_size: "малый внешний sample size",
    attribution_model_lastsign: "атрибуция Метрики: lastsign",
    external_metrica_all_values_zero: "внешние значения Метрики нулевые",
    external_metrica_no_imported_rows: "нет импортированных строк Метрики",
    metrica_source_detail_not_available_or_skipped: "детализация источников Метрики недоступна или пропущена",
    metrica_region_not_available_or_skipped: "региональный срез Метрики недоступен или пропущен",
    metrica_landing_mapping_read_only: "landing mapping только read-only",
    unmapped_urls_are_diagnostics_only: "unmapped URLs являются только диагностикой",
    webmaster_not_content_core_truth: "Вебмастер не является Content Core truth",
    webmaster_external_search_evidence_only: "Вебмастер является внешним search evidence",
    webmaster_url_samples_are_not_full_coverage: "URL samples Вебмастера не являются полным покрытием",
    webmaster_query_visibility_no_rows_for_period: "нет query visibility rows за период",
    no_zero_demand_claim: "нельзя трактовать как нулевой спрос",
    external_search_visibility_evidence_only: "поисковая видимость только как external evidence"
  }[value] || value;
}

function firstLabel(row = {}, keys = []) {
  for (const key of keys) {
    if (row[key]) {
      return row[key];
    }
  }

  return "n/a";
}

function externalMetricLine(totals = {}) {
  return `${formatNumber(totals.visits)} visits / ${formatNumber(totals.users)} users / ${formatNumber(totals.pageviews)} pageviews`;
}

function sumField(rows = [], field) {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

function collectLimitations(readModel) {
  const evidence = readModel.external_evidence || {};
  const readiness = readModel.external_source_readiness || {};
  const selected = readModel.selected_page_detail || {};
  const items = [
    ...(readModel.warnings || []),
    ...(readModel.limitations || []),
    ...(selected.limitations || []),
    ...(evidence.yandex_metrica?.limitations || []),
    ...(evidence.yandex_metrica?.traffic_sources?.limitations || []),
    ...(evidence.yandex_metrica?.source_details?.limitations || []),
    ...(evidence.yandex_metrica?.devices?.limitations || []),
    ...(evidence.yandex_metrica?.geography?.limitations || []),
    ...(evidence.yandex_metrica?.landings?.limitations || []),
    ...(evidence.yandex_webmaster?.limitations || []),
    ...(evidence.yandex_webmaster?.url_samples?.limitations || []),
    ...(evidence.yandex_webmaster?.query_visibility?.limitations || []),
    ...(readiness.yandex_metrica?.limitations || []),
    ...(readiness.yandex_webmaster?.limitations || [])
  ];

  return [...new Set(items.filter(Boolean))];
}

function formatSourcePeriod(item = {}) {
  if (!item.imported_period_start && !item.imported_period_end) {
    return "период не задан";
  }

  return `${item.imported_period_start || "?"} - ${item.imported_period_end || "?"}`;
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

function EmptyState({ title, children }) {
  return (
    <div className={styles.emptyBox}>
      <strong>{title}</strong>
      <p className={styles.muted}>{children}</p>
    </div>
  );
}

function MetricCard({ label, value, hint, tag = "internal" }) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.muted}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricHint}>{hint}</p>
      <span className={`${styles.badge} ${tag === "external" ? styles.badgeInfo : styles.badgeOk}`}>
        {tag === "external" ? "external evidence" : "first-party"}
      </span>
    </article>
  );
}

function TopSummary({ readModel, period }) {
  const overview = readModel.overview || {};
  const readiness = readModel.external_source_readiness || {};
  const limitationCount = collectLimitations(readModel).length;
  const metrica = readiness.yandex_metrica || {};
  const webmaster = readiness.yandex_webmaster || {};

  return (
    <section className={styles.panel} aria-labelledby="minimal-summary">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="minimal-summary">Сводка за {period} дней</h3>
          <p className={styles.muted}>Первичные карточки считают только first-party агрегаты. Метрика и Вебмастер показаны ниже как внешний слой.</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>read model only</span>
      </div>
      <div className={styles.metricGrid}>
        <MetricCard
          label="Внутренние визиты"
          value={metricValue("visits", overview.visits)}
          hint={formatDelta(overview.visits?.delta_vs_previous_period)}
        />
        <MetricCard
          label="Внутренние действия"
          value={metricValue("contact_actions", overview.contact_actions)}
          hint="Контакты и intent-события, не лиды."
        />
        <MetricCard
          label="Метрика"
          value={statusLabel(metrica.status)}
          hint={`${formatSourcePeriod(metrica)} / ${actionabilityLabel(metrica.data_actionability)}`}
          tag="external"
        />
        <MetricCard
          label="Вебмастер"
          value={statusLabel(webmaster.status)}
          hint={`${formatSourcePeriod(webmaster)} / ${actionabilityLabel(webmaster.data_actionability)}`}
          tag="external"
        />
        <MetricCard
          label="Ограничения"
          value={formatNumber(limitationCount)}
          hint="Тонкие, нулевые, устаревшие или неполные данные вынесены отдельным блоком."
          tag={limitationCount ? "external" : "internal"}
        />
      </div>
    </section>
  );
}

function OverviewCards({ overview = {} }) {
  const items = [
    ["organic_visits", "Органический трафик"],
    ["yandex_impressions", "Показы Яндекса"],
    ["yandex_clicks", "Клики из поиска"],
    ["ctr", "CTR"],
    ["visit_to_intent_conversion", "Визит -> действие"],
    ["leads", "Лиды"]
  ];

  return (
    <section className={styles.panel} aria-labelledby="visibility-overview">
      <div className={styles.panelHeader}>
        <h3 id="visibility-overview">Базовые показатели</h3>
        <p className={styles.muted}>Внутренние метрики отделены от внешних агрегатов и не смешиваются с lead attribution.</p>
      </div>
      <div className={styles.metricGrid}>
        {items.map(([key, label]) => {
          const item = overview[key] || {};

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

function InternalTrafficSources({ sources = [] }) {
  return (
    <div className={styles.sectionBlock}>
      <div className={styles.panelHeader}>
        <h4>Внутренний traffic mix</h4>
        <span className={`${styles.badge} ${styles.badgeOk}`}>first-party</span>
      </div>
      {sources.length ? (
        <div className={styles.sourceGrid}>
          {sources.slice(0, 8).map((item) => (
            <article key={item.source} className={styles.sourceCard}>
              <p className={styles.muted}>{item.label || sourceLabel(item.source)}</p>
              <p className={styles.sourceValue}>{formatNumber(item.visits)} визитов</p>
              <p className={styles.smallText}>
                {formatNumber(item.contact_actions)} действий / конверсия {formatPercent(item.conversion_rate)}
              </p>
              <p className={styles.metricHint}>{formatDelta(item.delta_vs_previous_period)}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Внутренних источников пока нет">За выбранный период нет first-party агрегатов по источникам.</EmptyState>
      )}
    </div>
  );
}

function EvidenceTable({ title, rows = [], totals, labelKeys, columns = [] }) {
  return (
    <div className={styles.sectionBlock}>
      <div className={styles.panelHeader}>
        <div>
          <h4>{title}</h4>
          <p className={styles.muted}>{externalMetricLine(totals)}</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>external</span>
      </div>
      {rows.length ? (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.compactTable}`}>
            <thead>
              <tr>
                <th>Значение</th>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Visits</th>
                <th>Users</th>
                <th>Pageviews</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, index) => (
                <tr key={`${title}-${firstLabel(row, labelKeys)}-${index}`}>
                  <td>{firstLabel(row, labelKeys)}</td>
                  {columns.map((column) => <td key={column.key}>{row[column.key] || "нет данных"}</td>)}
                  <td>{formatNumber(row.visits)}</td>
                  <td>{formatNumber(row.users)}</td>
                  <td>{formatNumber(row.pageviews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Внешних строк нет">Источник подключён как evidence layer, но этот срез пустой или был безопасно пропущен.</EmptyState>
      )}
    </div>
  );
}

function TrafficComposition({ readModel }) {
  const metrica = readModel.external_evidence?.yandex_metrica || {};

  return (
    <section className={styles.panel} aria-labelledby="traffic-composition">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="traffic-composition">Источники, устройства и география</h3>
          <p className={styles.muted}>Внешние visits/users/pageviews — enrichment из Метрики, не operational truth.</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>Метрика — внешний слой</span>
      </div>
      <InternalTrafficSources sources={readModel.traffic_sources || []} />
      <EvidenceTable
        title="Metrica traffic sources"
        rows={metrica.traffic_sources?.rows || []}
        totals={metrica.traffic_sources?.totals}
        labelKeys={["traffic_source_name", "traffic_source"]}
      />
      <EvidenceTable
        title="Metrica source detail"
        rows={metrica.source_details?.rows || []}
        totals={metrica.source_details?.totals}
        labelKeys={["source_engine_name", "source_engine", "traffic_source_name", "traffic_source"]}
        columns={[{ key: "traffic_source_name", label: "Источник" }]}
      />
      <div className={styles.splitGrid}>
        <EvidenceTable
          title="Устройства"
          rows={metrica.devices?.rows || []}
          totals={metrica.devices?.totals}
          labelKeys={["device_category_name", "device_category"]}
        />
        <EvidenceTable
          title="Страны"
          rows={metrica.geography?.countries || []}
          totals={metrica.geography?.country_totals}
          labelKeys={["country_name", "country"]}
        />
      </div>
      <EvidenceTable
        title="Регионы"
        rows={metrica.geography?.regions || []}
        totals={metrica.geography?.region_totals}
        labelKeys={["region_area_name", "region_area"]}
        columns={[{ key: "country_name", label: "Страна" }]}
      />
    </section>
  );
}

function LandingPages({ readModel }) {
  const landings = readModel.external_evidence?.yandex_metrica?.landings || {};
  const unmapped = readModel.source_diagnostics?.unmapped_urls || [];

  return (
    <section className={styles.panel} aria-labelledby="landing-pages">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="landing-pages">Страницы входа</h3>
          <p className={styles.muted}>Landing URLs сопоставляются read-only. Unmapped URLs — диагностика, не задание на создание страниц.</p>
        </div>
        <div className={styles.chips}>
          <span className={`${styles.badge} ${styles.badgeOk}`}>mapped: {formatNumber(landings.mapped_count)}</span>
          <span className={`${styles.badge} ${landings.unmapped_count ? styles.badgeWarn : styles.badgeInfo}`}>
            unmapped: {formatNumber(landings.unmapped_count)}
          </span>
        </div>
      </div>
      {landings.rows?.length ? (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.compactTable}`}>
            <thead>
              <tr>
                <th>Landing path / URL</th>
                <th>Content Core mapping</th>
                <th>Visits</th>
                <th>Users</th>
                <th>Pageviews</th>
              </tr>
            </thead>
            <tbody>
              {landings.rows.slice(0, 10).map((row, index) => (
                <tr key={`${row.page_path || row.normalized_url}-${index}`}>
                  <td>
                    <strong>{row.page_path || row.normalized_url || "n/a"}</strong>
                    {row.normalized_url ? <p className={styles.smallText}>{row.normalized_url}</p> : null}
                  </td>
                  <td>{row.entity_type && row.entity_id ? `${row.entity_type}:${row.entity_id}` : "не сопоставлено"}</td>
                  <td>{formatNumber(row.visits)}</td>
                  <td>{formatNumber(row.users)}</td>
                  <td>{formatNumber(row.pageviews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Landing rows отсутствуют">Метрика не вернула строки landing URL за период или импорт ещё не выполнен.</EmptyState>
      )}
      {unmapped.length ? (
        <div className={styles.warningBox}>
          <strong>Unmapped diagnostics</strong>
          {unmapped.slice(0, 5).map((item) => (
            <p key={item.id || item.page_path} className={styles.smallText}>
              {item.page_path} / {item.safe_reason || "unmapped"}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PagesTable({ pages = [], selectedPagePath, period }) {
  if (!pages.length) {
    return (
      <section className={styles.panel}>
        <EmptyState title="Страницы не найдены">Нет опубликованных страниц Content Core или агрегированных адресов за период.</EmptyState>
      </section>
    );
  }

  return (
    <section className={styles.tablePanel} aria-labelledby="page-actions">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 id="page-actions">Страницы и внутренние действия</h3>
          <p className={styles.muted}>Page-level first-party факты: визиты, просмотры, клики и intent-события без lead attribution.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Страница</th>
              <th>Тип</th>
              <th>Публикация</th>
              <th>Индексация</th>
              <th>Визиты</th>
              <th>Просмотры</th>
              <th>Контактные действия</th>
              <th>CTA views/clicks</th>
              <th>Gallery/FAQ</th>
              <th>Поиск</th>
            </tr>
          </thead>
          <tbody>
            {pages.slice(0, 50).map((page) => (
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
                <td><span className={styles.statusText}>{publishStatusLabel(page.publish_status)}</span></td>
                <td>{page.indexation_state}</td>
                <td>{formatNumber(page.visits)}</td>
                <td>{formatNumber(page.page_views)}</td>
                <td>{formatNumber(page.contact_actions)}</td>
                <td>{formatNumber(page.cta_views)} / {formatNumber(page.cta_clicks)}</td>
                <td>{formatNumber(page.gallery_opens)} / {formatNumber(page.faq_expands)}</td>
                <td>{formatNumber(page.clicks)} clicks / {formatPercent(page.ctr)}</td>
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

function SelectedPageFacts({ detail }) {
  if (!detail) {
    return (
      <section className={styles.detailPanel}>
        <EmptyState title="Страница не выбрана">Выберите строку в таблице, чтобы увидеть page-level действия.</EmptyState>
      </section>
    );
  }

  return (
    <section className={styles.detailPanel} aria-labelledby="selected-page-facts">
      <div className={styles.detailHeader}>
        <div className={styles.titleStack}>
          <h3 id="selected-page-facts">{detail.page_identity.page_title}</h3>
          <p className={styles.muted}>{detail.page_identity.page_path}</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeOk}`}>Content Core route</span>
      </div>
      <div className={styles.detailColumns}>
        <DetailList
          items={[
            ["Тип", typeLabel(detail.page_identity.entity_type)],
            ["Ревизия", detail.current_published_revision?.revision_id || "нет данных"],
            ["Title", detail.seo_fields_summary?.title || "не указан"],
            ["Description", detail.seo_fields_summary?.description || "не указано"],
            ["H1", detail.seo_fields_summary?.h1 || "не указан"],
            ["Индексация", detail.indexation_summary.indexation_state]
          ]}
        />
        <DetailList
          items={[
            ["Визиты", formatNumber(detail.traffic_summary.visits)],
            ["Users", formatNumber(detail.traffic_summary.users)],
            ["Mobile share", formatPercent(detail.traffic_summary.mobile_share)],
            ["CTA views", formatNumber(detail.behavior_summary.cta_views)],
            ["CTA clicks", formatNumber(detail.behavior_summary.cta_clicks)],
            ["Gallery opens", formatNumber(detail.behavior_summary.gallery_opens)],
            ["FAQ expands", formatNumber(detail.behavior_summary.faq_expands)]
          ]}
        />
        <DetailList
          items={[
            ["Click-to-call", formatNumber(detail.intent_events_summary.click_to_call)],
            ["Telegram", formatNumber(detail.intent_events_summary.click_to_telegram)],
            ["WhatsApp", formatNumber(detail.intent_events_summary.click_to_whatsapp)],
            ["Form start", formatNumber(detail.intent_events_summary.form_start)],
            ["Form submit", formatNumber(detail.intent_events_summary.form_submit)],
            ["Контактные действия", formatNumber(detail.intent_events_summary.contact_actions)]
          ]}
        />
      </div>
      <div className={styles.warningBox}>
        <strong>Граница интерпретации</strong>
        <p className={styles.muted}>Действия являются intent signals. Панель не считает их лидами и не делает lead attribution.</p>
      </div>
    </section>
  );
}

function SemanticClickMap({ items = [] }) {
  if (!items.length) {
    return (
      <section className={styles.detailPanel} aria-labelledby="semantic-click-map">
        <div className={styles.detailHeader}>
          <h3 id="semantic-click-map">Семантическая карта кликов</h3>
        </div>
        <EmptyState title="Кликов по смысловым элементам пока нет">Это не heatmap и не session replay: показываются только агрегированные first-party события.</EmptyState>
      </section>
    );
  }

  const max = Math.max(...items.map((item) => item.actions || 0), 1);

  return (
    <section className={styles.detailPanel} aria-labelledby="semantic-click-map">
      <div className={styles.detailHeader}>
        <h3 id="semantic-click-map">Семантическая карта кликов</h3>
        <p className={styles.muted}>Агрегированные first-party события по смысловым элементам страницы.</p>
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

function InternalActions({ readModel }) {
  const pages = readModel.page_list || [];
  const detail = readModel.selected_page_detail;

  return (
    <section className={styles.panel} aria-labelledby="internal-actions">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="internal-actions">Внутренние действия</h3>
          <p className={styles.muted}>First-party clicks/actions: контакты, CTA, формы, галерея, FAQ, кейсы и услуги. Это не лиды.</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeOk}`}>operational truth</span>
      </div>
      <div className={styles.metricGrid}>
        <MetricCard label="Контактные действия" value={formatNumber(sumField(pages, "contact_actions"))} hint="click-to-call, мессенджеры, contact link, form submit." />
        <MetricCard label="CTA views/clicks" value={`${formatNumber(sumField(pages, "cta_views"))} / ${formatNumber(sumField(pages, "cta_clicks"))}`} hint="Показы и клики CTA из internal telemetry." />
        <MetricCard label="Gallery opens" value={formatNumber(sumField(pages, "gallery_opens"))} hint="Открытия галерей как proof/interest signal." />
        <MetricCard label="FAQ expands" value={formatNumber(sumField(pages, "faq_expands"))} hint="Раскрытия FAQ как intent/education signal." />
      </div>
      <div className={styles.detailGrid}>
        <SelectedPageFacts detail={detail} />
        <SemanticClickMap items={readModel.semantic_click_map || []} />
      </div>
    </section>
  );
}

function WebmasterUrlSamples({ samples = {} }) {
  if (!samples.rows?.length) {
    return (
      <EmptyState title="URL samples не отображаются">Нет compact URL samples или источник ещё не вернул строки.</EmptyState>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.compactTable}`}>
        <thead>
          <tr>
            <th>URL / route</th>
            <th>Mapping</th>
            <th>Status</th>
            <th>HTTP</th>
            <th>Observed</th>
          </tr>
        </thead>
        <tbody>
          {samples.rows.slice(0, 10).map((row, index) => (
            <tr key={`${row.normalized_url || row.page_path || row.endpoint}-${index}`}>
              <td>
                <strong>{row.page_path || row.normalized_url || row.endpoint || "n/a"}</strong>
                {row.normalized_url ? <p className={styles.smallText}>{row.normalized_url}</p> : null}
              </td>
              <td>{row.resolution_status || "нет данных"}</td>
              <td>{row.sample_status || "нет данных"}</td>
              <td>{row.http_code ?? "нет данных"}</td>
              <td>{row.observed_date || "нет данных"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WebmasterQueryRows({ query = {} }) {
  if (!query.rows?.length) {
    return (
      <div className={styles.warningBox}>
        <strong>Query rows отсутствуют</strong>
        <p className={styles.muted}>Это limitation Вебмастера за период. Панель не делает вывод "спроса нет".</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.compactTable}`}>
        <thead>
          <tr>
            <th>Query</th>
            <th>Page</th>
            <th>Device / geo</th>
            <th>Impressions</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {query.rows.slice(0, 10).map((row, index) => (
            <tr key={`${row.query}-${row.page_path}-${index}`}>
              <td>{row.query || "n/a"}</td>
              <td>{row.page_path || row.normalized_url || "нет mapping"}</td>
              <td>{row.device || "all"} / {row.country || row.region || "geo не задано"}</td>
              <td>{formatNumber(row.impressions)}</td>
              <td>{formatNumber(row.clicks)}</td>
              <td>{formatPercent(row.ctr)}</td>
              <td>{row.average_position === null || row.average_position === undefined ? "нет данных" : formatNumber(row.average_position)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchWebmaster({ evidence, readiness }) {
  const webmaster = evidence?.yandex_webmaster || {};
  const host = webmaster.host_indexation || {};
  const samples = webmaster.url_samples || {};
  const query = webmaster.query_visibility || {};

  return (
    <section className={styles.panel} aria-labelledby="webmaster-state">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="webmaster-state">Поиск и Вебмастер</h3>
          <p className={styles.muted}>External search/indexation evidence. Вебмастер не является Content Core truth.</p>
        </div>
        <span className={`${styles.badge} ${styles[`badge${sourceTone(readiness?.yandex_webmaster?.freshness?.status || readiness?.yandex_webmaster?.status)}`]}`}>
          {statusLabel(readiness?.yandex_webmaster?.freshness?.status || readiness?.yandex_webmaster?.status)}
        </span>
      </div>
      <div className={styles.metricGrid}>
        <MetricCard label="Host verified" value={host.host_verified ? "да" : "нет"} hint={host.host_data_status || "host status не задан"} tag="external" />
        <MetricCard label="Searchable pages" value={formatNumber(host.searchable_pages_count)} hint="Страницы по snapshot Вебмастера." tag="external" />
        <MetricCard label="Excluded pages" value={formatNumber(host.excluded_pages_count)} hint="Исключённые URL по snapshot Вебмастера." tag="external" />
        <MetricCard label="URL samples" value={`${formatNumber(samples.sample_count)} / ${formatNumber(samples.resolved_count)}`} hint={`${formatNumber(samples.unmapped_count)} unmapped samples`} tag="external" />
        <MetricCard label="Query rows" value={formatNumber(query.row_count)} hint={query.row_count ? "Есть compact query/page rows." : "Нулевые rows не означают нулевой спрос."} tag="external" />
      </div>
      {Object.keys(host.site_problem_counts || {}).length ? (
        <div className={styles.chips}>
          {Object.entries(host.site_problem_counts).map(([key, value]) => (
            <span key={key} className={`${styles.badge} ${styles.badgeWarn}`}>{key}: {formatNumber(value)}</span>
          ))}
        </div>
      ) : null}
      <WebmasterUrlSamples samples={samples} />
      <WebmasterQueryRows query={query} />
    </section>
  );
}

function DataLimitations({ readModel }) {
  const limitations = collectLimitations(readModel);

  return (
    <section className={styles.panel} aria-labelledby="data-limitations">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="data-limitations">Ограничения данных</h3>
          <p className={styles.muted}>Ограничения видны явно: тонкие, нулевые, устаревшие и неполные данные не трактуются сверх доказательств.</p>
        </div>
        <span className={`${styles.badge} ${limitations.length ? styles.badgeWarn : styles.badgeOk}`}>
          {formatNumber(limitations.length)}
        </span>
      </div>
      <div className={styles.warningBox}>
        <strong>Границы источников</strong>
        <p className={styles.muted}>Internal telemetry = operational truth. Metrica/Webmaster = enrichment/evidence. Content Core = truth для страниц и маршрутов.</p>
      </div>
      {limitations.length ? (
        <div className={styles.chips}>
          {limitations.slice(0, 24).map((item) => (
            <span key={item} className={`${styles.badge} ${styles.badgeInfo}`}>{limitationLabel(item)}</span>
          ))}
        </div>
      ) : (
        <EmptyState title="Явных ограничений нет">Read model не вернул warnings/limitations для выбранного периода.</EmptyState>
      )}
    </section>
  );
}

function ExistingSystemSignals({ recommendations = [] }) {
  return (
    <section className={styles.panel} aria-labelledby="existing-diagnostics">
      <div className={styles.panelHeader}>
        <div>
          <h3 id="existing-diagnostics">Существующие диагностические сигналы</h3>
          <p className={styles.muted}>Это существующий системный вывод read model. Minimal panel не добавляет R5 rules и не создаёт новые рекомендации.</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>not R5</span>
      </div>
      {recommendations.length ? (
        <div className={styles.recommendations}>
          {recommendations.slice(0, 8).map((item) => (
            <article key={item.recommendation_id} className={styles.recommendationRow}>
              <div>
                <strong>{item.label}</strong>
                <p className={styles.smallText}>{item.linked_page?.page_path || "без страницы"}</p>
                <p className={styles.muted}>{item.evidence}</p>
              </div>
              <div className={styles.metaList}>
                <span className={`${styles.badge} ${item.priority === "high" ? styles.badgeWarn : styles.badgeInfo}`}>{item.priority || "low"}</span>
                <span className={styles.badge}>status: {item.status || "new"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Диагностических сигналов нет">Панель не создаёт рекомендации из внешних тонких или нулевых данных.</EmptyState>
      )}
    </section>
  );
}

export function SeoVisibilityDashboard({ readModel, period }) {
  const selectedPagePath = readModel.selected_page_detail?.page_identity?.page_path || "";

  return (
    <div className={styles.dashboard}>
      <section className={styles.topBar} aria-labelledby="visibility-title">
        <div className={styles.topBarHeader}>
          <div className={styles.titleStack}>
            <h3 id="visibility-title">Минимальная SEO-панель</h3>
            <p className={styles.subtitle}>
              Факты из analytics read model: трафик, источники, устройства, регионы, landing pages, внутренние действия и ограничения данных.
            </p>
          </div>
          <nav className={styles.periodTabs} aria-label="Период">
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
          </nav>
        </div>
        {renderSourceBadges(readModel)}
        <div className={styles.actions}>
          <Link className={styles.secondaryButton} href={`/api/admin/visibility/read-model?period=${period}`} target="_blank">
            Read model JSON
          </Link>
          <span className={styles.disabledButton} aria-disabled="true">Настройки интеграций вне scope</span>
        </div>
      </section>

      <TopSummary readModel={readModel} period={period} />
      <OverviewCards overview={readModel.overview} />
      <TrafficComposition readModel={readModel} />
      <LandingPages readModel={readModel} />
      <PagesTable pages={readModel.page_list} selectedPagePath={selectedPagePath} period={period} />
      <InternalActions readModel={readModel} />
      <SearchWebmaster evidence={readModel.external_evidence} readiness={readModel.external_source_readiness} />
      <DataLimitations readModel={readModel} />
      <ExistingSystemSignals recommendations={readModel.recommendations || []} />
    </div>
  );
}
