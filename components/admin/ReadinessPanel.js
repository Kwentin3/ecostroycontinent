import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

export function ReadinessPanel({ readiness, title = ADMIN_COPY.readinessTitle, defaultOpen = false }) {
  if (!readiness) {
    return null;
  }

  const blocking = readiness.results.filter((result) => result.severity === "blocking");
  const warnings = readiness.results.filter((result) => result.severity === "warning");
  const info = readiness.results.filter((result) => result.severity === "info");

  return (
    <details className={styles.compactDisclosure} open={defaultOpen}>
      <summary className={styles.compactDisclosureSummary}>
        <span className={styles.compactDisclosureMarker} aria-hidden="true" />
        <span className={styles.compactDisclosureSummaryMain}>
          <strong>{title}</strong>
          <span className={styles.compactDisclosureSummaryMeta}>{readiness.summary}</span>
        </span>
        <span className={styles.compactDisclosureSummaryStats}>
          <span className={styles.badge}>{ADMIN_COPY.readinessBlocking}: {blocking.length}</span>
          <span className={styles.badge}>{ADMIN_COPY.readinessWarnings}: {warnings.length}</span>
          <span className={styles.badge}>{ADMIN_COPY.readinessInfo}: {info.length}</span>
        </span>
      </summary>
      <div className={styles.compactDisclosureBody}>
        {blocking.length > 0 ? (
          <div className={styles.statusPanelBlocking}>
            <strong>{ADMIN_COPY.readinessBlocking}</strong>
            <ul>
              {blocking.map((item) => (
                <li key={item.code}>{item.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {warnings.length > 0 ? (
          <div className={styles.statusPanelWarning}>
            <strong>{ADMIN_COPY.readinessWarnings}</strong>
            <ul>
              {warnings.map((item) => (
                <li key={item.code}>{item.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {info.length > 0 ? (
          <div className={styles.statusPanelInfo}>
            <strong>{ADMIN_COPY.readinessInfo}</strong>
            <ul>
              {info.map((item) => (
                <li key={item.code}>{item.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
