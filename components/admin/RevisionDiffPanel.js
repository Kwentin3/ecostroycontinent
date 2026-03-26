import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

export function RevisionDiffPanel({
  title = ADMIN_COPY.diffTitle,
  basisLabel = "",
  rows = [],
  emptyLabel = ADMIN_COPY.diffEmpty
}) {
  return (
    <section className={styles.panel}>
      <h3>{title}</h3>
      {basisLabel ? <p className={styles.mutedText}>{basisLabel}</p> : null}
      {rows.length === 0 ? (
        <p className={styles.emptyHint}>{emptyLabel}</p>
      ) : (
        <div className={styles.stack}>
          {rows.map((row) => (
            <article key={row.field} className={styles.diffCard}>
              <p className={styles.eyebrow}>{row.label}</p>
              <div className={styles.diffGrid}>
                <div className={styles.diffCell}>
                  <strong>{ADMIN_COPY.diffBefore}</strong>
                  <pre className={styles.diffValue}>{row.before}</pre>
                </div>
                <div className={styles.diffCell}>
                  <strong>{ADMIN_COPY.diffAfter}</strong>
                  <pre className={styles.diffValue}>{row.after}</pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
