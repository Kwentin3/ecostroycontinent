# TEST_DATA_CANON_Экостройконтинент_v1

Статус: active engineering/operator canon  
Дата: 2026-04-11  
Назначение: bounded operational rule for any test data created by an agent or developer in admin/content flows.

## 1. Why this rule exists

В этом контуре реальной ценностью обладают только текущие рабочие сущности и особенно `media domain`.

Практический урок проекта:

- почти всё, что агент создавал в page/content flows во время smoke, audit, remediation, archive verification и preview checks, оказалось тестовыми артефактами;
- отсутствие явной test-маркировки сделало cleanup дороже и создало ambiguity между реальной ценностью и инженерным мусором.

Из этого следует канон:

- тестовые сущности должны быть помечены сразу в момент создания;
- немаркированный тестовый объект считается operational defect.

## 2. What counts as test data

К test data относятся любые временные сущности, создаваемые не ради реального продукта, а ради проверки:

- smoke pages;
- audit fixtures;
- archive verification entities;
- remediation fixtures;
- preview-check objects;
- temporary services / cases / galleries;
- demo/proof objects;
- any other bounded engineering object that is expected to be disposable.

## 3. Required naming convention

Обязательный формат:

- `test__<domain>__<purpose>__<suffix>`

Примеры:

- `test__page__archive-fixture__20260411`
- `test__page__smoke`
- `test__service__picker-fixture__01`
- `test__case__ui-audit`
- `test__gallery__preview-check`

### Minimum invariant

- имя должно начинаться с префикса `test__`;
- префикс обязателен и для человека, и для будущего cleanup-инвентаря;
- если формат нужно сократить, сокращать можно только хвост, но не префикс.

## 4. Where this applies

Правило применяется везде, где агент или разработчик создаёт временную сущность в content/admin контуре, включая:

- `Page`
- `Service`
- `Case`
- `Gallery`
- temporary fixtures for review/publish/archive verification
- temporary smoke-created objects

## 5. Media domain caution

`media domain` требует отдельной осторожности:

- реальных media в проекте мало и они ценны;
- агент не должен плодить тестовые media без крайней необходимости;
- если тестовый media-артефакт всё же нужен, он тоже обязан быть явно test-marked через `test__...`;
- при сомнении лучше использовать существующий media asset или non-media fixture, чем создавать новый test media object.

## 6. Cleanup implication

Operational rule:

- `test__*` removable by policy once it is no longer needed;
- исключение только одно: если объект явно переоценён как ценный и отдельно реклассифицирован.

Важно:

- это не значит, что любой `test__*` можно удалять вслепую;
- это значит, что такой объект по умолчанию считается disposable test artifact, а не молчаливой частью canonical truth.

## 7. Rule for future agents

- Не создавайте немаркированные smoke/fixture/audit entities.
- Если создаёте временную страницу, сервис, кейс, галерею или другой disposable объект, начинайте имя с `test__`.
- Если создаёте test media, делайте это только при реальной необходимости и тоже через `test__`.
- Если нашли исторический объект без понятной ценности и без `test__`-маркировки, не нормализуйте его молча: сначала классифицируйте как `Keep / Remove / Hold`.

## 8. Cross-links

- [PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md)
- [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)
