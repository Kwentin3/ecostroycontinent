import Link from "next/link";

import styles from "../../../components/admin/admin-ui.module.css";

export default function NoAccessPage() {
  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Нет доступа</p>
        <h1>Недостаточно прав</h1>
        <p className={styles.mutedText}>Эта поверхность доступна не всем ролям first slice.</p>
        <Link href="/admin" className={styles.secondaryButton}>Назад на панель</Link>
      </section>
    </main>
  );
}
