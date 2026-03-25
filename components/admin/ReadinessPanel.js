import styles from "./admin-ui.module.css";

export function ReadinessPanel({ readiness, title = "Readiness" }) {
  if (!readiness) {
    return null;
  }

  const blocking = readiness.results.filter((result) => result.severity === "blocking");
  const warnings = readiness.results.filter((result) => result.severity === "warning");
  const info = readiness.results.filter((result) => result.severity === "info");

  return (
    <section className={styles.stack}>
      <div className={styles.panel}>
        <h3>{title}</h3>
        <p className={styles.mutedText}>{readiness.summary}</p>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>Blocking: {blocking.length}</span>
          <span className={styles.badge}>Warnings: {warnings.length}</span>
          <span className={styles.badge}>Info: {info.length}</span>
        </div>
      </div>
      {blocking.length > 0 ? (
        <div className={styles.statusPanelBlocking}>
          <strong>Blocking</strong>
          <ul>
            {blocking.map((item) => (
              <li key={item.code}>{item.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className={styles.statusPanelWarning}>
          <strong>Warnings</strong>
          <ul>
            {warnings.map((item) => (
              <li key={item.code}>{item.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {info.length > 0 ? (
        <div className={styles.statusPanelInfo}>
          <strong>Info</strong>
          <ul>
            {info.map((item) => (
              <li key={item.code}>{item.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
