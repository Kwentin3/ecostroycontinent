## Purpose

Убрать `Галереи` как отдельную admin-visible поверхность, не ломая доменную сущность `gallery` и текущие publish/readiness/reference contracts.

## Decision Already Fixed

- В админке больше не показываем слово `Галерея` как рабочую сущность.
- В `Услугах`, `Кейсах` и `Страницах` оператор видит `Коллекции`.
- `gallery` остаётся внутренней доменной сущностью и совместимым reference layer.
- Public copy и public render contracts не переоткрываются этим проходом.

## Execution Chain

1. Найти все оставшиеся admin-visible `Галерея` surfaces и copy.
2. Переименовать их в `Коллекция` / `Коллекции`, не меняя внутренних entity ids и schema keys.
3. Перевести media inspector usage links на media-native collection path вместо legacy gallery detail URLs.
4. Сохранить compatibility routes для старых deep links.
5. Прогнать build/test.
6. Вручную доставить runtime на сервер.
7. Проверить live через Playwright:
   - `Медиа`
   - `Услуги`
   - `Кейсы`
   - `Страницы`
   - `Где используется`

## In Scope

- admin labels
- admin helper copy
- media workspace terminology
- collection labels in downstream entity editors
- media-native inspector links

## Out Of Scope

- удаление сущности `gallery`
- переписывание public site copy
- пересборка readiness model
- миграция DB/schema contracts
- cleanup broken preview fixtures

## Success Criteria

- В admin navigation и editor surfaces больше нет operator-facing `Галереи`.
- В `service/case/page` selection groups оператор видит `Коллекции`.
- Из `Где используется` ссылки на коллекции ведут прямо в `Медиа`, а не в legacy gallery surface.
- Compatibility routes продолжают работать.
