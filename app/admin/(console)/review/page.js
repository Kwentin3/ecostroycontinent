import Link from "next/link";

import { AdminShell } from "../../../../components/admin/AdminShell";
import styles from "../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../lib/admin/page-helpers";
import { getReviewQueue } from "../../../../lib/content-ops/workflow";

export default async function ReviewQueuePage() {
  const user = await requireReviewUser();
  const queue = await getReviewQueue();

  return (
    <AdminShell user={user} title="Очередь проверки">
      <section className={styles.panel}>
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
                <th>Ревизия</th>
                <th>Approval владельца</th>
                <th>Превью</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.revision.id}>
                  <td>{item.revision.payload.title || item.revision.payload.h1 || item.entityType}</td>
                  <td>{item.revision.revisionNumber}</td>
                  <td>{item.revision.ownerReviewRequired ? item.revision.ownerApprovalStatus : "not required"}</td>
                  <td>{item.revision.previewStatus}</td>
                  <td>
                    <Link href={`/admin/review/${item.revision.id}`}>Открыть проверку</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  );
}
