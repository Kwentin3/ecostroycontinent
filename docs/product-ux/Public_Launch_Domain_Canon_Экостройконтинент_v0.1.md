# Public Launch Domain Canon v0.1

Проект: "Экостройконтинент"  
Статус: canonical companion for phase-1 launch  
Назначение: зафиксировать цельную модель публичного launch-домена без переписывания PRD и без расширения scope.

## 1. Purpose and scope

Этот документ фиксирует практический канон для Public Web в phase 1 и закрывает разрывы между:

- SEO-архитектурой
- route ownership
- content ownership
- proof/evidence requirements
- conversion path
- publish semantics
- technical SEO delivery baseline

Документ не вводит новые feature-domains и не заменяет PRD. Он уточняет и склеивает уже принятый канон в operationally usable модель.

## 2. Canonical public launch model

Каноническая модель phase-1 launch:

- Public launch не является "одним универсальным лендингом".
- Launch строится вокруг связки `Home -> Services Index -> Service Detail -> Case/Proof -> Contact Action`.
- `Home` = trust/navigation hub, а не единственный владелец всех коммерческих интентов.
- Основная коммерческая и SEO-нагрузка лежит на отдельных `Service` страницах.
- `Case` слой обязателен как доказательная опора, а не декоративное портфолио.

Day-1 route core:

- `/`
- `/services`
- `/services/[slug]`
- `/cases`
- `/cases/[slug]`
- `/about`
- `/contacts`

`/blog` и `Article` остаются phase-1 supporting layer, но не обязательным day-1 launch gate. Они входят в live-контур только после готовности route + content + proof.

## 3. Route ownership and entity boundaries

Канонические владельцы route truth:

- `Service` owns `/services/[slug]` truth.
- `Case` owns `/cases/[slug]` truth.
- `Article` owns `/blog/[slug]` truth.
- `Page` owns standalone pages (`/about`, `/contacts`) и page-level composition only.

Жёсткие границы:

- `Page` не становится вторым владельцем service/case/article route truth.
- `Page` не может иметь конкурирующую truth-модель для коммерческого интента, уже принадлежащего `Service`.
- Если route рендерится через shell-композицию, shell остаётся projection/container, а source truth остаётся в route-owning entity.
- Нельзя вводить параллельные редакторы, где один и тот же URL/интент одновременно "владеется" `Service` и `Page`.

## 4. Page-type contracts

### 4.1 Home (`/`)

Purpose:

- объяснить кто компания, что делает и где работает;
- дать быстрый вход в ключевые услуги;
- дать trust/proof сигналы;
- дать явный next step к контакту.

Must include:

- service hub блок с переходами на service detail;
- proof-led блоки (кейсы/фактура/FAQ/trust);
- явный CTA к контакту.

Must not:

- превращаться в "простыню про всё";
- подменять service detail страницы.

### 4.2 Services index (`/services`)

Purpose:

- каталог услуг и узел входа в money pages.

Must include:

- список publish-ready service cards;
- быстрые переходы к detail;
- вторичный CTA к контакту.

Must not:

- быть тупиком без перехода в detail;
- содержать дублирующий full-detail контент каждой услуги.

### 4.3 Service detail (`/services/[slug]`)

Purpose:

- основной коммерческий intent asset.

Minimum content contract:

- один основной intent;
- уникальные `slug`, `H1`, title;
- service scope и границы ответственности;
- process/этапы;
- минимум один proof path (`Case`, media/gallery, factual FAQ);
- явный CTA.

Do not publish:

- thin promise page без фактуры.

### 4.4 Cases index/detail (`/cases`, `/cases/[slug]`)

Purpose:

- доказательная база для service pages.

Case minimum factual structure:

- `task`
- `work_scope`
- `result`
- `location context`
- `visual proof`

### 4.5 About (`/about`)

Purpose:

- trust page: company truth, process, competencies, bounded claims.

### 4.6 Contacts (`/contacts`)

Purpose:

- primary conversion page + local trust.

Must include:

- единый подтверждённый contact set;
- primary launch region / service area формулировка;
- минимум один рабочий контактный path.

### 4.7 Blog/Article (`/blog`, `/blog/[slug]`)

Purpose:

- supporting SEO layer, supporting internal linking, FAQ/объясняющий контур.

Phase-1 discipline:

- не блокирует day-1 launch-core;
- публикуется только после готовности `Article` route-ownership и редакционного контура.

## 5. Navigation model (canonical)

Навигация считается частью SEO/UX/conversion architecture, а не декоративным UI.

Minimum navigation contract:

- глобальный `header`
- active state текущего раздела
- быстрый доступ к услугам (dropdown/list)
- `breadcrumbs` на внутренних страницах
- `footer navigation`
- contextual links (`related services`, `related cases`, при наличии `related articles`)

Mobile contract:

- тот же canonical nav-path должен быть доступен на мобильном;
- пользователь не должен попадать в тупиковые экраны без следующего шага.

## 6. Proof and evidence contract

Launch правила:

- Service page не публикуется без proof path.
- Case page не публикуется без minimum factual structure.
- Claims-heavy copy не публикуется без owner review.
- Если proof inventory слабый, страница исключается из launch cut.

## 7. Contact and region truth contract

- `Global Settings` хранит единый contact/region truth.
- `contactTruthConfirmed=true` является launch gate для `Contacts` и conversion-critical surfaces.
- Phone/email/messenger/CTA wording должны совпадать на home, service pages, contacts, schema и глобальных настройках.
- Primary region формулируется единообразно, без географического расползания.

## 8. Conversion contract

Minimum conversion surfaces:

- `Home`: primary CTA
- `Service detail`: primary CTA + visible next step
- `Contacts`: explicit contact paths

Минимум один рабочий conversion канал обязателен на launch (`click-to-call`, `messenger` или lead form). Для money pages без явного next step публикация не считается launch-ready.

## 9. Publish semantics and SEO delivery coupling

- Publish = явная доменная операция, а не save-time status flip.
- Published read-side использует только validated published revisions.
- Slug mutation опубликованной сущности создаёт обязательства: redirect/revalidation/sitemap follow-up.
- Publish readiness для indexable страниц должен проверять:
  - required fields
  - valid refs
  - SEO basics
  - visible CTA where required
  - минимальную factual completeness

## 10. Technical SEO baseline (launch minimum)

Обязательный минимум до публичного launch:

- `robots.txt`
- `sitemap.xml`
- per-page title/description handling
- canonical logic
- indexation controls
- schema markup там, где есть реальное содержание
- breadcrumbs markup для внутренних страниц
- image SEO basics (`alt`, осмысленные refs/filenames)
- отсутствие draft leakage в public contour

## 11. Launch cut discipline

- Narrow proof-led core важнее ширины.
- Лучше меньше publish-ready страниц, чем широкий weak launch.
- Страницы без контактной правды, proof-минимума или intent clarity не должны идти в launch.

Recommended launch discipline for phase-1:

- запускать только страницы, прошедшие intent + proof + contact + conversion + technical baseline;
- всё спорное переносить в post-launch queue без ощущения "потери".

## 12. Non-goals (phase 1)

- broad page-builder expansion
- autonomous AI publishing
- broad multi-region rollout
- synthetic/placeholder content as launch substitute

## 13. Source-of-truth references

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/out/for chatGpt/01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
- `docs/out/for chatGpt/03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
- `docs/out/for chatGpt/04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`
- `docs/reports/2026-04-17/AUDIT.LAUNCH_READINESS_ANAMNESIS.ECOSTROYCONTINENT.V1.report.md`
