import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmActionForm } from "../../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireUserManager } from "../../../../../lib/admin/page-helpers";
import { getScreenLegend } from "../../../../../lib/admin/screen-copy.js";
import { getRoleLabel } from "../../../../../lib/auth/session.js";
import { findUserById, listUsers } from "../../../../../lib/content-core/repository";
import { normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";

export default async function UserDetailPage({ params, searchParams }) {
  const user = await requireUserManager();
  const query = await searchParams;
  const { userId } = await params;
  const currentUser = await findUserById(userId);
  const users = await listUsers();

  if (!currentUser) {
    notFound();
  }

  const activeCount = users.filter((item) => item.active).length;

  return (
    <AdminShell
      user={user}
      title="Пользователи"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Пользователи", href: "/admin/users" },
        { label: currentUser.display_name }
      ]}
      activeHref="/admin/users"
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        <SurfacePacket
          eyebrow="Карточка пользователя"
          title={currentUser.display_name}
          summary="Здесь можно изменить имя, логин, роль, активность и пароль. Удаление доступно отдельно и требует подтверждения."
          legend={getScreenLegend("usersDetail")}
          bullets={[
            `Роль: ${getRoleLabel(currentUser.role)}`,
            `Активен: ${currentUser.active ? "да" : "нет"}`,
            `Всего пользователей в системе: ${users.length}`,
            `Активных сейчас: ${activeCount}`
          ]}
          actions={<Link href="/admin/users" className={styles.secondaryButton}>Назад к списку</Link>}
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/admin/users/${item.id}`}>{item.display_name} ({item.username})</Link>
                    </td>
                    <td>{getRoleLabel(item.role)}</td>
                    <td>{item.active ? "да" : "нет"}</td>
                    <td>
                      <Link href={`/admin/users/${item.id}`} className={styles.secondaryButton}>
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.panel}>
            <h3>Редактировать пользователя</h3>
            <div className={styles.stack}>
              <form action={`/api/admin/users/${currentUser.id}/update`} method="post" className={styles.formGrid}>
                <label className={styles.label}>
                  <span>Логин</span>
                  <input name="username" defaultValue={currentUser.username} required />
                </label>
                <label className={styles.label}>
                  <span>Отображаемое имя</span>
                  <input name="displayName" defaultValue={currentUser.display_name} required />
                </label>
                <label className={styles.label}>
                  <span>Роль</span>
                  <select name="role" defaultValue={currentUser.role}>
                    <option value="superadmin">{getRoleLabel("superadmin")}</option>
                    <option value="seo_manager">{getRoleLabel("seo_manager")}</option>
                    <option value="business_owner">{getRoleLabel("business_owner")}</option>
                  </select>
                </label>
                <label className={styles.label}>
                  <span>Активен</span>
                  <select name="active" defaultValue={currentUser.active ? "true" : "false"}>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                </label>
                <label className={styles.label}>
                  <span>Новый пароль</span>
                  <input name="password" type="password" placeholder="Оставьте пустым, если пароль не меняется" />
                </label>
                <button type="submit" className={styles.primaryButton}>
                  Сохранить изменения
                </button>
              </form>

              <ConfirmActionForm
                action={`/api/admin/users/${currentUser.id}/delete`}
                confirmMessage={`Удалить пользователя ${currentUser.display_name}?`}
              >
                <button type="submit" className={styles.dangerButton}>
                  Удалить пользователя
                </button>
              </ConfirmActionForm>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
