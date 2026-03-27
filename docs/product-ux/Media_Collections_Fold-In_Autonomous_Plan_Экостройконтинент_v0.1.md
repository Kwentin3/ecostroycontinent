# Media Collections Fold-In Autonomous Plan

## Purpose

Этот план фиксирует автономную execution chain для переноса рабочего слоя `gallery` в `media workspace` без разрушения доменной сущности `gallery`.

## Decision Already Fixed

- `gallery` как сущность сохраняется.
- Отдельный standalone screen `Галереи` перестаёт быть primary operator surface.
- `media` становится главным рабочим экраном для:
  - upload,
  - browse,
  - metadata edit,
  - collection membership,
  - collection composition.
- Legacy gallery routes должны вести в `media workspace`, а не в dead-end screen.
- `service` / `case` / `page` продолжают ссылаться на `galleryIds`; raw asset arrays в эти сущности не просачиваются.

## Execution Bands

### Band 1. Domain-preserving merge
- Objective: встроить collection management в media UI, не ломая `gallery` truth.
- Scope:
  - collection DTOs для media workspace,
  - membership/usage summaries,
  - collection-safe payload builder.
- Proof:
  - media cards знают про membership,
  - collection entity по-прежнему содержит `assetIds`, `primaryAssetId`, `caption`, `seo`.
- Stop trigger:
  - если реализация требует убрать `gallery` как сущность.

### Band 2. Workspace surface transition
- Objective: сделать `media` gallery-first screen с встроенным collection layer.
- Scope:
  - card labels,
  - orphan status,
  - inspector section `Коллекции`,
  - toolbar entry `Коллекции`,
  - collection overlay.
- Proof:
  - operator может создать и изменить collection не покидая `media`.
- Forbidden shortcut:
  - не уводить collection editing обратно в generic entity form.

### Band 3. Legacy route absorption
- Objective: сохранить рабочие старые ссылки без второго primary screen.
- Scope:
  - `/admin/entities/gallery`
  - `/admin/entities/gallery/new`
  - `/admin/entities/gallery/[entityId]`
- Proof:
  - каждый маршрут редиректит в `media workspace` с корректным compose state.
- Stop trigger:
  - если redirect ломает deep-link editing существующей collection.

### Band 4. Live proof and regression check
- Objective: подтвердить, что merge не декоративный, а рабочий.
- Scope:
  - collection create,
  - collection edit,
  - search by collection signal,
  - orphan filter,
  - upload overlay regression,
  - sidebar/navigation cleanup.
- Proof:
  - live Playwright verification,
  - server delivery proof,
  - report with acceptance table.

## Owner Review Required

- Нужен ли отдельный product cleanup для ссылок `Где используется`, чтобы они в будущем открывали media-native collection links вместо legacy gallery URLs.
- Нужен ли follow-up pass на copy tightening вокруг collection semantics.

## Autonomous Discretion Allowed

- Тихая UI-компоновка overlay и inspector actions.
- Небольшая copy-normalization, если не меняется доменный смысл.
- Conservative usage labels, если они не притворяются full transitive graph.

## Autonomous Discretion Forbidden

- Убирать `gallery` из модели.
- Пробрасывать raw `assetIds` в `service/case/page` вместо `galleryIds`.
- Вводить новую parallel status machine для collection cards.
- Маскировать legacy route breakages вместо честного redirect.

## Closure Criteria

- `media` покрывает реальный collection workflow.
- `gallery` screen больше не нужен как primary surface.
- Existing content contracts остаются честными.
- Live server подтверждает end-to-end flow.
