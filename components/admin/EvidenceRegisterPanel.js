import Link from "next/link";

import { buildEvidenceRegisterViewModel } from "../../lib/admin/evidence-register-view.js";
import styles from "./admin-ui.module.css";

const TONE_CLASS_BY_STATE = {
  healthy: styles.cockpitToneHealthy,
  warning: styles.cockpitToneWarning,
  danger: styles.cockpitToneDanger,
  unknown: styles.cockpitToneUnknown
};

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
          {row.target.isFallback ? <span className={styles.cockpitFallbackPill}>fallback</span> : null}
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
  title = "Evidence register"
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

  return (
    <section id={panelId} className={`${styles.panel} ${styles.evidenceRegisterPanel}`} aria-labelledby="evidence-register-title">
      <div className={styles.cockpitBlockHeader}>
        <div>
          <p className={styles.cockpitBlockKicker}>Proof visibility</p>
          <h3 id="evidence-register-title" className={styles.cockpitBlockTitle}>{title}</h3>
          <p className={styles.cockpitBlockNote}>
            Projection only. No edit controls. The register shows where proof is missing and where to go next.
          </p>
        </div>
        <span className={`${styles.cockpitStateValue} ${toneClass}`}>{viewModel.state.label}</span>
      </div>

      <div className={styles.cockpitStateGrid}>
        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>State</span>
          <span className={`${styles.cockpitStateValue} ${toneClass}`}>{viewModel.state.label}</span>
          <p className={styles.cockpitStateCopy}>{viewModel.state.note}</p>
        </article>

        <article className={styles.cockpitStateCard}>
          <span className={styles.cockpitStateLabel}>Rows</span>
          <span className={styles.cockpitStateValue}>{viewModel.counts.total}</span>
          <p className={styles.cockpitStateCopy}>{viewModel.scopeLabel}</p>
        </article>
      </div>

      {viewModel.isEmpty ? (
        <div className={styles.emptyState}>
          <p className={styles.mutedText}>{viewModel.state.note}</p>
          <p className={styles.mutedText}>No editable controls are present in this surface.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Entity</th>
              <th>Reason</th>
              <th>Category</th>
              <th>Action</th>
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

