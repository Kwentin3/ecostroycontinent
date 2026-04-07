# LANDING_FIRST_DOMAIN_REBASE_V1

## What the new primary target is

The primary AI workspace target is now the landing / one-page composition workspace.

Service pages under `/services/[slug]` remain route-owning SEO surfaces and adjacent reuse inputs, but they are no longer the primary AI workspace target for this domain.

## Which docs were updated

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/reports/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_V1.report.md`

## What was added

The new landing-first canonical contract pack is now present in `docs/engineering/`:

- `LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1.md`
- `LANDING_COMPOSITION_RENDER_CONTRACT_v1.md`
- `LANDING_COMPOSITION_VERIFICATION_CONTRACT_v1.md`
- `LANDING_COMPOSITION_PUBLISH_ARTIFACT_CONTRACT_v1.md`
- `LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`

This pass also made the owner truth explicit: every publishable landing draft resolves to exactly one `Page` owner, and header/footer are fixed shell regions rather than ordinary composition blocks.

## What stayed

- Content Core remains canonical truth.
- Admin remains write-side.
- Public Web remains read-side only.
- Memory Card remains session-scoped working state.
- Publish remains explicit and human-controlled.

## What was superseded or narrowed

- The service-first landing factory is no longer the primary workspace target.
- Service-mode docs remain valid as adjacent / historical documentation for route-owning service-page truth and comparison.
- The screen plan now points to a landing workspace route family under `/admin/workspace/landing`.

## What future agents should follow first

1. `LANDING_COMPOSITION_*` contract pack
2. reworked `PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
3. reworked `LANDING_FACTORY_DOMAIN_MAP_v1.md`
4. reworked `AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
5. reworked `AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`

## What remains intentionally deferred

- service-mode route-specific implementation details, unless explicitly working on adjacent service-page SEO truth
- broader CMS / page-builder scope
- long-term memory / memory platform design

## Next smallest safe step

Implement the dedicated landing workspace screen and route family from the landing-first plan, reusing the current backend and Memory Card seams rather than rebuilding them.
