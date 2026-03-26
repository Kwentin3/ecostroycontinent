# Media Storage Operations Spec Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: media / storage spec  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md](./Admin_Agent_Ops_Domain_Model_Экостройконтинент_v0.1.md), [Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md](./Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md), [03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md](./03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md)

## Purpose

Этот документ фиксирует MediaAsset / Gallery как безопасный operational contour. Цель - управлять медиа как доменной сущностью, а не как raw bucket browsing, и держать binary truth отдельно от metadata truth.

## Scope

- MediaAsset lifecycle and metadata;
- Gallery semantics and ordering;
- upload slot and finalize flow;
- attach / detach / reorder;
- archive / quarantine posture;
- integrity and orphan detection;
- SQL / S3 / CDN boundary.

## What this document owns

- MediaAsset lifecycle;
- Gallery semantics;
- upload / finalize flow;
- attach / detach / reorder semantics;
- integrity and orphan detection;
- archive / quarantine posture;
- storage and CDN boundary.

## What this document does not own

- page content schema;
- publish workflow for text/content entities;
- CDN vendor selection;
- general DAM platform design;
- visual gallery presentation design.

## Canon assumptions

- `MediaAsset` is first-class.
- Metadata truth lives in SQL.
- Binary truth lives in S3-compatible storage.
- Public delivery goes through CDN.
- Asset reuse is normal.
- Raw CDN URL is a delivery output, not the source of truth.

## Non-goals

- anonymous file dump;
- bucket browser UI;
- raw delete-by-default workflow;
- enterprise DAM feature set;
- asset transformation pipeline sprawl;
- media as free-floating unowned blobs.

## Media asset model

Minimum logical fields:

- asset id;
- asset type;
- storage key;
- mime type;
- original filename;
- size;
- status;
- title;
- alt;
- caption;
- ownership note;
- source note;
- uploaded by / uploaded at;
- optional checksum or integrity hint.

## Gallery model

Gallery is a lightweight ordered grouping of assets.

Minimum logical fields:

- gallery id;
- title;
- ordered asset refs;
- primary asset ref;
- caption;
- status;
- locale if relevant.

Gallery is not a semi-DAM album subsystem. It is only an ordered reusable grouping that helps cases and page blocks.

## Media lifecycle

Recommended posture:

`upload_pending -> uploaded_pending_finalize -> ready -> attached`

Safety paths:

- `archived`
- `quarantined`
- `missing_binary`

### Upload slot

1. Admin or agent requests an upload slot.
2. System returns a presigned upload target or equivalent bounded upload contract.
3. Client uploads binary to object storage.
4. System does not treat the asset as public-ready yet.

### Finalize

Finalize must verify:

- the object exists;
- the object matches the expected metadata shape;
- optional checksum or size expectations are satisfied if provided;
- the asset can be safely represented as SQL truth.

If finalize fails, the asset should not silently become public-ready.

## Attach / detach semantics

- attach links an asset to a content entity or gallery through a relation row;
- detach removes the relation but does not destroy the binary by default;
- one asset may be reused across many entities;
- relation roles should stay narrow, such as `primary`, `cover`, `gallery`, `inline`, `hero`.

## Reorder semantics

- gallery ordering is explicit;
- reorder must be auditable;
- reorder is a metadata action, not a binary mutation.

## Archive / quarantine posture

Preferred default:

- detach first when a public reference should be removed;
- archive when the asset is no longer meant to be active but may still need retention;
- quarantine when the asset is suspect, broken, policy-sensitive or integrity-violating;
- hard delete should not be the default MVP action.

Hard delete, if ever introduced, must be a named allowlisted maintenance action with dry-run and explicit confirmation.

## Integrity checks

Required checks:

- missing binary detection;
- orphan asset detection;
- orphan binary detection if storage inventory is available;
- invalid MIME / extension mismatch when available;
- gallery membership consistency;
- public asset readiness versus entity publish readiness;
- reference existence and permission checks.

Diagnostics should show:

- what is missing;
- what is affected;
- whether publish is blocked;
- the safest next action.

## Storage and CDN boundary

| Layer | Responsibility | Not responsible for |
| --- | --- | --- |
| SQL | metadata truth, relations, status, ownership notes | binary storage |
| S3-compatible storage | binary objects | canonical metadata |
| CDN | public delivery | editorial truth |

Implementation may use a local adapter in non-production or transitional environments, but the contract must remain storage-backend-agnostic and S3-compatible in behavior.

## Allowed storage operations

- presign upload slot;
- confirm / finalize uploaded object;
- probe object existence;
- archive object;
- quarantine object;
- list integrity mismatches through diagnostic wrappers.

See [DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md](./DB_and_Storage_Allowlist_Appendix_Экостройконтинент_v0.1.md) for the explicit allowed / forbidden matrix.

## Forbidden storage operations in MVP

- raw bucket browsing;
- unrestricted delete;
- unrestricted overwrite without revalidation;
- public read-side treating CDN URL as canonical truth;
- agent-driven destructive cleanup without allowlist and explicit confirmation.

## Risks / failure modes

- upload and finalize collapse into one unsafe step;
- CDN URL becomes the canonical ID;
- media metadata and object truth diverge;
- orphaned binaries are never detected;
- hard delete is used where archive/quarantine would be safer;
- the current implementation adapter drifts from the S3-compatible contract instead of matching it.

## Open questions

- Which checksum / integrity fields are worth standardizing in MVP?
- Should binary replacement create a new asset record or a new binary version on the same logical asset?
- Which media states must be visible in the admin UI, and which can remain diagnostic-only?
- Which archive/quarantine retention rules should be fixed before launch?

## Decisions that must not be reopened by default

- Binaries live in object storage, not SQL.
- Metadata truth lives in SQL, not in the bucket.
- Public delivery goes through CDN.
- No raw unrestricted object-storage access for the agent.
- Hard delete is not the default posture.
