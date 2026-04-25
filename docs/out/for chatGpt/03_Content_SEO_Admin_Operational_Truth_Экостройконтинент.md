# Content, SEO, and Admin Operational Truth

## Purpose

Этот файл фиксирует operational truth по content/SEO/admin для phase-1 launch без ухода в low-level implementation.

## Canonical truths

- Публичный сайт строится из структурированных сущностей, а не из хаотичного rich text.
- `Service`, `Case`, `Article` — route-owning truth-слой для коммерческих/доказательных/knowledge маршрутов.
- `Page` — слой standalone pages и композиции, но не владелец service/case/article route truth.
- Launch-core intentionally narrow and proof-led.
- `RU-only` operational behavior на launch.

## Public launch operating model

Launch строится на системе, а не на одном лендинге:

- `Home` как hub
- `Services index + detail` как money-page ядро
- `Cases` как proof layer
- `About/Contacts` как trust + conversion surfaces
- `Blog/Article` как supporting layer (включается после готовности)

## Home operational role

`Home` в launch-модели:

- показывает "кто мы / что делаем / где работаем"
- маршрутизирует в key services
- содержит proof/trust/CTA
- не подменяет service detail страницы

## Service and case operational rules

Service rules:

- one service page = one main intent
- уникальные slug/H1/title
- обязателен явный CTA
- обязателен минимум один proof path

Case rules:

- кейс не декоративный контент, а proof entity
- minimum factual structure: `task`, `work_scope`, `result`, `location`, `visual proof`

## Navigation operational contract

Минимально обязательная система:

- global header
- active section state
- быстрый доступ к услугам
- breadcrumbs на внутренних страницах
- footer navigation
- related/contextual links между service/case/article surfaces

Без этого навигация не поддерживает SEO-архитектуру и конверсионный путь.

## Contact and region truth operational rules

- Единый contact set хранится в `Global Settings` и подтверждается перед launch.
- `contactTruthConfirmed=true` — launch gate для `Contacts` и conversion-critical surfaces.
- Primary region/service area формулировка должна быть консистентной в home/services/contacts/schema/global settings.

## Conversion mechanics baseline

Обязательные conversion points:

- CTA на home
- CTA на service detail
- рабочий path на contacts

Минимум один рабочий канал обязателен на launch (`click-to-call`, `messenger` или lead form).

## Publish gates and side effects

- Publish — explicit operation (`Draft -> Review -> Published`).
- Publish gate проверяет: required fields, valid refs, SEO basics, CTA visibility, factual minimum.
- Slug change published сущности создаёт redirect/revalidation/sitemap obligations.
- Published read-side потребляет только validated published revisions.

## SEO delivery baseline (operational)

Launch-ready baseline:

- `robots.txt`
- `sitemap.xml`
- canonical + metadata projection
- indexation controls
- schema markup where factual content exists
- draft leakage prevention

## Launch discipline

- Лучше 5 сильных service pages, чем широкий слабый набор.
- Лучше 2-3 реальных case pages, чем пустой proof contour.
- Не публиковать weak/placeholder страницы "для объёма".

## Do not reopen by default

- `Proof-led narrow launch core`
- `One service page = one main intent`
- `Page does not replace route-owning entities`
- `Publish gates stay real`
- `AI assistive only`

## What this file owns

- practical content/SEO/admin operating truth
- launch-safe constraints for public domain

## What this file does not own

- full CMS blueprint
- implementation internals per module
- long-term content expansion strategy

## Source docs used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
