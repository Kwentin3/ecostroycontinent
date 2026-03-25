# Public Shell Polish Plan, Экостройконтинент

## 1. Executive summary

Текущий public homepage shell уже canon-safe: он остается read-side only, temporary decorative layer и не тянет в проект вторую truth model.

Но визуально он еще не выглядит как аккуратная временная заставка. Сейчас это скорее ранний collage shell с тремя явными дефектами:

- один tile реально сломан;
- композиция читается как старт длинной ленты вниз;
- под заголовком слишком много служебной копии для temporary shell.

Нужен узкий autonomous execution batch, который доведет shell до почти завершенной poster-like first viewport без scope creep и без обращения к Content Core / MediaAsset truth.

Рекомендованный verdict для следующего execution batch: `must-do shell polish`, но только в границах `app/page.js` и `components/public/public-ui.module.css` с очень осторожным, локальным fallback behavior.

## 2. Current shell review

### What the current shell is doing

- `app/page.js` сейчас рендерит hardcoded header, status badge, login icon и mosaic из 6 Unsplash images.
- `components/public/public-ui.module.css` задает двухколоночный hero, 3-column mosaic, фиксированные карточки по 220px высотой и mobile stacking.

### What the live viewport showed

На desktop viewport 1920x953 shell показывает:

- title + status badge в левом верхнем блоке;
- login icon в правом верхнем углу;
- длинный explanatory paragraph;
- two fact cards under the paragraph;
- 6-tile mosaic справа, продолжающийся ниже fold.

Measured layout facts from the live review:

- `innerHeight = 953`
- `scrollHeight = 1131`
- `contentBottom = 178`

Interpretation:

- page is not literally "endless";
- but it does visibly overflow enough to read like the start of a feed, not like a finished poster;
- the bottom row being cut off creates the exact "mosaic goes downward" feeling the owner flagged.

### Broken image evidence

One tile is genuinely broken, not just visually weak.

- `document.images[3]` had `naturalWidth = 0`
- its source returned HTTP `404`
- the browser exposed raw alt text inside the empty white tile

So the defect is not a layout-only issue. It is:

- a dead asset URL;
- plus missing graceful fallback;
- plus decorative shell copy leaking into the card when the asset fails.

### Copy density evidence

The shell currently carries more helper copy than a temporary placeholder should:

- eyebrow
- title
- status badge
- explanatory paragraph
- two fact cards

That is too much explanation for a shell whose job is to look intentional, not editorial.

### Login affordance evidence

The login icon is present and accessible, but it still feels a little isolated from the rest of the composition.

In CSS there are no explicit hover/focus-visible states for the icon. That means the affordance is technically usable, but not yet confidently designed.

## 3. Owner feedback and additional findings

### Owner feedback that must be addressed

1. The mosaic scrolls. For a placeholder page that reads as odd and unfinished.
2. One photo is missing. That is not acceptable even for a temporary shell.
3. The legend / explanatory text under the title is extra and should probably be removed or radically simplified.

### Additional findings from the live review

1. The shell has a poster-like opportunity, but it is not yet using it.
2. The page is only mildly taller than the viewport, yet the visible bottom-row continuation still creates a feed-like read.
3. The broken tile is a trust defect, not a cosmetic blemish.
4. The login icon should stay, but it needs a better visual tether to the rest of the header area.
5. Any fallback must remain purely decorative and isolated. It must not create a new media architecture.

## 4. Canon compatibility check

This shell polish batch is canon-compatible only if it stays inside these boundaries:

- Public Web remains read-side only.
- Admin Console remains write-side only.
- Content Core remains the source of truth for content and published revisions.
- Temporary homepage shell remains temporary decorative layer.
- Unsplash / decorative images do not become a second media architecture.
- No page-builder logic, no CMS model, no Content Core imports, no MediaAsset ownership changes.

The current shell already satisfies the broad canon boundary because it is hardcoded and isolated. The polish batch must preserve that by staying local to the public shell layer.

## 5. Problem classification

| Issue | Current evidence | Classification | Batch decision |
|---|---|---|---|
| Broken tile / 404 image | One image URL returns 404 and shows raw alt text in layout | `must-fix now` | Replace dead source and add decorative fallback |
| Feed-like vertical continuation | `scrollHeight` exceeds viewport and bottom row is visibly cut off | `must-fix now` | Recompose as a poster-like first viewport; small technical overflow is acceptable, but not a visually obvious second clipped mosaic band |
| Extra legend / supporting copy | Paragraph + two fact cards under title | `must-fix now` | Remove or reduce to a minimal single-line note |
| Mosaic density / tile count | 6 tiles create a downward collage read | `must-fix now` | Reduce tile count if that is the cleanest way to remove the feed read; six is not a requirement |
| Login affordance | Visible but slightly detached; no explicit hover/focus states | `should-fix in same batch` | Add clear interaction states, keep it minimal; do not inflate it into a labeled CTA unless affordance remains weak |
| Micro balance polish | Shadows, spacing, and tile ratios can be tightened | `optional polish` | Only after the core batch is done |
| New content/media truth | Would introduce new data ownership or shell-specific media layer | `do not do now / scope-risk` | Forbidden |

### Explicit call on the first viewport

Yes, the first screen should resolve as one almost finished poster-like viewport on desktop.

That does not mean "zero scroll in every device forever."

It does mean that a small technical overflow is acceptable only if it does not produce a visually obvious second clipped strip of mosaic or any feeling that the page is inviting the user down a feed.

It does mean:

- no visible feel of an endless down-page mosaic;
- no second visible row that looks like the beginning of a gallery feed;
- no copy block that competes with the title and image composition.

## 6. Recommended autonomous polish batch

### Batch goal

Turn the current shell into a deliberate temporary poster:

- clean;
- compact;
- decorative;
- visibly intentional;
- still clearly temporary;
- still clearly read-side only.

### Must-fix inside the batch

1. Remove the dead tile source and prevent broken-image artifacts from surfacing.
2. Remove or drastically simplify the legend/supporting copy below the title.
3. Recompose the hero so the first desktop viewport reads as a finished shell, not the start of a long collage.
4. Reduce tile count if needed to keep the composition poster-like; do not preserve six tiles as a requirement.

### Should-fix in the same batch

1. Add explicit hover and focus-visible states to the login icon.
2. Tighten the login icon's visual balance so it feels intentionally placed, not floating separately.
3. Keep the login affordance minimal; avoid adding a label or a large tooltip unless testing shows the icon is not discoverable.
4. Reduce tile count or redistribute tile spans so the mosaic stops reading as an endless vertical sequence.

### Optional polish

1. Fine-tune spacing, corner radii, shadows, and typography after the layout is stable.
2. Refine mobile stacking only if it is affected by the desktop recompose.

### Do not do now

1. Do not introduce Content Core or MediaAsset as homepage image sources.
2. Do not create a separate media pipeline for the shell.
3. Do not turn the shell into a marketing homepage strategy or a broader redesign.
4. Do not add animation, infinite scroll, marquee behavior, or carousel logic.

## 7. Execution order by sub-batch

### Sub-batch A: asset hygiene and fallback

- Remove the dead URL.
- Decide whether the shell keeps the same number of decorative slots or drops one slot entirely.
- Add a purely decorative fallback for failed images so the layout never exposes raw alt text, placeholder copy, or any other text artifact inside the tile.

Why first:

- this is the trust defect;
- the rest of the visual balance should be tuned against the final image count.

### Sub-batch B: copy collapse

- Remove the explanatory paragraph unless a single short line is still needed.
- Remove the two fact cards unless one tiny status note is required.
- Keep the title and the `В разработке` badge.

Why second:

- the shell should look like a poster first and a page second;
- copy density directly drives the feeling of "unfinished content below."

### Sub-batch C: layout recompose

- Reduce the shell to a constrained first-screen composition.
- Limit the mosaic so it does not read like a feed continuing downward.
- If needed, move from free-flow masonry to a more fixed montage frame.
- Prefer fewer tiles if that is the cleanest way to keep the poster-like balance.
- Preserve decorative richness, but cap the visible composition.

Why third:

- this is the main UX/layout correction;
- it should be done after the image count and copy density are known.

### Sub-batch D: login affordance polish

- Add hover and focus-visible treatment.
- Make the entry point feel intentional and anchored.
- Keep the control minimal so it does not become a second navigation element.
- Do not promote the icon into a full labeled button unless the affordance remains weak after visual treatment.

Why last:

- this is polish, not the core defect;
- it should be tuned after the page composition is stable.

### Sub-batch E: proof pass

- Re-capture the desktop viewport.
- Re-check broken image handling.
- Confirm the shell still reads as temporary and decorative.

## 8. Repo / layer impact map

### Likely touched files

- `app/page.js`
- `components/public/public-ui.module.css`

### Possible but optional touched file

- a tiny helper inside `components/public/` only if extracting the decorative tile logic makes the shell simpler without changing ownership boundaries

### What should stay untouched

- `lib/content-core/*`
- `lib/read-side/*`
- `db/*`
- `app/admin/*`
- admin contracts and PRD files

### Layer intent

- `app/page.js`: shell composition, status copy, login entry, decorative tile list
- `components/public/public-ui.module.css`: layout, sizing, scroll containment, hover/focus, fallback presentation
- nothing else should be needed for this batch

## 9. Risks and anti-drift notes

### Anti-drift guardrails

- Keep the shell decorative.
- Keep it hardcoded.
- Keep it isolated from the content model.
- Keep fallback behavior local to the shell.
- Keep the login icon a small affordance, not a larger nav system.

### What would be drift

- adding a shell-specific media database or model;
- pulling homepage imagery from Content Core or MediaAsset records;
- turning the shell into an editorial/public content surface;
- broad branding or marketing redesign;
- adding a second source of truth for decorative assets;
- replacing the shell problem with a new homepage strategy problem.

### Specific risk with fallback handling

If fallback is implemented as a visible text label, pseudo-content card, or any other text artifact inside the tile, it will create the exact wrong signal.

The fallback must be:

- decorative;
- silent;
- isolated;
- non-canonical.

## 10. Proof expectations after implementation

The batch should be considered done only if the next proof pass shows:

1. Desktop viewport looks like one finished temporary poster, not a long collage feed.
2. No broken tile is visible.
3. No raw alt text or image-error artifacts are exposed.
4. The explanatory legend is gone or radically simplified.
5. The login icon still reads as the entry point and now has clear hover/focus affordance without becoming a heavy CTA.
6. The page still contains no Content Core / MediaAsset dependency.

### Recommended proof artifacts

- one desktop screenshot at a common large viewport;
- one smaller viewport screenshot to confirm responsive collapse;
- a DOM/image check confirming that failed assets are handled without visible artifacts;
- a click-through check that the login icon still lands in `/admin/login`;
- a quick scroll check showing the first viewport no longer reads as a feed start.

## 11. Final recommendation

Approve a narrow autonomous shell-polish batch.

The batch should be limited to:

- visual composition;
- copy reduction;
- broken-image fallback;
- login affordance polish.

The batch should not expand into:

- new public homepage architecture;
- new media truth;
- new content logic;
- broader branding work.

If the next execution keeps those boundaries, the shell can become a clean temporary poster without drifting away from the canon.
