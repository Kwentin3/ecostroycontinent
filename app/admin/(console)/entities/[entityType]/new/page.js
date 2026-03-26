import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { loadEditorPageData } from "../../../../../../lib/admin/entity-ui";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { assertEntityType } from "../../../../../../lib/content-core/service";
import { ENTITY_TYPE_LABELS } from "../../../../../../lib/content-core/content-types.js";

export default async function NewEntityPage({ params, searchParams }) {
  const { entityType } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const data = await loadEditorPageData(normalizedType, null);
  const query = await searchParams;

  return (
    <AdminShell user={user} title={`Новая ${ENTITY_TYPE_LABELS[normalizedType].toLowerCase()}`}>
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
        user={user}
        message={query?.message}
        error={query?.error}
      />
    </AdminShell>
  );
}
