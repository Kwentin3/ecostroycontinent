import { getCurrentUser } from "../auth/session";
import { redirectToAdmin } from "./operation-feedback";

export async function requireRouteUser(request) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: redirectToAdmin("/admin/login?error=Login%20required")
    };
  }

  return {
    user,
    response: null
  };
}
