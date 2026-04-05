# ЭКОСТРОЙКОНТИНЕНТ

## Product Requirements Document

Корпоративный сайт-платформа с AI-слоем  
Версия: v0.3.2  
Статус: working skeleton / canonical product doc  
База: PRD v0.3 (`docs/product-ux/PRD_Экостройконтинент_v0.3.md`)

Принцип документа: skeleton first, practical canon, no enterprise theater. Этот PRD задаёт рабочие границы и базовые контракты для малой команды, а не пытается описать вообще всё.

## 1. Обзор проекта

Корпоративный сайт-платформа для строительной подрядной компании «Экостройконтинент». Основные цели:

- Представительство в интернете с профессиональным и доверительным образом компании.
- Генерация лидов через органический поиск, понятные CTA и простую конверсионную механику.
- Управляемый AI-слой, который помогает команде готовить контент и разбирать SEO-сигналы, но не становится владельцем истины.
- Удобная административная панель для малой команды без лишней enterprise-сложности.

### 1.1 Success Metrics & Measurement

Проект стартует без historical baseline: раньше сайта не было, поэтому исходных данных по трафику, вовлечённости и конверсии нет.

На phase 1 не фиксируется жёсткий traffic KPI до завершения keyword research, выбора приоритетного региона и первичной индексации. Phase 1 выигрывается не "красивым трафиком", а индексируемостью, видимостью и конверсионной механикой.

Primary metrics:

- Sitewide visitor-to-lead conversion: initial target 1-2%.
- Long-run organic visitor-to-lead target: 2-3% as planning direction, not promise.
- Engagement target for core service/case pages: roughly 1-2 minutes on page as directional benchmark.

Leading indicators:

- Indexed core pages.
- Impressions.
- Clicks.
- Non-brand queries with impressions.
- Pages receiving organic entrances.
- Click-to-call.
- Click-to-Telegram.
- Form submit.
- Core Web Vitals pass rate.

Measurement semantics:

- `Intent event` = наблюдаемое действие с прямым контактным намерением: `click-to-call`, `click-to-Telegram`, `form submit`.
- `Lead` = отдельная контактная запись с достижимым способом связи, созданная из формы или вручную зафиксированного inbound-обращения; не каждый intent event становится lead.
- `Qualified lead` = операционный ярлык после human review; полезен для дальнейшей воронки, но не считается обязательным phase-1 KPI без накопленного baseline.

Phase-1 non-goals:

- Жёсткий план по органическому трафику до появления семантической и индексной базы.
- Обещания по позициям в конкурентных кластерах.
- Сложная enterprise-аналитика ради отчётности.

## 2. Домены системы

Проект состоит из трёх независимых, но связанных доменов в одном монорепо:

- Домен 1 — Public website. Публичный сайт, который отвечает за доверие, SEO-структуру, презентацию услуг и захват лида.
- Домен 2 — Admin / CMS / editorial ops. Внутренний интерфейс для контента, SEO-полей, медиа, ролей, публикации и базовой обработки лидов.
- Домен 3 — AI-слой. Вспомогательный сервис для внутренних ассистентов и будущих AI-surfaces. Он ускоряет работу, но не обходит контентный source of truth и не публикует ничего сам.

Contract posture for phase 1:

- `Admin / CMS` is the write-side tool for editorial data.
- `Content Core` in SQL is the source of truth for entities, relations, statuses and published revisions.
- `Public website` is a published read-side surface and must not become owner of editorial truth.
- Lead intake is a neighboring operational domain, not a substitute source of truth for content entities.

## 3. Публичный сайт

### 3.1 Страницы и разделы

Базовая иерархия phase 1:

- `/services/[slug]` — money pages по услугам.
- `/cases/[slug]` — кейсы и подтверждающие проектные страницы.
- `/blog/[slug]` — статьи, объясняющие материалы, кейсовые публикации.
- `/about` — страница о компании, команде, подходе и подтверждающих сигналах.
- `/contacts` — контакты, service area, способы связи, lead capture.

Практический launch scope phase 1:

- `5-7` сильных service pages как стартовое money-page ядро.
- `3-4` качественных case pages с реальными подтверждающими материалами.
- Один primary region cluster на запуске; точный регион остаётся owner decision.

Сквозные блоки:

- Hero + CTA.
- Услуги.
- Кейсы / портфолио.
- FAQ.
- Отзывы.
- Контактные формы и мессенджеры.

Route ownership canon:

- `Service` owns canonical slug, SEO intent and core content truth for `/services/[slug]`.
- `Case` owns canonical slug, proof narrative and core content truth for `/cases/[slug]`.
- `Article` owns canonical slug and core content truth for `/blog/[slug]`.
- `Page` owns standalone pages such as `/about` and `/contacts`, plus page-level composition.
- If a route-owning entity is rendered through a page shell, that shell is a projection/container, not a second owner of route truth.

Калькулятор / estimate tool, публичный AI-чат и продвинутая фильтрация портфолио не считаются обязательной частью phase 1 и выносятся в future separate specs. Public AI chat и calculator не поднимаются до появления первых реальных данных по индексируемости, спросу и лидам.

### 3.2 SEO-канон для локального service website

SEO в проекте встроен в продуктовую модель, а не добавляется "потом".

- Один service page = один основной intent.
- Для money pages обязательны уникальные `slug`, `H1` и SEO intent.
- Дубль-URL, дубль-страницы и индексируемые вариации из фильтров по умолчанию не создаются.
- Фильтры по умолчанию не рассматриваются как отдельные индексируемые страницы, если это отдельно не обосновано SEO-стратегией.
- Local business signals должны быть консистентны между контентом страницы, контактами, schema markup и глобальными данными компании.
- Schema markup используется только там, где на странице есть реальное подтверждающее содержимое.
- `sitemap.xml`, `robots.txt` и Google Search Console обязательны с первого релиза.
- Core Web Vitals рассматриваются как базовый quality gate и как leading indicator, а не как отдельная "SEO-инициатива".

### 3.2.1 AI Discoverability Layer

AI discoverability layer — часть SEO-канона, не отдельная инициатива. Для phase 1 он усиливает уже принятый publish/read-side contract: AI-агенты должны видеть, где лежит структурированный контент, и читать только опубликованную truth-модель сайта.

Реализуется в три уровня при запуске:

**Уровень 1 — HTML discovery hints (все страницы)**

В `<head>` каждой публичной страницы через корневой layout `next-app` добавляются machine-readable hints:

```html
<!-- AI-readable structured data available at /llms.txt -->
<!-- Full published content index at /llms-full.txt -->
<!-- JSON-LD schema available on page via <script type="application/ld+json"> -->
<meta name="ai-content-hints" content="llms=/llms.txt; full=/llms-full.txt; schema=json-ld; lang=ru" />
```

Назначение: AI-агент парсит страницу, видит hint в `<head>` и получает явный указатель на структурированный published content. Это не стандарт, но полезный discovery signal для агентов, которые смотрят в head страницы.

**Уровень 2 — `/llms.txt` (карта сайта для AI)**

Публичный текстовый маршрут в корне сайта. Формат: Markdown. Содержит:

- краткое описание компании и региона работы;
- карту ключевых URL с назначением каждого;
- перечень стартовых услуг со slug-ами;
- ссылку на `/llms-full.txt` для полного published content.

На старте допускается статическая реализация через public asset текущего `next-app`, если наружу она отдается как маршрут `/llms.txt`. В будущем допустим динамический published read-side endpoint `/llms.txt`, генерируемый из БД.

Пример структуры:

```text
# Экостройконтинент — строительная компания, Сочи

## О компании
Строительная подрядная компания. Регион работы: Сочи и Большой Сочи.
Основные направления: строительство домов под ключ, монолитные работы,
реконструкция и капитальный ремонт зданий.

## Ключевые разделы
- /services — услуги компании
- /cases — реализованные объекты
- /blog — статьи и кейсовые материалы
- /about — о компании
- /contacts — контакты и регион работы

## Услуги
- /services/stroitelstvo-domov-pod-klyuch
- /services/monolitnye-raboty
- /services/rekonstrukciya-kapitalnyy-remont-zdaniy

## Полный контент
Полный индекс контента в машиночитаемом формате: /llms-full.txt
```

**Уровень 3 — `/llms-full.txt` (полный контент в Markdown)**

Полный индекс опубликованного публичного контента сайта в чистом Markdown: без HTML-обвязки, без навигации, без рекламного шума.

Содержит:

- опубликованные услуги;
- опубликованные кейсы;
- опубликованные статьи;
- FAQ;
- подтверждённые контактные данные и region/service-area truth.

Реализация для текущей архитектуры: динамический public read-side endpoint `/llms-full.txt` внутри `next-app`, который читает опубликованные сущности из БД и рендерит их в Markdown. Endpoint должен опираться только на published truth и обновляться как часть publish pipeline, а не читать drafts или raw editor state.

**Schema.org JSON-LD — обязательный набор по типам страниц**

| Страница | Schema тип |
| --- | --- |
| `/` и `/about` | `LocalBusiness` + `GeneralContractor` |
| `/services/[slug]` | `Service` |
| `/cases/[slug]` | `Article` with `about: Project` |
| `/blog/[slug]` | `Article` |
| `/contacts` | `LocalBusiness` |
| Страницы с отзывами | `Review` + `AggregateRating` |
| FAQ-блоки | `FAQPage` |
| Хлебные крошки | `BreadcrumbList` |

Schema.org данные берутся из структурированных сущностей БД и published read-side projection, а не хардкодятся в шаблонах. `Global Settings` компании остаются единым source of truth для названия, телефона, service area, organization / local business data и других общих schema-полей.

**Принцип написания контента для AI-читабельности**

Каждый смысловой раздел страницы должен быть самодостаточным: сначала прямой ответ или ясное утверждение по intent, затем расширение и доказательная часть. FAQ-блоки формулируются как реальные вопросы пользователя, а не как маркетинговые заголовки.

Это одновременно GEO-оптимизация и улучшение конверсии; эти цели не конфликтуют между собой.

### 3.3 Микроблог и knowledge content

Микроблог нужен как практический SEO- и trust-layer, а не как "контент ради контента".

- Публикации поддерживают сервисные страницы, кейсы и FAQ.
- Основные типы: статья, кейсовый материал, объясняющий материал, новость компании.
- Материалы связываются с услугами, FAQ и кейсами через структурные references, а не через ручной copy-paste.
- Богатое тело статьи допускается, но source of truth остаётся в структурированной контентной модели, а не в хаотичном мешке rich text.

### 3.4 Media & Image Rules

Изображения и галереи считаются first-class content assets.

- Используются descriptive filenames.
- Для релевантных изображений обязателен `alt` text.
- Asset URLs должны быть стабильными.
- Каждое изображение или галерея должны быть связаны с owning service, case или другой сущностью.
- Важный контент не должен существовать только как CSS background без индексируемого HTML-представления.
- CDN / object storage рассматриваются как канонический delivery layer для медиа.
- AI может предлагать alt text, подписи и черновые описания изображений, но только как draft для human review.

## 4. Административная панель

### 4.1 Роли и права доступа

Команда на старте малая. Канонические роли:

- `Superadmin` — system settings, publish, rollback, roles, global entities.
- `SEO Manager` — creates/edits pages, articles, FAQ, SEO fields, uses AI assistants, prepares materials for review.
- `Business Owner` — approves key commercial positioning, contentious formulations, flagship pages/cases and sensitive public wording.

### 4.2 Editorial Workflow & Roles

Канонический workflow публикации:

- `Draft` -> `Review` -> `Published`

Правила:

- Контент создаётся и редактируется в `Draft`.
- `Review` означает human review текста, формулировок, SEO intent и публичных обещаний.
- `Published` появляется только после явного publish action.
- Publish is an explicit domain operation, not a magical status flip on an arbitrary live page.
- Минимальный publish gate проверяет наличие обязательных полей, разрешённых ссылок на сущности, явного indexation state и видимого CTA для money pages.
- Publish action должен быть детерминированным: текущая проверенная ревизия становится активной published revision для конкретной сущности и локали.
- Rollback означает возврат к предыдущей published revision, а не ручное "откатывание текста" прямо на живой странице.
- Публикация индексируемой страницы обновляет её публичное представление, SEO metadata и участие в sitemap.
- Изменение `slug` у опубликованной сущности требует явного redirect / revalidation / sitemap update path, а не тихой мутации live URL.
- Публикация и rollback остаются под контролем `Superadmin`.
- `Business Owner` подключается точечно: главная страница, первая публикация money pages, flagship cases, спорные обещания, публичные формулировки про цены, сроки, гарантии и чувствительные коммерческие утверждения.
- AI-generated content never goes live without human review and explicit publish action.

Документ специально не вводит сложные approval chains и compliance-процессы.

### 4.3 Content Contract v0.2

Ключевой принцип: страница — не мешок текста, а сборка из нормализованных сущностей и полей.

Канонические content entities:

- `Page`
- `Service`
- `Case / Project`
- `Article`
- `FAQ Item`
- `Review / Testimonial`
- `Global Settings`

Канонические правила:

- Source of truth для публичного контента и локализации находится в структурированных сущностях CMS / базы данных.
- `Service`, `Case` и `Article` являются route-owning сущностями для своих публичных разделов; `Page` не должен дублировать их route truth.
- Локализация хранится как локализованные поля тех же сущностей, а не как независимые дублирующие страницы без связей.
- Связи между сущностями строятся через references / stable IDs.
- `blocks[]` — это упорядоченный список типизированных блоков с ограниченным phase-1 набором, а не произвольный контейнер rich text.
- Блоки по возможности ссылаются на сущности и media assets через refs, а не дублируют уже принадлежащие им данные.
- `MediaAsset` и `Gallery` остаются first-class supporting entities внутри content core; public pages не работают с raw media URLs как с source-of-truth ссылками.
- Lifecycle статусов для контента минимум: `Draft`, `Review`, `Published`.
- Детальный список полей и минимальная типизация блоков вынесены в companion doc: [Content Contract v0.2](./Content_Contract_Экостройконтинент_v0.2.md).

### 4.4 Модули CMS

- Редактор страниц и блоков для публичных страниц.
- Управление услугами, кейсами, FAQ и отзывами.
- SEO-поля на уровне сущностей.
- Глобальные настройки компании: контакты, мессенджеры, default SEO, organization / local business data.
- Media library поверх object storage / CDN.
- Интерфейс локализации для поддерживаемых языков.
- AI-assist surfaces только как черновой помощник, а не канал публикации.

CMS должна поддерживать структуру контентных сущностей, а не провоцировать бесконтрольный dump произвольного rich text.

### 4.5 Базовое измерение и обработка лидов

- Lead / intake domain соседствует с content domain, но не смешивается с ним.
- Форма заявки сохраняется в БД и отправляет уведомление в Telegram.
- Базовые конверсионные события фиксируются с первого релиза: click-to-call, click-to-Telegram, form submit.
- Intent events и leads хранятся раздельно: intent event показывает намерение, lead фиксирует состоявшийся контактный вход.
- Qualified lead допускается как ручная операционная метка после human review, но не вводится как обязательный автоматический workflow state phase 1.
- Минимальная практическая трактовка `qualified lead`: есть достижимый контакт, понятна потребность, и запрос хотя бы грубо попадает в service / region scope компании.
- Search Console и sitemap образуют обязательный measurement baseline.
- Допустимы простые админские представления по лидам и индексируемости.
- Полноценный SEO dashboard и CRM-lite beyond basic lead handling выносятся в отдельные future specs.

## 5. AI-слой

### 5.1 AI surfaces

Phase-1 active surfaces:

- `Internal content assistant` — помощь в подготовке draft-версий страниц, статей, FAQ, alt text и редактуре материалов.
- `Internal SEO assistant` — помощь в интерпретации visibility signals и подготовке on-page улучшений.

Reserved future surface:

- `Public chat` — future separate spec, не является phase-1 deliverable.

Во всех случаях AI — слой помощи и ускорения, а не владелец контентной истины.

### 5.2 Minimal LLM Factory

Для phase 1 нужна минимальная LLM factory без hardcode провайдера в бизнес-логике:

- Provider abstraction.
- Model registry.
- Runtime selection by config.
- Typical initial config example: `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3-flash`.
- No provider-specific hardcode in business logic.
- System instructions and skills as main control surface.
- Весь внешний LLM-трафик проходит через authenticated SOCKS5-прокси; параметры host/IP, port, username и password живут в `.env`, а не в коде.

Это должна быть тонкая прослойка для переключения моделей и провайдеров, а не самостоятельная "AI-платформа".

### 5.3 AI boundaries and non-goals

- Нет автономной публикации.
- Нет обязательной long-term memory на старте.
- Нет тяжёлой multi-agent orchestration.
- Нет overengineered provider layer.
- Контекст для внутренних ассистентов берётся из текущей сущности, роли пользователя и опубликованного контента.
- AI is not a route owner and does not replace canonical entity truth.
- Allowed outputs: draft copy, rewrites, content outlines, SEO field variants, alt text drafts, explainers по уже видимым сигналам.
- Restricted outputs: direct publish, бесшумное изменение source-of-truth данных, неподтверждённые коммерческие обещания, invented facts и destructive content actions без явного human action.
- Если у AI нет достаточного основания, он должен возвращать draft с оговоркой или запрашивать недостающий контекст, а не достраивать уверенную публичную фактуру.
- Persistent memory и сложные memory layers допускаются только как future decision при явной пользе, а не как базовая архитектурная обязанность.

## 6. Технический стек

Минимальный технологический baseline:

- `Next.js` App Router для публичного сайта и админки.
- `PostgreSQL` для контента, лидов, настроек и служебных данных.
- `S3-compatible object storage` + CDN для медиа.
- Ролевая авторизация уровня приложения.
- `Telegram` для базовых lead notifications.
- Интеграции с Search Console и внешними AI-провайдерами по мере необходимости.

`pgvector` допустим как future extension, но не является обязательным phase-1 требованием.

## 7. Инфраструктура

### 7.1 Схема

- `next-app` обслуживает публичный сайт и admin surface.
- `postgres` хранит контент, лиды, настройки и статусные данные.
- Object storage + CDN обслуживают медиа.
- `Traefik` остаётся внешним edge/router слоем.
- Внешние LLM-провайдеры доступны через SOCKS5-прокси.

### 7.2 Docker Compose

- `next-app` — Next.js приложение.
- `postgres` — PostgreSQL.
- `Traefik` — уже существующий ingress/service router.
- `S3` / CDN — внешний managed layer, не поднимается внутри Compose.

Ops не изобретается с нуля: используется стандартный отраслевой baseline для Next.js + PostgreSQL + object storage.

### 7.3 CDN и доставка медиа

- CDN и object storage считаются каноническим delivery layer для изображений и галерей.
- Stable asset URLs важны для SEO, кэширования и повторного использования внутри сущностей.
- Origin для медиа — S3-совместимое хранилище.
- Фронтенд допускает только явно разрешённые remote media hosts.

### 7.4 Security / privacy / legal note

Security, privacy и legal deep dive сознательно не разворачиваются внутри этого PRD. Для phase 1 принимается стандартный baseline по секретам, доступам, резервному копированию, moderation и обязательным публичным страницам. Более глубокая проработка выносится в отдельный spec при росте требований.

## 8. Темы и i18n

### 8.1 Система тем

- Темы остаются управляемыми через design tokens / CSS custom properties.
- Изменение темы не должно ломать SEO- и контентную структуру.
- Визуальная кастомизация вторична относительно читаемости, доверия и конверсии.

### 8.2 Интернационализация

- Каноническая launch truth для phase 1: RU-only.
- Английский допускается архитектурно только как future expansion и не обещается на запуске без подтверждённой editorial capacity команды.
- Source of truth для переводов находится в тех же контентных сущностях с локализованными полями.
- Неподдерживаемая или неполная локаль остаётся в draft / non-indexed состоянии и не должна попадать в публичную навигацию, sitemap или `hreflang`.
- Для каждого реально поддерживаемого и опубликованного языка обязательны корректные `hreflang`, sitemap и уникальные локализованные SEO-поля.

## 9. Фазы разработки

### 9.1 Фаза 1 — Фундамент (MVP)

Цель: индексируемый локальный service website, который принимает лиды, имеет рабочий editorial workflow и измеримый baseline.

- Один primary region cluster на запуске.
- Небольшое, но сильное стартовое ядро важнее ширины: `5-7` service pages и `3-4` case pages лучше, чем распыление на десятки слабых URL.
- Публичный сайт с иерархией `/services`, `/cases`, `/blog`, `/about`, `/contacts`.
- Структурированная контентная модель и lifecycle `Draft / Review / Published`.
- Роли: `Superadmin`, `SEO Manager`, `Business Owner`.
- Базовая CMS для услуг, кейсов, статей, FAQ, отзывов, глобальных настроек и медиа.
- Базовая lead capture механика: форма + Telegram.
- Measurement baseline: sitemap, Search Console, конверсионные события, CWV.
- Object storage + CDN для медиа.
- Minimal internal AI assistance с обязательным human-in-the-loop.

### 9.2 Фаза 2 — Visibility Loop & Editorial Acceleration

Цель: использовать первые данные поиска и конверсии для улучшения контента и money pages.

- Расширение контентного плана после keyword research и уточнения региона.
- Лёгкие представления по индексируемости, кликам и конверсионным событиям.
- Internal SEO assistant и content assistant в рабочих сценариях команды.
- Рост корпуса кейсов, FAQ и supporting content без потери структурного контракта.

### 9.3 Фаза 3 — Отдельные продуктовые поверхности

Цель: добавлять новые поверхности только после отдельного обоснования.

- Public AI chat.
- Calculator / estimate tool.
- Advanced portfolio / filtering logic.
- Более развитые аналитические и SEO surfaces.

### 9.4 Фаза 4 — Интеграции и автоматизация

Цель: автоматизировать только то, что уже доказало пользу в ручном процессе.

- CRM-интеграция, если базовая обработка лидов перестаёт хватать.
- Дополнительные внутренние workflow automation.
- Расширенные integration hooks при подтверждённой операционной необходимости.

Автопубликация остаётся вне scope.

## 10. Открытые вопросы / Separate Specs

### 10.1 Открытые owner decisions

- Финальный список услуг для money pages и семантической структуры.
- Какой именно регион становится primary launch region / service area.
- Нужно ли вообще поднимать EN после RU-only запуска и кто владеет регулярным сопровождением этой локали.
- Стартовый объём качественных кейсов, фото и отзывов.
- Подтверждение списка страниц и формулировок, которые всегда требуют `Business Owner` review.
- Нужен ли публичный AI-чат в обозримом roadmap или он сознательно отложен.
- Есть ли реальная бизнес-потребность в calculator / estimate tool.

### 10.2 Future separate specs

- Public AI chat.
- Calculator / estimate tool.
- SEO dashboard.
- Advanced portfolio / filtering logic.
- CRM-lite workflow if/when it grows beyond basic lead handling.

## 11. Архитектурные решения — обоснование

- Modular monolith acceptable; hard domain boundaries and contract-first integration are mandatory.
- Контент нормализуется в сущности и связи, потому что это упрощает SEO, локализацию, повторное использование и AI-assisted workflows.
- Publish остаётся human-mediated, потому что для малой команды контроль публичных обещаний важнее скорости автогенерации.
- Public read-side не должен становиться случайным владельцем raw editorial truth.
- Media остаётся отдельным first-class domain внутри общей системы, без raw URL chaos как основной модели работы.
- Minimal LLM factory даёт гибкость по провайдерам без раннего платформенного разрастания.
- Premature microservice sprawl не требуется для phase 1.
- Успех phase 1 измеряется через индексируемость, видимость и конверсионную механику, а не через vanity traffic.
- Security / privacy / legal deep dive намеренно отложены, чтобы не превращать skeleton PRD в перегруженный enterprise-spec.

PRD v0.3.2 — рабочий канон. Более глубокие product- или implementation-спеки создаются отдельно только там, где появляется реальная потребность.
