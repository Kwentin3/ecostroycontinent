import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { deriveEditorValue, loadEditorPageData, getPayloadLabel } from "../../../../../../lib/admin/entity-ui";
import { normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { assertEntityType } from "../../../../../../lib/content-core/service";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../../lib/content-core/content-types.js";
import styles from "../../../../../../components/admin/admin-ui.module.css";

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
  const surfaceLabel = getPayloadLabel(data.currentRevision?.payload || data.state.activePublishedRevision?.payload || { title: ENTITY_TYPE_LABELS[normalizedType] });
  const returnTo = normalizeAdminReturnTo(query?.returnTo);

  if (!data.state?.entity) {
    notFound();
  }

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
      actions={
        <>
          {normalizedType === ENTITY_TYPES.PAGE && entityId ? (
            <Link href={`/admin/workspace/landing/${entityId}`} className={styles.secondaryButton}>
              Открыть AI-верстку
            </Link>
          ) : null}
          {returnTo ? <Link href={returnTo} className={styles.secondaryButton}>Вернуться к источнику</Link> : null}
        </>
      }
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
