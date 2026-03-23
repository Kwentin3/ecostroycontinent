# Change Report

Документ: PRD «Экостройконтинент» v0.3  
Дата: 2026-03-23

## Какие улучшения выбраны и почему они дали наибольший practical gain

- Уточнена семантика `intent event`, `lead` и `qualified lead`, чтобы measurement, конверсионные цели и базовая lead-обработка не расходились по смыслу.
- Добавлены минимальные publish / rollback semantics, чтобы publish перестал выглядеть как "магия", а rollback получил понятную интерпретацию через published revision.
- Прижата модель `blocks[]`: теперь это типизированные блоки с ограниченным phase-1 набором, что снижает риск превращения CMS в dump произвольного rich text.
- Добавлены короткие AI guardrails в формате allowed / restricted outputs, чтобы заранее снять спорные трактовки роли AI без разворачивания большого AI governance doc.
- Зафиксирована launch truth по языкам как `RU-first`, чтобы i18n не оставался расплывчатым обещанием и не создавал ложный scope уже на запуске.

## Какие документы изменены

- Создан новый [PRD v0.3](../../product-ux/PRD_Экостройконтинент_v0.3.md).
- Обновлён companion doc [Content Contract v0.2](../../product-ux/Content_Contract_Экостройконтинент_v0.2.md).
- Подготовлен этот change report для strengthening-итерации.

## Что сознательно не добавлено, чтобы не уйти в overengineering

- Не добавлялся отдельный launch-readiness handbook: publish gate зафиксирован коротко, без превращения в контрольный мегалист.
- Не добавлялась глубокая DB/versioning schema: определены только минимальные revision semantics, нужные для publish и rollback.
- Не добавлялся тяжёлый AI policy/spec: оставлены только практические guardrails.
- Не расширялись отдельные future specs вроде public AI chat, calculator, SEO dashboard или CRM-lite.
- Не разворачивались security / privacy / legal темы beyond already accepted baseline.

## Какие seams всё ещё оставлены на будущее и почему

- Детальный keyword map и региональная SEO-стратегия остаются вне PRD, потому что требуют реального research, а не канонической догадки.
- Полная version history, diffing и editorial audit trail оставлены на будущее, потому что для phase 1 достаточно детерминированного publish/rollback поведения.
- Расширенная taxonomy для блоков и layout-системы не описывается глубже, чтобы не превратить Content Contract в UI-builder spec.
- Критерии `qualified lead` не детализированы глубже, потому что до накопления baseline они будут слишком искусственными.

## Какие owner decisions по-прежнему открыты

- Финальный список услуг для money pages и семантической структуры.
- Приоритетный регион / service area для локального SEO.
- Нужно ли поднимать EN после RU-first запуска и кто владеет её регулярным сопровождением.
- Стартовый объём качественных кейсов, фото и отзывов.
- Какие страницы и формулировки всегда требуют `Business Owner` review.
- Нужен ли публичный AI-чат в обозримом roadmap.
- Есть ли реальная бизнес-потребность в calculator / estimate tool.
