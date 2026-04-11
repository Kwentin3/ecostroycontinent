# DOCS_AND_STICKY_COMMENTS.TEST_DATA_CANON.V1.report

## 1. Executive Summary

В проекте зафиксирован явный канон для тестовых данных: временные сущности, создаваемые агентом или разработчиком, должны быть test-marked сразу в момент создания, а не распознаваться постфактум во время cleanup. В документации это закреплено через один отдельный canon note и два заметных cross-link update, а в коде добавлены sparse sticky-comments ровно в тех местах, где будущий агент с высокой вероятностью будет создавать smoke/fixture объекты или лезть в cleanup/legacy-normalization path.

Ключевой operational lesson тоже зафиксирован прямо: отсутствие явного test prefix уже привело к cleanup ambiguity, поэтому теперь немаркированный тестовый объект считается дефектом процесса, а не нормой.

## 2. Problem Statement

Исторически в контуре накопились временные page/content артефакты, созданные агентом во время smoke, audit, remediation и verification. Почти все они оказались disposable, но не были явно помечены как тестовые. Из-за этого cleanup стал дороже:

- было трудно отделять реальную ценность от инженерного мусора;
- приходилось дополнительно инвентаризировать historical junk;
- future agent без контекста не видел правила прямо в коде.

Нужен был небольшой, но заметный канон, который:

- легко обнаружить;
- легко соблюдать;
- легко использовать для safe cleanup.

## 3. Final Naming Convention Chosen

Финальный формат:

- `test__<domain>__<purpose>__<suffix>`

Минимальный инвариант:

- имя должно начинаться с `test__`.

Примеры:

- `test__page__archive-fixture__20260411`
- `test__page__smoke`
- `test__case__picker-fixture__01`

Почему выбран именно он:

- префикс `test__` читается и человеком, и скриптом;
- формат достаточно короткий для повседневной работы;
- domain/purpose/suffix помогают не только cleanup, но и ручной проверке.

## 4. Docs Updated

- [TEST_DATA_CANON_Экостройконтинент_v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/engineering/TEST_DATA_CANON_Экостройконтинент_v1.md)
  - новый короткий canon note;
  - фиксирует why / what counts / naming convention / media caution / cleanup implication / future-agent rule.
- [PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md)
  - добавлен section-level rule для page/workspace flows;
  - future agent, читающий page-domain canon, увидит правило до создания smoke page.
- [Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md)
  - добавлен cleanup-side canon о test prefix;
  - правило привязано к существующему cleanup tool и maintenance posture.

## 5. Sticky Comments Added

- [PageRegistryClient.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PageRegistryClient.js)
  - comment рядом с registry-native create modal form.
- [route.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/entities/[entityType]/save/route.js)
  - comment на server-side create/save seam.
- [cleanup-test-data.mjs](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/scripts/cleanup-test-data.mjs)
  - comment в main cleanup entry script.
- [test-data-cleanup.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/internal/test-data-cleanup.js)
  - comment рядом с matcher logic.
- [page.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/[entityId]/normalize-test-fixture/page.js)
  - comment в legacy post-hoc normalization bridge.
- [MediaGalleryWorkspace.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/MediaGalleryWorkspace.js)
  - comment в value-sensitive media creation/edit surface.

## 6. Why These Locations Were Chosen

Эти места закрывают самые вероятные пустые входы для будущего агента:

- page registry modal: где проще всего создать временную страницу;
- generic entity save route: где можно начать с API и не увидеть UI-комментарий;
- cleanup script + helper: где будущий агент будет искать safe cleanup logic;
- legacy normalize-test-fixture bridge: чтобы никто не решил, что постфактум normalization лучше явной маркировки при создании.

Это даёт sticky coverage без спама комментариями по всему репозиторию.

## 7. What Was Intentionally Not Touched

- Не добавлял комментарии во все tests подряд: это создало бы шум, а не sticky guidance.
- Не переписывал cleanup subsystem и не строил новый governance framework.
- Не трогал реальные media и не менял media behavior beyond documentation caution.
- Не разносил правило по множеству несвязанных docs: выбраны один отдельный canon note и два естественных cross-link anchor.
- Не менял product/runtime logic кроме минимально уместного cleanup matcher hint для `test__`.
- Не добавлял новые UI affordances или cleanup commands: эта волна сознательно ограничена docs/comments и одним узким matcher guard.

## 8. Recommended Future Agent Rule of Thumb

Короткое правило для будущего агента:

- если создаёшь временную сущность, начинай её имя с `test__`;
- если сомневаешься, создавай `test__...`, а не “человеческое” имя без маркера;
- если речь о media, сначала попробуй обойтись без нового объекта;
- если cleanup нужен позже, `test__*` должен быть уже виден без археологии и догадок.

## 9. Checks Run

- `node --test tests/test-data-cleanup.test.js`
  - `7/7` pass
