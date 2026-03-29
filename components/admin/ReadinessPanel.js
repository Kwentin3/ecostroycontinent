import { ADMIN_COPY } from "../../lib/ui-copy.js";
import { buildReadinessNavigationModel } from "../../lib/admin/readiness-actionability.js";
import styles from "./admin-ui.module.css";

const TONE_CLASS_BY_SEVERITY = {
  blocking: styles.cockpitToneDanger,
  warning: styles.cockpitToneWarning,
  info: styles.cockpitToneHealthy
};

function renderItem(item) {
  return (
    <li key={item.key} className={styles.timelineItem}>
      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${TONE_CLASS_BY_SEVERITY[item.severity] || styles.cockpitToneUnknown}`}>
          {item.severity}
        </span>
        {item.target.isFallback ? <span className={styles.cockpitFallbackPill}>fallback</span> : null}
      </div>
      <a href={item.target.href} className={styles.readinessItemLink}>
        {item.message || item.fieldLabel}
      </a>
      <p className={styles.mutedText}>{item.target.targetLabel}</p>
    </li>
  );
}

export function ReadinessPanel({
  readiness,
  title = ADMIN_COPY.readinessTitle,
  defaultOpen = false,
  entityType = null,
  navigationContext = "editor",
  panelId = null,
  fallbackAnchorId = null,
  fallbackLabel = null
}) {
  const model = buildReadinessNavigationModel({
    entityType,
    readiness,
    context: navigationContext,
    fallbackAnchorId: fallbackAnchorId || panelId || null,
    fallbackLabel
  });
  const blocking = model.items.filter((result) => result.severity === "blocking");
  const warnings = model.items.filter((result) => result.severity === "warning");
  const info = model.items.filter((result) => result.severity === "info");
  const hasAnyItems = model.items.length > 0;
  const summaryMeta = readiness?.summary || model.state.note;

  return (
    <details id={panelId || undefined} className={styles.compactDisclosure} open={defaultOpen}>
      <summary className={styles.compactDisclosureSummary}>
        <span className={styles.compactDisclosureMarker} aria-hidden="true" />
        <span className={styles.compactDisclosureSummaryMain}>
          <strong>{title}</strong>
          <span className={styles.compactDisclosureSummaryMeta}>{summaryMeta}</span>
        </span>
        <span className={styles.compactDisclosureSummaryStats}>
          <span className={styles.badge}>{ADMIN_COPY.readinessBlocking}: {blocking.length}</span>
          <span className={styles.badge}>{ADMIN_COPY.readinessWarnings}: {warnings.length}</span>
          <span className={styles.badge}>{ADMIN_COPY.readinessInfo}: {info.length}</span>
        </span>
      </summary>
      <div className={styles.compactDisclosureBody}>
        {!readiness ? (
          <div className={styles.statusPanelInfo}>
            <strong>{model.state.label}</strong>
            <p className={styles.mutedText}>{model.state.note}</p>
            {model.fallbackAnchorId ? <p className={styles.mutedText}>Fallback anchor: {model.fallbackAnchorId}</p> : null}
          </div>
        ) : null}

        {blocking.length > 0 ? (
          <div className={styles.statusPanelBlocking}>
            <strong>{ADMIN_COPY.readinessBlocking}</strong>
            <ul className={styles.timeline}>
              {blocking.map(renderItem)}
            </ul>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className={styles.statusPanelWarning}>
            <strong>{ADMIN_COPY.readinessWarnings}</strong>
            <ul className={styles.timeline}>
              {warnings.map(renderItem)}
            </ul>
          </div>
        ) : null}

        {info.length > 0 ? (
          <div className={styles.statusPanelInfo}>
            <strong>{ADMIN_COPY.readinessInfo}</strong>
            <ul className={styles.timeline}>
              {info.map(renderItem)}
            </ul>
          </div>
        ) : null}

        {!hasAnyItems && readiness ? (
          <div className={styles.statusPanelInfo}>
            <strong>{model.state.label}</strong>
            <p className={styles.mutedText}>Проблем не обнаружено. Проверка не скрывает missing данные.</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

