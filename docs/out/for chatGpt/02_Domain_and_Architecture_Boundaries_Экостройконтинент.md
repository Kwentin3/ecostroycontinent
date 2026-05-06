# Domain and Architecture Boundaries

## Purpose

Этот документ фиксирует архитектурные границы, которые нельзя размывать в реализации public launch domain.

## Canonical truths

- `Content Core` в SQL — source of truth для сущностей, связей, статусов и published revisions.
- `Admin Console` — write-side only.
- `Public Web` — published read-side only.
- `MediaAsset` и `Gallery` — first-class supporting entities.
- Route ownership явно закреплён:
  - `Service` owns `/services/[slug]`
  - `Case` owns `/cases/[slug]`
  - `Article` owns `/blog/[slug]`
  - `Page` owns standalone pages and page-level composition only
- `Publish` — explicit domain operation with gates and side effects.
- `AI` — assistive only: not source of truth, not route owner, not autonomous publisher.

## Public launch route boundary (phase 1)

Day-1 route core:

- `/`
- `/services`, `/services/[slug]`
- `/cases`, `/cases/[slug]`
- `/about`, `/contacts`

`/blog` и `Article` — supporting layer phase 1, включается в live после готовности route/entity/publish contour.

## Page ownership hard boundary

- `Page` не владеет route truth для `/services/[slug]`, `/cases/[slug]`, `/blog/[slug]`.
- `Page` не создаёт второй конкурирующий source-of-truth для service-like маршрутов.
- Если route-owning сущность рендерится через page shell, shell является read-side projection/container, а не вторым редактором truth.
- Запрещено одновременное сосуществование двух owner-моделей для одного коммерческого интента.

## Publish semantics

- `Published` — не label на live странице.
- Publish активирует одну validated revision как публичную truth для сущности.
- Rollback возвращает предыдущую published revision.
- Изменение `slug` у опубликованной сущности требует redirect/revalidation/sitemap follow-up.

## Navigation boundary

Навигация входит в доменный контракт launch-readiness:

- global header
- active state
- быстрый доступ к услугам
- breadcrumbs
- footer navigation
- related/contextual links

Отсутствие навигационной связки нарушает целостность read-side и conversion path.

## Media boundary

- metadata truth живёт в SQL
- binaries живут в object storage
- public delivery идёт через CDN
- контентные сущности ссылаются на media через refs/IDs, не через raw URL как truth

## Anti-drift guardrails

### Mandatory rules

- `Admin Console` remains write-side only.
- `Public Web` remains read-side only.
- Route ownership и publish semantics не обходятся временными костылями.
- `Service`/`Case`/`Article` остаются route owners.
- `Page` не становится вторым route owner.

### Forbidden moves

- implicit publish через save/edit
- page-based takeover коммерческих route-intents
- параллельная truth-модель для SEO/route/publish
- hardcoded public truth в шаблонах вместо structured entities

### Stop-and-escalate triggers

- нужно нарушить route ownership ради "быстрого launch"
- появляется второй competing model для publish/SEO/route truth
- реализация требует обхода publish gates
- docs противоречат друг другу по owner boundaries

## Do not reopen by default

- `Public Web is read-side only`
- `Admin Console is write-side only`
- `Page is not a second route owner`
- `Publish stays explicit`

## What this file owns

- cross-doc boundaries
- route ownership contract
- publish and drift guardrails

## What this file does not own

- DB schema details
- endpoint contracts
- UI pixel-level behavior

## Source docs used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
