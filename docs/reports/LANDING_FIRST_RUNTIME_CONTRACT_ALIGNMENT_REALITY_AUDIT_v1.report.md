# Landing-First Runtime Contract Alignment Reality Audit v1

Date: 2026-04-08
Audit basis: post-change runtime and test reality

## Fully Aligned Now

- The landing-first runtime has an explicit canonical composition family: `landing`.
- The runtime primary registry/model is now the landing-first block model in `lib/landing-workspace/landing.js`, not the legacy flat section registry.
- Canonical runtime normalization now lands in a landing draft shape first, then projects to the Page-shaped payload only for current compatibility needs.
- Shell regions are now represented separately from ordinary composition blocks and verified separately.
- `pageId` remains the owner anchor throughout the runtime spec/run path.
- `landingDraftId` remains an internal draft/revision handle only.
- Prompt assembly remains pure through `assemblePromptPacket(...)`.
- The LLM boundary remains isolated at `requestStructuredArtifact(...)`.

## Partial But Improved

- One-active-session-per-`pageId` is stronger in reality:
  - a conflicting active session is now detected
  - generation is blocked when a conflict is found
  - the UI reflects that blocked state
- This is not yet a fully serialized global uniqueness guarantee because the current architecture still relies on a read-then-anchor guard rather than a transactional uniqueness lock.
- Review/verification still carries `sections`, but those are now an explicit compatibility alias over canonical `blocks`.

## Legacy By Design

- The Page-shaped payload projection remains because `Page` is still the only owner truth for publishable landing results.
- Legacy fields such as `serviceIds`, `caseIds`, `galleryIds`, and `primaryMediaAssetId` still exist inside the compatibility projection layer.
- Legacy/service-first naming remains in a small compatibility review surface, but it is now explicitly fenced and annotated.

## Is The New Landing-First Registry / Model Truly The Runtime Primary Path?

Yes, with one explicit compatibility caveat.

- The runtime now parses and validates the landing-first draft as the primary candidate/spec shape.
- Canonical block and shell registries drive projection and verification.
- The remaining Page-shaped payload is a downstream compatibility projection, not the primary semantic model.

## Is One Active Session Per `pageId` Stronger In Reality?

Yes.

- The runtime no longer casually permits another active session to attach to the same `pageId`.
- The guard is practical and user-visible.
- The remaining limitation is honest:
  - without a transactional uniqueness constraint or lock, a narrow race window still exists under simultaneous competing writes

## Next Smallest Safe Step

- Add a transactional compare-and-set or equivalent persistence-level uniqueness guard for active landing workspace anchors by `pageId`.
- Keep that step narrow:
  - no new memory platform
  - no publish redesign
  - no broader workspace architecture cycle
