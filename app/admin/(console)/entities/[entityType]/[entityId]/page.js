import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { deriveEditorValue, loadEditorPageData } from "../../../../../../lib/admin/entity-ui";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { assertEntityType } from "../../../../../../lib/content-core/service";
import { ENTITY_TYPE_LABELS } from "../../../../../../lib/content-core/content-types.js";

export default async function EntityEditorPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const query = await searchParams;
  const data = await loadEditorPageData(normalizedType, entityId);

  if (!data.state?.entity) {
    notFound();
  }

  return (
    <AdminShell user={user} title={`${ENTITY_TYPE_LABELS[normalizedType]} — редактор`}>
      <EntityEditorForm
        entityType={normalizedType}
        entityId={entityId}
        value={deriveEditorValue(normalizedType, data.currentRevision || data.state.activePublishedRevision)}
        currentRevision={data.currentRevision}
        activePublishedRevision={data.state.activePublishedRevision}
        readiness={data.readiness}
        auditItems={data.auditItems}
        obligations={data.obligations}
        relationOptions={data.relationOptions}
        mediaOptions={data.mediaOptions}
        user={user}
        message={query?.message}
        error={query?.error}
      />
    </AdminShell>
  );
}
