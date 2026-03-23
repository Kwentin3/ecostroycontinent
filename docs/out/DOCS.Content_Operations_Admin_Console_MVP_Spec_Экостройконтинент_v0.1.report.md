# Change Report

Документ: Content Operations / Admin Console MVP Spec v0.1  
Дата: 2026-03-23

## Почему выбран именно такой MVP scope

- Inventory показал реальный bottleneck: не отсутствие идей для страниц, а отсутствие удобного контура для сущностей, кейсов, медиа и связей.
- Поэтому MVP сфокусирован на content operations: forms, relations, media normalization, galleries, publish statuses и minimum gates.
- Scope удержан узким: только то, что нужно для launch-core и small-team workflow.
- Первый implementation slice дополнительно заужен до `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page`.
- Несмотря на наличие `locale` в модели, UI первого среза зафиксирован как operationally `RU-only`, без полноразмерного multi-language editing shell.
- Спецификация даёт implementation-ready operating layer без попытки построить большую CMS-платформу.

## Что сознательно не включено, чтобы не уйти в overengineering

- visual no-code page builder
- enterprise DAM
- complex workflow / approval engine
- deep RBAC matrix
- advanced analytics cockpit
- heavy version-control platform
- autonomous AI publishing
- deep asset transformation pipeline

## Какие 2-4 открытых owner / implementation decisions всё ещё остаются

- Нужен ли `Gallery` как отдельная lightweight сущность сразу, или команда хочет начать с relation-level grouping и быстро перейти к Gallery only for cases.
- Где хранить relation roles (`primary`, `cover`, `gallery`, `inline`) технически: в отдельной linking table или внутри небольшого join model на уровне ORM / service layer.
- Какие именно list-view warnings нужны в самом первом срезе: только missing required fields или сразу missing proof/media too.
- Нужен ли отдельный redirect log / helper уже в MVP, или на первом шаге достаточно explicit warning + manual redirect task when slug changes.

## На какие existing docs / contracts spec опирается сильнее всего

- На [PRD v0.3.1](../../product-ux/PRD_Экостройконтинент_v0.3.1.md): editorial flow, small-team model, media rules, AI boundaries.
- На [Content Contract v0.2](../../product-ux/Content_Contract_Экостройконтинент_v0.2.md): entity model, typed blocks, source-of-truth rules, publish semantics.
- На [Launch SEO Core Spec v0.1](../../product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md): launch-core page set and proof-led priorities.
- На [Content Inventory & Evidence Register v0.1](../../product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md): evidence bottlenecks, missing media archive, absent case packs, missing contact truth.

## Что было слегка уточнено на operating layer

- `gallery_refs[]` operationalized as a lightweight `Gallery` concept for MVP instead of an undefined grouping.
- `Gallery` intentionally remains a lightweight ordered grouping for cases and gallery blocks, not a semi-DAM album system.
- `MediaAsset` usage roles clarified as relation-level truth rather than raw duplicated URLs or file copies.
- `Article` retained in MVP scope, but moved to optional early-next slice instead of first implementation cut.
- Side effects of changing a published `slug` made explicit: redirect, revalidation and sitemap update should not stay implicit.
