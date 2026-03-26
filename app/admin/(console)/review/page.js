import Link from "next/link";

import { AdminShell } from "../../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../../components/admin/SurfacePacket";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../lib/admin/page-helpers";
import { getScreenLegend } from "../../../../lib/admin/screen-copy.js";
import { getReviewQueue } from "../../../../lib/content-ops/workflow";
import { getEntityTypeLabel, getOwnerApprovalStatusLabel, getPreviewStatusLabel } from "../../../../lib/ui-copy.js";

export default async function ReviewQueuePage() {
  const user = await requireReviewUser();
  const queue = await getReviewQueue();
  const ownerItems = queue.filter((item) => item.revision.ownerReviewRequired);
  const firstItem = queue[0];

  return (
    <AdminShell user={user} title="Очередь проверки" breadcrumbs={[{ label: "Админка", href: "/admin" }, { label: "Проверка" }]} activeHref="/admin/review">
      <div className={styles.stack}>
        <SurfacePacket
          eyebrow="Очередь"
          title={queue.length ? `${queue.length} материалов ждут проверки` : "Очередь проверки пуста"}
          summary="Открывайте карточки по очереди. Если материал требует согласования владельца, это видно прямо в списке."
          legend={getScreenLegend("reviewQueue")}
          bullets={[
            `Требуют согласования владельца: ${ownerItems.length}`,
            `Всего в очереди: ${queue.length}`,
            queue.length ? "Первым открывайте верхнюю карточку очереди." : "Когда очередь пуста, можно вернуться к рабочим разделам."
          ]}
          actions={firstItem ? <Link href={`/admin/review/${firstItem.revision.id}`} className={styles.secondaryButton}>Открыть первую проверку</Link> : <Link href="/admin/entities/service" className={styles.secondaryButton}>Открыть услуги</Link>}
        />
        {queue.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.mutedText}>Очередь проверки пуста.</p>
            <Link href="/admin/entities/service">Открыть услуги</Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Сущность</th>
                <th>Версия</th>
                <th>Согласование владельца</th>
                <th>Предпросмотр</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.revision.id}>
                  <td>{item.revision.payload.title || item.revision.payload.h1 || getEntityTypeLabel(item.entityType)}</td>
                  <td>{item.revision.revisionNumber}</td>
                  <td>{item.revision.ownerReviewRequired ? getOwnerApprovalStatusLabel(item.revision.ownerApprovalStatus) : "Не требуется"}</td>
                  <td>{getPreviewStatusLabel(item.revision.previewStatus)}</td>
                  <td>
                    <Link href={`/admin/review/${item.revision.id}`}>Открыть проверку</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
