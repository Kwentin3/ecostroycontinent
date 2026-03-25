import { requireAdminUser } from "../../../lib/admin/page-helpers";

export default async function AdminConsoleLayout({ children }) {
  await requireAdminUser();
  return children;
}
