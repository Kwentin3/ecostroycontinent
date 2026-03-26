import { loginWithPassword } from "../../../../lib/auth/session";
import { FEEDBACK_COPY } from "../../../../lib/ui-copy.js";
import { redirectToAdmin } from "../../../../lib/admin/operation-feedback";

export async function POST(request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await loginWithPassword(username, password);

  if (!user) {
    return redirectToAdmin(`/admin/login?error=${encodeURIComponent(FEEDBACK_COPY.invalidCredentials)}`);
  }

  return redirectToAdmin("/admin");
}
