import styles from "./admin-ui.module.css";

function renderMetaItem(item, index) {
  if (typeof item === "string") {
    return (
      <span key={`${item}-${index}`} className={styles.badge}>
        {item}
      </span>
    );
  }

  return item;
}

export function SurfacePacket({ eyebrow, title, summary, meta = [], bullets = [], actions = null, children = null }) {
  return (
    <section className={styles.surfacePacket}>
      <div className={styles.surfacePacketTop}>
        <div className={styles.surfacePacketHeading}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          {title ? <h3>{title}</h3> : null}
          {summary ? <p className={styles.surfacePacketSummary}>{summary}</p> : null}
        </div>
        {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      </div>

      {meta.length ? <div className={styles.badgeRow}>{meta.map((item, index) => renderMetaItem(item, index))}</div> : null}

      {bullets.length ? (
        <ul className={styles.surfacePacketList}>
          {bullets.filter(Boolean).map((bullet, index) => (
            <li key={`${bullet}-${index}`}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {children ? <div className={styles.surfacePacketBody}>{children}</div> : null}
    </section>
  );
}
