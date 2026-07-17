import styles from "../../../../components/admin/admin-ui.module.css";

export default function RemovalSweepLoading() {
  return (
    <div className={styles.removalSweepLoading} role="status" aria-label="Загружаем очередь очистки">
      <div className={styles.removalSweepLoadingHeader} />
      <div className={styles.removalSweepLoadingTabs} />
      {[1, 2, 3].map((item) => <div key={item} className={styles.removalSweepLoadingCard} />)}
      <span className={styles.visuallyHidden}>Загружаем очередь очистки...</span>
    </div>
  );
}
