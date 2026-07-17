import { AdminShell } from "../../../../components/admin/AdminShell";
import { RemovalSweepWorkspace } from "../../../../components/admin/RemovalSweepWorkspace";
import { requireRemovalSweepUser } from "../../../../lib/admin/page-helpers.js";
import { listRemovalSweepComponents } from "../../../../lib/admin/removal-sweep-analysis.js";
import { getRemovalSweepHref } from "../../../../lib/admin/removal-quarantine.js";
import { listRecentDestructiveEvents } from "../../../../lib/content-ops/destructive-forensics.js";
import { normalizeLegacyCopy } from "../../../../lib/ui-copy.js";
import { userCanEditContent, userCanExecuteRemovalSweep } from "../../../../lib/auth/roles.js";

export default async function RemovalSweepPage({ searchParams }) {
  const user = await requireRemovalSweepUser();
  const query = await searchParams;
  const [components, recentEvents] = await Promise.all([
    listRemovalSweepComponents(),
    listRecentDestructiveEvents({
      limit: 12,
      operationKind: "removal_sweep"
    })
  ]);

  return (
    <AdminShell
      user={user}
      title="Центр очистки"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Очистка" }
      ]}
      activeHref={getRemovalSweepHref()}
    >
      <RemovalSweepWorkspace
        initialComponents={components}
        initialEvents={recentEvents}
        canExecuteRemovalSweep={userCanExecuteRemovalSweep(user)}
        canOpenEntityDetails={userCanEditContent(user)}
        initialMessage={normalizeLegacyCopy(query?.message || "")}
        initialError={normalizeLegacyCopy(query?.error || "")}
      />
    </AdminShell>
  );
}
