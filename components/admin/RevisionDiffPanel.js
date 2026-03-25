import styles from "./admin-ui.module.css";

export function RevisionDiffPanel({ title = "Human-readable diff", basisLabel = "", rows = [], emptyLabel = "No top-level changes." }) {
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
                  <strong>Before</strong>
                  <pre className={styles.diffValue}>{row.before}</pre>
                </div>
                <div className={styles.diffCell}>
                  <strong>After</strong>
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
