import Link from "next/link";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import { loadLandingWorkspaceChooserData, buildLandingWorkspaceHref } from "../../../../../lib/admin/landing-workspace.js";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { readWorkspaceSessionRecord } from "../../../../../lib/ai-workspace/memory-card.js";
import { getCurrentSessionId } from "../../../../../lib/auth/session.js";
import { getPayloadLabel } from "../../../../../lib/admin/entity-ui.js";
import { getRevisionStateLabel, normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";
import styles from "../../../../../components/admin/admin-ui.module.css";

export default async function LandingWorkspaceChooserPage({ searchParams }) {
  const user = await requireReviewUser();
  const query = await searchParams;
  const sessionId = await getCurrentSessionId();
  const sessionRow = sessionId ? await readWorkspaceSessionRecord(sessionId) : null;
  const data = await loadLandingWorkspaceChooserData({ sessionRow });
  const currentPageCard = data.pageCards.find((card) => card.entity.id === data.currentSessionPageId) ?? null;

  return (
    <AdminShell
      user={user}
      title="Рабочая зона лендинга"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "AI-верстка" }
      ]}
      activeHref="/admin/workspace/landing"
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <SurfacePacket
          eyebrow="Выбор лендинга"
          title="Рабочая зона лендинга"
          summary="Сначала выберите страницу-источник. Рабочая зона не создаёт страницу, а только привязывается к ней."
          legend="Здесь можно продолжить существующую сессию или открыть рабочую зону для выбранной страницы."
          meta={[
            currentPageCard ? `Текущая страница: ${getPayloadLabel(currentPageCard.latestRevision?.payload)}` : "Текущая страница: нет",
            data.currentSessionPageId ? `Страница-источник: ${data.currentSessionPageId}` : "Страница-источник: не выбрана"
          ]}
        >
          {data.currentSessionPageId ? (
            <Link href={buildLandingWorkspaceHref(data.currentSessionPageId)} className={styles.primaryButton}>
              Продолжить работу
            </Link>
          ) : (
            <p className={styles.mutedText}>Привязки к странице пока нет. Откройте любую страницу ниже, чтобы создать первую сессию.</p>
          )}
        </SurfacePacket>

        <section className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Страница</th>
                <th>Последняя версия</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.pageCards.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className={styles.emptyState}>
                      <p className={styles.mutedText}>Страниц пока нет.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.pageCards.map((card) => {
                  const href = buildLandingWorkspaceHref(card.entity.id);
                  const label = getPayloadLabel(card.latestRevision?.payload);
                  return (
                    <tr key={card.entity.id}>
                      <td>
                        <div className={styles.cockpitCoverageSummary}>
                          <strong>{label}</strong>
                          <span className={styles.mutedText}>{card.entity.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cockpitCoverageSummary}>
                          <strong>{card.latestRevision ? `Версия №${card.latestRevision.revisionNumber}` : "Версий пока нет"}</strong>
                          <span className={styles.mutedText}>{card.latestRevision ? getRevisionStateLabel(card.latestRevision.state) : "Версий пока нет"}</span>
                        </div>
                      </td>
                      <td>
                        <Link href={href} className={styles.secondaryButton}>
                          Открыть AI-верстку
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AdminShell>
  );
}
