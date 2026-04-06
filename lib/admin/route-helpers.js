import { NextResponse } from "next/server.js";

import { getCurrentUser } from "../auth/session.js";
import { FEEDBACK_COPY } from "../ui-copy.js";
import { redirectToAdmin } from "./operation-feedback.js";
import { userIsSuperadmin } from "../auth/roles.js";

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

export async function requireRouteSuperadmin(request) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: "AUTH_REQUIRED", message: FEEDBACK_COPY.loginRequired },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, nofollow"
          }
        }
      )
    };
  }

  if (!userIsSuperadmin(user)) {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: "FORBIDDEN", message: "Недостаточно прав для диагностики LLM." },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, nofollow"
          }
        }
      )
    };
  }

  return {
    user,
    response: null
  };
}
