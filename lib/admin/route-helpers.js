import { NextResponse } from "next/server";

import { getCurrentUser } from "../auth/session";

export async function requireRouteUser(request) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.redirect(new URL("/admin/login?error=Login%20required", request.url))
    };
  }

  return {
    user,
    response: null
  };
}
