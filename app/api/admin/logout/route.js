import { logoutCurrentSession } from "../../../../lib/auth/session";
import { FEEDBACK_COPY } from "../../../../lib/ui-copy.js";
import { redirectToAdmin } from "../../../../lib/admin/operation-feedback";

export async function POST(request) {
  await logoutCurrentSession();
  return redirectToAdmin(`/admin/login?message=${encodeURIComponent(FEEDBACK_COPY.loggedOut)}`);
}
