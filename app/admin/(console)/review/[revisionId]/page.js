import { redirect } from "next/navigation";

function buildReviewRedirectUrl(revisionId, query = {}) {
  const params = new URLSearchParams();

  params.set("selected", revisionId);

  if (typeof query.preview === "string" && query.preview.length > 0) {
    params.set("preview", query.preview);
  }

  if (typeof query.message === "string" && query.message.length > 0) {
    params.set("message", query.message);
  }

  if (typeof query.error === "string" && query.error.length > 0) {
    params.set("error", query.error);
  }

  if (typeof query.q === "string" && query.q.length > 0) {
    params.set("q", query.q);
  }

  if (typeof query.status === "string" && query.status.length > 0) {
    params.set("status", query.status);
  }

  if (typeof query.type === "string" && query.type.length > 0) {
    params.set("type", query.type);
  }

  return `/admin/review?${params.toString()}`;
}

export default async function ReviewDetailRedirectPage({ params, searchParams }) {
  const { revisionId } = await params;
  const query = await searchParams;

  redirect(buildReviewRedirectUrl(revisionId, query));
}
