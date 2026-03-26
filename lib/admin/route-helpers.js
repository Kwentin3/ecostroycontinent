import { getCurrentUser } from "../auth/session";
import { FEEDBACK_COPY } from "../ui-copy.js";
import { redirectToAdmin } from "./operation-feedback";

export async function requireRouteUser(request) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: redirectToAdmin(`/admin/login?error=${encodeURIComponent(FEEDBACK_COPY.loginRequired)}`)
    };
  }

  return {
    user,
    response: null
  };
}
