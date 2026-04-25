# Project Truth and Current Phase

## Purpose

Этот briefing file даёт новому чату быстрый ответ:

- что это за проект
- в какой фазе он находится
- что уже зафиксировано в каноне
- где проходит граница launch-core

## Canonical truths

- Проект: корпоративный сайт-платформа строительной компании `Экостройконтинент`.
- `Phase 1 = narrow launch-core`, а не широкий продукт.
- Launch выигрывается индексируемостью, proof-led контентом и конверсионной механикой, а не шириной URL.
- Launch truth по языку: `RU-only`.
- На запуске используется один primary region cluster.
- `Public Web` = read-side only; `Admin Console` = write-side only.
- `Service`, `Case`, `Article` — route-owning сущности; `Page` не дублирует их route truth.
- `Publish` — явная доменная операция, а не status flip при save.
- AI остаётся assistive only; autonomous publish запрещён.

## Current phase and posture

- Текущая стадия: pre-launch execution / remediation after launch-readiness audit.
- Главный bottleneck: не стратегия и не новый PRD, а owner confirmations, evidence gaps, contact truth, media truth и production readiness.
- Launch posture на дату аудита `2026-04-17`: **NO-GO** для полноценного SEO/commercial запуска до закрытия обязательных launch gates.

## What is in phase-1 launch core

Day-1 public core:

- `/`
- `/services`
- `/services/[slug]`
- `/cases`
- `/cases/[slug]`
- `/about`
- `/contacts`

Поддерживающий слой:

- `/blog` и `Article` входят в phase 1 как supporting SEO layer, но не являются обязательным day-1 gate.
- Blog/article вводятся в live только после готовности route/entity/publish contour.

Контентный принцип:

- лучше 5 сильных service pages и 2-3 реальных case pages, чем широкий слабый слой.

## What is explicitly not in launch

- broad product surface beyond core
- English launch
- autonomous AI publishing
- full no-code page builder
- enterprise DAM / workflow stack
- weak or placeholder commercial pages without proof

## Public business truth as currently known

- Recommended public brand: `Экостройконтинент`.
- Legal name for trust/requisites: `ООО "ЭКОСТРОЙКОНТИНЕНТ"`.
- Primary region wording и финальный contact set должны быть подтверждены owner-решением до launch.

## Owner review boundaries

Always owner review:

- home page
- `/about`
- первая публикация всех launch money pages
- flagship cases
- любые claims-heavy surfaces (цены, сроки, гарантии, чувствительные обещания)

Standard editorial flow acceptable:

- `/contacts` только после подтверждения contact truth
- supporting articles без новых коммерческих обещаний
- routine proof-led updates

## Already accepted strategic decisions

- Launch starts from a small proof-led core, not from breadth.
- Public site не становится owner of editorial truth.
- AI помогает, но не определяет public truth.
- Publish остаётся explicit и human-mediated.
- Modular monolith acceptable; premature microservices not required.

## Do not reopen by default

- `Phase 1 = narrow launch-core`
- `RU-only on launch`
- `Public Web read-side only`
- `Admin write-side only`
- `AI assistive only`
- `No autonomous publishing`
- `No broad phase-1 scope expansion`

## What this file owns

- project-level truth
- phase posture
- launch boundary framing

## What this file does not own

- detailed domain boundaries
- page-by-page contracts
- publish gate implementation details

## Source docs used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
