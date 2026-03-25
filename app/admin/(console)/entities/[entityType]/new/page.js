import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { EntityEditorForm } from "../../../../../../components/admin/EntityEditorForm";
import { loadEditorPageData } from "../../../../../../lib/admin/entity-ui";
import { requireEditorUser } from "../../../../../../lib/admin/page-helpers";
import { assertEntityType } from "../../../../../../lib/content-core/service";

export default async function NewEntityPage({ params }) {
  const { entityType } = await params;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);
  const data = await loadEditorPageData(normalizedType, null);

  return (
    <AdminShell user={user} title={`New ${normalizedType}`}>
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
      />
    </AdminShell>
  );
}
