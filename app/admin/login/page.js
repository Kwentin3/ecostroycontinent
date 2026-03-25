import styles from "../../../components/admin/admin-ui.module.css";

export const metadata = {
  title: "Admin Login"
};

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Write-side only</p>
        <h1>Admin login</h1>
        <p className={styles.mutedText}>
          First slice uses fixed roles: `superadmin`, `seo_manager`, and `business_owner`.
        </p>
        {params?.error ? <div className={styles.statusPanelBlocking}>{params.error}</div> : null}
        {params?.message ? <div className={styles.statusPanelInfo}>{params.message}</div> : null}
        <form action="/api/admin/login" method="post" className={styles.formGrid}>
          <label className={styles.label}>
            <span>Username</span>
            <input type="text" name="username" required />
          </label>
          <label className={styles.label}>
            <span>Password</span>
            <input type="password" name="password" required />
          </label>
          <button type="submit" className={styles.primaryButton}>Login</button>
        </form>
      </section>
    </main>
  );
}
