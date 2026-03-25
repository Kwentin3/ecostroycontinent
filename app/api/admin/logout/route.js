import { logoutCurrentSession } from "../../../../lib/auth/session";
import { redirectToAdmin } from "../../../../lib/admin/operation-feedback";

export async function POST(request) {
  await logoutCurrentSession();
  return redirectToAdmin("/admin/login?message=Logged%20out");
}
