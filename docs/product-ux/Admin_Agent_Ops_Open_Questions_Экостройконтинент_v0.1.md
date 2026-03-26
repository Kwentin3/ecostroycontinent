# Admin Agent Ops Open Questions Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: owner confirmations / blocker register  
Основание: [PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md](./PRD_Admin_Agent_Ops_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md), [04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md](./04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md), [Owner_Confirmation_Pack_Экостройконтинент_v0.1.md](./Owner_Confirmation_Pack_Экостройконтинент_v0.1.md)

## Purpose

Этот документ собирает только те вопросы, которые действительно блокируют безопасную реализацию admin + agent ops слоя. Он не повторяет весь canon; он фиксирует то, что ещё должен подтвердить owner или team decision.

## Scope

- owner confirmations that block launch;
- implementation questions that affect safety posture;
- what can be built before confirmations;
- what must not ship before confirmations;
- explicit stop triggers and safe defaults.

## What this document owns

- blocker questions;
- safe default until confirmation;
- what can proceed before answers;
- what must not ship before answers;
- explicit stop triggers.

## What this document does not own

- content strategy;
- full product roadmap;
- UI style;
- implementation code;
- infra procurement.

## Canon assumptions

- Existing canon wins.
- Human review remains explicit.
- The agent may assist, but it may not become an autonomous owner of truth.
- No raw unrestricted DB or storage access by default.

## Non-goals

- reopening phase-1 strategy;
- expanding scope to future surfaces;
- re-litigating already accepted read-side/write-side boundaries.

## Owner confirmations that still block launch

| Question | Why it matters | Blocks | Safe default until answered |
| --- | --- | --- | --- |
| Public brand name on site | public truth and schema truth | about / home / contacts wording | use the recommended brand name from current canon only in drafts |
| Primary phone / messenger set / optional email | contacts page and CTA truth | contacts publish and contact blocks | keep contacts draft-only |
| Primary region / service area wording | local SEO and claim discipline | services, contacts, global settings | keep region wording narrow and unpromoted |
| Final launch service core | determines what is worth publishing first | service page publish order | keep the narrow proof-led core only |
| Guest-house and commercial scope | avoids false scope expansion | service pages and case mapping | exclude unless real proof is confirmed |
| Priority cases and flagship case | owner review map and evidence collection | case publish order | draft only, no launch claim |
| Price / срок / guarantee wording | claims discipline | launch-critical copy | avoid hard claims |
| Dedicated owner-truth editing surface or review-only | permissions and UX design | RBAC and UI scope | review-only by default |

## Implementation questions that affect safety

| Question | Why it matters | Safe default |
| --- | --- | --- |
| Which named maintenance actions are allowed in MVP? | determines how much power the agent and Superadmin wrappers actually have | keep maintenance minimal and allowlisted |
| Should the agent ever act from Business Owner context? | prevents hidden authority creep | no, unless only for review packet preparation |
| Which DB wrapper views are read-only enough for SEO Manager? | prevents raw-data creep | diagnostics-only, allowlisted views only |
| Which storage actions are allowed beyond upload/finalize? | prevents destructive storage paths | archive/quarantine only |
| Is the storage backend already S3-compatible in production? | affects implementation path and migration risk | use an abstraction even if a local adapter exists in dev |

## What can be done before confirmations

- finalize the contract docs themselves;
- implement or refactor workflow and RBAC safety;
- implement audit and forensic logging;
- implement diagnostics taxonomy and read-only checks;
- implement media upload/finalize contract with safe defaults;
- prepare draft content and review packets without publishing;
- collect proof packs and media inventory;
- build the admin UI skeleton.

The current runtime / target-state delta may also be worked through in parallel, but only as migration hardening, not as a canon rewrite. See [Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md](./Current_Runtime_vs_Target_State_Appendix_Экостройконтинент_v0.1.md).

## What must not ship before confirmations

- contacts page publish;
- claims-heavy launch pages with unresolved wording;
- guest-house or commercial launch scope unless real proof exists;
- any agent path that can publish or approve owner-required content;
- any raw SQL or raw storage access path;
- any hard-delete-by-default media path;
- any launch decision that depends on missing evidence.

## Explicit stop triggers

Stop and escalate if any of the following happens:

- a design path makes the agent an autonomous publisher;
- the agent gets unrestricted DB or S3 power;
- owner review is made optional for claims-heavy or launch-critical pages;
- the scope expands into public AI chat, calculator, SEO dashboard, CRM-lite or EN rollout;
- the implementation plan assumes evidence that is not actually available;
- a contradiction appears between contract docs and current implementation.

## Risks / failure modes

- unresolved owner truth gets buried under implementation work;
- the team confuses `draftable` with `publishable`;
- missing media is treated as a UI problem instead of an evidence gap;
- agent convenience silently outranks safety posture;
- a temporary implementation shortcut becomes a new de facto canon.

## Decisions that must not be reopened by default

- no public AI chat in this package;
- no calculator in this package;
- no SEO dashboard in this package;
- no EN rollout in this package;
- no multi-region launch in this package;
- no raw unrestricted DB or storage access for the agent;
- no autonomous publish by the agent;
- no hidden owner bypass.
