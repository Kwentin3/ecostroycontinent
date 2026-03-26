import styles from "../../../components/admin/admin-ui.module.css";
import { normalizeLegacyCopy } from "../../../lib/ui-copy.js";

export const metadata = {
  title: "Вход в админку"
};

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Только рабочая зона</p>
        <h1>Вход в админку</h1>
        <p className={styles.mutedText}>
          Доступ открыт для ролей суперадмина, SEO-менеджера и владельца бизнеса.
        </p>
        {params?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(params.error)}</div> : null}
        {params?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(params.message)}</div> : null}
        <form action="/api/admin/login" method="post" className={styles.formGrid}>
          <label className={styles.label}>
            <span>Логин</span>
            <input type="text" name="username" required />
          </label>
          <label className={styles.label}>
            <span>Пароль</span>
            <input type="password" name="password" required />
          </label>
          <button type="submit" className={styles.primaryButton}>Войти</button>
        </form>
      </section>
    </main>
  );
}
