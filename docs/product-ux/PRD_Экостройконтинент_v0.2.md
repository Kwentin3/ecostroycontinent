# ЭКОСТРОЙКОНТИНЕНТ

## Product Requirements Document

Корпоративный сайт-платформа с AI-слоем  
Версия: v0.2  
Статус: working skeleton / canonical product doc  
База: PRD v0.1 (`docs/PRD_Экостройконтинент_v0.1.docx`)

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

Phase-1 non-goals:

- Жёсткий план по органическому трафику до появления семантической и индексной базы.
- Обещания по позициям в конкурентных кластерах.
- Сложная enterprise-аналитика ради отчётности.

## 2. Домены системы

Проект состоит из трёх независимых, но связанных доменов в одном монорепо:

- Домен 1 — Public website. Публичный сайт, который отвечает за доверие, SEO-структуру, презентацию услуг и захват лида.
- Домен 2 — Admin / CMS / editorial ops. Внутренний интерфейс для контента, SEO-полей, медиа, ролей, публикации и базовой обработки лидов.
- Домен 3 — AI-слой. Вспомогательный сервис для внутренних ассистентов и будущих AI-surfaces. Он ускоряет работу, но не обходит контентный source of truth и не публикует ничего сам.

## 3. Публичный сайт

### 3.1 Страницы и разделы

Базовая иерархия phase 1:

- `/services/[slug]` — money pages по услугам.
- `/cases/[slug]` — кейсы и подтверждающие проектные страницы.
- `/blog/[slug]` — статьи, объясняющие материалы, кейсовые публикации.
- `/about` — страница о компании, команде, подходе и подтверждающих сигналах.
- `/contacts` — контакты, service area, способы связи, lead capture.

Сквозные блоки:

- Hero + CTA.
- Услуги.
- Кейсы / портфолио.
- FAQ.
- Отзывы.
- Контактные формы и мессенджеры.

Калькулятор / estimate tool, публичный AI-чат и продвинутая фильтрация портфолио не считаются обязательной частью phase 1 и выносятся в future separate specs.

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
- Публикация и rollback остаются под контролем `Superadmin`.
- `Business Owner` подключается точечно: ключевое коммерческое позиционирование, спорные обещания, flagship pages/cases, чувствительные формулировки.
- AI-generated content never goes live without human review and explicit publish action.

Документ специально не вводит сложные approval chains и compliance-процессы.

### 4.3 Content Contract v0.1

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
- Локализация хранится как локализованные поля тех же сущностей, а не как независимые дублирующие страницы без связей.
- Связи между сущностями строятся через references / stable IDs.
- Lifecycle статусов для контента минимум: `Draft`, `Review`, `Published`.
- Детальный список полей вынесен в companion doc: [Content Contract v0.1](./Content_Contract_Экостройконтинент_v0.1.md).

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

- Форма заявки сохраняется в БД и отправляет уведомление в Telegram.
- Базовые конверсионные события фиксируются с первого релиза: click-to-call, click-to-Telegram, form submit.
- Search Console и sitemap образуют обязательный measurement baseline.
- Допустимы простые админские представления по лидам и индексируемости.
- Полноценный SEO dashboard и CRM-lite beyond basic lead handling выносятся в отдельные future specs.

## 5. AI-слой

### 5.1 AI surfaces

На старте фиксируются три поверхности:

- `Public chat` — future separate spec, не является обязательным phase-1 deliverable.
- `Internal content assistant` — помощь в подготовке draft-версий страниц, статей, FAQ, alt text и редактуре материалов.
- `Internal SEO assistant` — помощь в интерпретации visibility signals и подготовке on-page улучшений.

Во всех случаях AI — слой помощи и ускорения, а не владелец контентной истины.

### 5.2 Minimal LLM Factory

Для phase 1 нужна минимальная LLM factory без hardcode провайдера в бизнес-логике:

- Provider abstraction.
- Model registry.
- Runtime selection by config.
- No provider-specific hardcode in business logic.
- System instructions and skills as main control surface.
- Весь внешний LLM-трафик проходит через SOCKS5-прокси; конфигурация живёт в `.env`, а не в коде.

Это должна быть тонкая прослойка для переключения моделей и провайдеров, а не самостоятельная "AI-платформа".

### 5.3 AI boundaries and non-goals

- Нет автономной публикации.
- Нет обязательной long-term memory на старте.
- Нет тяжёлой multi-agent orchestration.
- Нет overengineered provider layer.
- Контекст для внутренних ассистентов берётся из текущей сущности, роли пользователя и опубликованного контента.
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

- Базовый язык запуска: русский.
- Архитектура может поддерживать английский, но фактический scope локализации должен соответствовать реальной editorial capacity команды.
- Source of truth для переводов находится в тех же контентных сущностях с локализованными полями.
- Для каждого реально поддерживаемого языка обязательны корректные `hreflang`, sitemap и уникальные локализованные SEO-поля.

## 9. Фазы разработки

### 9.1 Фаза 1 — Фундамент (MVP)

Цель: индексируемый локальный service website, который принимает лиды, имеет рабочий editorial workflow и измеримый baseline.

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
- Приоритетный регион / service area для локального SEO.
- Реальный launch scope по языкам: RU-only или RU + EN.
- Стартовый объём качественных кейсов, фото и отзывов.
- Какие страницы и формулировки всегда требуют `Business Owner` review.
- Нужен ли публичный AI-чат в обозримом roadmap или он сознательно отложен.
- Есть ли реальная бизнес-потребность в calculator / estimate tool.

### 10.2 Future separate specs

- Public AI chat.
- Calculator / estimate tool.
- SEO dashboard.
- Advanced portfolio / filtering logic.
- CRM-lite workflow if/when it grows beyond basic lead handling.

## 11. Архитектурные решения — обоснование

- Контент нормализуется в сущности и связи, потому что это упрощает SEO, локализацию, повторное использование и AI-assisted workflows.
- Publish остаётся human-mediated, потому что для малой команды контроль публичных обещаний важнее скорости автогенерации.
- Minimal LLM factory даёт гибкость по провайдерам без раннего платформенного разрастания.
- Успех phase 1 измеряется через индексируемость, видимость и конверсионную механику, а не через vanity traffic.
- Security / privacy / legal deep dive намеренно отложены, чтобы не превращать skeleton PRD в перегруженный enterprise-spec.

PRD v0.2 — рабочий канон. Более глубокие product- или implementation-спеки создаются отдельно только там, где появляется реальная потребность.
