# SEO Dashboard MVP Post-Implementation Audit Report

Дата: 2026-05-04

## Executive Verdict

По коду найдены и исправлены два точечных дефекта:

- analytics event endpoint требовал клиентские `anonymous_id` / `session_id`, хотя должен устойчиво работать без cookies и клиентского идентификатора;
- в UI `/admin/visibility` оставались английские пользовательские labels и raw contract values.

После правок локальные code-safe проверки зелёные: `npm test` и `npm run build` проходят.

## Infra Canon Applied

Перед финальным выводом перечитаны infra-документы:

- `docs/selectel/AGENT_RUNTIME_CONTEXT_Экостройконтинент.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- `.env.example`
- `compose.yaml`

Вывод по инфраструктуре: Windows workspace не является canonical runtime и не должен становиться второй SQL truth. DB-backed proof, включая применение миграций на реальной схеме и проверку auth-dependent admin surface, должен выполняться против canonical Selectel VM / compose stack `app + sql` после deploy или через явно разрешённый server-aligned verification path.

## Checks

1. Migration `008`: файл и build совместимы с текущим repo state; локальная чистая БД не использовалась как доказательный контур после уточнения infra canon. Требуется server-side verification на canonical SQL target.
2. `/admin/visibility`: route присутствует в production build; auth/read-model поведение покрыто тестами. Реальный after-login live proof требует deployed server runtime.
3. Public pages: production build проходит и public routes собираются с `AnalyticsTracker` / `data-analytics-*`.
4. Event endpoint: исправлено. Payload без `anonymous_id` / `session_id` принимается, server генерирует безопасные ids; oversized payload ограничен до parsing/auth lookup.
5. Metadata privacy: form values, token-like поля и arbitrary metadata dump отклоняются тестами.
6. Business aggregates: `is_excluded=true` исключается из business metrics тестом summarizer/read-model.
7. Read model privacy: добавлен тест, что read model не содержит raw event identifiers, user agent, IP, form values или raw events как структурные поля.
8. Lead domain: read model сохраняет `not_ready` / unavailable и не превращает лиды в `0`.
9. Yandex/GSC: source health states остаются Yandex-first; GSC корректно `not_configured` без credentials.
10. Resolver tests: services, cases, about, contacts и unmapped route покрыты.
11. UI language: исправлены английские пользовательские labels в SEO dashboard; добавлен regression test.
12. Git hygiene: до коммита остаются только изменённые audit-fix files и заранее известные `docs/out` deletions.

## Commands And Results

- `npm test -- --test-name-pattern="analytics|visibility|route resolver"`: pass, `442/442`.
- `npm run build`: pass, `/admin/visibility` and `/api/analytics/events` included in Next production route list.
- `npm test`: pass, `442/442`.
- `rg` audit for accidental English dashboard labels: only technical keys remain in code property access, not user-facing labels.

## Fixed Files

- `app/api/analytics/events/route.js`
- `lib/analytics/event-schema.js`
- `components/admin/SeoVisibilityDashboard.js`
- `tests/analytics-event-route.test.js`
- `tests/analytics-event-schema.test.js`
- `tests/analytics-read-model.test.js`
- `tests/admin-visibility-ui.test.js`

## Remaining Server-Dependent Proof

Не закрыто локально намеренно, чтобы не создавать вторую SQL truth:

- apply `008` against canonical SQL target;
- verify `/admin/visibility` after real authorization on deployed runtime;
- live public page smoke after deploy;
- live event endpoint storage against `repo-sql-1`.

Это не code blocker, а server-aligned acceptance step.

