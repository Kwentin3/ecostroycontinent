import Link from "next/link";

import { buildEvidenceRegisterViewModel } from "../../lib/admin/evidence-register-view.js";
import styles from "./admin-ui.module.css";

const TONE_CLASS_BY_STATE = {
  healthy: styles.cockpitToneHealthy,
  warning: styles.cockpitToneWarning,
  danger: styles.cockpitToneDanger,
  unknown: styles.cockpitToneUnknown
};

function renderCompactRow(row) {
  const toneClass = row.severity === "blocking"
    ? styles.cockpitToneDanger
    : row.severity === "warning"
      ? styles.cockpitToneWarning
      : styles.cockpitToneHealthy;

  return (
    <article key={row.key} className={styles.evidenceRailItem}>
      <div className={styles.evidenceRailHeader}>
        <div className={styles.cockpitCoverageSummary}>
          <strong>{row.entityLabel}</strong>
          <span className={styles.mutedText}>
            {row.entityTypeLabel}
            {row.entityId ? ` · ${row.entityId}` : ""}
          </span>
        </div>
        <div className={styles.badgeRow}>
          <span className={`${styles.cockpitStatusPill} ${toneClass}`}>{row.categoryLabel}</span>
          {row.target.isFallback ? <span className={styles.cockpitFallbackPill}>Резервный переход</span> : null}
        </div>
      </div>
      <p className={styles.evidenceRailReason}>{row.reason}</p>
      <p className={styles.evidenceRailMeta}>{row.fieldLabel}</p>
      <div className={styles.evidenceRailFooter}>
        <span className={`${styles.badge} ${toneClass}`}>{row.severityLabel}</span>
        <Link href={row.target.href} className={styles.secondaryButton}>
          {row.target.label}
        </Link>
      </div>
    </article>
  );
}

function renderRow(row) {
  const toneClass = row.severity === "blocking"
    ? styles.cockpitToneDanger
    : row.severity === "warning"
      ? styles.cockpitToneWarning
      : styles.cockpitToneHealthy;

  return (
    <tr key={row.key}>
      <td>
        <div className={styles.cockpitCoverageSummary}>
          <strong>{row.entityLabel}</strong>
          <span className={styles.mutedText}>
            {row.entityTypeLabel}
            {row.entityId ? ` · ${row.entityId}` : ""}
          </span>
          {row.target.isFallback ? <span className={styles.cockpitFallbackPill}>Резервный переход</span> : null}
        </div>
      </td>
      <td>
        <div className={styles.cockpitCoverageSummary}>
          <strong>{row.reason}</strong>
          <span className={styles.mutedText}>{row.fieldLabel}</span>
        </div>
      </td>
      <td>
        <div className={styles.badgeRow}>
          <span className={`${styles.cockpitStatusPill} ${toneClass}`}>{row.categoryLabel}</span>
          <span className={`${styles.cockpitStatusPill} ${toneClass}`}>{row.severityLabel}</span>
        </div>
      </td>
      <td>
        <div className={styles.cockpitCoverageSummary}>
          <Link href={row.target.href} className={styles.secondaryButton}>
            {row.target.label}
          </Link>
          <span className={styles.mutedText}>{row.target.targetLabel}</span>
        </div>
      </td>
    </tr>
  );
}

export function EvidenceRegisterPanel({
  cockpit = null,
  entityType = null,
  entityId = null,
  entityLabel = null,
  readiness = null,
  obligations = [],
  scope = null,
  panelId = "evidence-register",
  title = "Реестр доказательств"
}) {
  const viewModel = buildEvidenceRegisterViewModel({
    cockpit,
    entityType,
    entityId,
    entityLabel,
    readiness,
    obligations,
    scope
  });
  const toneClass = TONE_CLASS_BY_STATE[viewModel.state.tone] || styles.cockpitToneUnknown;
  const compactRail = scope === "editor";
  const effectiveTitle = compactRail && title === "Реестр доказательств" ? "Что проверить в данных" : title;

  if (compactRail) {
    return (
      <details id={panelId} className={styles.compactDisclosure}>
        <summary className={styles.compactDisclosureSummary}>
          <span className={styles.compactDisclosureMarker} aria-hidden="true" />
          <span className={styles.compactDisclosureSummaryMain}>
            <strong>{effectiveTitle}</strong>
            <span className={styles.compactDisclosureSummaryMeta}>
              Связанные данные и обязательства, которые стоит проверить перед следующим шагом.
            </span>
          </span>
          <span className={styles.compactDisclosureSummaryStats}>
            <span className={`${styles.cockpitStatusPill} ${toneClass}`}>{viewModel.state.label}</span>
            <span className={styles.badge}>Строк: {viewModel.counts.total}</span>
          </span>
        </summary>
        <div className={styles.compactDisclosureBody}>
          <p className={styles.mutedText}>{viewModel.scopeLabel}</p>
          {viewModel.isEmpty ? (
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>{viewModel.state.note}</p>
              <p className={styles.mutedText}>Панель только подсказывает, где проверить связанные данные дальше.</p>
            </div>
          ) : (
            <div className={styles.evidenceRailList}>
              {viewModel.rows.map(renderCompactRow)}
            </div>
          )}
        </div>
      </details>
    );
  }

  return (
    <section id={panelId} className={`${styles.panel} ${styles.evidenceRegisterPanel}`} aria-labelledby="evidence-register-title">
      <div className={styles.cockpitBlockHeader}>
        <div>
          <p className={styles.cockpitBlockKicker}>Видимость доказательств</p>
          <h3 id="evidence-register-title" className={styles.cockpitBlockTitle}>{effectiveTitle}</h3>
          <p className={styles.cockpitBlockNote}>
            Проекция только для просмотра. Редактирования нет. Реестр показывает, где не хватает доказательств и куда идти дальше.
          </p>
        </div>
        <span className={`${styles.cockpitStateValue} ${toneClass}`}>{viewModel.state.label}</span>
      </div>

      <div className={styles.cockpitStateGrid}>
        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Состояние</span>
          <span className={`${styles.cockpitStateValue} ${toneClass}`}>{viewModel.state.label}</span>
          <p className={styles.cockpitStateCopy}>{viewModel.state.note}</p>
        </article>

        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Строки</span>
          <span className={styles.cockpitStateValue}>{viewModel.counts.total}</span>
          <p className={styles.cockpitStateCopy}>{viewModel.scopeLabel}</p>
        </article>
      </div>

      {viewModel.isEmpty ? (
        <div className={styles.emptyState}>
          <p className={styles.mutedText}>{viewModel.state.note}</p>
          <p className={styles.mutedText}>Редактируемые элементы в этой панели отсутствуют.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Сущность</th>
              <th>Причина</th>
              <th>Категория</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {viewModel.rows.map(renderRow)}
          </tbody>
        </table>
      )}
    </section>
  );
}

