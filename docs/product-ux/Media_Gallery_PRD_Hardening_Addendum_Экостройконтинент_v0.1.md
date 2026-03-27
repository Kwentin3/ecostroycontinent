# Media Gallery PRD Hardening Addendum

Статус: PRD hardening addendum v0.1
Назначение: короткое укрепление PRD `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md` перед переходом к autonomous implementation planning.
Опорные артефакты:
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`
- `docs/reports/2026-03-27/eco.media-gallery-prd-landscape-intake.v1.report.md`

## 1. Purpose of this addendum

Этот addendum не переписывает PRD и не расширяет scope.
Он фиксирует минимальный набор clarifications, prerequisites и guardrails, без которых следующий шаг — autonomous implementation planning — будет слишком подвержен drift.

## 2. Confirmed hardening notes

### 2.1 V1 image-only boundary

V1 относится только к `image` media surface.
V1 не вводит `video` / `document` support и не должен предполагать несуществующие media contracts за пределами image-only модели.

### 2.2 Card status truth

V1 не вводит новую параллельную status machine для media cards.
Карточечные сигналы статуса должны выводиться из уже существующего revision/readiness truth или из отдельного явно утверждённого contract decision.

До отдельного contract decision implementation planning не имеет права придумывать новый набор состояний “для удобства UI”.

### 2.3 Usage aggregation truth

`usage visibility`, `usage count`, `used / unused` и `archive/delete blocking` не могут строиться на UI heuristics, статических labels или частичных клиентских догадках.

Для этих функций требуется явный aggregation layer over references.
Этот слой должен считаться source of truth для usage-related UI signals и safety rules.

### 2.4 Broken asset semantics

V1 не должен слепо смешивать в один статус:
- missing/broken binary or admin preview path;
- public delivery/CDN degradation.

Implementation planning должно либо:
- различать эти failure classes,
- либо честно зафиксировать, какой именно broken signal входит в V1 и какой не входит.

## 3. Explicit prerequisite decisions before autonomous implementation planning

### 3.1 Upload lifecycle prerequisite

Overlay-first upload flow считается уже зафиксированным user-visible outcome.
Но до запуска autonomous implementation planning должен быть выбран и утверждён один технический lifecycle для unsaved upload state:
- in-browser temporary state;
- temporary persisted draft;
- upload-finalize flow.

Без этого решения implementation planning не считается ready.

### 3.2 Variant scope decision

Для `derived variant` действует жёсткая развилка:
- либо derived variant уходит в `V1.1 / V2`;
- либо он остаётся в `V1` только при explicit minimal contract note о lineage semantics.

Если derived variant остаётся в `V1`, до implementation planning должно быть явно зафиксировано минимум следующее:
- derived variant создаёт новый `media_asset`, а не silently overwrites existing published asset;
- lineage semantics признана и допустима для V1;
- published overwrite остаётся запрещённым.

Если такая contract note не утверждена, derived variant должен считаться out of V1.

### 3.3 Draft reuse policy

До autonomous implementation planning должно быть явно решено одно из двух:
- freshly uploaded draft asset может участвовать в downstream editorial flows сразу;
- reuse остаётся published-only до отдельного contract change.

Этот пункт нельзя оставлять на усмотрение реализации, потому что он влияет на query layer, picker behavior и рабочий смысл upload flow.

## 4. Guardrails for future implementation planning

1. Не вводить новый скрытый media-status vocabulary без contract approval.
2. Не возвращать generic SEO-looking fields на `media_asset`, пока нет подтверждённого persistence contract.
3. Не реализовывать usage visibility через placeholder logic или string heuristics.
4. Не смешивать storage/admin-preview failures и CDN/public-delivery failures в один ложный “broken” without explicit rule.
5. Не трактовать upload overlay как purely visual concern: за ним должен стоять утверждённый lifecycle.
6. Не оставлять `derived variant` внутри V1 как размытый “можно потом додумать”. Либо contract note, либо defer.
7. Не менять draft reuse policy молча в процессе реализации.

## 5. Final readiness statement

С текущим PRD можно переходить к autonomous implementation planning только после минимального hardening по следующим точкам:
- upload lifecycle chosen and approved;
- draft reuse policy explicitly fixed;
- variant scope explicitly fixed;
- usage aggregation declared as explicit source-of-truth layer;
- broken asset semantics bounded honestly;
- image-only boundary preserved explicitly.

Итоговая оценка готовности:
- PRD не требует rewrite;
- PRD достаточно силён по продуктовой рамке;
- PRD становится пригодным для autonomous implementation planning после закрытия перечисленных prerequisite decisions.
