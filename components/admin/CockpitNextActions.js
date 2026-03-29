import Link from "next/link";

import styles from "./admin-ui.module.css";

function getToneClass(tone) {
  switch (tone) {
    case "danger":
      return styles.cockpitToneDanger;
    case "warning":
      return styles.cockpitToneWarning;
    case "missing":
      return styles.cockpitToneWarning;
    case "healthy":
      return styles.cockpitToneHealthy;
    default:
      return styles.cockpitToneUnknown;
  }
}

export function CockpitNextActions({ primaryAction = null, secondaryActions = [], stateNote = null }) {
  if (!primaryAction) {
    return (
      <section className={styles.panel} aria-labelledby="cockpit-next-actions-title">
        <div className={styles.cockpitBlockHeader}>
          <div>
            <p className={styles.cockpitBlockKicker}>Что делать</p>
            <h4 id="cockpit-next-actions-title" className={styles.cockpitBlockTitle}>Следующий лучший шаг</h4>
          </div>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.mutedText}>Следующее действие пока не собрано.</p>
          <p className={styles.mutedText}>Откройте first-slice сущность, чтобы cockpit показал actionable step.</p>
        </div>
      </section>
    );
  }

  const toneClass = getToneClass(primaryAction.tone);

  return (
    <section className={`${styles.panel} ${styles.cockpitActionPanel} ${toneClass}`} aria-labelledby="cockpit-next-actions-title">
      <div className={styles.cockpitBlockHeader}>
        <div>
          <p className={styles.cockpitBlockKicker}>Что делать</p>
          <h4 id="cockpit-next-actions-title" className={styles.cockpitBlockTitle}>Следующий лучший шаг</h4>
        </div>
        <span className={`${styles.cockpitStatusPill} ${toneClass}`}>{primaryAction.statusLabel}</span>
      </div>

      <div className={styles.cockpitActionPrimary}>
        <div className={styles.cockpitActionPrimaryMeta}>
          <span className={styles.badge}>{primaryAction.entityTypeLabel ?? primaryAction.entityType}</span>
          <span className={styles.badge}>{primaryAction.routeHint}</span>
        </div>
        <h5 className={styles.cockpitActionPrimaryTitle}>{primaryAction.label}</h5>
        <p className={styles.cockpitActionPrimaryBody}>{primaryAction.reason}</p>
        <div className={styles.inlineActions}>
          <Link href={primaryAction.routeTarget.href} className={styles.primaryButton}>
            {primaryAction.actionLabel}
          </Link>
        </div>
      </div>

      {secondaryActions.length ? (
        <div className={styles.cockpitActionList} aria-label="Дополнительные следующие шаги">
          {secondaryActions.map((action) => (
            <article key={action.key} className={styles.cockpitActionItem}>
              <div className={styles.cockpitActionItemTop}>
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{action.entityTypeLabel ?? action.entityType}</span>
                  <span className={`${styles.cockpitStatusPill} ${getToneClass(action.tone)}`}>{action.statusLabel}</span>
                </div>
                <Link href={action.routeTarget.href} className={styles.secondaryButton}>
                  {action.actionLabel}
                </Link>
              </div>
              <p className={styles.cockpitActionItemBody}>{action.label}</p>
              <p className={styles.mutedText}>{action.reason}</p>
              <p className={styles.mutedText}>{action.routeHint}</p>
            </article>
          ))}
        </div>
      ) : null}

      {stateNote ? <p className={styles.cockpitBlockNote}>{stateNote}</p> : null}
    </section>
  );
}
