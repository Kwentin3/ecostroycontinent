import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { PageWorkspaceScreen } from "../../../../../../components/admin/PageWorkspaceScreen";
import styles from "../../../../../../components/admin/admin-ui.module.css";
import { deriveEditorValue, getPayloadLabel, loadEditorPageData } from "../../../../../../lib/admin/entity-ui.js";
import { buildListRowProjection } from "../../../../../../lib/admin/list-visibility.js";
import {
  buildPageWorkspaceBaseValue,
  buildPageWorkspaceCompositionState,
  buildPageWorkspaceLifecycleState,
  buildPageWorkspaceMetadataState
} from "../../../../../../lib/admin/page-workspace.js";
import { normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../../lib/content-core/content-types.js";
import { assertEntityType } from "../../../../../../lib/content-core/service";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../../../../../../lib/read-side/public-content.js";
import { userCanEditContent, userCanPublish } from "../../../../../../lib/auth/session.js";

function serializeLookupMap(map) {
  return Object.fromEntries(Array.from(map?.entries?.() ?? []));
}

export default async function EntityEditorPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const query = await searchParams;

  if (normalizedType === ENTITY_TYPES.MEDIA_ASSET) {
    const target = new URLSearchParams();
    target.set("asset", entityId);

    if (query?.message) {
      target.set("message", query.message);
    }

    if (query?.error) {
      target.set("error", query.error);
    }

    const returnTo = normalizeAdminReturnTo(query?.returnTo);

    if (returnTo) {
      target.set("returnTo", returnTo);
    }

    redirect(`/admin/entities/media_asset?${target.toString()}`);
  }

  if (normalizedType === ENTITY_TYPES.GALLERY) {
    const target = new URLSearchParams();
    target.set("compose", "collections");
    target.set("collection", entityId);

    if (query?.message) {
      target.set("message", query.message);
    }

    if (query?.error) {
      target.set("error", query.error);
    }

    const returnTo = normalizeAdminReturnTo(query?.returnTo);

    if (returnTo) {
      target.set("returnTo", returnTo);
    }

    redirect(`/admin/entities/media_asset?${target.toString()}`);
  }

  const data = await loadEditorPageData(normalizedType, entityId);
  const returnTo = normalizeAdminReturnTo(query?.returnTo);

  if (!data.state?.entity) {
    notFound();
  }

  if (normalizedType === ENTITY_TYPES.PAGE) {
    const workingRevision = data.currentRevision || data.state.activePublishedRevision || null;
    const pageLabel = getPayloadLabel(workingRevision?.payload || { title: ENTITY_TYPE_LABELS[normalizedType] }) || entityId;
    const row = buildListRowProjection({
      card: {
        entity: data.state.entity,
        latestRevision: workingRevision
      },
      entityType: ENTITY_TYPES.PAGE,
      readiness: workingRevision ? data.readiness : null,
      obligations: data.obligations,
      listHref: "/admin/entities/page"
    });
    const [publishedLookups, globalSettings] = await Promise.all([
      buildPublishedLookups(),
      getPublishedGlobalSettings()
    ]);
    const baseValue = buildPageWorkspaceBaseValue(workingRevision);
    const lifecycle = buildPageWorkspaceLifecycleState({
      aggregate: data.state,
      permissions: {
        canArchive: userCanPublish(user),
        canDelete: userCanEditContent(user)
      }
    });
    const reviewHref = data.currentRevision ? `/admin/review/${data.currentRevision.id}` : "";
    const signal = row || {
      signalLabel: "Проверить",
      signalTone: "unknown",
      signalReason: "Сигнал ещё не собран полностью."
    };

    return (
      <AdminShell
        user={user}
        title={pageLabel}
        breadcrumbs={[
          { label: "Админка", href: "/admin" },
          { label: "Страницы", href: "/admin/entities/page" },
          { label: pageLabel }
        ]}
        activeHref="/admin/entities/page"
        actions={returnTo ? <Link href={returnTo} className={styles.secondaryButton}>Вернуться к источнику</Link> : null}
      >
        <PageWorkspaceScreen
          pageId={entityId}
          pageLabel={pageLabel}
          initialBaseValue={baseValue}
          initialComposition={buildPageWorkspaceCompositionState(baseValue)}
          initialMetadata={buildPageWorkspaceMetadataState(baseValue)}
          initialRevision={data.currentRevision ? {
            id: data.currentRevision.id,
            revisionNumber: data.currentRevision.revisionNumber,
            state: data.currentRevision.state,
            previewStatus: data.currentRevision.previewStatus ?? null
          } : null}
          reviewHref={reviewHref}
          historyHref={`/admin/entities/page/${entityId}/history`}
          saveUrl={`/api/admin/entities/page/${entityId}/workspace`}
          signalLabel={signal.signalLabel}
          signalTone={signal.signalTone}
          signalReason={signal.signalReason}
          mediaOptions={data.mediaOptions}
          relationOptions={data.relationOptions}
          publishedLookupRecords={{
            services: serializeLookupMap(publishedLookups.serviceMap),
            cases: serializeLookupMap(publishedLookups.caseMap),
            galleries: serializeLookupMap(publishedLookups.galleryMap),
            media: serializeLookupMap(publishedLookups.mediaMap)
          }}
          globalSettings={globalSettings}
          lifecycle={{
            ...lifecycle,
            archiveUrl: `/api/admin/entities/page/${entityId}/live-deactivation`,
            deleteUrl: "/api/admin/entities/page/delete",
            registryHref: "/admin/entities/page"
          }}
          initialMessage={query?.message || ""}
          initialError={query?.error || ""}
        />
      </AdminShell>
    );
  }

  const surfaceLabel = getPayloadLabel(data.currentRevision?.payload || data.state.activePublishedRevision?.payload || { title: ENTITY_TYPE_LABELS[normalizedType] });

  return (
    <AdminShell
      user={user}
      title={`${surfaceLabel} — редактор`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: surfaceLabel }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={returnTo ? <Link href={returnTo} className={styles.secondaryButton}>Вернуться к источнику</Link> : null}
    >
      <EntityEditorForm
        entityType={normalizedType}
        entityId={entityId}
        entityCreationOrigin={data.state.entity.creationOrigin}
        value={deriveEditorValue(normalizedType, data.currentRevision || data.state.activePublishedRevision)}
        currentRevision={data.currentRevision}
        activePublishedRevision={data.state.activePublishedRevision}
        readiness={data.readiness}
        auditItems={data.auditItems}
        obligations={data.obligations}
        relationOptions={data.relationOptions}
        mediaOptions={data.mediaOptions}
        caseProjectTypeOptions={data.caseProjectTypeOptions}
        workspaceMemoryCard={data.workspaceMemoryCard}
        user={user}
        message={query?.message}
        error={query?.error}
      />
    </AdminShell>
  );
}
