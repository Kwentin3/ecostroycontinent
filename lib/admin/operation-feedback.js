import { NextResponse } from "next/server";

import { getAppConfig } from "../config";

const FRIENDLY_ERROR_MAP = [
  [/publish blocked by readiness checks/i, "РџСѓР±Р»РёРєР°С†РёСЏ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅР°: СЃРЅР°С‡Р°Р»Р° СѓСЃС‚СЂР°РЅРёС‚Рµ Р·Р°РјРµС‡Р°РЅРёСЏ readiness."],
  [/required owner approval is missing/i, "РџРµСЂРµРґ РїСѓР±Р»РёРєР°С†РёРµР№ С‚СЂРµР±СѓРµС‚СЃСЏ approval РІР»Р°РґРµР»СЊС†Р°."],
  [/preview must be renderable before publish/i, "Preview РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ renderable РїРµСЂРµРґ РїСѓР±Р»РёРєР°С†РёРµР№."],
  [/slug collision blocks publish/i, "Р”СЂСѓРіРѕР№ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Р№ РјР°С‚РµСЂРёР°Р» СѓР¶Рµ РІР»Р°РґРµРµС‚ СЌС‚РёРј slug."],
  [/broken references block review submission/i, "РЎР»РѕРјР°РЅРЅС‹Рµ СЃРІСЏР·Рё Р±Р»РѕРєРёСЂСѓСЋС‚ РѕС‚РїСЂР°РІРєСѓ РЅР° review."],
  [/only draft revisions may be submitted for review/i, "РќР° review РјРѕР¶РЅРѕ РѕС‚РїСЂР°РІРёС‚СЊ С‚РѕР»СЊРєРѕ draft-СЂРµРІРёР·РёСЋ."],
  [/only review revisions may be published/i, "РџСѓР±Р»РёРєРѕРІР°С‚СЊ РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ СЂРµРІРёР·РёСЋ РІ review."],
  [/only review revisions may receive owner actions/i, "Owner action РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РґР»СЏ СЂРµРІРРРёР·РёРё РІ review."],
  [/rollback target must be a published revision/i, "Rollback РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РґР»СЏ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅРѕР№ СЂРµРІРРёР·РёРё."],
  [/publish disabled until blocking issues are resolved/i, "РџСѓР±Р»РёРєР°С†РёСЏ РЅРµРґРѕСЃС‚СѓРїРЅР°, РїРѕРєР° РµСЃС‚СЊ blocking issues."],
  [/only review revisions may be published/i, "РџСѓР±Р»РёРєРѕРІР°С‚СЊ РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ СЂРµРІРРёР·РёСЋ РІ review."]
];

export function toOperatorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  for (const [pattern, message] of FRIENDLY_ERROR_MAP) {
    if (pattern.test(raw)) {
      return message;
    }
  }

  if (raw) {
    return raw;
  }

  return "РћРїРµСЂР°С†РёСЏ РЅРµ РІС‹РїРѕР»РЅРµРЅР°.";
}

function sanitizeAdminPath(pathname) {
  if (typeof pathname !== "string") {
    return "/admin";
  }

  const trimmed = pathname.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/admin";
  }

  return trimmed;
}

export function buildAdminRedirectUrl(pathname) {
  const { appBaseUrl } = getAppConfig();
  return new URL(sanitizeAdminPath(pathname), appBaseUrl);
}

export function redirectToAdmin(pathname) {
  return NextResponse.redirect(buildAdminRedirectUrl(pathname));
}

export function redirectWithQuery(_request, pathname, query = {}) {
  const url = buildAdminRedirectUrl(pathname);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url);
}

export function redirectWithError(request, pathname, error) {
  return redirectWithQuery(request, pathname, {
    error: toOperatorMessage(error)
  });
}
