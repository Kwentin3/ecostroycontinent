# AUDIT.DELETE_SAFETY_PATTERN_AND_FORENSIC_GAPS.ECOSTROYCONTINENT.V1.report

Статус: pattern audit / refactor intake  
Дата: 2026-04-19

## 1. Executive summary

Этот аудит подтверждает, что инцидент с исчезновением медиа у `Гусеничный экскаватор ZAUBERG EX-210C` не является единичным операторским промахом. Это проявление повторяющегося паттерна drift:

1. В проекте существует канонический reference kernel (`lib/content-core/entity-references.js`), но рядом живут несколько legacy/helper-контуров с собственными локальными картами зависимостей.
2. Эти локальные карты уже разошлись с реальной доменной моделью, прежде всего по `equipment`.
3. В результате операторский UI в одних местах показывает неполный граф, а destructive operations принимают решение по урезанной модели связей.
4. Forensic contour для удаления сейчас не просто неполный, а структурно слабый: текущая таблица `audit_events` каскадно удаляется вместе с сущностью, поэтому post-delete reconstruction в ряде сценариев невозможен даже теоретически.

Короткий вывод:

- проблема реальна и уже проявилась на живом сервере;
- корень проблемы архитектурный, а не точечный;
- refactor нужен как унификация destructive graph logic и forensic logging, а не как ещё одна локальная заплатка;
- текущий код нельзя считать достаточно безопасным для удаления/очистки графа, пока эти контуры не сведены к одному ядру и не получат устойчивый deletion ledger.

## 2. Scope and evidence

### 2.1 Server-verified evidence

Подтверждено через live Web GUI:

- `Гусеничный экскаватор ZAUBERG EX-210C` в админке остался без основного медиа и показывает блокер `Не указан основной медиафайл техники.`
- В форме техники по-прежнему хранится `primaryMediaAssetId = entity_8e5e0d89-fa99-40c9-9e47-e77f2f00288c`, но этот media asset уже отсутствует в live медиатеке.
- В live медиатеке для surviving asset `Гусеничный экскаватор ZAUBERG EX-210CX на объекте` UI показывает `Не используется`, хотя соответствующая техника существует и использует этот asset как primary media.

Это доказывает сразу три факта:

- удаление referenced media реально произошло на сервере;
- обратная ссылка в `equipment` не была очищена;
- media usage inventory на live runtime уже умеет вводить оператора в заблуждение.

### 2.2 Code-verified evidence

Проверены следующие участки:

- `lib/content-core/entity-references.js`
- `lib/content-core/removal-references.js`
- `lib/admin/entity-delete.js`
- `lib/admin/live-deactivation.js`
- `lib/admin/test-graph-teardown.js`
- `lib/admin/legacy-test-fixture-normalization.js`
- `lib/admin/media-gallery.js`
- `lib/admin/removal-sweep-analysis.js`
- `app/api/admin/entities/[entityType]/delete/route.js`
- `app/api/admin/entities/[entityType]/[entityId]/test-graph-teardown/route.js`
- `db/migrations/001_admin_first_slice.sql`

### 2.3 Contract-verified evidence

Проверены контрактные документы:

- `docs/product-ux/Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md:102-132`
- `docs/product-ux/Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md:168-177`
- `docs/product-ux/Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md:471-499`
- `docs/product-ux/Agent_Ops_API_Contracts_Экостройконтинент_v0.1.md:197-246`

Ключевое требование docs truth:

- every successful mutation must create an audit event;
- every blocked mutation must create an audit event;
- audit trail должен быть полезен для reconstruction, а не только для красивой ленты рядом с сущностью.

## 3. Incident baseline

### 3.1 Что именно произошло

Наиболее вероятный сценарий:

- оператор работал через legacy media delete family;
- система не увидела `equipment` как входящую ссылку на `media_asset`;
- media asset был удалён hard delete;
- `equipment` сохранила stale `primaryMediaAssetId`;
- UI медиатеки заранее сказал оператору, что asset не используется.

### 3.2 Что нельзя честно доказать

Нельзя независимо восстановить exact historical route/button, которым удаление было выполнено.

Причина не в отсутствии анализа, а в отсутствии адекватного forensic trail у legacy delete path.

## 4. Findings

### F1. CRITICAL: текущая audit storage model не годится для post-delete forensics

Подтверждение:

- `db/migrations/001_admin_first_slice.sql:78-86` создаёт `audit_events`.
- `db/migrations/001_admin_first_slice.sql:80-81` задаёт:
  - `entity_id TEXT REFERENCES content_entities(id) ON DELETE CASCADE`
  - `revision_id TEXT REFERENCES content_revisions(id) ON DELETE CASCADE`
- `lib/content-core/repository.js:396-410` пишет audit event именно в эту таблицу.
- `lib/content-core/repository.js:413-429` читает timeline только по `entity_id`.
- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js:20-26` вообще не открывает history screen, если сущность уже удалена.

Следствие:

- все entity-scoped audit events удалённой сущности исчезают вместе с самой сущностью;
- history UI для удалённой сущности недоступен;
- если добавить delete-audit naïvely с `entityId = удаляемая сущность`, такой event тоже будет снесён каскадом;
- post-delete reconstruction на текущем носителе неустойчива по конструкции.

Это не просто missing feature. Это неправильный storage contract для deletion forensics.

### F2. CRITICAL: legacy delete guard omits `equipment`, но этот путь остаётся живым и доступным из UI

Подтверждение:

- `lib/admin/entity-delete.js:13-18` поддерживает только `media_asset`, `service`, `case`, `page`.
- `lib/admin/entity-delete.js:37-41` задаёт `SOURCE_TYPES_BY_TARGET` без `equipment`.
- `lib/admin/entity-delete.js:84-130` реализует локальный `referencesTarget(...)`, в котором вообще нет ветки `ENTITY_TYPES.EQUIPMENT`.
- `app/api/admin/entities/[entityType]/delete/route.js:77-86` напрямую вызывает `deleteEntityWithSafety(...)`.
- `components/admin/MediaGalleryWorkspace.js:958-960` строит delete preview href для выбранного media asset.
- `components/admin/MediaGalleryWorkspace.js:1516-1518` показывает кнопку `Удалить выбранный`.
- `components/admin/EntityEditorForm.js:288-301` всё ещё даёт legacy delete path и прямой hard delete action.
- `components/admin/EntityEditorForm.js:289-290` прямо маркирует путь как `Безопасно убрать (legacy)`.

Следствие:

legacy delete contour может принимать destructive решение по неполному графу и уже привёл к реальному live incident.

### F3. HIGH: media usage/orphan/archive inventory считает связи неполно и может ложно разрешать опасные действия

Подтверждение:

- `lib/admin/media-gallery.js:7-12` задаёт `MEDIA_USAGE_REFERENCE_TYPES` без `equipment`.
- `lib/admin/media-gallery.js:14-18` задаёт `COLLECTION_USAGE_REFERENCE_TYPES` без `equipment`.
- `lib/admin/media-gallery.js:100-178` считает media usage только из `gallery/service/case/page`.
- `lib/admin/media-gallery.js:184-240` считает usage collections только из `service/case/page`.
- `lib/admin/media-gallery.js:258-259` формирует `whereUsedLabel`, который может показать `Пока не используется`.
- `lib/admin/media-gallery.js:268-271` summary items тоже не знают про `equipment`.
- `lib/admin/media-gallery.js:369-372` объяснение archive eligibility перечисляет только collections/services/cases/pages.

Следствие:

- asset, который реально нужен технике, может выглядеть в UI как unused/orphan;
- оператор получает ложный сигнал безопасности ещё до destructive action;
- проблема касается не только delete, но и archive/orphan triage.

### F4. HIGH: destructive и cleanup-контуры логируются неравномерно и местами вообще не логируются

Подтверждение:

- `app/api/admin/entities/[entityType]/delete/route.js:36-142` не импортирует и не вызывает `recordAuditEvent`.
- `lib/admin/entity-delete.js:417-472` удаляет сущность, но не пишет audit event.
- `app/api/admin/entities/[entityType]/[entityId]/test-graph-teardown/route.js:17-65` выполняет teardown без audit emission в route layer.
- `lib/admin/test-graph-teardown.js:693-768` выполняет teardown, деактивацию и удаление, но вообще не использует `recordAuditEvent`.
- `lib/admin/test-graph-teardown.js:717-748` молча закрывает obligations, снимает published pointers и удаляет members.
- `lib/content-core/repository.js:506-507` завершает publish obligation без audit event.
- `lib/content-core/repository.js:520-532` снимает `active_published_revision_id` как raw state mutation.

Для сравнения:

- `lib/admin/live-deactivation.js:539-552` audit пишет.
- `lib/admin/legacy-test-fixture-normalization.js:404-418` audit пишет.
- `lib/admin/removal-sweep-analysis.js:576-647` audit пишет.

Вывод:

форензика сейчас зависит не от класса операции, а от того, в какой helper случайно попал оператор. Это breach of operations contract.

### F5. HIGH: канонический reference kernel существует, но destructive helpers продолжают жить на duplicated local truth

Подтверждение:

- `lib/content-core/entity-references.js:67-109` уже знает `equipment`, `gallery`, `page.sourceRefs.primaryEquipmentId`, `galleryIds` и умеет отвечать на вопрос `referencesTarget(...)` по единой модели.
- При этом собственные локальные `referencesTarget(...)` реализованы ещё минимум в:
  - `lib/admin/entity-delete.js:84-136`
  - `lib/admin/live-deactivation.js:82-134`
  - `lib/admin/test-graph-teardown.js:78-130`
  - `lib/admin/legacy-test-fixture-normalization.js:54-90`
- Новый removal sweep, в отличие от legacy helpers, уже использует canonical logic:
  - `lib/admin/removal-sweep-analysis.js:13`
  - `lib/admin/removal-sweep-analysis.js:16-22`
  - `lib/admin/removal-sweep-analysis.js:245-285`

Это и есть архитектурный корень drift:

- canonical graph уже расширили;
- legacy local maps не расширили;
- UI/operations перестали видеть один и тот же домен одинаково.

### F6. HIGH: `equipment` уже участвует в public/admin domain, но removal/deactivation support matrix у него фрагментирован

Подтверждение:

- `lib/read-side/public-content.js:32-35` и `:58-65` включают published `equipment` в read-side lookup.
- `components/public/PublicRenderers.js:371-377` и `:868-910` используют `primaryEquipmentId` и `equipment(...)` в page rendering.
- `app/api/admin/entities/[entityType]/save/route.js:102-143` умеет создавать `equipment_landing` из `equipment`.

Но destructive support matrix отстаёт:

- `lib/admin/removal-quarantine.js:3-8` не поддерживает `equipment` в removal quarantine.
- `lib/admin/entity-delete.js:13-18` не поддерживает `equipment` в safe delete.
- `lib/admin/live-deactivation.js:12-17` не поддерживает `equipment` в live deactivation.
- `lib/admin/test-graph-teardown.js:16-21` не поддерживает `equipment` в teardown.
- `lib/admin/legacy-test-fixture-normalization.js:8-12` не поддерживает `equipment` в normalization.

Это означает: `equipment` уже реальная сущность operational contour, но destructive lifecycle у неё не доведён до parity.

### F7. MEDIUM: quarantine/picker hygiene непоследовательна даже там, где core guard уже существует

Подтверждение:

- `lib/content-core/removal-references.js:37-53` запрещает создавать новые ссылки на marked-for-removal сущности.
- `lib/content-core/service.js:76-80` действительно вызывает этот guard при сохранении draft.
- `lib/admin/entity-ui.js:53-55` фильтрует из relation options `service/case/gallery`, если они `markedForRemovalAt`.
- `lib/admin/entity-ui.js:92-95` для `equipment` такого фильтра не делает и прокидывает `equipment.map(optionFromCard)` как есть.

Следствие:

- system invariant формально держится на save path;
- но operator UI показывает заведомо плохой выбор хотя бы для части сущностей;
- это создаёт UX drift и лишние операционные ошибки.

### F8. MEDIUM: verification contour не покрывает главный drift-сценарий

Подтверждение:

- `tests/admin/entity-delete.test.js:36-187` не содержит coverage для `equipment` incoming refs.
- `tests/admin/live-deactivation.test.js:65-334` не содержит coverage для `equipment` incoming refs.
- `tests/admin/test-graph-teardown.test.js:63-260` не содержит coverage для `equipment`.
- `tests/admin/legacy-test-fixture-normalization.test.js` не проверяет `equipment`-graph parity.
- `tests/admin/removal-sweep-analysis.test.js:34-52` знает ключ `equipment`, но только как пустой bucket; реального equipment-linked сценария нет.
- По `media-gallery.js` нет полноценного test contour для usage/orphan classification c `equipment`.

Вывод:

bug прошёл не только потому, что код старый, но и потому, что verification matrix не держала cross-entity parity на destructive path.

## 5. Pattern map by module

### Канонический слой

- `lib/content-core/entity-references.js`
- `lib/content-core/removal-references.js`

Это сейчас самый близкий к source of truth слой. Именно он должен быть owner для определения ссылок и конфликтов.

### Legacy destructive helpers с локальными графами

- `lib/admin/entity-delete.js`
- `lib/admin/live-deactivation.js`
- `lib/admin/test-graph-teardown.js`
- `lib/admin/legacy-test-fixture-normalization.js`
- `lib/admin/media-gallery.js`

Эти файлы содержат duplicated graph knowledge. Именно здесь паттерн drift повторяется.

### Частично исправленный новый контур

- `lib/admin/removal-sweep-analysis.js`
- `app/api/admin/removal-sweep/purge/route.js`

Этот contour уже ближе к правильной модели, но не закрывает весь destructive domain и не решает audit storage problem.

## 6. What this means for the refactor

Это не задача класса “добавить `equipment` в один массив”.

Чтобы устранить проблему как класс, будущий refactor должен добиться следующих свойств:

1. Все incoming/outgoing reference decisions должны опираться на один canonical graph kernel.
2. Ни один destructive path не должен жить на собственной локальной карте ссылок.
3. Ни один destructive path не должен обходить единый auditable mutation envelope.
4. Deletion forensics должны жить в append-only носителе, который не сносится каскадом вместе с сущностью.
5. Operator UI не должен вести в legacy destructive path, считающий граф иначе, чем новый cleanup contour.
6. Usage/orphan/archive classification для media/gallery должна считать тот же граф, что и blocker logic.
7. Verification matrix должна проверять parity на `service/case/media/gallery/page/equipment`, а не только happy-path без `equipment`.

## 7. Honest current judgement

### Что уже хорошо

- В системе уже есть канонический reference kernel.
- Removal quarantine + removal sweep идут в правильную сторону.
- Save path уже умеет запрещать новые ссылки на marked-for-removal объекты.
- Live incident surfaced сейчас, пока домен данных ещё узкий и проблему можно чинить системно.

### Что реально опасно

- legacy delete path остаётся доступным;
- media/library usage UI может говорить оператору неправду;
- forensic trail для удаления структурно ненадёжен;
- test-graph teardown меняет состояние глубоко, но почти без forensic следа;
- `equipment` уже реальный operational actor, но destructive lifecycle у него недостроен.

### Что нельзя больше считать безопасным по умолчанию

Нельзя исходить из предположения, что:

- `Не используется` в медиатеке действительно означает отсутствие живых зависимостей;
- delete blockers одинаково видят все типы сущностей;
- audit trail позволит потом восстановить, кто и что удалил;
- новый safe-removal слой уже автоматически нейтрализовал старые destructive paths.

## 8. Final judgement

Проблема классифицируется как **systemic delete-safety and forensic drift**, а не как isolated bug.

Главный риск сейчас двойной:

1. destructive operations принимают решение по неполному графу;
2. после destructive mutation система не гарантирует достаточного forensic следа для reconstruction.

Это именно тот случай, где точечный фикс одного blocker'а будет слабым решением. Материал для рефакторинга собран: нужно сводить graph logic, destructive execution и forensic ledger в один согласованный контур.