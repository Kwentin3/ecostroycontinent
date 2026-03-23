# Consistency Report

Документ: Bounded Domain Consistency Sweep v0.1  
Дата: 2026-03-23

## Какие документы были изменены

- [PRD v0.3.1](../../product-ux/PRD_Экостройконтинент_v0.3.1.md)
- [Content Contract v0.2](../../product-ux/Content_Contract_Экостройконтинент_v0.2.md)
- [Launch SEO Core Spec v0.1](../../product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md)
- [Content Operations / Admin Console MVP Spec v0.1](../../product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md)

`Content Inventory & Evidence Register v0.1` сознательно не менялся: он уже честно отражает evidence reality и не был главным источником архитектурного drift.

## Какие seams были найдены

- Двусмысленность между `Page` и `Service/Case/Article` как владельцами публичной route truth.
- Read / write split был понятен по смыслу, но не везде был назван прямо.
- Publish semantics местами читались как lifecycle, но не как явная domain operation.
- Media domain был operationalized в admin spec, но недостаточно канонизирован в content contract.
- Lead / intake domain соседствовал с CMS, но не везде был явно отделён от content domain.
- Global settings / launch region / public contact truth были связаны, но не везде одинаково прочитаны как единый canonical source.
- AI boundaries были сильными, но не везде явно говорили, что AI не route owner.

## Какие seams реально зафиксированы

- Route ownership canon теперь проговорён явно:
  - `Service` owns `/services/*`
  - `Case` owns `/cases/*`
  - `Article` owns `/blog/*`
  - `Page` owns standalone pages and composition
- `Admin / CMS` закреплён как write-side tool, `Content Core` как source of truth, `Public Web` как published read-side projection.
- Publish зафиксирован как explicit domain operation с published revision semantics, validation gates и slug-change side effects.
- `MediaAsset` и `Gallery` схлопнуты в единый media canon:
  - media metadata truth in SQL
  - binaries in S3
  - delivery through CDN
  - no raw URL chaos as editorial source of truth
- Lead domain отделён от content domain как соседний operational domain.
- AI выровнен как assistive layer: not source of truth, not route owner, no autonomous publish.

## Какие решения удалось harmonize

- PRD, Content Contract и Admin Spec теперь одинаково читают `Page` как standalone/composition shell, а не второй источник истины для route-owning сущностей.
- Launch SEO Core Spec теперь согласован с route ownership canon на уровне URL map.
- Media domain теперь описан совместимо в content contract и admin spec, без расхождения между "first-class asset" и "lightweight gallery concept".
- Publish semantics теперь последовательны от PRD до admin operating layer.

## Какие вопросы сознательно оставлены открытыми

### Owner-level

- Финальный launch region / service area wording for public use.
- Итоговый список launch services and cases after real proof audit.
- Какие claims по срокам, стоимости и гарантиям owner готов публично защищать.

### Implementation-level

- Техническая форма relation-role storage (`primary`, `cover`, `gallery`, `inline`).
- Нужен ли отдельный redirect helper/log already in MVP или достаточно explicit warning + manual task.
- Точный минимальный набор first-slice list warnings.

## Что специально не было добавлено

- Новый большой architecture manifesto.
- Microservice / projection / eventing blueprint.
- Deep DB schema or migration design.
- Новый RBAC or workflow framework.
- Extra companion docs ради красивой полноты.

Sweep остался bounded: только правки, которые реально снижают риск drift и усиливают договорённости между уже существующими каноническими документами.
