import { notFound } from "next/navigation";

import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { RevisionDiffPanel } from "../../../../../../../components/admin/RevisionDiffPanel";
import { SurfacePacket } from "../../../../../../../components/admin/SurfacePacket";
import { TimelineList } from "../../../../../../../components/admin/TimelineList";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers";
import { getPreviewTargetForField, getPayloadLabel } from "../../../../../../../lib/admin/entity-ui";
import { CHANGE_INTENT_LABEL, getScreenLegend } from "../../../../../../../lib/admin/screen-copy.js";
import { buildHumanReadableDiff } from "../../../../../../../lib/content-core/diff.js";
import { getEntityEditorState } from "../../../../../../../lib/content-core/service";
import { getAuditTimeline } from "../../../../../../../lib/content-ops/audit";
import { getChangeClassLabel, getEntityTypeLabel, getRevisionStateLabel, normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";

export default async function EntityHistoryPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const user = await requireEditorUser();
  const state = await getEntityEditorState(entityId);
  const auditItems = await getAuditTimeline(entityId);
  const query = await searchParams;
  const surfaceLabel = getPayloadLabel(state.revisions[0]?.payload || state.activePublishedRevision?.payload || { title: getEntityTypeLabel(entityType) });

  if (!state?.entity) {
    notFound();
  }

  return (
    <AdminShell
      user={user}
      title={`${surfaceLabel} — история`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: getEntityTypeLabel(entityType), href: `/admin/entities/${entityType}` },
        { label: surfaceLabel, href: `/admin/entities/${entityType}/${entityId}` },
        { label: "История" }
      ]}
      activeHref={`/admin/entities/${entityType}`}
    >
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        <SurfacePacket
          eyebrow="История"
          title="Лента версий"
          summary="Здесь видно, как материал менялся от черновика к публикации. Откат выполняет суперадмин и только по понятной ревизии."
          legend={getScreenLegend("history")}
          bullets={[
            `Всего версий: ${state.revisions.length}`,
            state.activePublishedRevision ? `Опубликованная версия №${state.activePublishedRevision.revisionNumber}` : "Опубликованной версии пока нет",
            "Комментарий к версии читается как история, а не как технический лог."
          ]}
        />
        <section className={styles.panel}>
          <div className={styles.stack}>
            {state.revisions.map((revision, index) => {
              const baseline = index === state.revisions.length - 1 ? state.activePublishedRevision : state.revisions[index + 1] ?? state.activePublishedRevision;
              const diffRows = buildHumanReadableDiff(
                state.entity.entityType,
                baseline?.payload ?? null,
                revision.payload,
                (field) => getPreviewTargetForField(state.entity.entityType, field)
              );

              return (
                <article key={revision.id} className={styles.timelineItem}>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{getRevisionStateLabel(revision.state)}</span>
                    {revision.aiInvolvement ? <span className={styles.badge}>С участием ИИ</span> : null}
                  </div>
                  <h4>Версия №{revision.revisionNumber}</h4>
                  <p className={styles.mutedText}>{CHANGE_INTENT_LABEL}: {normalizeLegacyCopy(revision.changeIntent)}</p>
                  <p className={styles.mutedText}>{getChangeClassLabel(revision.changeClass)}</p>
                  <RevisionDiffPanel
                    title="Понятные изменения"
                    basisLabel={baseline ? `Сравнение с ${baseline.state === "published" ? "опубликованной базой" : `версией №${baseline.revisionNumber}`}` : "Первая версия"}
                    rows={diffRows}
                    emptyLabel="Изменений верхнего уровня нет."
                  />
                  {user.role === "superadmin" && revision.state === "published" ? (
                    <div className={styles.inlineActions}>
                      <ConfirmActionForm
                        action={`/api/admin/entities/${entityType}/${entityId}/rollback`}
                        confirmMessage={`Откатить к версии №${revision.revisionNumber}?`}
                        className={styles.inlineActions}
                      >
                        <input type="hidden" name="targetRevisionId" value={revision.id} />
                      <button type="submit" className={`${styles.secondaryButton} ${styles.stretchButton}`}>Откатить к этой версии</button>
                      </ConfirmActionForm>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
        <section className={styles.panel}>
          <TimelineList items={auditItems} defaultOpen />
        </section>
      </div>
    </AdminShell>
  );
}
