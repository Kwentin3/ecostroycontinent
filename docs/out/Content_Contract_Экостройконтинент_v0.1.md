# Content Contract v0.1

Companion doc к PRD v0.2 для «Экостройконтинент».

Этот документ фиксирует минимальную каноническую модель контента. Он намеренно короткий: задача не в том, чтобы описать идеальную CMS всех времён, а в том, чтобы у команды был общий контракт на сущности, поля, связи и статусы.

## 1. Core principles

- Страница — не мешок текста, а сборка из нормализованных сущностей и полей.
- Source of truth для публичного контента и локализации находится в структурированных сущностях CMS / базы данных.
- Frontend является delivery layer, а не независимым источником истины.
- Локализация относится к тем же сущностям, а не живёт как набор несвязанных дубликатов.
- Статусный lifecycle минимум: `Draft` -> `Review` -> `Published`.
- AI может помогать с черновиками, но не обходит этот lifecycle.

## 2. Entity model

### 2.1 Page

- `slug`
- `locale`
- `status`
- `page_type`
- `title`
- `h1`
- `intro`
- `blocks[]`
- `primary_image`
- `seo_title`
- `seo_description`
- `canonical_url`
- `noindex`
- `schema_type`

### 2.2 Service

- `slug`
- `title`
- `summary`
- `problems_solved`
- `service_steps[]`
- `materials_or_methods[]`
- `faq_refs[]`
- `case_refs[]`
- `service_area_refs[]`
- `cta_variant`
- `seo_*`

### 2.3 Case / Project

- `slug`
- `title`
- `location`
- `project_type`
- `task`
- `work_scope`
- `result`
- `gallery_refs[]`
- `service_refs[]`
- `testimonial_ref`
- `seo_*`

### 2.4 Article

- `slug`
- `title`
- `excerpt`
- `body`
- `topic`
- `service_refs[]`
- `faq_refs[]`
- `author`
- `publish_date`
- `seo_*`

### 2.5 FAQ Item

- `question`
- `answer`
- `service_refs[]`
- `topic_refs[]`

### 2.6 Review / Testimonial

- `author_name`
- `author_role`
- `quote`
- `source_type`
- `is_public`
- `related_service_refs[]`
- `related_case_refs[]`

### 2.7 Global Settings

- `company_name`
- `phone`
- `messengers`
- `address_or_service_area`
- `default_seo`
- `default_ctas`
- `organization_or_local_business_data`

Примечание: `seo_*` означает как минимум `seo_title`, `seo_description`, `canonical_url` и при необходимости дополнительные SEO-поля того же уровня.

## 3. Relationships and references

- `Page` может собираться из `Service`, `Case`, `FAQ Item`, `Review / Testimonial` и media assets через `blocks[]` и references.
- `Service` связывается с `FAQ Item`, `Case / Project` и service areas через references, чтобы не размножать текст вручную.
- `Case / Project` связывается с услугами, галереями и отзывами.
- `Article` связывается с услугами и FAQ для внутренней связности и SEO-поддержки.
- `Review / Testimonial` и `FAQ Item` должны быть переиспользуемыми сущностями, а не разовыми кусками текста, вшитыми в страницу.
- `Global Settings` питают общие контакты, default SEO, CTAs и organization / local business signals.

Relations должны строиться через stable IDs / refs, а не через хрупкие текстовые вставки.

## 4. Source of truth and localization

- Каноническая запись сущности определяется её внутренним идентификатором, типом и локалью.
- `slug` должен быть уникален в рамках типа сущности и локали.
- Локализованные версии остаются частью той же сущности, а не отдельным не связанным контентным объектом.
- Публичные URL выводятся из типа сущности, локали и `slug`; ручное размножение близнецов вне модели не допускается.

## 5. Status lifecycle

### Draft

Рабочее состояние для создания и редактирования. AI-generated content может существовать только как `Draft`, пока человек не проверил материал.

### Review

Состояние human review: проверяются фактура, коммерческие формулировки, SEO intent, ссылки между сущностями и публичная пригодность.

### Published

Публично доступное состояние. Переход в `Published` происходит только через явный publish action уполномоченного человека.

## 6. Editorial gate

- AI-generated content never goes live without human review and explicit publish action.
- `Superadmin` управляет publish / rollback.
- `SEO Manager` готовит и редактирует материалы.
- `Business Owner` подключается к ключевым коммерческим и чувствительным формулировкам.

Этого контракта достаточно для phase 1. Более глубокая схема БД, versioning и сложные workflow rules описываются отдельно только если реально понадобятся.
