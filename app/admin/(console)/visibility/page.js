import { AdminShell } from "../../../../components/admin/AdminShell";
import { SeoVisibilityDashboard } from "../../../../components/admin/SeoVisibilityDashboard";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireAdminUser } from "../../../../lib/admin/page-helpers";
import { buildSeoDashboardReadModel } from "../../../../lib/analytics/read-model.js";

function parsePeriod(value) {
  const parsed = Number(value || 28);
  return [7, 28, 90].includes(parsed) ? parsed : 28;
}

export default async function AdminVisibilityPage({ searchParams }) {
  const user = await requireAdminUser();
  const query = await searchParams;
  const period = parsePeriod(query?.period);
  const selectedPagePath = typeof query?.page === "string" ? query.page : "";

  let readModel = null;
  let error = null;

  try {
    readModel = await buildSeoDashboardReadModel({ periodDays: period, selectedPagePath });
  } catch {
    error = "Не удалось собрать аналитический read model. Проверьте миграции и доступность базы данных.";
  }

  return (
    <AdminShell
      user={user}
      title="Видимость"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Видимость" }
      ]}
      activeHref="/admin/visibility"
    >
      {error ? (
        <section className={styles.panel}>
          <div className={styles.statusPanelBlocking}>{error}</div>
        </section>
      ) : (
        <SeoVisibilityDashboard readModel={readModel} period={period} />
      )}
    </AdminShell>
  );
}
