import { NextResponse } from "next/server.js";

import { getAppConfig } from "../config.js";
import { FEEDBACK_COPY } from "../ui-copy.js";

const FRIENDLY_ERROR_MAP = [
  [/publish blocked by readiness checks/i, "Публикация заблокирована проверкой готовности."],
  [/required owner approval is missing/i, "Не хватает обязательного согласования владельца."],
  [/preview must be renderable before publish/i, "Перед публикацией предпросмотр должен быть доступен."],
  [/slug collision blocks publish/i, "Публикацию блокирует конфликт короткого адреса."],
  [/broken references block review submission/i, "Сломанные связи не позволяют отправить версию на проверку."],
  [/only draft revisions may be submitted for review/i, "Только черновики можно отправлять на проверку."],
  [/only review revisions may be published/i, "Только версии на проверке можно публиковать."],
  [/only review revisions may receive owner actions/i, "Только версии на проверке могут получать решения владельца."],
  [/rollback target must be a published revision/i, "Для отката нужна опубликованная версия этой же сущности."],
  [/invalid credentials/i, FEEDBACK_COPY.invalidCredentials],
  [/logged out/i, FEEDBACK_COPY.loggedOut],
  [/submitted for review/i, FEEDBACK_COPY.reviewSubmitted],
  [/owner action saved/i, FEEDBACK_COPY.ownerActionSaved],
  [/published/i, FEEDBACK_COPY.published],
  [/rollback executed/i, FEEDBACK_COPY.rollbackExecuted],
  [/obligation completed/i, FEEDBACK_COPY.obligationCompleted],
  [/user created/i, FEEDBACK_COPY.userCreated],
  [/user updated/i, FEEDBACK_COPY.userUpdated],
  [/user deleted/i, FEEDBACK_COPY.userDeleted],
  [/duplicate key value violates unique constraint .*app_users_username_key/i, "Пользователь с таким логином уже существует."],
  [/choose a file/i, FEEDBACK_COPY.chooseFile],
  [/media uploaded/i, FEEDBACK_COPY.mediaUploaded],
  [/login required/i, FEEDBACK_COPY.loginRequired],
  [/auth_required/i, FEEDBACK_COPY.loginRequired]
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

  return "Операция не выполнена.";
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
  return NextResponse.redirect(buildAdminRedirectUrl(pathname), 303);
}

export function redirectWithQuery(_request, pathname, query = {}) {
  const url = buildAdminRedirectUrl(pathname);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url, 303);
}

export function redirectWithError(request, pathname, error) {
  return redirectWithQuery(request, pathname, {
    error: toOperatorMessage(error)
  });
}
