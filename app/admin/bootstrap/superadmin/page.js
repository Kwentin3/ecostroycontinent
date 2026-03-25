import styles from "../../../../components/admin/admin-ui.module.css";
import { getAppConfig } from "../../../../lib/config.js";

export const metadata = {
  title: "Bootstrap superadmin",
  robots: {
    index: false,
    follow: false
  }
};

export default async function SuperadminBootstrapPage({ searchParams }) {
  const params = await searchParams;
  const config = getAppConfig();

  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Security bootstrap</p>
        <h1>Bootstrap superadmin credentials</h1>
        <p className={styles.mutedText}>
          This flow is one-time and human-mediated. The target login is fixed as <code>{config.bootstrapSuperadminUsername}</code>.
          The generated password will be shown once only and will not be recoverable from normal app outputs.
        </p>
        {params?.error ? <div className={styles.statusPanelBlocking}>{params.error}</div> : null}
        {!config.bootstrapSuperadminConfigured ? (
          <div className={styles.statusPanelBlocking}>
            Bootstrap authority token is not configured. Set <code>BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN</code> before using this flow.
          </div>
        ) : null}
        <form action="/api/admin/bootstrap/superadmin" method="post" className={styles.formGrid}>
          <label className={styles.label}>
            <span>Bootstrap authority token</span>
            <input type="password" name="bootstrapToken" autoComplete="off" required />
          </label>
          <label className={styles.label}>
            <span>Confirmation</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="confirm" value="true" required />
              <span>I understand the password will be shown once.</span>
            </div>
          </label>
          <button type="submit" className={styles.primaryButton} disabled={!config.bootstrapSuperadminConfigured}>
            Bootstrap superadmin
          </button>
        </form>
      </section>
    </main>
  );
}
