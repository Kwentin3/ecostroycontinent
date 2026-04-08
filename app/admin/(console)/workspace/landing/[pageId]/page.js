import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { LandingWorkspaceMemoryPanel } from "../../../../../../components/admin/LandingWorkspaceMemoryPanel";
import { LandingWorkspaceVerificationPanel } from "../../../../../../components/admin/LandingWorkspaceVerificationPanel";
import { PreviewViewport } from "../../../../../../components/admin/PreviewViewport";
import { SurfacePacket } from "../../../../../../components/admin/SurfacePacket";
import { StandalonePage } from "../../../../../../components/public/PublicRenderers";
import { loadLandingWorkspacePageData, buildLandingWorkspaceHref } from "../../../../../../lib/admin/landing-workspace.js";
import { requireReviewUser } from "../../../../../../lib/admin/page-helpers";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { getPayloadLabel } from "../../../../../../lib/admin/entity-ui.js";
import { getRevisionStateLabel, getRoleLabel, normalizeLegacyCopy } from "../../../../../../lib/ui-copy.js";
import { getCurrentSessionId } from "../../../../../../lib/auth/session.js";
import styles from "../../../../../../components/admin/admin-ui.module.css";

export default async function LandingWorkspacePage({ params, searchParams }) {
  const { pageId } = await params;
  const user = await requireReviewUser();
  const query = await searchParams;
  const previewMode = typeof query?.preview === "string" ? query.preview : "desktop";
  const data = await loadLandingWorkspacePageData(pageId, { previewMode }, { actor: user });

  if (!data.entity || data.entity.entityType !== ENTITY_TYPES.PAGE || !data.sourceRevision) {
    notFound();
  }

  const canEdit = userCanEditContent(user) && !data.sessionConflict;
  const pageLabel = getPayloadLabel(data.sourceRevision.payload) || pageId;
  const workspaceHref = buildLandingWorkspaceHref(pageId);
  const sourceEditorHref = `/admin/entities/page/${pageId}`;
  const currentChangeIntent = normalizeLegacyCopy(
    data.workspaceMemoryCard?.editorialIntent?.changeIntent
      || data.currentRevision?.changeIntent
      || "Уточнить лендинг на основе страницы-источника."
  );
  const currentEditorialGoal = normalizeLegacyCopy(
    data.workspaceMemoryCard?.editorialIntent?.editorialGoal
      || "Уточнить лендинг на основе страницы-источника."
  );
  const currentVariantDirection = data.workspaceMemoryCard?.editorialIntent?.variantDirection || "";
  const currentSessionId = await getCurrentSessionId();

  return (
    <AdminShell
      user={user}
      title={`Рабочая зона лендинга · ${pageLabel}`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "AI-верстка", href: "/admin/workspace/landing" },
        { label: pageLabel }
      ]}
      activeHref="/admin/workspace/landing"
      actions={
        <>
          <Link href={sourceEditorHref} className={styles.secondaryButton}>
            Открыть редактор страницы
          </Link>
          <Link href="/admin/workspace/landing" className={styles.secondaryButton}>
            К выбору лендинга
          </Link>
        </>
      }
    >
      <div className={styles.workspaceGrid}>
        <section className={styles.workspaceColumn}>
          {data.sessionConflict ? (
            <div className={styles.statusPanelBlocking}>
              Another active landing workspace session is already anchored to this page. Resume that session before generating or sending this draft to review.
            </div>
          ) : null}

          <SurfacePacket
            eyebrow="Страница-источник"
            title={pageLabel}
            summary={`Страница-источник: ${pageId}`}
            legend="Редактор страницы остаётся единственным местом правки исходника. Рабочая зона только привязана к этой странице."
            meta={[
              data.currentRevision ? `Черновик: №${data.currentRevision.revisionNumber}` : "Черновик: нет",
              data.activePublishedRevision ? `Опубликованная основа: №${data.activePublishedRevision.revisionNumber}` : "Опубликованная основа: нет",
              data.sourceRevision ? `Статус последней версии: ${getRevisionStateLabel(data.sourceRevision.state)}` : "Статус последней версии: недоступен"
            ]}
          >
            <div className={styles.inlineActions}>
              <Link href={sourceEditorHref} className={styles.secondaryButton}>
                Открыть редактор страницы
              </Link>
              {currentSessionId ? (
                <Link href={workspaceHref} className={styles.secondaryButton}>
                  Обновить привязку
                </Link>
              ) : null}
            </div>
          </SurfacePacket>

          <LandingWorkspaceMemoryPanel memoryCard={data.workspaceMemoryCard} />

          <SurfacePacket
            eyebrow="Последние действия"
            title="Последний шаг"
            summary="Журнал остаётся коротким и ограниченным, чтобы рабочая зона не превращалась в чат."
            legend="Здесь видны последнее принятое изменение, последний блокер и результат генерации."
            bullets={[
              `Последнее изменение: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.lastChange || "—")}`,
              `Последний блокер: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.lastBlocker || "—")}`,
              `Результат: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.generationOutcome || "—")}`
            ]}
          />
        </section>

        <section className={styles.workspaceColumn}>
          <SurfacePacket
            eyebrow="Предпросмотр"
            title="Текущая проекция"
            summary="Предпросмотр и проверка читают одну и ту же текущую проекцию."
            legend="Переключайте устройство только для проверки вида. Сама проекция не меняется."
          >
            <PreviewViewport
              title="Предпросмотр"
              hint="Переключайте устройство сверху, чтобы увидеть ту же страницу в другом размере."
              device={previewMode}
              hrefBase={workspaceHref}
              searchParams={query}
            >
              <StandalonePage
                page={data.derivedArtifactSlice.payload}
                globalSettings={data.globalSettings}
                services={(id) => data.publishedLookups.serviceMap.get(id) || null}
                cases={(id) => data.publishedLookups.caseMap.get(id) || null}
                galleries={(id) => data.publishedLookups.galleryMap.get(id) || null}
                resolveMedia={(id) => data.publishedLookups.mediaMap.get(id) || null}
              />
            </PreviewViewport>
          </SurfacePacket>

          <SurfacePacket
            eyebrow="Постановка задачи"
            title="Что хотим изменить"
            summary="Коротко и конкретно опишите следующую правку. Этот блок не редактирует страницу-источник напрямую."
            legend="Этот блок только задаёт следующую генерацию черновика."
          >
            {canEdit ? (
              <form action={`/api/admin/workspace/landing/${pageId}`} method="post" className={styles.formGrid}>
                <input type="hidden" name="previewMode" value={previewMode} />
                <input type="hidden" name="editorialGoal" value={currentEditorialGoal} />
                <input type="hidden" name="variantDirection" value={currentVariantDirection} />
                <label className={styles.label}>
                  <span>Что хотим изменить</span>
                  <textarea
                    name="changeIntent"
                    defaultValue={currentChangeIntent}
                    placeholder="Что нужно изменить в лендинге?"
                    required
                  />
                </label>
                <div className={styles.inlineActions}>
                  <button type="submit" name="actionKind" value="generate_candidate" className={styles.primaryButton}>
                    {data.currentRevision ? "Сгенерировать заново" : "Сгенерировать черновик"}
                  </button>
                  {data.currentRevision ? (
                    <button type="submit" name="actionKind" value="send_to_review" className={styles.secondaryButton}>
                      Передать на проверку
                    </button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className={styles.mutedText}>
                Эту поверхность могут редактировать только {getRoleLabel("seo_manager")} и {getRoleLabel("superadmin")}. {getRoleLabel("business_owner")} видит
                отчет, предпросмотр и обзор проверки.
              </p>
            )}
          </SurfacePacket>
        </section>

        <section className={`${styles.workspaceColumn} ${styles.stickyPanel}`}>
          <LandingWorkspaceVerificationPanel
            derivedArtifactSlice={data.derivedArtifactSlice}
            readiness={data.readiness}
            revision={data.sourceRevision}
            auditItems={data.auditItems}
            report={data.verificationReport}
          />

          <SurfacePacket
            eyebrow="Передача на проверку"
            title="Следующий шаг"
            summary="Рабочая зона может передать результат в существующий поток проверки без второго пути публикации."
            legend="Используйте страницу проверки для согласования и редактор страницы для правок исходника."
            meta={[
              data.currentRevision ? `Черновик №${data.currentRevision.revisionNumber}` : "Черновик ещё не создан",
              data.sourceRevision?.state === "review" ? "Уже на проверке" : "Ещё не на проверке"
            ]}
          >
            {data.sourceRevision?.state === "review" ? (
              <Link href={`/admin/review/${data.sourceRevision.id}`} className={styles.primaryButton}>
                Открыть проверку
              </Link>
            ) : data.currentRevision ? (
              <Link href={`/admin/review/${data.currentRevision.id}`} className={styles.secondaryButton}>
                Открыть проверку черновика
              </Link>
            ) : (
              <p className={styles.mutedText}>Сначала создайте черновик, затем передайте его на проверку.</p>
            )}
          </SurfacePacket>
        </section>
      </div>
    </AdminShell>
  );
}
