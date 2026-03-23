# Change Report

Документ: PRD «Экостройконтинент» v0.2  
Дата: 2026-03-23

## Что именно изменено

- Подготовлен новый канонический PRD v0.2 на базе структуры и логики v0.1 без полного переписывания документа.
- Добавлен measurement canon для запуска: primary metrics, leading indicators и phase-1 non-goals.
- Добавлен editorial workflow `Draft -> Review -> Published` и уточнены полномочия `Superadmin`, `SEO Manager`, `Business Owner`.
- Добавлен краткий content canon в PRD и вынесен детальный `Content Contract v0.1` в companion doc.
- Расширен SEO-канон для локального service website.
- Добавлены media & image rules на уровне контракта.
- Пересобран AI-раздел: зафиксированы AI surfaces, minimal LLM factory и явные AI non-goals.

## Какие новые разделы добавлены

- `1.1 Success Metrics & Measurement`
- `3.4 Media & Image Rules`
- `4.2 Editorial Workflow & Roles`
- `4.3 Content Contract v0.1`
- `5.3 AI boundaries and non-goals`
- `7.4 Security / privacy / legal note`
- `10.2 Future separate specs`

## Какие старые разделы переработаны или объединены

- `3.2 SEO-фундамент` переработан в более короткий operating canon для локального service website.
- `4.1 Роли и права доступа` уточнён под фактические стартовые роли малой команды.
- `4.x` секции про CMS, SEO и лиды собраны в более компактный канон без enterprise-раздувания.
- `5.2 LLM Factory` сохранён, но ужат до minimal factory без жёсткой привязки к провайдеру.
- `5.3 Архитектура памяти AI` harmonized: вместо ранней memory-архитектуры зафиксированы boundaries и defer по persistent memory.
- `9. Фазы разработки` подрезаны по scope и приведены к более реалистичному roadmap для малой команды.

## Что сознательно не добавлено и почему

- Не добавлен deep dive по security / privacy / legal: это осознанно отложено, чтобы не раздувать PRD.
- Не добавлена сложная memory architecture для AI: для phase 1 это premature complexity.
- Не добавлены тяжёлые approval chains, compliance-процессы и enterprise governance: не соответствуют масштабу команды.
- Не добавлен overengineered provider layer: нужен минимальный factory, а не отдельная AI-платформа.
- Не добавлен полный SEO dashboard spec: тема вынесена в future separate specs.

## Какие темы вынесены в future separate specs

- Public AI chat.
- Calculator / estimate tool.
- SEO dashboard.
- Advanced portfolio / filtering logic.
- CRM-lite workflow, если перерастёт basic lead handling.

## Какие owner decisions всё ещё открыты

- Финальный список услуг для money pages и семантики.
- Приоритетный регион / service area.
- Launch scope по языкам.
- Стартовый объём сильных кейсов, фото и отзывов.
- Какие страницы требуют обязательного `Business Owner` review.
- Нужен ли public AI chat в обозримом roadmap.
- Есть ли реальная бизнес-потребность в calculator / estimate tool.
