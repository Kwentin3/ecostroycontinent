import { NextResponse } from "next/server";

const FRIENDLY_ERROR_MAP = [
  [/publish blocked by readiness checks/i, "Публикация заблокирована: сначала устраните замечания readiness."],
  [/required owner approval is missing/i, "Перед публикацией требуется approval владельца."],
  [/preview must be renderable before publish/i, "Preview должен быть renderable перед публикацией."],
  [/slug collision blocks publish/i, "Другой опубликованный материал уже владеет этим slug."],
  [/broken references block review submission/i, "Сломанные связи блокируют отправку на review."],
  [/only draft revisions may be submitted for review/i, "На review можно отправить только draft-ревизию."],
  [/only review revisions may be published/i, "Публиковать можно только ревизию в review."],
  [/only review revisions may receive owner actions/i, "Owner action доступен только для ревизии в review."],
  [/rollback target must be a published revision/i, "Rollback доступен только для опубликованной ревизии."],
  [/publish disabled until blocking issues are resolved/i, "Публикация недоступна, пока есть blocking issues."],
  [/only review revisions may be published/i, "Публиковать можно только ревизию в review."]
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

export function redirectWithQuery(request, pathname, query = {}) {
  const url = new URL(pathname, request.url);

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
