const INTERNAL_TRAFFIC_COOKIE = "esc_internal_traffic";
const INTERNAL_TRAFFIC_COOKIE_VALUE = "1";
const INTERNAL_TRAFFIC_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

function parseCookieHeader(request) {
  const header = request?.headers?.get?.("cookie") || "";

  return header.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    const key = rawKey?.trim();

    if (key) {
      cookies[key] = decodeURIComponent(rawValue.join("=") || "");
    }

    return cookies;
  }, {});
}

export function hasInternalTrafficMarker(request) {
  if (request?.cookies?.get) {
    return request.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value === INTERNAL_TRAFFIC_COOKIE_VALUE;
  }

  return parseCookieHeader(request)[INTERNAL_TRAFFIC_COOKIE] === INTERNAL_TRAFFIC_COOKIE_VALUE;
}

export function resolveInternalTraffic({ request = null, user = null } = {}) {
  return Boolean(hasInternalTrafficMarker(request) || user?.id || user?.role);
}

export function resolveTestTraffic({ request = null, payload = {} } = {}) {
  const header = request?.headers?.get?.("x-telemetry-test") || "";
  const normalizedHeader = header.trim().toLowerCase();

  return Boolean(
    payload?.is_test === true
    || ["1", "true", "yes", "on"].includes(normalizedHeader)
  );
}

export function setInternalTrafficMarkerOnCookieStore(cookieStore) {
  if (!cookieStore?.set) {
    return;
  }

  cookieStore.set(INTERNAL_TRAFFIC_COOKIE, INTERNAL_TRAFFIC_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INTERNAL_TRAFFIC_MAX_AGE_SECONDS,
    path: "/"
  });
}

export function setInternalTrafficMarkerOnResponse(response) {
  if (!response?.cookies?.set) {
    return response;
  }

  response.cookies.set(INTERNAL_TRAFFIC_COOKIE, INTERNAL_TRAFFIC_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INTERNAL_TRAFFIC_MAX_AGE_SECONDS,
    path: "/"
  });

  return response;
}

export const INTERNAL_TRAFFIC_COOKIE_NAME = INTERNAL_TRAFFIC_COOKIE;
