# ECO.MEDIA_GALLERY.CONTINUATION_WAVE.v1.report

## Executive Summary

Continuation wave для `Медиатеки` реализована и доставлена на живой сервер.

Эта волна добрала три практических слоя поверх уже shipped V1:
- richer usage visibility в inspector;
- archive / restore safety flow для неиспользуемых ассетов;
- minimal draft-only image editing внутри текущего overlay, без variant flow.

Фича проверена live через Playwright под `SEO Manager`.

Итоговая оценка: continuation wave пригодна к использованию. Сам media workspace остался стабильным, а новые возможности не сломали upload/create и не размазали already-fixed границы `draft-only` и `no hidden variant semantics`.

## Реализованный Todo

- [x] Добрать usage summary в inspector на базе существующих ссылок `collections / services / cases / pages`
- [x] Добавить честный archive / restore flow только для безопасных, неиспользуемых ассетов
- [x] Показать archived state в library summary, filters, card badges и inspector copy
- [x] Добавить minimal image editing в текущий media overlay
- [x] Удержать image editing строго в `draft-only` модели без скрытых variants
- [x] Сохранить published asset guardrail с явным disabled reason
- [x] Проверить, что upload/create flow не сломался после lifecycle и editor changes
- [x] Выкатить изменения в `main`, собрать image и вручную задеплоить сервер
- [x] Прогнать live verification через Playwright и сохранить proof screenshot

## Что доставлено

### 1. Usage + safety

FACT
- Inspector теперь показывает `Использование` не только как общий флаг, а как summary по существующим связям.
- Для ассета с реальными ссылками archive action блокируется честно и объясняет причину.
- Для ассета без ссылок archive action доступен.

Basis
- code: `lib/admin/media-gallery.js`
- code: `components/admin/MediaGalleryWorkspace.js`
- live behavior confirmed in Playwright

### 2. Archive / restore lifecycle

FACT
- Для `media_asset` добавлен lifecycle слой `active / archived` без отдельной parallel status machine.
- В UI появились:
  - filter `В архиве`;
  - archived badge на карточке;
  - archived state в inspector;
  - actions `В архив` / `Вернуть из архива`.

Basis
- code: `lib/content-core/schemas.js`
- code: `app/api/admin/media/library/[entityId]/lifecycle/route.js`
- code: `components/admin/MediaGalleryWorkspace.js`
- live behavior confirmed in Playwright

### 3. Minimal image editing

FACT
- В edit overlay появился tab `Изображение`.
- Для draft assets доступны:
  - rotate left / right;
  - flip horizontal / vertical;
  - crop by selection;
  - reset.
- Edited binary сохраняется как новая версия того же draft asset, без variant lineage semantics.
- Для published assets binary editing заблокирован и явно объяснён.

Basis
- code: `components/admin/MediaImageEditorPanel.js`
- code: `components/admin/MediaGalleryWorkspace.js`
- code: `app/api/admin/media/library/[entityId]/route.js`
- live behavior confirmed in Playwright

### 4. Create/upload regression stayed healthy

FACT
- Upload/create flow после continuation wave остаётся рабочим.
- Новый asset создаётся через текущий media overlay и появляется в `Медиатеке`.

Basis
- code: `app/api/admin/media/library/create/route.js`
- live behavior confirmed in Playwright

## Live Verification Program

### Scenario 1. Used asset must expose richer usage and block archive

Asset
- `media gallery smoke`

Observed
- inspector показывает `Всего связей = 2`, `Черновики = 2`, `Коллекции = 2`;
- `Где используется` показывает две media-native collection links;
- кнопка `В архив` disabled;
- copy объясняет, что архив недоступен, пока есть ссылки.

Verdict
- PASS

### Scenario 2. Unused draft asset must archive and restore safely

Asset
- `tmp media upload smoke`

Observed
- archive action succeeded with message `Ассет переведён в архив.`;
- card получила badge `Архив`;
- summary counter `В архиве` вырос до `1`;
- filter `В архиве` показал ровно один asset;
- restore action succeeded with message `Ассет возвращён из архива.`;
- archived counter вернулся к `0`.

Verdict
- PASS

### Scenario 3. Draft-only image editing must work on draft asset

Asset
- `tmp media upload smoke`

Observed
- tab `Изображение` доступен;
- операция `Повернуть вправо` активировала локально изменённое состояние;
- metadata tab показал note `Изображение изменено локально`;
- save succeeded with message `Изображение и метаданные сохранены.`;
- file size changed from `68 Б` to `89 Б`, что подтверждает обновление binary.

Verdict
- PASS

### Scenario 4. Published asset must refuse image editing

Asset
- `probe` (`Опубликовано`)

Observed
- tab `Изображение` открывается как read-only explanation surface;
- все image-edit controls disabled;
- UI показывает explanation `У опубликованных ассетов binary overwrite запрещён. Для них нужен отдельный variant flow.`

Verdict
- PASS

### Scenario 5. Upload/create regression after continuation wave

Observed
- upload overlay принял image file;
- `Сохранить ассет` создал новый card;
- success message `Медиафайл загружен и появился в медиатеке.`;
- newly created asset сразу появился в grid и inspector.

Verdict
- PASS

## Proof Package

- Screenshot: [live-media-gallery-continuation-wave-post-deploy.png](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-03-27/live-media-gallery-continuation-wave-post-deploy.png)

## Delivery Data

FACT
- implementation commit: `3a2e3ef` `feat: extend media workspace safety and image editing`
- pushed to `origin/main`
- build-and-publish: `23648476569` `success`
- manual deploy: `23648537034` `success`
- deployed image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:df0a85ac2fd01766175410014cc889e4eba36014545e7622f697126c2d83614b`

## Residual Notes

DEFERRED
- CDN delivery remains degraded at infra level; sidebar still honestly shows `CDN: warn`. Это не регресс continuation wave.
- Derived variants remain out of scope and are still correctly not introduced by the editor.

RISK
- During live upload regression check a temporary proof asset `continuation wave smoke` was created in production content. It is harmless and orphaned, but ideally should be removed by the internal cleanup path.
- A separate ops issue surfaced while attempting cleanup through the server-side wrapper: module resolution inside the cleanup runtime wrapper does not currently match the deployed app image. Это не блокирует media feature, но мешает автоматической post-smoke cleanup на сервере.

## Final Assessment

Continuation wave delivered the intended next step without drifting into a larger DAM-style subsystem.

The most important product/engineering outcomes are now true at the same time:
- operator gets richer usage truth before acting;
- archive is safe and honest;
- image editing exists, but stays explicitly draft-only;
- published assets keep their guardrail;
- current media workspace remains the single primary surface.

Overall verdict:
- continuation wave is successfully shipped
- live verification passed
- residual issues are secondary and do not invalidate the feature delivery
