# SEO Visibility / Traffic / Conversion Dashboard PRD Refine Report

Проект: «Экостройконтинент»
Дата: 2026-04-30
Статус: documentation refine

## 1. Что изменено

Изменены документы:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`.

Создан этот report:

- `docs/reports/2026-04-30/SEO_VISIBILITY_TRAFFIC_CONVERSION_DASHBOARD_PRD_REFINE_Экостройконтинент_v0.1.report.md`.

Runtime-код, миграции, UI, API и внешние интеграции не менялись.

## 2. Какие разделы усилены в PRD

Добавлены или уточнены:

- `Product Purpose`: дашборд описан как операционный инструмент роста, а не отчетный экран.
- `Операционный цикл улучшений`: signal -> diagnosis -> hypothesis -> action -> publication -> monitoring -> next action.
- `Какая оперативная информация нужна SEO-специалисту`: отдельно для роста трафика, повышения конверсии и управления работой.
- `Actionability First`: каждый экран должен отвечать не только "что происходит?", но и "что делать дальше?".
- `Priority Model`: простая explainable модель приоритизации страниц и проблем.
- `Recommendation / Task Lifecycle`: статусы рекомендации от detection до monitoring/resolved/dismissed.
- `What Good Looks Like`: практические сценарии правильного использования.
- `Baseline and Threshold Caution`: осторожность при малой выборке и отсутствии исторической базы.
- `Before / After Measurement`: сравнение периодов до/после published change.
- `Search Console Attribution Limitation`: query data является агрегатом и не связывается с конкретным пользователем/лидом.
- `Traffic Source Practicality`: практичные source labels и явный `unknown/unattributed`.
- `Event Markup Contract`: стабильные `data-analytics-*` атрибуты для semantic events.
- `Admin / Bot Exclusion`: исключение админского, ботного, QA и preview-трафика из бизнес-агрегатов.
- `AI Assistant Boundary`: AI объясняет сигналы и готовит draft-рекомендации, но не утверждает причинность и не обещает рост.

## 3. Что уточнено в taxonomy

Добавлено или уточнено:

- event envelope fields: `event_source`, `is_excluded`, `exclusion_reason`;
- element markup contract для CTA, phone, Telegram, related cases, FAQ и gallery;
- admin/bot/QA/preview exclusion rules;
- practical traffic source classification: `organic_google`, `organic_yandex`, `direct`, `referral`, `telegram`, `whatsapp`, `maps_or_business_directory`, `paid`, `campaign_utm`, `unknown`, `unattributed`;
- Search Console limitation: page-level aggregate signals only;
- issue priority/status fields;
- recommendation lifecycle statuses;
- optional recommendation lifecycle events.

## 4. Какие принципы усилены

- Дашборд должен помогать отвечать: "что нам нужно сделать сейчас, чтобы получить больше целевого трафика и больше обращений?"
- Метрики должны вести к действию: улучшить title/description, CTA, proof path, FAQ, галерею, перелинковку, mobile UX или indexation setup.
- Semantic click map остается раньше visual heatmap.
- Search Console не используется как session-level attribution.
- Recommendation backlog не меняет canonical content и не публикует.
- Content Core остается источником истины.
- Public Web остается read-side.
- Admin Console остается write-side.
- AI остается advisory/draft-only.
- Фича не превращается в BI, CRM, GA4/Метрика replacement или enterprise analytics product.

## 5. Открытые вопросы

1. Какие commercial priority labels нужны для service pages?
2. Где хранить recommendation state в будущей реализации: отдельная таблица, generated issues + persisted review state, или внешний task tracker later?
3. Какие baseline periods считать минимально достаточными: 7/14/28/90 дней?
4. Какие правила будут определять internal QA traffic?
5. Какие thresholds владелец готов принять после накопления baseline?
6. Должны ли рекомендации later создавать задачи во внешнем трекере, или оставаться внутри Admin Console?
7. Когда lead/intake domain будет готов для корректной связки contact action -> lead?

## 6. Git / Runtime Confirmation

Это documentation-only refine.

Не менялись:

- runtime application code;
- migrations;
- API routes;
- UI components;
- package/dependency files;
- external API integrations.

Текущий статус: документы пока untracked, поэтому обычный `git diff --stat` пустой до `git add`. Проверять фактический набор изменений нужно через `git status --short --untracked-files=all`.

Ожидаемый набор измененных/новых файлов:

- PRD;
- taxonomy companion;
- discovery report from previous PRD delivery;
- новый refine report.
