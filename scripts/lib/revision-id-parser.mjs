const DIRECT_PATTERNS = [
  /\/api\/admin\/revisions\/(rev_[a-z0-9-]+)\/submit/i,
  /\/admin\/revisions\/(rev_[a-z0-9-]+)\/publish/i,
  /\/admin\/review\/(rev_[a-z0-9-]+)/i
];

function unique(items) {
  return [...new Set(items)];
}

export function parseRevisionIdFromEditorHtml(html) {
  if (typeof html !== "string" || html.length === 0) {
    return null;
  }

  for (const pattern of DIRECT_PATTERNS) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  const allMatches = unique(
    [...html.matchAll(/rev_[a-z0-9-]+/gi)]
      .map((match) => match[0]?.toLowerCase())
      .filter(Boolean)
  );

  if (allMatches.length === 1) {
    return allMatches[0];
  }

  return null;
}

export async function lookupLatestRevisionId({
  baseUrl,
  cookie = "",
  entityType,
  entityId,
  requestImpl = fetch
}) {
  if (!baseUrl || !entityType || !entityId) {
    return null;
  }

  const lookupUrl = new URL(`/api/admin/entities/${entityType}/lookup`, baseUrl);
  lookupUrl.searchParams.set("entityId", entityId);

  const response = await requestImpl(lookupUrl, {
    method: "GET",
    headers: cookie ? { cookie } : undefined,
    redirect: "follow"
  });

  if (!response.ok) {
    return null;
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (!payload?.ok || !payload?.matched) {
    return null;
  }

  const revisionId = payload?.latestRevision?.id;
  return typeof revisionId === "string" && revisionId.length > 0 ? revisionId : null;
}
