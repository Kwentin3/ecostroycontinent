import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { loadEditorPageData } from "../../../../../../lib/admin/entity-ui";
import { normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { assertEntityType } from "../../../../../../lib/content-core/service";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../../lib/content-core/content-types.js";
import styles from "../../../../../../components/admin/admin-ui.module.css";

export default async function NewEntityPage({ params, searchParams }) {
  const { entityType } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const query = await searchParams;

  if (normalizedType === ENTITY_TYPES.MEDIA_ASSET) {
    const target = new URLSearchParams();
    target.set("compose", "upload");

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
    target.set("compose", "collection-new");

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

  const data = await loadEditorPageData(normalizedType, null);
  const returnTo = normalizeAdminReturnTo(query?.returnTo);

  return (
    <AdminShell
      user={user}
      title={`Новая ${ENTITY_TYPE_LABELS[normalizedType].toLowerCase()}`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: "Новый черновик" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={returnTo ? <Link href={returnTo} className={styles.secondaryButton}>Вернуться к источнику</Link> : null}
    >
      <EntityEditorForm
        entityType={normalizedType}
        entityId={null}
        value={normalizedType === "page" ? { pageType: "about" } : {}}
        currentRevision={null}
        activePublishedRevision={null}
        readiness={null}
        auditItems={[]}
        obligations={[]}
        relationOptions={data.relationOptions}
        mediaOptions={data.mediaOptions}
        caseProjectTypeOptions={data.caseProjectTypeOptions}
        user={user}
        message={query?.message}
        error={query?.error}
      />
    </AdminShell>
  );
}
