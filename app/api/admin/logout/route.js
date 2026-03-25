import { NextResponse } from "next/server";

import { logoutCurrentSession } from "../../../../lib/auth/session";

export async function POST(request) {
  await logoutCurrentSession();
  return NextResponse.redirect(new URL("/admin/login?message=Logged%20out", request.url));
}
