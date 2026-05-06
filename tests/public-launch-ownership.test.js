import test from "node:test";
import assert from "node:assert/strict";

import { PAGE_TYPES } from "../lib/content-core/content-types.js";
import {
  assertPageTypeAllowedForLaunchOwnership,
  isStrictPageOwnershipLaunchMode
} from "../lib/public-launch/ownership.js";

test("strict page ownership mode defaults to off in NODE_ENV=test when flag is unset", () => {
  const previous = process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  delete process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP;

  try {
    assert.equal(isStrictPageOwnershipLaunchMode(), false);
  } finally {
    if (previous === undefined) {
      delete process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP;
    } else {
      process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP = previous;
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test("strict page ownership mode can be forced on via env flag", () => {
  const previous = process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP;
  process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP = "1";

  try {
    assert.equal(isStrictPageOwnershipLaunchMode(), true);
  } finally {
    if (previous === undefined) {
      delete process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP;
    } else {
      process.env.PUBLIC_LAUNCH_STRICT_PAGE_OWNERSHIP = previous;
    }
  }
});

test("launch ownership guard blocks new legacy page types in strict mode", () => {
  assert.throws(
    () => assertPageTypeAllowedForLaunchOwnership({
      strictMode: true,
      nextPageType: PAGE_TYPES.SERVICE_LANDING,
      previousPageType: ""
    }),
    /legacy pageType/i
  );
});

test("launch ownership guard allows updates when legacy page type stays unchanged", () => {
  assert.doesNotThrow(() => assertPageTypeAllowedForLaunchOwnership({
    strictMode: true,
    nextPageType: PAGE_TYPES.SERVICE_LANDING,
    previousPageType: PAGE_TYPES.SERVICE_LANDING
  }));
});
