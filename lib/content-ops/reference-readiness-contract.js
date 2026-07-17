const INVALID_REFERENCE_CODE_PATTERN = /^invalid_/;
const UNPUBLISHED_REFERENCE_CODE_PATTERN = /^unpublished_/;

export function isInvalidReferenceReadinessCode(code) {
  return typeof code === "string" && INVALID_REFERENCE_CODE_PATTERN.test(code);
}

export function isUnpublishedReferenceReadinessCode(code) {
  return typeof code === "string" && UNPUBLISHED_REFERENCE_CODE_PATTERN.test(code);
}

export function isReferenceReadinessCode(code) {
  return isInvalidReferenceReadinessCode(code) || isUnpublishedReferenceReadinessCode(code);
}

export function getReferenceReadinessSeverity(code) {
  return isUnpublishedReferenceReadinessCode(code) ? "warning" : "blocking";
}

export function isBlockingReferenceReadinessCode(code) {
  return isReferenceReadinessCode(code) && getReferenceReadinessSeverity(code) === "blocking";
}

export function makeReferenceReadinessResult({ code, message, field = null }) {
  return {
    severity: getReferenceReadinessSeverity(code),
    code,
    message,
    field
  };
}
