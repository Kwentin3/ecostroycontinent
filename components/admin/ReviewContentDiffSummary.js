import { ADMIN_COPY } from "../../lib/ui-copy.js";
import styles from "./admin-ui.module.css";

function renderDiffValue(row, side) {
  const parts = side === "before" ? row.beforeParts : row.afterParts;
  const highlightClass = side === "before" ? styles.diffRemovedText : styles.diffAddedText;

  if (!parts) {
    return row[side];
  }

  return (
    <>
      <span>{parts.prefix}</span>
      <mark className={highlightClass}>{parts.change}</mark>
      <span>{parts.suffix}</span>
    </>
  );
}

export function ReviewContentDiffSummary({
  title,
  basisLabel = "",
  rows = [],
  emptyLabel = "Контентных изменений не найдено."
}) {
  return (
    <section className={styles.reviewContentDiff}>
      <div className={styles.reviewContentDiffHeader}>
        <h3>{title}</h3>
        {basisLabel ? <p>{basisLabel}</p> : null}
      </div>
      {rows.length === 0 ? (
        <p className={styles.emptyHint}>{emptyLabel}</p>
      ) : (
        <div className={styles.reviewContentDiffList}>
          {rows.map((row) => (
            <article key={row.field} className={styles.diffCard}>
              <div className={styles.diffCardHeader}>
                <div>
                  <p className={styles.eyebrow}>{row.label}</p>
                  {row.summary ? <p className={styles.diffSummary}>{row.summary}</p> : null}
                </div>
              </div>
              <div className={styles.diffGrid}>
                <div className={styles.diffCell}>
                  <strong>{ADMIN_COPY.diffBefore}</strong>
                  <pre className={styles.diffValue}>{renderDiffValue(row, "before")}</pre>
                </div>
                <div className={styles.diffCell}>
                  <strong>{ADMIN_COPY.diffAfter}</strong>
                  <pre className={styles.diffValue}>{renderDiffValue(row, "after")}</pre>
                </div>
              </div>
              {Array.isArray(row.details) && row.details.length > 0 ? (
                <ul className={styles.diffDetailList}>
                  {row.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
