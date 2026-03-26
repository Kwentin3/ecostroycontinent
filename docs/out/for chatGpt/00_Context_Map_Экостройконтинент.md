# Context Map

## Purpose

Этот pack нужен как compact briefing для будущих сессий ChatGPT по проекту «Экостройконтинент». Он помогает быстро войти в проектный контекст без пересказа всей документации заново.

## Canonical truths

- Это derived context layer, а не primary source.
- Каноническая truth живёт в `docs/product-ux/*.md`.
- Reports помогают понять зафиксированные решения и текущие швы, но не заменяют канон.
- Если pack конфликтует с каноническим документом, приоритет у канонического документа.

## AI Discoverability Layer

- AI discoverability — часть SEO-канона phase 1, а не отдельная фича.
- Три уровня: HTML hints в `<head>`, `/llms.txt` как compact AI map, `/llms-full.txt` как полный published content index.
- Schema.org JSON-LD обязателен для всех типов страниц; данные берутся из БД и `Global Settings`, а не из шаблонного hardcode.
- `/llms-full.txt` мыслится как dynamic public read-side endpoint, обновляемый через publish pipeline.
- Детали зафиксированы в PRD section `3.2.1`.

## Do not reopen by default

- Не превращать этот pack в новый канон.
- Не переоткрывать уже принятые phase-1 рамки без явной причины.
- Не использовать pack как justification для новых фич beyond current canon.

## What this file owns

- Правило чтения pack.
- Карту оставшихся 4 файлов.
- Границы того, что pack включает и что сознательно исключает.

## What this file does not own

- Product truth.
- Архитектурные решения.
- Implementation details.
- Актуальный production backlog.

## Recommended read order

1. `01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
2. `02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
3. `03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
4. `04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`

## File map

- `01` — что это за проект, в какой он фазе и что уже решено на уровне launch truth.
- `02` — архитектурные и доменные границы, которые не надо заново изобретать.
- `03` — как practically живут content, SEO, admin, media и publish.
- `04` — что всё ещё открыто, что блокирует запуск и куда двигаться дальше.

## Intentionally excluded from this pack

- Полные PRD/spec тексты.
- История всех итераций документации.
- Deep implementation blueprint.
- Широкие future specs по `public AI chat`, `calculator`, `SEO dashboard`, `CRM-lite`.
- Подробный infra, legal или analytics layer.

## How future ChatGPT sessions should use this pack

- Считать его быстрым briefing, а не источником окончательной истины.
- Не переоткрывать решения из блока `Do not reopen by default`, пока пользователь явно не просит их пересмотреть.
- При необходимости углубления идти из pack в канонические docs, а не наоборот.

## Source docs used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`

## Current state anchor

- Public homepage shell is already implemented and deployed.
- The live shell is temporary and decorative:
  - title + `В разработке` badge
  - 3 decorative Unsplash tiles
  - minimal top-right login icon
- Current shell code lives in:
  - `app/page.js`
  - `components/public/public-ui.module.css`
- The live host mismatch was caused by a pinned VM digest reference in `/opt/ecostroycontinent/runtime/.env`.
- Current known-good host image reference after the fix:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:03ce569f42a4dc7ef037bd29604b13131897ba3d6ea246e60b85ad1584a7fe9c`
- Deploy path:
  - push to `main`
  - `build-and-publish.yml`
  - GHCR
  - `deploy-phase1.yml`
  - VM compose refresh
- If the hosted GUI looks stale again, check the pinned host digest first before touching page code.
- Do not reintroduce `<img>` tiles or text fallbacks inside decorative tiles.
- `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
