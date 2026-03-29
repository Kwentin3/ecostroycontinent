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

export function LaunchCoreCoveragePanel({ coverageTiles = [], coverageNote = null }) {
  return (
    <section className={styles.panel} aria-labelledby="launch-core-coverage-title">
      <div className={styles.cockpitBlockHeader}>
        <div>
          <p className={styles.cockpitBlockKicker}>Coverage</p>
          <h4 id="launch-core-coverage-title" className={styles.cockpitBlockTitle}>Launch-core coverage</h4>
        </div>
        <p className={styles.cockpitBlockNote}>Одна строка на каждый first-slice entity type. Empty coverage никогда не выглядит healthy.</p>
      </div>

      {coverageTiles.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.mutedText}>Покрытие пока не собрано.</p>
          <p className={styles.mutedText}>Ни одна first-slice строка не пришла в cockpit projection.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Сущность</th>
              <th>Состояние</th>
              <th>Сигнал</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {coverageTiles.map((tile) => (
              <tr key={tile.key}>
                <td>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{tile.label}</strong>
                    <span className={styles.mutedText}>{tile.routeHint}</span>
                    {tile.fallbackRoute ? <span className={styles.cockpitFallbackPill}>Fallback route</span> : null}
                  </div>
                </td>
                <td>
                  <span className={`${styles.cockpitStatusPill} ${getToneClass(tile.tone)}`}>{tile.statusLabel}</span>
                </td>
                <td>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{tile.summary}</strong>
                    <span className={styles.mutedText}>{tile.reason}</span>
                    {tile.countBadges.length ? (
                      <div className={styles.badgeRow} aria-label={`${tile.label} counters`}>
                        {tile.countBadges.map((badge) => (
                          <span key={badge.key} className={`${styles.cockpitStatusPill} ${getToneClass(badge.tone)}`}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>
                  <Link href={tile.routeTarget.href} className={styles.secondaryButton}>
                    {tile.routeTarget.isFallback ? tile.routeTarget.label : "Открыть"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {coverageNote ? <p className={styles.cockpitBlockNote}>{coverageNote}</p> : null}
    </section>
  );
}
