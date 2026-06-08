function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getVisibleReviewComment(revision = null) {
  const comment = asText(revision?.reviewComment);

  if (!comment || revision?.state !== "draft") {
    return "";
  }

  return comment;
}
