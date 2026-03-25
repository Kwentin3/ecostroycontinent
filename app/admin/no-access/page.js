import Link from "next/link";

import styles from "../../../components/admin/admin-ui.module.css";

export default function NoAccessPage() {
  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>No access</p>
        <h1>Insufficient permissions</h1>
        <p className={styles.mutedText}>This surface is not available to every first-slice role.</p>
        <Link href="/admin" className={styles.secondaryButton}>Back to dashboard</Link>
      </section>
    </main>
  );
}
