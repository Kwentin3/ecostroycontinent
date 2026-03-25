import { AdminShell } from "../../../../components/admin/AdminShell";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireUserManager } from "../../../../lib/admin/page-helpers";
import { listUsers } from "../../../../lib/content-core/repository";

export default async function UsersPage({ searchParams }) {
  const user = await requireUserManager();
  const users = await listUsers();
  const query = await searchParams;

  return (
    <AdminShell user={user} title="User management">
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <section className={styles.panel}>
          <h3>Create user</h3>
          <form action="/api/admin/users/create" method="post" className={styles.gridTwo}>
            <label className={styles.label}>
              <span>Username</span>
              <input name="username" required />
            </label>
            <label className={styles.label}>
              <span>Display name</span>
              <input name="displayName" required />
            </label>
            <label className={styles.label}>
              <span>Role</span>
              <select name="role" defaultValue="seo_manager">
                <option value="superadmin">superadmin</option>
                <option value="seo_manager">seo_manager</option>
                <option value="business_owner">business_owner</option>
              </select>
            </label>
            <label className={styles.label}>
              <span>Password</span>
              <input name="password" type="password" required />
            </label>
            <button type="submit" className={styles.primaryButton}>Create user</button>
          </form>
        </section>
        <section className={styles.panel}>
          <h3>Users</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Active</th>
                <th>Latest activity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.display_name} ({item.username})</td>
                  <td>{item.role}</td>
                  <td>{item.active ? "yes" : "no"}</td>
                  <td>{item.latest_activity_at ? new Date(item.latest_activity_at).toLocaleString("ru-RU") : "-"}</td>
                  <td>
                    <form action={`/api/admin/users/${item.id}/toggle`} method="post">
                      <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                      <button type="submit" className={styles.secondaryButton}>{item.active ? "Deactivate" : "Activate"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AdminShell>
  );
}
