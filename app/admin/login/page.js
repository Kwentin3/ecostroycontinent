import styles from "../../../components/admin/admin-ui.module.css";

export const metadata = {
  title: "Вход в админку"
};

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Только write-side</p>
        <h1>Вход в админку</h1>
        <p className={styles.mutedText}>
          Доступ открыт для ролей `superadmin`, `seo_manager` и `business_owner`.
        </p>
        {params?.error ? <div className={styles.statusPanelBlocking}>{params.error}</div> : null}
        {params?.message ? <div className={styles.statusPanelInfo}>{params.message}</div> : null}
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
