"use client";

import styles from "../../../../components/admin/admin-ui.module.css";

export default function RemovalSweepError({ reset }) {
  return (
    <section className={`${styles.panel} ${styles.removalSweepFatalError}`} role="alert">
      <h2>Не удалось загрузить очередь очистки</h2>
      <p>Данные не изменены. Попробуйте получить актуальное состояние ещё раз.</p>
      <button type="button" className={styles.secondaryButton} onClick={reset}>
        Повторить загрузку
      </button>
    </section>
  );
}
