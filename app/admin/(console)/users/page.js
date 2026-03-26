import { ConfirmActionForm } from "../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../../components/admin/SurfacePacket";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireUserManager } from "../../../../lib/admin/page-helpers";
import { getRoleLabel } from "../../../../lib/auth/session.js";
import { listUsers } from "../../../../lib/content-core/repository";
import { normalizeLegacyCopy } from "../../../../lib/ui-copy.js";

export default async function UsersPage({ searchParams }) {
  const user = await requireUserManager();
  const users = await listUsers();
  const query = await searchParams;
  const activeCount = users.filter((item) => item.active).length;

  return (
    <AdminShell
      user={user}
      title="Пользователи"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Пользователи" }
      ]}
      activeHref="/admin/users"
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        <SurfacePacket
          eyebrow="Доступы"
          title="Управление пользователями"
          summary="Здесь видны активные роли, последняя активность и быстрые действия по включению или отключению доступа."
          bullets={[
            `Всего пользователей: ${users.length}`,
            `Активных: ${activeCount}`,
            "Создание и деактивация выполняются без отдельного экрана."
          ]}
        />
        <div className={styles.split}>
          <section className={styles.panel}>
            <h3>Список пользователей</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Активен</th>
                  <th>Последняя активность</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.display_name} ({item.username})
                    </td>
                    <td>{getRoleLabel(item.role)}</td>
                    <td>{item.active ? "да" : "нет"}</td>
                    <td>{item.latest_activity_at ? new Date(item.latest_activity_at).toLocaleString("ru-RU") : "-"}</td>
                    <td>
                      <ConfirmActionForm
                        action={`/api/admin/users/${item.id}/toggle`}
                        confirmMessage={item.active ? `Деактивировать пользователя ${item.display_name}?` : `Активировать пользователя ${item.display_name}?`}
                      >
                        <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                        <button type="submit" className={styles.secondaryButton}>
                          {item.active ? "Деактивировать" : "Активировать"}
                        </button>
                      </ConfirmActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className={styles.panel}>
            <h3>Создать пользователя</h3>
            <form action="/api/admin/users/create" method="post" className={styles.gridTwo}>
              <label className={styles.label}>
                <span>Логин</span>
                <input name="username" required />
              </label>
              <label className={styles.label}>
                <span>Отображаемое имя</span>
                <input name="displayName" required />
              </label>
              <label className={styles.label}>
                <span>Роль</span>
                <select name="role" defaultValue="seo_manager">
                  <option value="superadmin">{getRoleLabel("superadmin")}</option>
                  <option value="seo_manager">{getRoleLabel("seo_manager")}</option>
                  <option value="business_owner">{getRoleLabel("business_owner")}</option>
                </select>
              </label>
              <label className={styles.label}>
                <span>Пароль</span>
                <input name="password" type="password" required />
              </label>
              <button type="submit" className={styles.primaryButton}>
                Создать пользователя
              </button>
            </form>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
