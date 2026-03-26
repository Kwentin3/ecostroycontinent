# EKOSTROY.UI.VERSTKA_NOTES_Р­РєРѕСЃС‚СЂРѕР№РєРѕРЅС‚РёРЅРµРЅС‚_v0.1

РЎС‚Р°С‚СѓСЃ: working notes
Р”Р°С‚Р°: 2026-03-26

Р­С‚Р° Р·Р°РјРµС‚РєР° РЅСѓР¶РЅР° РєР°Рє СЂР°Р±РѕС‡РёР№ С„Р°Р№Р» РґР»СЏ РЅР°РєРѕРїР»РµРЅРёСЏ РЅР°Р±Р»СЋРґРµРЅРёР№ РїРѕ РІС‘СЂСЃС‚РєРµ Рё РёРЅС‚РµСЂС„РµР№СЃРЅРѕР№ РїРѕРґР°С‡Рµ.
РљРѕРґ Р·РґРµСЃСЊ РЅРµ РјРµРЅСЏРµРј, С‚РѕР»СЊРєРѕ С„РёРєСЃРёСЂСѓРµРј Р·Р°РјРµС‡Р°РЅРёСЏ Рё Р±СѓРґСѓС‰РёРµ С‚РѕС‡РєРё РґР»СЏ РїР»Р°РЅР° СЂРµРґР°РєС‚СѓСЂС‹.

## Consolidated view

### What is already clear
- Left shell navigation should not behave like ordinary page content; it needs to stay available on long screens.
- Nested editor surfaces need a visible way to show depth and to return one level up.
- Right-side support/status blocks should feel more static and compact than the main editor scroll.
- Several screens repeat the same density problem: fields are too close together and the layout feels crowded.
- Some field names are semantically weak for ordinary users, especially where the UI already mixes business text, SEO text and internal workflow text.
- `РњРµРґРёР°`, `Р“Р°Р»РµСЂРµРё`, `РљРµР№СЃС‹`, `РЎС‚СЂР°РЅРёС†С‹` and `РЈСЃР»СѓРіРё` are one repeated pattern, not five unrelated bugs.
- `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` is a separate structural issue: the screen feels like a squeezed one-page split and not a comfortable CRUD surface.
- We likely need a shared shell pattern for nested content editors so the user does not have to relearn layout and navigation on every screen.
- The goal is consistent interface grammar across screens, not a giant monolith component.

### Priority clusters
1. Shell and navigation
2. Layout density and spacing
3. Nested depth and return path
4. Field semantics and naming
5. Reuse vs duplication in media flows
6. CRUD structure for РџРѕР»СЊР·РѕРІР°С‚РµР»Рё
7. Shared shell pattern for repeated editor surfaces

### Screens covered by these notes
- `РђРґРјРёРЅРєР°` shell and dashboard
- `РќР°СЃС‚СЂРѕР№РєРё`
- `РџСЂРѕРІРµСЂРєР°`
- `РњРµРґРёР°`
- `Р“Р°Р»РµСЂРµРё`
- `РљРµР№СЃС‹`
- `РЎС‚СЂР°РЅРёС†С‹`
- `РЈСЃР»СѓРіРё` by repeated pattern from chat context
- `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё`

### High-level direction
- Build one shared layout grammar for nested editors.
- Apply it first to `РњРµРґРёР°`, `Р“Р°Р»РµСЂРµРё`, `РљРµР№СЃС‹`, `РЎС‚СЂР°РЅРёС†С‹`, `РЈСЃР»СѓРіРё`.
- Keep `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` compatible with the grammar, but allow a lighter variant if it needs a more CRUD-oriented split.
- Use the same rules for sidebar, breadcrumb/depth, right rail, and work area so screen switching feels familiar instead of cognitively expensive.

### Canonized postures
- The left sidebar is global navigation only. The top depth/breadcrumb bar is the canonical way to show nested depth. The right rail is support/status only.
- `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` should stay inside the main content area as a lighter CRUD surface. It should not move into the support rail and should not become a nested content editor.
- `РџСЂРѕРІРµСЂРєР°` is the primary owner-facing decision packet surface. Its preview linkage, device toggle, and readiness hierarchy are core UX expectations, not optional experiments.
- `РњРµРґРёР°` is the source library of files and assets. `Р“Р°Р»РµСЂРµРё` are collections or albums built from those uploaded assets.
- Quick upload inside `РљРµР№СЃС‹`, `РЈСЃР»СѓРіРё`, or similar editors is a candidate anti-pattern until it is proven to reuse the existing media flow instead of creating a parallel one.
- Decision points and open layout questions in this file are informational only. If they conflict with the canonized postures in the carryovers plan, the plan wins.

### Canon precedence
- The canonized postures above are the current decision baseline.
- The `Decision points` section below is historical context only and must not override the canonized postures in the carryovers plan.

## Pending carry-overs from earlier discussion

- `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` should stay a real CRUD surface, not a squeezed nested editor. The list, add form, role, last activity, and deactivate actions still need a cleaner reading.
- `РџСЂРѕРІРµСЂРєР°` still needs the preview-linkage idea: selecting a field should help highlight the related area in the preview, and the preview should be able to switch between mobile and desktop/tablet views.
- `РџСЂРѕРІРµСЂРєР°` also needs the status hierarchy refined so readiness is visible higher on the screen, not only at the bottom.
- `РњРµРґРёР°` and `Р“Р°Р»РµСЂРµРё` still need small screen legends that explain, in plain language, what each surface is for and how they differ.
- The repeated editor family still needs the shared audit rail and field-density adjustments that we discussed, especially where long values and relation blocks make the screen feel crowded.

## Live notes

### 1. Р›РµРІР°СЏ РЅР°РІРёРіР°С†РёРѕРЅРЅР°СЏ РїР°РЅРµР»СЊ РЅРµ Р·Р°РєСЂРµРїР»РµРЅР°
- Surface: admin shell / left sidebar.
- Current observation: РїР°РЅРµР»СЊ РЅР°РІРёРіР°С†РёРё РІРµРґС‘С‚ СЃРµР±СЏ РєР°Рє РѕР±С‹С‡РЅС‹Р№ РїРѕС‚РѕРєРѕРІС‹Р№ Р±Р»РѕРє Рё РїСЂРѕРєСЂСѓС‡РёРІР°РµС‚СЃСЏ РІРјРµСЃС‚Рµ СЃРѕ СЃС‚СЂР°РЅРёС†РµР№.
- DOM check on `/admin`: `ASIDE`, `position: static`, `overflow-y: visible`, С‚Рѕ РµСЃС‚СЊ sticky/fixed РїРѕРІРµРґРµРЅРёСЏ РЅРµС‚.
- Why it matters: РЅР°РІРёРіР°С†РёСЏ РґРѕР»Р¶РЅР° РѕСЃС‚Р°РІР°С‚СЊСЃСЏ РґРѕСЃС‚СѓРїРЅРѕР№ РЅР° РґР»РёРЅРЅС‹С… СЌРєСЂР°РЅР°С…, РёРЅР°С‡Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ С‚РµСЂСЏРµС‚ РєРѕРЅС‚РµРєСЃС‚ Рё РІС‹РЅСѓР¶РґРµРЅ РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ РЅР°РІРµСЂС…, С‡С‚РѕР±С‹ РїРµСЂРµР№С‚Рё РІ РґСЂСѓРіРѕР№ СЂР°Р·РґРµР».
- Desired direction: СЃРґРµР»Р°С‚СЊ Р»РµРІСѓСЋ РїР°РЅРµР»СЊ СЃС‚Р°С‚РёС‡РµСЃРєРѕР№ РґР»СЏ viewport-СѓСЂРѕРІРЅСЏ shell, С‡С‚РѕР±С‹ main content СЃРєСЂРѕР»Р»РёР»СЃСЏ РѕС‚РґРµР»СЊРЅРѕ.
- Severity: medium.

### 2. Dashboard cards РІРёР·СѓР°Р»СЊРЅРѕ С‡РёС‚Р°СЋС‚СЃСЏ, РЅРѕ proof-data С€СѓРјРёС‚
- Surface: admin dashboard.
- Current observation: shell СЃС‚Р°Р» СЂСѓСЃСЃРєРёРј, РЅРѕ РєР°СЂС‚РѕС‡РєРё РґРµР№СЃС‚РІРёР№ РїРѕ-РїСЂРµР¶РЅРµРјСѓ РЅР°РїРѕР»РЅРµРЅС‹ proof data Рё Р°РЅРіР»РёР№СЃРєРёРјРё РЅР°Р·РІР°РЅРёСЏРјРё СЃСѓС‰РЅРѕСЃС‚РµР№.
- Why it matters: СЌС‚Рѕ РЅРµ Р»РѕРјР°РµС‚ shell, РЅРѕ СЃРѕР·РґР°С‘С‚ РѕС‰СѓС‰РµРЅРёРµ РЅРµР·Р°РІРµСЂС€С‘РЅРЅРѕСЃС‚Рё Рё РјРµС€Р°РµС‚ РѕС†РµРЅРёРІР°С‚СЊ РІС‘СЂСЃС‚РєСѓ РєР°Рє С‡РёСЃС‚С‹Р№ РїСЂРѕРґСѓРєС‚РѕРІС‹Р№ СЌРєСЂР°РЅ.
- Desired direction: РѕС‚РґРµР»СЊРЅРѕ РїРѕС‡РёСЃС‚РёС‚СЊ runtime/content layer, С‡С‚РѕР±С‹ РІРёР·СѓР°Р»СЊРЅР°СЏ РѕС†РµРЅРєР° shell РЅРµ СЃРјРµС€РёРІР°Р»Р°СЃСЊ СЃ proof fixtures.
- Severity: low.

### 3. Review/detail layout СѓР¶Рµ РїРѕР»РµР·РЅС‹Р№, РЅРѕ РїРµСЂРµРіСЂСѓР¶РµРЅ СЃР»СѓР¶РµР±РЅС‹РјРё Р±Р»РѕРєР°РјРё
- Surface: review detail / entity detail.
- Current observation: РґРІСѓС…РєРѕР»РѕРЅРѕС‡РЅР°СЏ СЃС…РµРјР° РїРѕРЅСЏС‚РЅР°СЏ, РЅРѕ РЅР° РґР»РёРЅРЅС‹С… СЃСѓС‰РЅРѕСЃС‚СЏС… СЌРєСЂР°РЅ Р±С‹СЃС‚СЂРѕ РїСЂРµРІСЂР°С‰Р°РµС‚СЃСЏ РІ РѕС‡РµРЅСЊ РІС‹СЃРѕРєРёР№ operational page.
- Live impression: Р»РµРІР°СЏ РєРѕР»РѕРЅРєР° СЃ С„РѕСЂРјРѕР№ Рё right preview РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ СЃРѕРґРµСЂР¶Р°С‚ РјРЅРѕРіРѕ РїРѕРІС‚РѕСЂСЏСЋС‰РµРіРѕСЃСЏ proof-data, РїРѕСЌС‚РѕРјСѓ СЌРєСЂР°РЅ РІС‹РіР»СЏРґРёС‚ С‚СЏР¶РµР»РµРµ, С‡РµРј РґРѕР»Р¶РµРЅ РґР»СЏ СЂР°Р±РѕС‡РµР№ РїСЂРѕРІРµСЂРєРё.
- Why it matters: РґР»СЏ Business Owner Рё РЅРµС‚РµС…РЅРёС‡РµСЃРєРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїР»РѕС‚РЅРѕСЃС‚СЊ РјРѕР¶РµС‚ Р±С‹С‚СЊ С‚СЏР¶С‘Р»РѕР№, РѕСЃРѕР±РµРЅРЅРѕ РµСЃР»Рё СЃР»СѓР¶РµР±РЅС‹С… РєР°СЂС‚РѕС‡РµРє РјРЅРѕРіРѕ.
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё СЃРѕРєСЂР°С‚РёС‚СЊ РїР»РѕС‚РЅРѕСЃС‚СЊ Р±РµР· РёР·РјРµРЅРµРЅРёСЏ СЃРјС‹СЃР»Р° workflow.
- Severity: low.

### 4. Р­РєСЂР°РЅ РіР»РѕР±Р°Р»СЊРЅС‹С… РЅР°СЃС‚СЂРѕРµРє С‚РµСЃРЅРѕРІР°С‚ РїРѕ РІРµСЂС‚РёРєР°Р»Рё Рё РІ Р±Р»РѕРєР°С… СѓРїСЂР°РІР»РµРЅРёСЏ
- Surface: `РќР°СЃС‚СЂРѕР№РєРё` / global settings editor.
- Current observation: РЅР° СЃРєСЂРёРЅС€РѕС‚Рµ РїРѕР»СЏ Рё РїСЂР°РІС‹Рµ status cards СЂР°СЃРїРѕР»РѕР¶РµРЅС‹ РѕС‡РµРЅСЊ РїР»РѕС‚РЅРѕ; РІРёР·СѓР°Р»СЊРЅРѕ С‡СѓРІСЃС‚РІСѓРµС‚СЃСЏ РЅРµС…РІР°С‚РєР° РІРѕР·РґСѓС…Р° РјРµР¶РґСѓ СЃРµРєС†РёСЏРјРё.
- Live impression: С‚РµРєСЃС‚РѕРІС‹Рµ РїРѕР»СЏ, С‡РµРєР±РѕРєСЃ, РІС‹РїР°РґР°СЋС‰РёР№ СЃРїРёСЃРѕРє Рё СЃРѕСЃРµРґРЅСЏСЏ readiness-РєРѕР»РѕРЅРєР° РѕР±СЂР°Р·СѓСЋС‚ РґРѕРІРѕР»СЊРЅРѕ РЅР°РїСЂСЏР¶С‘РЅРЅСѓСЋ РєРѕРјРїРѕР·РёС†РёСЋ, РѕСЃРѕР±РµРЅРЅРѕ РІРѕРєСЂСѓРі Р±Р»РѕРєР° СЃ РїРѕСЏСЃРЅРµРЅРёРµРј Рє РєРЅРѕРїРєРµ Рё РїСЂР°РІРѕР№ sidebar-РєРѕР»РѕРЅРєРѕР№.
- Why it matters: РґР»СЏ РЅРµС‚РµС…РЅРёС‡РµСЃРєРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ С‚Р°РєРѕР№ СЌРєСЂР°РЅ РІС‹РіР»СЏРґРёС‚ Р±РѕР»РµРµ В«Р°РґРјРёРЅСЃРєРёРјВ», С‡РµРј РґСЂСѓР¶РµР»СЋР±РЅС‹Рј, РґР°Р¶Рµ РµСЃР»Рё С‚РµРєСЃС‚С‹ СѓР¶Рµ СЂСѓСЃСЃРєРёРµ.
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ РІРµСЂС‚РёРєР°Р»СЊРЅС‹Рµ РѕС‚СЃС‚СѓРїС‹, С€РёСЂРёРЅСѓ Р»РµРІРѕР№ РєРѕР»РѕРЅРєРё Рё РѕС‰СѓС‰РµРЅРёРµ РёРµСЂР°СЂС…РёРё РјРµР¶РґСѓ form area Рё support cards.
- Severity: medium.

### 5. Р’Р»РѕР¶РµРЅРЅС‹Рµ СЌРєСЂР°РЅС‹ РЅРµ РґР°СЋС‚ СѓРґРѕР±РЅРѕРіРѕ РїСѓС‚Рё РЅР°Р·Р°Рґ РїРѕ СѓСЂРѕРІРЅСЋ
- Surface: nested admin flows, РѕСЃРѕР±РµРЅРЅРѕ `РџСЂРѕРІРµСЂРєР°` -> `РћС‚РєСЂС‹С‚СЊ РїСЂРѕРІРµСЂРєСѓ`, Р° С‚Р°РєР¶Рµ entity list -> entity detail -> history.
- Current observation: Сѓ nested screen РµСЃС‚СЊ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ content, РЅРѕ СЏРІРЅРѕР№ breadcrumb/map-of-depth РЅР°РІРёРіР°С†РёРё СЃРІРµСЂС…Сѓ РЅРµС‚; РІРѕР·РІСЂР°С‚ РІ РєРѕРЅС‚РµРєСЃС‚ РїСЂРёС…РѕРґРёС‚СЃСЏ РґРµР»Р°С‚СЊ С‡РµСЂРµР· sidebar РёР»Рё РѕС‚РґРµР»СЊРЅС‹Рµ СЃСЃС‹Р»РєРё.
- Why it matters: РїСЂРё РІР»РѕР¶РµРЅРЅРѕСЃС‚Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ С‚РµСЂСЏРµС‚ РѕС‰СѓС‰РµРЅРёРµ "РіРґРµ СЏ РЅР°С…РѕР¶СѓСЃСЊ" Рё "РєР°Рє РІРµСЂРЅСѓС‚СЊСЃСЏ РЅР° СѓСЂРѕРІРµРЅСЊ РІС‹С€Рµ" Р±РµР· Р»РёС€РЅРµРіРѕ РїРѕРёСЃРєР°.
- Desired direction: РїРѕС‚РѕРј РІС‹Р±СЂР°С‚СЊ РѕРґРёРЅ РёР· РґРІСѓС… РІР°СЂРёР°РЅС‚РѕРІ:
  - Р»РёР±Рѕ СЂР°СЃРєСЂС‹РІР°СЋС‰Р°СЏСЃСЏ РІР»РѕР¶РµРЅРЅРѕСЃС‚СЊ РІ Р»РµРІРѕР№ РїР°РЅРµР»Рё;
  - Р»РёР±Рѕ РІРµСЂС…РЅСЏСЏ РЅР°РІРёРіР°С†РёРѕРЅРЅР°СЏ РєР°СЂС‚Р° / breadcrumb, РїРѕРєР°Р·С‹РІР°СЋС‰Р°СЏ РѕСЃРЅРѕРІРЅРѕР№ СЌРєСЂР°РЅ Рё РїРѕРґСѓСЂРѕРІРµРЅСЊ.
- Severity: medium.

### 6. РњРµРґРёР°-СЂРµРґР°РєС‚РѕСЂ РІС‹РіР»СЏРґРёС‚ С‚РµСЃРЅРѕ РІ РІРµСЂС…РЅРµР№ С‡Р°СЃС‚Рё С„РѕСЂРјС‹
- Surface: `РњРµРґРёР°` -> `РћС‚РєСЂС‹С‚СЊ` -> media detail editor.
- Current observation: РІ РІРµСЂС…РЅРµРј Р±Р»РѕРєРµ СЂРµРґР°РєС‚РѕСЂР° РїРѕР»СЏ РёРґСѓС‚ РѕС‡РµРЅСЊ Р±Р»РёР·РєРѕ РґСЂСѓРі Рє РґСЂСѓРіСѓ; РІРёР·СѓР°Р»СЊРЅРѕ Р·Р°РјРµС‚РЅРѕ, С‡С‚Рѕ С„РѕСЂРјР° СЃР¶РёРјР°РµС‚СЃСЏ Рё С‚РµСЂСЏРµС‚ РІРѕР·РґСѓС… РјРµР¶РґСѓ adjacent controls.
- Live impression: РїРµСЂРІР°СЏ Р·РѕРЅР° СЃ `РЎРјС‹СЃР» РёР·РјРµРЅРµРЅРёСЏ`, `РќР°Р·РІР°РЅРёРµ`, `РћРїРёСЃР°РЅРёРµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ`, `РџРѕРґРїРёСЃСЊ`, `РџСЂРёРјРµС‡Р°РЅРёРµ Рѕ РїСЂР°РІР°С…` Рё `РџСЂРёРјРµС‡Р°РЅРёРµ РѕР± РёСЃС‚РѕС‡РЅРёРєРµ` С‡РёС‚Р°РµС‚СЃСЏ РєР°Рє dense operational form, Р° РЅРµ РєР°Рє СЃРїРѕРєРѕР№РЅС‹Р№ editor surface.
- Why it matters: РґР»СЏ РІРёР·СѓР°Р»СЊРЅРѕР№ РѕС†РµРЅРєРё СЌС‚Рѕ РІС‹РіР»СЏРґРёС‚ РјРµРЅРµРµ friendly Рё РїРѕРІС‹С€Р°РµС‚ СЂРёСЃРє accidental mistakes РїСЂРё Р·Р°РїРѕР»РЅРµРЅРёРё.
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё СѓРїСЂРѕСЃС‚РёС‚СЊ СЃРµС‚РєСѓ РІРµСЂС…РЅРµР№ С‡Р°СЃС‚Рё С„РѕСЂРјС‹ РёР»Рё СЃРѕРєСЂР°С‚РёС‚СЊ РєРѕР»РёС‡РµСЃС‚РІРѕ РїР°СЂР°Р»Р»РµР»СЊРЅС‹С… РїРѕР»РµР№ РІ РѕРґРЅРѕРј СЂСЏРґСѓ.
- Severity: medium.

### 7. Р“Р°Р»РµСЂРµСЏ РїРѕРІС‚РѕСЂСЏРµС‚ С‚Сѓ Р¶Рµ РїСЂРѕР±Р»РµРјСѓ РІР»РѕР¶РµРЅРЅРѕСЃС‚Рё Рё РїР»РѕС‚РЅРѕСЃС‚Рё
- Surface: `Р“Р°Р»РµСЂРµРё` -> `РћС‚РєСЂС‹С‚СЊ` -> gallery detail editor.
- Current observation: nested navigation Р·РґРµСЃСЊ С‚РѕР¶Рµ РЅРµ С‡РёС‚Р°РµС‚СЃСЏ РєР°Рє СЏРІРЅР°СЏ РєР°СЂС‚Р° СѓСЂРѕРІРЅРµР№, Р° СЃР°Рј СЌРєСЂР°РЅ Р·Р°РїРѕР»РЅРµРЅ Р±РѕР»СЊС€РёРј РєРѕР»РёС‡РµСЃС‚РІРѕРј РєР°СЂС‚РѕС‡РµРє С„Р°Р№Р»РѕРІ.
- Live impression: С„Р°Р№Р»С‹ РіР°Р»РµСЂРµРё Рё РѕСЃРЅРѕРІРЅРѕР№ С„Р°Р№Р» РёРґСѓС‚ РїР»РѕС‚РЅС‹Рј Р±Р»РѕРєРѕРј РєР°СЂС‚РѕС‡РµРє; proof data СЃРёР»СЊРЅРѕ С€СѓРјРёС‚ Рё СЃРѕР·РґР°РµС‚ РѕС‰СѓС‰РµРЅРёРµ РїРµСЂРµРіСЂСѓР¶РµРЅРЅРѕРіРѕ media picker-Р°.
- Why it matters: РґР»СЏ non-technical РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ С‚Р°РєРѕР№ СЌРєСЂР°РЅ С‚СЏР¶РµР»Рѕ РІРѕСЃРїСЂРёРЅРёРјР°РµС‚СЃСЏ РєР°Рє СЏСЃРЅР°СЏ СЂР°Р±РѕС‡Р°СЏ С„РѕСЂРјР°, РѕСЃРѕР±РµРЅРЅРѕ РµСЃР»Рё РЅСѓР¶РЅРѕ Р±С‹СЃС‚СЂРѕ РЅР°Р№С‚Рё РѕРґРёРЅ РєРѕРЅРєСЂРµС‚РЅС‹Р№ С„Р°Р№Р».
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё СЃРѕРєСЂР°С‚РёС‚СЊ РІРёР·СѓР°Р»СЊРЅС‹Р№ С€СѓРј РєР°СЂС‚РѕС‡РµРє, РґРѕР±Р°РІРёС‚СЊ СЏРІРЅС‹Р№ path-back Рё СѓР»СѓС‡С€РёС‚СЊ РіСЂСѓРїРїРёСЂРѕРІРєСѓ С„Р°Р№Р»РѕРІ.
- Severity: medium.

### 8. Р“Р°Р»РµСЂРµСЏ СЃРµРјР°РЅС‚РёС‡РµСЃРєРё РїРµСЂРµРіСЂСѓР¶РµРЅР° Рё РїР»РѕС…Рѕ РѕР±СЉСЏСЃРЅСЏРµС‚ РїРѕР»СЏ
- Surface: `Р“Р°Р»РµСЂРµРё` -> `РћС‚РєСЂС‹С‚СЊ` -> gallery detail editor.
- Current observation: РЅР°Р·РІР°РЅРёРµ РїРѕР»СЏ `РЎРјС‹СЃР» РёР·РјРµРЅРµРЅРёСЏ` РЅРµ РїРѕРјРѕРіР°РµС‚ РѕР±С‹С‡РЅРѕРјСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РёРјРµРЅРЅРѕ РѕС‚ РЅРµРіРѕ С…РѕС‚СЏС‚; РѕРЅРѕ Р·РІСѓС‡РёС‚ РІРЅСѓС‚СЂРµРЅРЅРµ Рё С‚РµС…РЅРёС‡РµСЃРєРё.
- Current observation: `РќР°Р·РІР°РЅРёРµ` Рё `РџРѕРґРїРёСЃСЊ` РґР»СЏ РѕР±С‹С‡РЅРѕРіРѕ С‡РµР»РѕРІРµРєР° РІС‹РіР»СЏРґСЏС‚ РїРѕС‡С‚Рё РєР°Рє СЃРёРЅРѕРЅРёРјС‹, С…РѕС‚СЏ РІ РІРµСЂСЃС‚РєРµ Рё SEO СЌС‚Рѕ СЂР°Р·РЅС‹Рµ СЃСѓС‰РЅРѕСЃС‚Рё.
- Why it matters: СЌРєСЂР°РЅ РЅРµ РѕР±СЉСЏСЃРЅСЏРµС‚ РєРѕРЅС‚РµРєСЃС‚ РїРѕР»РµР№, РїРѕСЌС‚РѕРјСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РґРѕР»Р¶РµРЅ СѓР¶Рµ Р·РЅР°С‚СЊ РІРЅСѓС‚СЂРµРЅРЅСЋСЋ РјРѕРґРµР»СЊ, С‡С‚РѕР±С‹ Р·Р°РїРѕР»РЅРёС‚СЊ С„РѕСЂРјСѓ Р±РµР· РѕС€РёР±РѕРє.
- Desired direction: РїРѕР·Р¶Рµ РїРµСЂРµРёРјРµРЅРѕРІР°С‚СЊ РїРѕР»СЏ С‚Р°Рє, С‡С‚РѕР±С‹ Р±С‹Р»Рѕ СЏСЃРЅРѕ, РіРґРµ С‚РµРєСЃС‚ СѓС‡Р°СЃС‚РІСѓРµС‚: Р·Р°РіРѕР»РѕРІРѕРє РєР°СЂС‚РѕС‡РєРё, РїРѕРґРїРёСЃСЊ РїРѕРґ РёР·РѕР±СЂР°Р¶РµРЅРёРµРј, SEO-РѕРїРёСЃР°РЅРёРµ, СЃР»СѓР¶РµР±РЅРѕРµ РїРѕСЏСЃРЅРµРЅРёРµ Рє РїСЂР°РІРєРµ Рё С‚.Рґ.
- Severity: high.
- Extra note: РѕР±С‰РёР№ UX СЌРєСЂР°РЅР° РїРѕРєР° РЅРµ РІС‹РіР»СЏРґРёС‚ friendly; Р»РѕРіРёРєР° Рё РЅР°Р·РІР°РЅРёСЏ РїРѕР»РµР№ Р·Р°РїСѓС‚С‹РІР°СЋС‚ Рё РЅРµ РІРµРґСѓС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ С€Р°РіР°Рј.

### 9. РљРµР№СЃ РїРѕРІС‚РѕСЂСЏРµС‚ РїСЂРѕР±Р»РµРјСѓ РІР»РѕР¶РµРЅРЅРѕСЃС‚Рё Рё СѓСЃРёР»РёРІР°РµС‚ РµС‘ СЃРІСЏР·Р°РЅРЅС‹РјРё СЃРїРёСЃРєР°РјРё
- Surface: `РљРµР№СЃС‹` -> `РћС‚РєСЂС‹С‚СЊ` -> case detail editor.
- Current observation: С‚РѕС‚ Р¶Рµ РїР°С‚С‚РµСЂРЅ nested detail Р±РµР· СЏРІРЅРѕР№ РєР°СЂС‚С‹ СѓСЂРѕРІРЅСЏ РІРІРµСЂС…, РЅРѕ СЌРєСЂР°РЅ С‚СЏР¶РµР»РµРµ РёР·-Р·Р° Р±РѕР»СЊС€РёС… Р±Р»РѕРєРѕРІ СЃРІСЏР·Р°РЅРЅС‹С… СѓСЃР»СѓРі, РіР°Р»РµСЂРµР№ Рё РјРµРґРёР°.
- Live impression: РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СЌРєСЂР°РЅ РІС‹РіР»СЏРґРёС‚ РґР»РёРЅРЅС‹Рј operational workspace, РіРґРµ С‚СЂСѓРґРЅРѕ Р±С‹СЃС‚СЂРѕ РїРѕРЅСЏС‚СЊ, РіРґРµ Р·Р°РєРѕРЅС‡РёР»СЃСЏ Р±Р°Р·РѕРІС‹Р№ РєРµР№СЃ Рё РіРґРµ РЅР°С‡Р°Р»РёСЃСЊ СЃРІСЏР·Рё.
- Why it matters: СЌС‚Рѕ РїСЂСЏРјРѕ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ РёРґРµСЋ РїСЂРѕ breadcrumb / depth navigation, РїРѕС‚РѕРјСѓ С‡С‚Рѕ Р·РґРµСЃСЊ Р±РµР· РЅРµРіРѕ РїСЂРѕС‰Рµ РїРѕС‚РµСЂСЏС‚СЊСЃСЏ.
- Desired direction: РїРѕР·Р¶Рµ РѕРїСЂРµРґРµР»РёС‚СЊ, РЅСѓР¶РЅР° Р»Рё РІРµСЂС…РЅСЏСЏ РЅР°РІРёРіР°С†РёРѕРЅРЅР°СЏ РєР°СЂС‚Р° РїРѕ СѓСЂРѕРІРЅСЏРј Рё/РёР»Рё Р±РѕР»РµРµ РєРѕРјРїР°РєС‚РЅРѕРµ СЂР°Р·РјРµС‰РµРЅРёРµ СЃРІСЏР·Р°РЅРЅС‹С… СЃСѓС‰РЅРѕСЃС‚РµР№.
- Severity: medium.

### 10. РЈ РєРµР№СЃР° С‚РѕР¶Рµ РµСЃС‚СЊ СЃРµРјР°РЅС‚РёС‡РµСЃРєРё РЅРµРѕС‡РµРІРёРґРЅС‹Рµ РїРѕР»СЏ Рё РґСѓР±Р»РёСЂСѓСЋС‰Р°СЏ РјРµРґРёР°-Р·Р°РіСЂСѓР·РєР°
- Surface: `РљРµР№СЃС‹` -> `РћС‚РєСЂС‹С‚СЊ` -> case detail editor.
- Current observation: РїРѕР»СЏ `РўРёРї РїСЂРѕРµРєС‚Р°` Рё `РљРѕСЂРѕС‚РєРёР№ Р°РґСЂРµСЃ` РЅРµ РѕР±СЉСЏСЃРЅСЏСЋС‚ РѕР±С‹С‡РЅРѕРјСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ, РґРѕР»Р¶РµРЅ Р»Рё РѕРЅ РїСЂРёРґСѓРјР°С‚СЊ Р·РЅР°С‡РµРЅРёРµ СЃР°Рј РёР»Рё РІС‹Р±СЂР°С‚СЊ РёР· СЃРїСЂР°РІРѕС‡РЅРёРєР°.
- Current observation: Р±Р»РѕРє `Р‘С‹СЃС‚СЂР°СЏ Р·Р°РіСЂСѓР·РєР° РјРµРґРёР°` РІС‹РіР»СЏРґРёС‚ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ СЃРїРѕСЃРѕР± Р·Р°РіСЂСѓР·РєРё С„Р°Р№Р»РѕРІ, С…РѕС‚СЏ СЂСЏРґРѕРј СѓР¶Рµ РµСЃС‚СЊ РіР°Р»РµСЂРµСЏ Рё СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ media flow.
- Why it matters: РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РјРѕР¶РµС‚ РІРѕСЃРїСЂРёРЅРёРјР°С‚СЊ СЌС‚Рѕ РєР°Рє РґСѓР±Р»РёСЂРѕРІР°РЅРёРµ С„СѓРЅРєС†РёРѕРЅР°Р»Р° Рё РЅРµ РїРѕРЅРёРјР°С‚СЊ, РєР°РєРѕР№ РїСѓС‚СЊ СЏРІР»СЏРµС‚СЃСЏ РѕСЃРЅРѕРІРЅС‹Рј.
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё РґР»СЏ РєРµР№СЃР° РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ С‚РѕС‚ Р¶Рµ media engine / gallery picker, С‡С‚РѕР±С‹ РЅРµ РїР»РѕРґРёС‚СЊ РїР°СЂР°Р»Р»РµР»СЊРЅС‹Рµ СЃС†РµРЅР°СЂРёРё Рё РЅРµ СЂР°СЃС…РѕРґРёС‚СЊСЃСЏ РІ Р»РѕРіРёРєРµ Р·Р°РіСЂСѓР·РєРё.
- Severity: high.
- Extra note: РµСЃР»Рё `РўРёРї РїСЂРѕРµРєС‚Р°` РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ СЃРїСЂР°РІРѕС‡РЅРёРєРѕРј, СЌС‚Рѕ Р»СѓС‡С€Рµ РїРѕРєР°Р·С‹РІР°С‚СЊ СЏРІРЅРѕ С‡РµСЂРµР· select / picker, Р° РЅРµ РєР°Рє С‚РµРєСЃС‚, РєРѕС‚РѕСЂС‹Р№ РЅР°РґРѕ РїСЂРёРґСѓРјС‹РІР°С‚СЊ РІСЂСѓС‡РЅСѓСЋ.

### 11. РџСЂР°РІС‹Рµ СЃР»СѓР¶РµР±РЅС‹Рµ Р±Р»РѕРєРё РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РєРѕРјРїР°РєС‚РЅРµРµ Рё Р±РѕР»РµРµ СЃС‚Р°С‚РёС‡РЅС‹РјРё
- Surface: all nested/detail admin screens, especially `Р“Р°Р»РµСЂРµРё` and `РљРµР№СЃС‹`.
- Current observation: right sidebar blocks are currently part of the main long scroll; even with little content they move together with the form and force the user to re-find status blocks.
- Why it matters: С‚Р°РєРѕРµ РїРѕРІРµРґРµРЅРёРµ СѓС‚РѕРјР»СЏРµС‚ Рё РґРµР»Р°РµС‚ СЃР»СѓР¶РµР±РЅС‹Рµ РєР°СЂС‚РѕС‡РєРё РјРµРЅРµРµ РїРѕР»РµР·РЅС‹РјРё, С‡РµРј РѕРЅРё РјРѕРіР»Рё Р±С‹ Р±С‹С‚СЊ.
- Desired direction: РїРѕР·Р¶Рµ РїСЂРѕРІРµСЂРёС‚СЊ РІР°СЂРёР°РЅС‚, РіРґРµ right rail remains compact and behaves as a mostly-static support panel, becoming scrollable only when its own content grows beyond the viewport.
- Severity: medium.
- Extra note: СЌС‚Рѕ РѕС‚РЅРѕСЃРёС‚СЃСЏ РЅРµ Рє РѕРґРЅРѕРјСѓ СЌРєСЂР°РЅСѓ, Р° Рє РѕР±С‰РµРјСѓ РїР°С‚С‚РµСЂРЅСѓ РІР»РѕР¶РµРЅРЅС‹С… admin surfaces.

### 12. Р­РєСЂР°РЅ `РЎС‚СЂР°РЅРёС†С‹` РїРѕРІС‚РѕСЂСЏРµС‚ С‚Рµ Р¶Рµ РїСЂРµС‚РµРЅР·РёРё
- Surface: `РЎС‚СЂР°РЅРёС†С‹` -> `РћС‚РєСЂС‹С‚СЊ` -> page detail editor.
- Current observation: С‚Рµ Р¶Рµ РІРѕРїСЂРѕСЃС‹ Рє СЃРµРјР°РЅС‚РёРєРµ РїРѕР»РµР№, РІР»РѕР¶РµРЅРЅРѕСЃС‚Рё, РїСЂР°РІРѕРјСѓ СЃР°Р№РґР±Р°СЂСѓ Рё РґР»РёРЅРЅРѕРјСѓ СЂР°Р±РѕС‡РµРјСѓ СЃРєСЂРѕР»Р»Сѓ.
- Why it matters: СЌС‚Рѕ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РїСЂРѕР±Р»РµРјР° РЅРµ Р»РѕРєР°Р»СЊРЅР°СЏ, Р° СЃРёСЃС‚РµРјРЅР°СЏ РґР»СЏ nested content editors.
- Desired direction: СЂР°СЃСЃРјР°С‚СЂРёРІР°С‚СЊ `РЎС‚СЂР°РЅРёС†С‹` РІРјРµСЃС‚Рµ СЃ `Р“Р°Р»РµСЂРµСЏРјРё`, `РљРµР№СЃР°РјРё`, `РњРµРґРёР°` Рё `РЈСЃР»СѓРіР°РјРё` РєР°Рє РѕРґРёРЅ РїР°С‚С‚РµСЂРЅ СЂРµРґР°РєС‚СѓСЂС‹, Р° РЅРµ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Рµ РјРµР»РєРёРµ Р±Р°РіРё.
- Severity: medium.

### 13. Р­РєСЂР°РЅ `РЈСЃР»СѓРіРё` С‚РѕР¶Рµ РІ С‚РѕРј Р¶Рµ РєР»Р°СЃСЃРµ РїСЂРѕР±Р»РµРј
- Surface: `РЈСЃР»СѓРіРё` -> service list / service detail editor.
- Current observation: Рє СЌС‚РѕРјСѓ СЌРєСЂР°РЅСѓ РѕС‚РЅРѕСЃСЏС‚СЃСЏ С‚Рµ Р¶Рµ РїСЂРµС‚РµРЅР·РёРё, С‡С‚Рѕ Рё Рє `Р“Р°Р»РµСЂРµРё`, `РљРµР№СЃС‹`, `РЎС‚СЂР°РЅРёС†С‹` Рё `РњРµРґРёР°`.
- Why it matters: СЌС‚Рѕ РµС‰С‘ РѕРґРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ, С‡С‚Рѕ РјС‹ РёРјРµРµРј РЅРµ РЅР°Р±РѕСЂ С‡Р°СЃС‚РЅС‹С… РЅРµРґРѕС‡С‘С‚РѕРІ, Р° РµРґРёРЅС‹Р№ pattern-level UX issue РґР»СЏ nested editors.
- Desired direction: РїРѕС‚РѕРј РїСЂР°РІРёС‚СЊ РєР°Рє РѕР±С‰СѓСЋ СЃС…РµРјСѓ, Р° РЅРµ РєР°Рє С‡РµС‚С‹СЂРµ-РїСЏС‚СЊ СЂР°Р·СЂРѕР·РЅРµРЅРЅС‹С… СЌРєСЂР°РЅР°.
- Severity: medium.

### 14. Р­РєСЂР°РЅ `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` С‚РµСЃРЅС‹Р№ Рё РЅРµРѕС‡РµРІРёРґРЅС‹Р№ РїРѕ РєРѕРјРїРѕР·РёС†РёРё
- Surface: `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё`.
- Current observation: РїРѕР»СЏ С„РѕСЂРјС‹ СЂР°СЃРїРѕР»РѕР¶РµРЅС‹ РѕС‡РµРЅСЊ РїР»РѕС‚РЅРѕ Рё РјРµСЃС‚Р°РјРё РІРёР·СѓР°Р»СЊРЅРѕ "РЅР°РµР·Р¶Р°СЋС‚" РґСЂСѓРі РЅР° РґСЂСѓРіР°, РёР·-Р·Р° С‡РµРіРѕ СЌРєСЂР°РЅ РІС‹РіР»СЏРґРёС‚ РЅРµР»РѕРіРёС‡РЅРѕ Рё РЅРµ РѕС‡РµРЅСЊ friendly.
- Current observation: СЃРїРёСЃРѕРє РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, РІРµСЂРѕСЏС‚РЅРѕ, Р»СѓС‡С€Рµ РІС‹РЅРµСЃС‚Рё РІ РѕС‚РґРµР»СЊРЅСѓСЋ РїСЂР°РІСѓСЋ РїР°РЅРµР»СЊ РёР»Рё РІ РёРЅРѕР№ Р±РѕР»РµРµ СЃРїРѕРєРѕР№РЅС‹Р№ layout-РїР°С‚С‚РµСЂРЅ.
- Current observation: РІРѕР·РјРѕР¶РЅРѕ, РџРѕР»СЊР·РѕРІР°С‚РµР»Рё СЃС‚РѕРёС‚ СЂР°СЃРєСЂС‹РІР°С‚СЊ РєР°Рє РїРѕРґРІР»РѕР¶РµРЅРЅРѕСЃС‚СЊ РІ Р»РµРІРѕРј РјРµРЅСЋ, РµСЃР»Рё СЌС‚Рѕ Р»СѓС‡С€Рµ РІРїРёС€РµС‚СЃСЏ РІ shell Рё РїРѕРјРѕР¶РµС‚ РЅРµ СЃРјРµС€РёРІР°С‚СЊ СЃРїРёСЃРѕРє СЃ С„РѕСЂРјРѕР№.
- Why it matters: СЃРµР№С‡Р°СЃ СЌРєСЂР°РЅ РЅРµ РѕС‡РµРЅСЊ С…РѕСЂРѕС€Рѕ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ Р·Р°РґР°С‡Сѓ СѓРїСЂР°РІР»РµРЅРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё Рё РЅРµ РґР°С‘С‚ РѕС‰СѓС‰РµРЅРёСЏ РїРѕР»РЅРѕС†РµРЅРЅРѕРіРѕ CRUD.
- Desired direction: РїРѕР·Р¶Рµ РІС‹Р±СЂР°С‚СЊ Р»РёР±Рѕ Р±РѕР»РµРµ СѓРґРѕР±РЅРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ form/list, Р»РёР±Рѕ nested navigation pattern, РЅРѕ РЅРµ РѕСЃС‚Р°РІР»СЏС‚СЊ СЌС‚Рѕ РєР°Рє РїР»РѕС‚РЅС‹Р№ one-page split Р±РµР· РёРµСЂР°СЂС…РёРё.
- Severity: high.
- Extra note: Р·РґРµСЃСЊ Р·Р°РјРµС‚РµРЅ РЅРµ С‚РѕР»СЊРєРѕ layout issue, РЅРѕ Рё С„СѓРЅРєС†РёРѕРЅР°Р»СЊРЅС‹Р№ gap РїРѕ РѕС‰СѓС‰РµРЅРёСЋ РїРѕР»РЅРѕС†РµРЅРЅРѕРіРѕ CRUD flow.

## Working rule

- РЎРЅР°С‡Р°Р»Р° СЃРѕР±РёСЂР°РµРј РЅР°Р±Р»СЋРґРµРЅРёСЏ.
- РџРѕС‚РѕРј, РєРѕРіРґР° Р·Р°РјРµС‡Р°РЅРёР№ СЃС‚Р°РЅРµС‚ РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ, РґРµР»Р°РµРј РѕС‚РґРµР»СЊРЅС‹Р№ РїР»Р°РЅ СЂРµРґР°РєС‚СѓСЂС‹.
- Р”Рѕ СЌС‚РѕРіРѕ СЌС‚Р°РїР° РЅРёС‡РµРіРѕ РЅРµ РїРµСЂРµРїСЂРѕРµРєС‚РёСЂСѓРµРј Рё РЅРµ РїРµСЂРµРёРјРµРЅРѕРІС‹РІР°РµРј.

## Review addendum after plan readback

- `РЎРјС‹СЃР» РёР·РјРµРЅРµРЅРёСЏ` СЃРєРѕСЂРµРµ РІСЃРµРіРѕ СЏРІР»СЏРµС‚СЃСЏ РІРЅСѓС‚СЂРµРЅРЅРёРј `change intent`; РЅСѓР¶РЅРѕ СЂРµС€РёС‚СЊ, СЌС‚Рѕ РїРѕР»Рµ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РёР»Рё С‚РѕР»СЊРєРѕ РґР»СЏ СЃРёСЃС‚РµРјС‹.
- Before renaming `РЎРјС‹СЃР» РёР·РјРµРЅРµРЅРёСЏ`, decide whether the field belongs in the user-facing form at all. If it is purely an internal audit/workflow field, the right fix may be to remove it from the visible editor, not to rename it.
- `Р‘С‹СЃС‚СЂР°СЏ Р·Р°РіСЂСѓР·РєР° РјРµРґРёР°` РІ РєРµР№СЃР°С… Р»СѓС‡С€Рµ СЃС‡РёС‚Р°С‚СЊ candidate anti-pattern, Р° РЅРµ РїСЂРѕСЃС‚Рѕ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕР№ РєРЅРѕРїРєРѕР№.
- Р”Рѕ Wave 5 РѕС‚РґРµР»СЊРЅРѕ РїСЂРѕРІРµСЂРёС‚СЊ loading, empty, error Рё no-access states РЅР° РєР°Р¶РґРѕРј СЃРµРјРµР№СЃС‚РІРµ СЌРєСЂР°РЅРѕРІ.
- Р”Р»СЏ СЌС‚РѕРіРѕ РїСЂРѕС…РѕРґР° admin first slice Р»СѓС‡С€Рµ СЃС‡РёС‚Р°С‚СЊ desktop-first; responsive/mobile behavior РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РІРЅРµ scope, РµСЃР»Рё РѕРЅ РЅРµ Р±СѓРґРµС‚ СЏРІРЅРѕ РїРµСЂРµРѕС‚РєСЂС‹С‚.

## Workflow addendum after role narrative readback

- Need explicit role landing states, not only shared dashboard logic. `SEO Manager` should see a working queue and next actions, `Business Owner` should land on a decision packet, and `Superadmin` should land on operational control and consequences.
- `Business Owner` review surface should behave like a compact decision packet: summary, real preview, risk notes, and a small set of action buttons. This is a screen pattern, not just a text tone issue.
- Comments must be able to point back to a concrete field or block so the user can jump directly to the problem area instead of searching the form again.
- Audit timeline needs to read like a human story: who changed what, why it changed, and whether AI was used. This is not the same as a technical event log.
- Publish side effects should be visible as a short, understandable checklist on the screen, not hidden in a separate technical layer.
- `РџРѕР»СЊР·РѕРІР°С‚РµР»Рё` still needs one more pass as an operational CRUD surface: list, role, last activity, add, deactivate, and the exact place where Superadmin manages access.
- The workflow narrative confirms that the grammar work is not enough by itself. We also need role-facing information architecture rules on top of the shared shell.

## Dashboard addendum after live main-page review

- `Р“Р»Р°РІРЅР°СЏ` feels too sparse for the primary admin landing surface: the page has too little signal density above the fold and too much vertical breathing room for the amount of information it carries.
- The current composition reads more like a long status board than a compact operational landing packet.
- The long scroll is not buying enough value right now; the screen should answer `С‡С‚Рѕ С‚СЂРµР±СѓРµС‚ РґРµР№СЃС‚РІРёСЏ СЃРµР№С‡Р°СЃ` faster.
- A more logical compaction would likely mean tighter grouping of the operational queue, a clearer split between primary actions and secondary status, and fewer oversized cards that force the user to scroll before seeing the next actionable context.

### 15. Проверка: preview linkage and device toggle request
- Surface: Проверка review surface.
- Current observation: when a user selects a field, it would be much more user-friendly if the live preview and the main central page highlighted the corresponding area together, so the relation between editor field and rendered output is obvious.
- Current observation: the right preview column appears to be primarily mobile-oriented; it would be useful to add a desktop/computer toggle so the preview can also switch to tablet/desktop rendering without leaving the screen.
- Why it matters: this would reduce guesswork during review and make the preview behave more like a real validation tool instead of a static side panel.
- Desired direction: explore a preview-to-field highlight connection and a responsive preview mode switch, but keep the change scoped to review UX rather than a broader redesign.
- Severity: medium.

### 16. Проверка: before/after comparison may work better stacked than side-by-side
- Surface: Проверка review surface.
- Current observation: the current `before / after` comparison reads as two side-by-side columns, but the content can be long enough that the fixed width makes the comparison feel cramped or visually sparse.
- Current observation: for long text diffs it may be more readable to place `before` above `after`, using a vertical stack instead of forcing both states into a narrow horizontal split.
- Current observation: the text and spacing in this area feel slightly too airy; a tighter typographic scale could make the comparison easier to scan without changing workflow meaning.
- Why it matters: a vertical `before / after` stack may preserve comparison clarity better on long content and reduce the sense that the form is wasting horizontal space.
- Desired direction: consider an alternate diff layout for long content cases, with smaller typography and denser spacing, but keep the change limited to review presentation.
- Severity: medium.

### 17. Проверка: readiness status should move higher in the screen hierarchy
- Surface: Проверка review surface.
- Current observation: the readiness / `Проверка готовности` block currently sits at the bottom of the page, but it is a status-oriented element that users need much earlier in the flow.
- Current observation: there is plenty of vertical room near the top of the screen where this status could be visible without forcing the user to scroll all the way down.
- Why it matters: readiness is a decision signal, not an afterthought; burying it at the bottom delays the moment when the user understands whether the item is ready or blocked.
- Desired direction: move readiness/status information closer to the top of the review surface, ideally near the main header or first visible support block, so it is read before deep content scanning begins.
- Severity: medium.

### 18. Настройки: containers feel too tight and block composition could be calmer
- Surface: `Настройки` / global settings editor.
- Current observation: the main form and the right support column feel visually too close together, so the page composition reads tighter than it should.
- Current observation: the screen does not literally break, but the block arrangement creates a sense that containers are pressing into each other instead of breathing as separate areas.
- Why it matters: for a role that comes here to understand and adjust system-wide settings, a cramped composition adds unnecessary friction and makes the screen feel more admin-heavy than friendly.
- Desired direction: re-balance the block spacing and hierarchy so the main editor area and the right status rail feel like distinct, calmer zones rather than adjacent crowded containers.
- Severity: medium.

### 19. Media detail: two file controls feel semantically close but visually confusing
- Surface: `Медиа` -> media detail editor.
- Current observation: the screen shows two separate `Файл`-related controls in close proximity: the quick upload button and the file selection field, and they do not immediately read as different actions.
- Current observation: the surrounding containers are tight enough that the upload block and the edit block feel like they are pressing into each other, especially around the top half of the card.
- Why it matters: when the same term appears twice with different meanings, the user has to stop and decode whether this is one upload flow or two separate controls, which adds friction and weakens trust in the screen.
- Desired direction: separate the quick upload action from the main edit form more clearly, and make the semantic difference between `choose file` and `upload media` visually obvious instead of relying on proximity and repeated labels.
- Severity: medium.

### 20. Media and Gallery need a small screen legend for orientation
- Surface: `Медиа` and `Галереи`.
- Current observation: the user still has to infer the difference between `Медиа` and `Галереи` from the surrounding controls instead of getting a short, direct explanation of what each screen is for.
- Current observation: a compact hint or legend block would help if it lived in an otherwise free corner of the screen, ideally as a small, low-emphasis text area rather than another heavy card.
- Why it matters: when screen purpose is not obvious, the user spends extra cognitive effort just figuring out where they are before they can do the actual job.
- Desired direction: add a tiny explanatory block with plain-language purpose text for each screen, keeping the font smaller and the block visually light so it helps orientation without competing with the main editor.
- Severity: medium.

### 21. White background containment feels visually leaky on some blocks
- Surface: nested/editor admin screens, especially `Медиа` detail and similar card-heavy surfaces.
- Current observation: the white page background and the rounded cards make it feel as if some containers slightly protrude beyond the background boundary, even when the layout may still be technically valid.
- Current observation: the composition is not broken, but the visual edge between background and cards is not always calm or clean, so some blocks feel like they are floating out of their frame.
- Why it matters: this weakens the sense of visual discipline and can make the page feel less polished or less grounded, even if the spacing rules are otherwise consistent.
- Desired direction: later check whether card boundaries, page padding, and background layering need a small cleanup so blocks sit more clearly inside the intended surface.
- Severity: low.

### 22. Gallery detail has a clearer purpose statement, but runtime thumbnail noise still distracts
- Surface: `Галереи` -> gallery detail editor.
- Current observation: this screen already explains its purpose more clearly than `Медиа` by saying that the gallery collects uploaded media and that new files belong in `Медиа`.
- Current observation: the selection area is still visually busy because many thumbnails render as proof assets, and the browser console reports missing media resources for some of them.
- Why it matters: even when the screen legend is clearer, runtime/content noise makes the gallery feel less stable and harder to judge as a clean UX surface.
- Desired direction: keep the explanatory copy, but treat missing thumbnails and 404 media references as a separate runtime/content issue rather than a layout problem.
- Severity: medium.

### 23. Gallery detail may still contain duplicate or overlapping media concepts
- Surface: `Галереи` -> gallery detail editor.
- Current observation: the screen already has a clear `Файлы галереи` selector, but it also has a separate `Основной файл` block, and the difference between those two concepts is not obvious at first glance.
- Current observation: the field `Смысл изменения` also looks like internal workflow language rather than a field whose purpose is self-evident to the user.
- Current observation: `Канонический адрес` is another field that may be technically correct but still needs contextual explanation for ordinary users.
- Why it matters: if the screen contains both a general gallery selection and a separate main-file selection without a simple explanation, the user may assume duplicate functionality or become uncertain which one controls what.
- Desired direction: before changing labels, decide whether the blocks are truly distinct user actions; if they are, add small contextual hints that explain the difference in plain language, and if not, consider removing the redundant visible control.
- Severity: high.

### 24. Draft short legends for screen orientation
- Surface: `Медиа`, `Галереи`, and fields that need context.
- Current observation: the screens would benefit from a tiny, low-emphasis explanatory block placed in a quiet corner of the layout, so users can immediately understand what each surface is for.
- Suggested legend for `Медиа`: `Медиа — это библиотека исходных файлов. Здесь загружают и редактируют отдельные изображения и другие ассеты, которые потом используются в галереях, кейсах и страницах.`
- Suggested legend for `Галереи`: `Галерея — это подборка из уже загруженных медиа. Здесь выбирают файлы, задают порядок и собирают альбом для нужного материала.`
- Suggested helper for `Основной файл`, if the block is kept: `Основной файл — это главный кадр галереи. Он используется как первое изображение в карточке и в превью.`
- Suggested helper for `Канонический адрес`: `Канонический адрес — это основной адрес страницы, который будет использоваться в ссылках и поиске.`
- Why it matters: short legends reduce guesswork and make the difference between similar screens and similar fields obvious without making the layout heavier.
- Desired direction: keep these helpers small, quiet, and visually lighter than the main content so they explain rather than compete.
- Severity: medium.

### 25. Services detail is the heaviest screen in the repeated editor family
- Surface: `Услуги` -> service detail editor.
- Current observation: this screen follows the same shared grammar as `Медиа`, `Галереи`, and `Кейсы`, but it feels denser because it combines general service fields with related cases, related galleries, and main media in one long workflow.
- Current observation: fields like `Короткий адрес`, `Смысл изменения`, and `Канонический адрес` still need context, and the relation blocks add a lot of cognitive weight even when the layout itself is structurally correct.
- Current observation: the browser console shows missing media resources for proof thumbnails, so part of the visual noise is runtime/content residue rather than layout alone.
- Why it matters: the service editor is a good example of why the repeated family needs a clear grammar, because even with shared shell rules the screen can still feel overloaded if relation blocks and proof data are allowed to dominate.
- Desired direction: keep the shared shell pattern, but later check whether the service screen needs tighter grouping, a stronger screen legend, and clearer differentiation between core service content and relationship pickers.
- Severity: high.

### 26. Services audit rail should collapse into a compact expandable line
- Surface: `Услуги` -> service detail editor.
- Current observation: the audit trail on the right works, but it occupies too much vertical space as a stack of cards when most users only need to know whether an event matters and whether they should open it.
- Current observation: because the rail is visually heavy, it competes with the main form instead of acting as a quick status lane.
- Why it matters: audit history is useful, but not every event needs to be shown at full height by default; a compact disclosure line would make the screen calmer and easier to scan.
- Desired direction: consider rendering audit items as a single concise row or line with a plus / chevron control that expands into the full card only when the user wants the details.
- Severity: medium.

### 27. Services top field grid needs to be denser and more resilient to long values
- Surface: `Услуги` -> service detail editor.
- Current observation: fields such as `Короткий адрес`, `Название`, `Основной заголовок (H1)` and `Текст кнопки` are arranged in a way that reads like narrow side-by-side columns, but long values make this structure feel fragile and crowded.
- Current observation: in this form, `Короткий адрес` may not actually be short, and `Основной заголовок (H1)` may be long enough to need more room than the current column rhythm gives it.
- Why it matters: the user should not have to fight the field grid just because the content is long; the layout should tolerate long values without feeling like fields are colliding.
- Desired direction: make the top block more compact in a way that still allows long values to breathe, likely by allowing some fields to stack or span more width instead of forcing all of them into the same column rhythm.
- Severity: medium.

### 28. Services `Смысл изменения` needs an explicit helper or a boundary decision
- Surface: `Услуги` -> service detail editor.
- Current observation: the `Смысл изменения` field is visible here as a live workflow label, but it is still not self-explanatory to a normal user.
- Current observation: without a short helper, the field looks like an internal audit note rather than something the user should actively fill in.
- Why it matters: if the user has to guess what this field means, the form becomes less trustworthy and less friendly, especially on a dense operational screen.
- Suggested helper text: `Что изменилось в этой версии и зачем.` If the field is actually internal workflow noise, it may be better hidden from the visible editor instead of just renamed.
- Severity: high.

### 29. Case audit rail should also be compact and expandable by default
- Surface: `Кейсы` -> case detail editor.
- Current observation: the right audit rail repeats the same problem as `Услуги`; it is useful, but the full card stack takes too much vertical attention for a status area.
- Current observation: the current form already has many relationship blocks, so a tall audit column compounds the feeling of a long operational page.
- Why it matters: if the audit stream is only needed selectively, it should start as a compact line or row and expand on demand instead of occupying full-height cards by default.
- Desired direction: keep the audit information available, but collapse it into a lighter disclosure pattern that users can open only when they need the full story.
- Severity: medium.

### 30. Case top form should tolerate long values better and explain taxonomy-like fields
- Surface: `Кейсы` -> case detail editor.
- Current observation: the top block uses a dense grid for `Короткий адрес`, `Название`, `Локация`, and `Тип проекта`, and this works only if values stay short and predictable.
- Current observation: `Тип проекта` in particular looks like a taxonomy field and should be clearly either a select/reference or a supported controlled value, not a thing the user has to invent without context.
- Why it matters: long values or unclear taxonomy fields can make the form feel brittle and more technical than it should, especially when the user is trying to fill it quickly.
- Desired direction: tighten the top grid, allow long fields more breathing room, and decide whether `Тип проекта` belongs to a controlled reference or needs a short helper that explains the allowed meaning.
- Severity: high.

### 31. Case screen also benefits from a small purpose legend
- Surface: `Кейсы` -> case detail editor.
- Current observation: this screen is obviously a case editor to an experienced user, but a tiny legend would still help by explaining that the screen is for a real project story, not a generic form dump.
- Current observation: the legend can be very small and quiet so it helps orientation without competing with the main content.
- Why it matters: a short explanatory block makes the repeated editor family easier to scan and lowers the need to infer the screen’s purpose from the fields alone.
- Desired direction: add a compact helper similar to the one proposed for `Медиа` and `Галереи`, but tuned to case story editing.
- Severity: low.

## Historical appendix (non-executable)

This appendix is intentionally non-executable. It preserves older layout questions as context only. If it conflicts with the canonized postures above, the canon wins.
Implementation agents should treat the appendix as read-only context unless they are explicitly asked to revisit historical rationale.

### Historical decision points

- РќСѓР¶РЅРѕ Р»Рё РІРІРµСЃС‚Рё РµРґРёРЅС‹Р№ breadcrumb / depth bar РґР»СЏ РІСЃРµС… nested detail screens?
- РќСѓР¶РЅР° Р»Рё Р»РµРІРѕР№ РїР°РЅРµР»Рё СЂРѕР»СЊ РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ tree navigation РґР»СЏ РІР»РѕР¶РµРЅРЅС‹С… СЃСѓС‰РЅРѕСЃС‚РµР№?
- Р”РѕР»Р¶РµРЅ Р»Рё right rail Р±С‹С‚СЊ sticky/support panel СЃ СЃРѕР±СЃС‚РІРµРЅРЅС‹Рј scroll threshold?
- РҐРѕС‚РёРј Р»Рё РјС‹ РІС‹РЅРµСЃС‚Рё user list РІ РѕС‚РґРµР»СЊРЅСѓСЋ РїСЂР°РІСѓСЋ РїР°РЅРµР»СЊ РёР»Рё РІ child view РїРѕ С‚РёРїСѓ nested navigation?
- Р”РѕР»Р¶РЅР° Р»Рё Р±С‹СЃС‚СЂР°СЏ Р·Р°РіСЂСѓР·РєР° РјРµРґРёР° РІ РєРµР№СЃР°С… Рё СЃС‚СЂР°РЅРёС†Р°С… РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ gallery/media engine Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ РїР°СЂР°Р»Р»РµР»СЊРЅРѕРіРѕ СЃС†РµРЅР°СЂРёСЏ?
- Р”РѕР»Р¶РЅС‹ Р»Рё РїРѕР»СЏ РІСЂРѕРґРµ `РўРёРї РїСЂРѕРµРєС‚Р°`, `РЎРјС‹СЃР» РёР·РјРµРЅРµРЅРёСЏ`, `РљРѕСЂРѕС‚РєРёР№ Р°РґСЂРµСЃ` Р±С‹С‚СЊ СЏРІРЅРѕ РїРµСЂРµРІРµРґРµРЅС‹ РІ СЃРїСЂР°РІРѕС‡РЅРёРєРё, select-Рё РёР»Рё Р±РѕР»РµРµ РєРѕРЅС‚РµРєСЃС‚РЅС‹Рµ РїРѕРґРїРёСЃРё?
- РќСѓР¶РЅРѕ Р»Рё РїСЂРёРІРµСЃС‚Рё РІСЃРµ repeated content editors Рє РѕРґРЅРѕРјСѓ РїР°С‚С‚РµСЂРЅСѓ layout, С‡С‚РѕР±С‹ СЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РёС… РєР°Рє СЃРµРјРµР№СЃС‚РІРѕ СЌРєСЂР°РЅРѕРІ?

### Historical open layout questions

- РќСѓР¶РЅРѕ Р»Рё Р»РµРІСѓСЋ РЅР°РІРёРіР°С†РёСЋ РґРµР»Р°С‚СЊ `sticky` РёР»Рё `fixed` РІ СЂР°РјРєР°С… С‚РµРєСѓС‰РµРіРѕ shell?
- Р•СЃР»Рё РѕСЃС‚Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ `sticky`, С…РІР°С‚РёС‚ Р»Рё СЌС‚РѕРіРѕ РґР»СЏ РґР»РёРЅРЅС‹С… СЃС‚СЂР°РЅРёС†?
- Р•СЃС‚СЊ Р»Рё СЃРјС‹СЃР» РѕРіСЂР°РЅРёС‡РёС‚СЊ РІС‹СЃРѕС‚Сѓ sidebar Рё РґР°С‚СЊ РµР№ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ РІРЅСѓС‚СЂРµРЅРЅРёР№ СЃРєСЂРѕР»Р», РёР»Рё СЌС‚Рѕ Р±СѓРґРµС‚ Р»РёС€РЅРёРј СѓСЃР»РѕР¶РЅРµРЅРёРµРј?
