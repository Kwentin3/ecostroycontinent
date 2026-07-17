import test from "node:test";
import assert from "node:assert/strict";

import {
  getReferenceReadinessSeverity,
  isBlockingReferenceReadinessCode,
  isInvalidReferenceReadinessCode,
  isReferenceReadinessCode,
  isUnpublishedReferenceReadinessCode,
  makeReferenceReadinessResult
} from "../lib/content-ops/reference-readiness-contract.js";

test("reference readiness contract blocks broken refs and warns on unpublished refs", () => {
  assert.equal(isInvalidReferenceReadinessCode("invalid_gallery_refs"), true);
  assert.equal(isUnpublishedReferenceReadinessCode("unpublished_gallery_refs"), true);
  assert.equal(isReferenceReadinessCode("unpublished_gallery_refs"), true);
  assert.equal(isBlockingReferenceReadinessCode("invalid_gallery_refs"), true);
  assert.equal(isBlockingReferenceReadinessCode("unpublished_gallery_refs"), false);
  assert.equal(getReferenceReadinessSeverity("invalid_gallery_refs"), "blocking");
  assert.equal(getReferenceReadinessSeverity("unpublished_gallery_refs"), "warning");

  assert.deepEqual(
    makeReferenceReadinessResult({
      code: "unpublished_primary_media_ref",
      message: "Primary media is unpublished.",
      field: "primaryMediaAssetId"
    }),
    {
      severity: "warning",
      code: "unpublished_primary_media_ref",
      message: "Primary media is unpublished.",
      field: "primaryMediaAssetId"
    }
  );
});
