# Decisions, Blockers, and Next Steps

## Purpose

Этот документ показывает текущее фактическое состояние launch readiness и фиксирует рабочие решения/блокеры после аудита.

## Canonical truths

- Главный bottleneck: execution readiness, а не стратегия и не новый PRD.
- Канон достаточно собран; основной риск — drift в реализации и публикация слабых страниц.
- Launch-core должен оставаться узким, proof-led и честным по contact/region/conversion truth.

## Open owner decisions

- Подтвердить финальный primary launch region / service area wording.
- Подтвердить единый public contact set (phone/messenger/email).
- Подтвердить финальный service launch list (surviving pages only).
- Подтвердить claim boundaries по ценам/срокам/гарантиям.
- Подтвердить flagship case shortlist для первой публикации.

## Current blockers (from launch-readiness audit)

- Нет published service/case launch-core.
- `/about` и `/contacts` не в published контуре.
- `/blog` route и `Article` слой не готовы как рабочий supporting contour.
- Contact truth не подтверждён до launch gate.
- Недостаточен proof inventory (кейсы/медиа/фактура).
- Technical SEO baseline неполный (`robots`, `sitemap`, canonical/meta/schema projection).
- Навигация не закреплена как системная часть launch architecture.
- Conversion path неполный на ключевых surface-ах.

## What is missing before launch

- минимум 2-3 publish-ready service pages с proof paths
- минимум 2 publish-ready case pages с factual minimum
- published `/about` и `/contacts`
- подтверждённый contact/region truth
- минимально рабочая global navigation system
- базовый technical SEO delivery layer
- production queue только из surviving pages

## Next practical steps

1. Закрыть owner confirmations по region/contact/claim boundaries.
2. Собрать и подтвердить proof packs для service/case candidates.
3. Отфильтровать launch list до реально surviving pages.
4. Довести до publish-ready home/services/cases/about/contacts core.
5. Закрыть launch technical SEO baseline и связку publish->SEO delivery.

## Intentionally deferred topics

- broad blog expansion
- public AI chat
- calculator / estimate tool
- advanced SEO dashboards
- broad multi-region rollout

## What future chat should not spend time on right now

- переписывание PRD с нуля
- broad ideation beyond phase 1
- искусственное расширение launch list
- попытка компенсировать отсутствие proof красивым copy

## Do not reopen by default

- `Current priority = publishable proof-led core`
- `No weak pages in launch set`
- `No page-based ownership drift over Service/Case/Article`
- `No bypass of explicit publish gates`

## What this file owns

- current unresolved owner decisions
- practical blocker map
- immediate execution priorities

## What this file does not own

- project-level canonical foundations
- detailed architecture contracts
- implementation-level task decomposition

## Source docs used

- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
