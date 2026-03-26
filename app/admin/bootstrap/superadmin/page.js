import styles from "../../../../components/admin/admin-ui.module.css";
import { getAppConfig } from "../../../../lib/config.js";
import { normalizeLegacyCopy } from "../../../../lib/ui-copy.js";

export const metadata = {
  title: "Инициализация суперадмина"
};

export default async function SuperadminBootstrapPage({ searchParams }) {
  const params = await searchParams;
  const config = getAppConfig();

  return (
    <main className={`${styles.page} ${styles.centerPage}`}>
      <section className={`${styles.panel} ${styles.authPanel}`}>
        <p className={styles.eyebrow}>Безопасная инициализация</p>
        <h1>Инициализация суперадмина</h1>
        <p className={styles.mutedText}>
          Эта операция выполняется один раз и только вручную. Целевой логин зафиксирован как <code>{config.bootstrapSuperadminUsername}</code>.
          Пароль будет показан только один раз и не восстановится из обычных экранов приложения.
        </p>
        {params?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(params.error)}</div> : null}
        {!config.bootstrapSuperadminConfigured ? (
          <div className={styles.statusPanelBlocking}>
            Токен доступа для инициализации не настроен. Укажите <code>BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN</code> перед запуском этой операции.
          </div>
        ) : null}
        <form action="/api/admin/bootstrap/superadmin" method="post" className={styles.formGrid}>
          <label className={styles.label}>
            <span>Токен доступа</span>
            <input type="password" name="bootstrapToken" autoComplete="off" required />
          </label>
          <label className={styles.label}>
            <span>Подтверждение</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="confirm" value="true" required />
              <span>Я понимаю, что пароль будет показан только один раз.</span>
            </div>
          </label>
          <button type="submit" className={`${styles.primaryButton} ${styles.stretchButton}`} disabled={!config.bootstrapSuperadminConfigured}>
            Создать учётную запись
          </button>
        </form>
      </section>
    </main>
  );
}
