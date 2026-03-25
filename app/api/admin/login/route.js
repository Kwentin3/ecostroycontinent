import { NextResponse } from "next/server";

import { loginWithPassword } from "../../../../lib/auth/session";

export async function POST(request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await loginWithPassword(username, password);

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login?error=Invalid%20credentials", request.url));
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
