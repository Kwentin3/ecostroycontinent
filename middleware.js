import { NextResponse } from "next/server";

import {
  PLACEHOLDER_COOKIE_NAME,
  PLACEHOLDER_QUERY_PARAM,
  isPublicCorePath,
  parsePlaceholderToggle
} from "./lib/public-launch/placeholder-mode.js";

export function middleware(request) {
  if (!isPublicCorePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const queryToggle = parsePlaceholderToggle(request.nextUrl.searchParams.get(PLACEHOLDER_QUERY_PARAM));
  const cookieToggle = parsePlaceholderToggle(request.cookies.get(PLACEHOLDER_COOKIE_NAME)?.value);
  const placeholderMode = queryToggle !== null ? queryToggle : cookieToggle === true;
  const response = NextResponse.next();

  if (queryToggle !== null) {
    if (queryToggle) {
      response.cookies.set(PLACEHOLDER_COOKIE_NAME, "1", {
        path: "/",
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        maxAge: 60 * 60 * 4
      });
    } else {
      response.cookies.delete(PLACEHOLDER_COOKIE_NAME);
    }
  }

  if (placeholderMode) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/", "/services/:path*", "/cases/:path*", "/about", "/contacts"]
};
