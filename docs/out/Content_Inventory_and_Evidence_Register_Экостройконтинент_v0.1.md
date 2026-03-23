# Content Inventory & Evidence Register v0.1

Проект: «Экостройконтинент»  
Статус: launch-only inventory / evidence register  
Основание: [PRD v0.3.1](./PRD_Экостройконтинент_v0.3.1.md), [Content Contract v0.2](./Content_Contract_Экостройконтинент_v0.2.md), [Launch SEO Core Spec v0.1](./Launch_SEO_Core_Экостройконтинент_v0.1.md)

## 1. Purpose and Scope

Этот документ фиксирует readiness реальных материалов для phase-1 launch-core.

Он покрывает только launch-only scope:

- стартовые service pages;
- стартовые case pages;
- минимальный supporting contour;
- trust/support pages;
- глобальные business facts, нужные для запуска.

Это не полный реестр будущего контента компании и не DAM/CMS spec.

### Inventory basis

Текущая инвентаризация ограничена доступным контекстом:

- в рабочей папке найдены только документы канона и execution-specs;
- в рабочей папке не найдены фото, видео, таблицы, кейс-паспорта, testimonials, готовые page drafts, контакты для публикации или иные content assets;
- в качестве внешне проверяемых сигналов доступны только базовые публичные company facts и SRO membership.

Следствие: этот register намеренно строгий. Он не предполагает, что "материалы наверняка где-то есть".

## 2. Inventory Status Model

- `Ready` — достаточно фактуры и proof assets, чтобы собирать страницу без критического добора.
- `Partial` — есть часть фактуры или trust base, но для публикации не хватает существенных элементов.
- `Owner input required` — ключевой смысл, scope, claim или публичные формулировки не могут быть зафиксированы без owner input.
- `Asset collection required` — нет или почти нет фото, кейсов, отзывов, FAQ-фактов, подтверждений.
- `Blocked for launch` — выпуск страницы на старте не рекомендуется до закрытия критических gaps.

## 3. Service-Page Evidence Inventory

Главный вывод по service layer: page intent уже определён каноном и Launch SEO Core Spec, но реальная доказательная база для всех service pages пока не представлена в workspace.

### 3.1 Строительство домов под ключ

- Intent / role: anchor money page для частного домостроения в `Сочи / Большой Сочи`
- Current readiness status: `Partial`
- Factual material already exists:
  - page intent и роль зафиксированы в launch-core;
  - локальная релевантность `Сочи` определена;
  - публично подтверждается, что компания занимается строительством жилых и нежилых зданий.
- Proof assets already exist:
  - есть только общий company trust base: действующее юрлицо и членство в СРО;
  - подтверждённых case refs, фото, отзывов или page-ready examples в workspace нет.
- What is missing:
  - реальное описание услуги;
  - этапы работ;
  - boundaries "что входит / что не входит";
  - минимум 2 дома / домовых кейса;
  - фото этапов;
  - FAQ по срокам, процессу, подготовке участка;
  - owner-approved claims по договору, срокам, гарантии.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `publish after light enrichment` only if owner quickly supplies 1-2 case packs and factual service scope; otherwise page slides toward `Asset collection required`.

### 3.2 Монолитные работы

- Intent / role: технологическая money page для монолита, фундамента, подпорных решений, конструктивных работ
- Current readiness status: `Partial`
- Factual material already exists:
  - page intent and local rationale already defined;
  - монолит выглядит релевантным для местного строительного контекста;
  - company trust base exists.
- Proof assets already exist:
  - подтверждённого монолитного кейса в workspace нет;
  - usable hidden-works photo set не обнаружен.
- What is missing:
  - перечень типов монолитных работ;
  - реальные методы / этапность;
  - фото армирования / опалубки / бетонирования;
  - минимум 1 case ref;
  - фактура по контролю качества и ограничениям.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `publish after light enrichment` only if there is a real monolith case and stage photos; otherwise page should wait.

### 3.3 Строительство гостевых домов

- Intent / role: hospitality-shaped local page for Sochi-specific demand
- Current readiness status: `Owner input required`
- Factual material already exists:
  - page intent defined in launch-core;
  - Sochi market logic is plausible.
- Proof assets already exist:
  - no verified guest-house case in workspace;
  - no floorplan-like materials;
  - no testimonial or photo evidence.
- What is missing:
  - подтверждение, что это реальный service scope компании;
  - минимум 1 доказуемый объект;
  - owner-approved wording without investment promises;
  - FAQ facts and planning constraints.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `hold until missing assets are collected`

### 3.4 Реконструкция и капитальный ремонт зданий

- Intent / role: separate intent for rebuilding / upgrading an existing object
- Current readiness status: `Partial`
- Factual material already exists:
  - page intent defined in launch-core;
  - service logic is commercially understandable.
- Proof assets already exist:
  - no case pack in workspace;
  - no before/after set;
  - no clear example of scope boundaries.
- What is missing:
  - case with initial problem, work scope and result;
  - photos before/after;
  - practical FAQ "когда реконструкция уместна";
  - owner-approved public wording for risk-sensitive claims.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `publish after light enrichment` only if one convincing reconstruction case can be reconstructed from real materials.

### 3.5 Фасадные работы

- Intent / role: narrower service page with potentially faster conversion than full construction
- Current readiness status: `Asset collection required`
- Factual material already exists:
  - page role and intent defined in launch-core.
- Proof assets already exist:
  - no verified facade case;
  - no usable photo set;
  - no materials/methods inventory.
- What is missing:
  - перечень видов фасадных работ;
  - material/method facts;
  - photos of process and result;
  - at least 1 case ref;
  - FAQ by seasonality and scope;
  - careful warranty language.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `hold until missing assets are collected`

### 3.6 Строительство коммерческих объектов

- Intent / role: optional B2B page for small / mid-scale non-residential projects
- Current readiness status: `Blocked for launch`
- Factual material already exists:
  - only high-level page intent from launch-core;
  - public legal activity includes non-residential construction at a registry level.
- Proof assets already exist:
  - no verified commercial case in workspace;
  - no public-ready commercial proof set;
  - no approved client-safe wording.
- What is missing:
  - owner confirmation that this is true launch scope;
  - at least 1 real commercial case;
  - photos and work scope;
  - public claim boundaries;
  - service-type list that can be defended publicly.
- Business Owner review mandatory: `Yes`
- Launch recommendation: `hold until missing assets are collected`

## 4. Case-Page Evidence Inventory

Главный вывод по case layer: в текущем доступном контексте нет ни одного готового case pack. Все case pages сейчас упираются в отсутствие task / scope / result / photos / before-after / testimonial level facts.

### 4.1 Частный дом на участке со сложным рельефом

- What it is supposed to prove: local competence in Sochi terrain conditions
- Related service pages: `Строительство домов под ключ`, `Монолитные работы`
- Available evidence:
  - launch rationale exists;
  - local relevance is strong in theory.
- Missing evidence:
  - task;
  - work scope;
  - result;
  - photos;
  - location detail fit for publication;
  - quote / testimonial;
  - timeline.
- Risk level for publication: `High`
- Recommendation: `not launch-ready`

### 4.2 Монолитный каркас и конструктив частного объекта

- What it is supposed to prove: structural competence and hidden-works discipline
- Related service pages: `Монолитные работы`, `Строительство домов под ключ`
- Available evidence:
  - only the target proof narrative defined in launch-core.
- Missing evidence:
  - actual object identity;
  - work scope;
  - process photos;
  - result;
  - timeline;
  - location context.
- Risk level for publication: `High`
- Recommendation: `not launch-ready`

### 4.3 Реконструкция существующего здания

- What it is supposed to prove: ability to work with existing buildings, not just greenfield construction
- Related service pages: `Реконструкция и капитальный ремонт зданий`, `Фасадные работы`
- Available evidence:
  - target proof narrative from launch-core.
- Missing evidence:
  - before/after;
  - initial condition;
  - actual work scope;
  - result statement;
  - photos;
  - publication-safe facts.
- Risk level for publication: `High`
- Recommendation: `needs reconstruction from available materials` if real archive exists outside workspace; otherwise `not launch-ready`

### 4.4 Гостевой или небольшой коммерческий объект

- What it is supposed to prove: hospitality / commercial competence
- Related service pages: `Строительство гостевых домов`, `Строительство коммерческих объектов`
- Available evidence:
  - none in current workspace.
- Missing evidence:
  - case existence itself;
  - task;
  - scope;
  - result;
  - visuals;
  - publication-safe context.
- Risk level for publication: `Very high`
- Recommendation: `not launch-ready`

## 5. Supporting Content Inventory

### 5.1 FAQ clusters

Current status: `Partial`

What exists:

- FAQ clusters are defined structurally in canon and launch-core.

What is missing:

- real answers approved by owner / subject-matter side;
- page-linked fact base for steps, constraints, timing, preparation, scope boundaries;
- consistent reusable FAQ items in content-entity format.

Assessment:

- FAQ shells can be prepared now;
- publishable FAQ content should wait for service facts and owner confirmation.

### 5.2 Supporting topics

Current status: `Partial`

Topics with potential after light enrichment:

- `Как подготовить участок к строительству дома в Сочи`
- `Что влияет на стоимость строительства дома в Сочи`
- `Когда реконструкция выгоднее нового строительства`

Topic currently at risk of empty theorizing:

- `Монолит, блок или комбинированная схема: что учитывать в сочинском климате`

Reason:

- without owner/engineer fact input this topic can easily become generic SEO filler instead of real local expertise.

### 5.3 Trust / support pages

#### About

- Current status: `Partial`
- What exists:
  - legal entity identity;
  - city anchor `Сочи`;
  - SRO membership signal.
- What is missing:
  - public company narrative;
  - process description;
  - project proof blocks;
  - people / team facts safe for publication;
  - credibility copy beyond registry facts.

#### Contacts

- Current status: `Owner input required`
- What exists:
  - legal address in public registries;
  - recommended launch region cluster.
- What is missing:
  - public phone;
  - public messengers;
  - public email;
  - contact CTA truth;
  - clear service-area wording approved for launch.

Assessment:

- `About` can be drafted from verified company facts but still needs enrichment.
- `Contacts` cannot be honestly published as a conversion page until real contact channels are confirmed.

## 6. Media and Visual Evidence Inventory

Current status for launch-core media: `Asset collection required`

Findings from current workspace:

- no image files found;
- no video files found;
- no gallery packs found;
- no case-photo folders found;
- no before/after sets found;
- no asset-to-page mapping found.

Launch implication:

- there is currently no usable visual evidence base inside the accessible workspace;
- any service or case page that depends on visual proof should be treated as visually under-evidenced until a real archive is collected and mapped to entities.

Most critical visual gaps:

- house-build process photos;
- monolith stage photos;
- reconstruction before/after;
- facade result photos;
- hero-quality brand-safe site visuals.

## 7. Reviews / Testimonials / Trust Evidence

Current status: `Partial`

What exists:

- company legal existence is publicly verifiable;
- company city anchor is publicly verifiable;
- company SRO membership is publicly visible.

What does not currently exist in accessible inventory:

- publishable testimonials;
- owner-approved review wording;
- named client quotes;
- documented public permissions for quote use;
- structured trust blocks tied to pages/cases.

Important note:

- third-party anonymous review pages are not treated as usable launch evidence;
- trust evidence for launch should come from verifiable company facts or owner-approved client material.

## 8. Global Settings / Business Facts Readiness

### Ready or mostly ready

- `company_name` — `ООО «ЭКОСТРОЙКОНТИНЕНТ»`
- `launch region recommendation` — `Сочи / Большой Сочи` as recommended cluster
- `legal address / company city anchor` — public registry-level data exists
- `organization credibility baseline` — legal registration + SRO membership

### Partial

- `about/company narrative basics` — can be derived partially from verified company facts, but needs owner shaping
- `local SEO truth for public pages` — city anchor exists, but public contact/service-area phrasing is not final

### Missing or owner-dependent

- `phone`
- `messengers`
- `public email`
- `contact CTA truth`
- `primary service area wording approved for site use`
- `public-facing differentiators that owner is ready to defend`

Assessment:

- global legal identity exists;
- global conversion identity is not yet launch-ready.

## 9. Launch Readiness by Page

| Page | Readiness | Main blocker | Missing assets | Owner review needed | Recommended next action |
| --- | --- | --- | --- | --- | --- |
| `/` | Partial | no page-ready proof set | hero visuals, service proof blocks, CTA truth | Yes | draft after global facts + top proof assets are collected |
| `/about` | Partial | trust content too thin | company narrative, process, project proof | Yes | compile owner facts + SRO/legal baseline + proof blocks |
| `/contacts` | Owner input required | no confirmed public contact set | phone, messengers, email, service-area statement | No for basic page, Yes for claims | owner confirms contact truth first |
| `/services/stroitelstvo-domov-pod-klyuch` | Partial | missing case/photo depth | case refs, photos, FAQ facts, scope details | Yes | collect 1-2 house case packs and service facts |
| `/services/monolitnye-raboty` | Partial | no monolith proof pack | stage photos, case ref, methods/process facts | Yes | assemble one strong monolith case before drafting final copy |
| `/services/stroitelstvo-gostevyh-domov` | Owner input required | service scope not yet proven | case, photos, planning facts, approved wording | Yes | confirm real scope and collect one valid object |
| `/services/rekonstrukciya-kapitalnyy-remont-zdaniy` | Partial | no before/after evidence | reconstruction case, before/after, scope boundaries | Yes | find one reconstructable project and build proof pack |
| `/services/fasadnye-raboty` | Asset collection required | no visible evidence | photos, methods, case ref, FAQ facts | Yes | do not draft final page until visuals and scope exist |
| `/services/stroitelstvo-kommercheskih-obektov` | Blocked for launch | no defensible proof inventory | commercial case, photos, scope, claims | Yes | remove from launch unless owner supplies real B2B proof |
| `/cases/chastnyy-dom-na-slozhnom-relefe` | Blocked for launch | no case pack | task, scope, result, photos, quote | Yes if flagship | build case passport from real archive or postpone |
| `/cases/monolitnyy-karkas-chastnogo-obekta` | Blocked for launch | no case pack | task, scope, result, stage photos | Yes if flagship | build case passport from real archive or postpone |
| `/cases/rekonstrukciya-suschestvuyuschego-zdaniya` | Blocked for launch | no before/after proof | case facts, before/after, result, photos | Yes if flagship | reconstruct from archive only if enough evidence exists |
| `/cases/gostevoy-ili-kommercheskiy-obekt` | Blocked for launch | case existence unconfirmed | everything | Yes | exclude from launch unless a real object is confirmed |
| `/blog/podgotovka-uchastka-k-stroitelstvu-v-sochi` | Partial | needs practical local facts | owner/engineer input, examples | No | draft after collecting service FAQs |
| `/blog/ot-chego-zavisit-stoimost-stroitelstva-doma-v-sochi` | Partial | risk of generic copy | cost drivers, exclusions, approved wording | No | draft only with owner-approved pricing logic |
| `/blog/monolit-ili-blok-dlya-stroitelstva-v-sochi` | Asset collection required | no subject-matter fact base | technical viewpoint, examples | No | postpone if expert input is unavailable |
| `/blog/kogda-rekonstrukciya-vygodnee-novogo-stroitelstva` | Partial | no real examples | comparative facts, one supporting case | No | draft after one reconstruction case is clarified |

## 10. Critical Gaps and Acquisition Priorities

### Highest-priority gaps

1. No verified case packs for any launch case page.
2. No usable photo archive in the accessible workspace.
3. No confirmed public contact set for `/contacts`.
4. No owner-approved claims for prices, сроки, guarantees and scope boundaries.
5. No publishable testimonials / reviews.
6. No proof inventory for `Строительство гостевых домов`.
7. No proof inventory for `Строительство коммерческих объектов`.
8. No structured FAQ fact base tied to services.

### Fastest to close

- confirm public phone, messengers, email and service-area wording;
- collect legal/trust baseline into reusable `About` and footer facts;
- identify whether at least 1 house project and 1 monolith project can be turned into real case passports.

### Owner-decision dependent

- whether guest-house construction is real launch scope;
- whether commercial objects stay in launch-core or move out;
- which claims about price, timeline and guarantees are safe for publication;
- which cases are flagship and require stricter review.

### Asset-collection dependent

- house-build photos;
- monolith process photos;
- reconstruction before/after;
- facade visuals;
- testimonials with publication permission.

### Pages that should probably wait

- `Строительство коммерческих объектов`
- `Гостевой или небольшой коммерческий объект`
- `Фасадные работы`, if no visuals surface quickly

## 11. Recommended Next Step

Следующий шаг после этого register:

1. Провести owner session на 60-90 минут только по factual collection:
   - контакты;
   - service scope;
   - safe claims;
   - список реальных объектов.
2. Собрать minimum evidence pack по каждому кандидату в launch:
   - case name;
   - task;
   - scope;
   - result;
   - 5-15 usable photos;
   - quote permission status.
3. Ужать launch-core до того набора страниц, который реально проходит по доказательной базе.
4. Превратить surviving pages в production backlog:
   - page brief;
   - missing assets;
   - owner review flag;
   - publish gate checklist.

Правильный результат после этого документа: короткая production queue и owner collection list, а не ещё один широкий стратегический spec.
