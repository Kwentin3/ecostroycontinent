import { NextResponse } from "next/server.js";

import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { getEntityEditorState, listEntityCards } from "../../../../../../lib/content-core/service.js";

function buildMatcher(request) {
  const url = new URL(request.url);

  return {
    entityId: String(url.searchParams.get("entityId") ?? "").trim(),
    slug: String(url.searchParams.get("slug") ?? "").trim(),
    pageType: String(url.searchParams.get("pageType") ?? "").trim()
  };
}

function summarizeRevision(revision) {
  if (!revision) {
    return null;
  }

  return {
    id: revision.id,
    revisionNumber: revision.revisionNumber,
    state: revision.state,
    payload: revision.payload,
    updatedAt: revision.updatedAt ?? revision.updated_at ?? null,
    publishedAt: revision.publishedAt ?? revision.published_at ?? null
  };
}

function summarizeAggregate(aggregate) {
  const latestRevision = (aggregate?.revisions ?? [])[0] ?? null;

  return {
    entity: aggregate?.entity ?? null,
    latestRevision: summarizeRevision(latestRevision),
    activePublishedRevision: summarizeRevision(aggregate?.activePublishedRevision ?? null)
  };
}

function summarizeCandidate(card) {
  return {
    entityId: card?.entity?.id ?? null,
    slug: card?.latestRevision?.payload?.slug ?? "",
    pageType: card?.latestRevision?.payload?.pageType ?? "",
    title: card?.latestRevision?.payload?.title ?? ""
  };
}

export async function GET(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    getEntityEditorState,
    listEntityCards,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return NextResponse.json({
      ok: false,
      error: "FORBIDDEN",
      message: "Недостаточно прав для поиска сущностей."
    }, { status: 403 });
  }

  const { entityType } = await params;

  if (!Object.values(ENTITY_TYPES).includes(entityType)) {
    return NextResponse.json({
      ok: false,
      error: "UNSUPPORTED_ENTITY_TYPE",
      message: "Неподдерживаемый тип сущности."
    }, { status: 400 });
  }

  const matcher = buildMatcher(request);

  if (!matcher.entityId && !matcher.slug && !matcher.pageType) {
    return NextResponse.json({
      ok: false,
      error: "MATCHER_REQUIRED",
      message: "Укажите хотя бы один matcher: entityId, slug или pageType."
    }, { status: 400 });
  }

  if (matcher.pageType && entityType !== ENTITY_TYPES.PAGE) {
    return NextResponse.json({
      ok: false,
      error: "PAGE_TYPE_MATCHER_UNSUPPORTED",
      message: "Matcher pageType доступен только для сущности page."
    }, { status: 400 });
  }

  if (matcher.entityId) {
    const aggregate = await routeDeps.getEntityEditorState(matcher.entityId);

    if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
      return NextResponse.json({
        ok: true,
        matched: false,
        matcher
      });
    }

    return NextResponse.json({
      ok: true,
      matched: true,
      matcher,
      ...summarizeAggregate(aggregate)
    });
  }

  const cards = await routeDeps.listEntityCards(entityType);
  const matches = cards.filter((card) => {
    const payload = card?.latestRevision?.payload ?? {};

    if (matcher.slug && payload.slug !== matcher.slug) {
      return false;
    }

    if (matcher.pageType && payload.pageType !== matcher.pageType) {
      return false;
    }

    return true;
  });

  if (matches.length === 0) {
    return NextResponse.json({
      ok: true,
      matched: false,
      matcher
    });
  }

  if (matches.length > 1) {
    return NextResponse.json({
      ok: false,
      error: "AMBIGUOUS_ENTITY_MATCH",
      message: "Найдено несколько сущностей по этому matcher.",
      matcher,
      candidates: matches.map(summarizeCandidate)
    }, { status: 409 });
  }

  const aggregate = await routeDeps.getEntityEditorState(matches[0].entity.id);

  return NextResponse.json({
    ok: true,
    matched: true,
    matcher,
    ...summarizeAggregate(aggregate)
  });
}
