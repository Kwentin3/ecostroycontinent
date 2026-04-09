# ADMIN_LIVE_DEACTIVATION_PLAYWRIGHT_OPERATOR_SMOKE_v1

## Scope

Focused operator smoke for the newly implemented admin-only live-deactivation flow:

- `Page`
- `Service`
- `Case`

Explicitly out of scope in this smoke:

- `MediaAsset`
- `Gallery`
- ordinary media delete
- broader admin regression
- any implementation changes

## Environment Tested

- Target: `https://ecostroycontinent.ru`
- Date: `2026-04-09`
- Method: Playwright MCP browser smoke against the deployed admin UI
- Operator account used for the verified session:
  - superadmin account supplied during the smoke run

## Which Entities / Cases Were Tested

### CASE D — Refusal scenario

Tested successfully.

Entity used:

- `Service`
- `Pilot Service mnlslpw0`
- editor route:
  - `/admin/entities/service/entity_27589a74-d2c2-48bc-8df1-11be8e587256`

Observed path:

1. Open service editor.
2. Confirm separate visible actions in the action row:
   - `История`
   - `Вывести из живого контура`
   - `Удалить`
3. Open `Вывести из живого контура`.
4. Inspect dry-run.
5. Confirm the operation is refused with explicit reason.
6. Return to the editor and try ordinary `Удалить`.
7. Confirm the ordinary delete path is also refused with its own explicit message.

Observed refusal:

- `Сущность участвует в review/publish-потоке.`

Observed ordinary delete refusal:

- `Сущность опубликована и участвует в живом контуре. Объект участвует в review/publish-потоке.`

Observed dry-run content:

- current live state is shown as active published truth;
- route impact is shown as `/services/pilot-service-mnlslpw0`;
- public-side outcome is shown as route becoming `404`;
- list impact is shown as disappearance from published service list;
- revalidation paths are shown;
- incoming published refs section is shown;
- incoming non-test draft refs section is shown.

### CASE E — Separation check

Tested successfully.

Confirmed in UI:

- ordinary delete remains a separate button from live deactivation;
- live deactivation is not hidden behind delete;
- live deactivation is shown as a dedicated dry-run page, not as a casual toggle;
- test teardown is not merged into this ordinary service flow.

Confirmed by direct operator action:

- clicking `Удалить` on the same `Service` does not silently fall back to live deactivation;
- clicking `Удалить` opens its own destructive confirmation;
- after confirmation, the UI returns a strict delete refusal rather than performing a hidden unpublish.

Additional separation check for `Page`:

- opened an unpublished draft `Page` editor;
- the page showed `Сущность ещё не опубликована.`;
- no ordinary `Удалить` action was shown in that editor;
- no `Вывести из живого контура` action was shown there;
- this matches the intended boundary that non-live `Page` uses neither ordinary live deactivation nor ordinary hard delete casually.

### CASE A — Allowed deactivation for one ordinary published `Page`

Could not be executed.

Reason:

- current `Page` list contained only non-live entries in practice;
- in editor/history state these pages did not have active live published truth;
- therefore no honest allowed `Page` deactivation subject was available in the current live admin data.

### CASE B — Allowed deactivation for one ordinary published `Service`

Could not be executed.

Reason:

- the only live ordinary `Service` candidate found in the current data was blocked by an active review/publish state;
- no ordinary published `Service` with a clean allowed dry-run was available.

### CASE C — Allowed deactivation for one ordinary published `Case`

Could not be executed.

Reason:

- the `Case` list currently contains no entities.

## What Passed

- Authenticated superadmin session works.
- Entry point `Вывести из живого контура` is easy to find on ordinary published `Service` editor.
- Wording is understandable and distinct from delete.
- Dry-run explains route/public consequences clearly.
- Refusal is explicit and operator-readable.
- Separation from ordinary delete is visible in the action row.
- Ordinary delete refusal is also explicit and operator-readable on the same `Service`.
- Separation from test teardown remains intact in the tested ordinary flow.
- Draft/non-live `Page` does not misleadingly show live-deactivation action.
- Draft/non-live `Page` also does not present a casual ordinary delete action in the tested editor.

## What Failed

No concrete UI/runtime failure was confirmed in the tested flow.

What failed is coverage of the allowed-path cases, because suitable live subjects were not available in current data.

There is also a practical operator gap for broader cleanup expectations:

- in the currently tested `Page` editor, there is no UI deletion path at all;
- this is not a runtime bug in the smoke path, but it is a real product limitation if operators expect page cleanup through UI.

## What Could Not Be Tested And Why

Could not verify successful execution for:

- one ordinary published `Page`
- one ordinary published `Service`
- one ordinary published `Case`
- ordinary `Page` delete through UI

Why:

- no safe allowed `Page` candidate with active live truth was available;
- no safe allowed `Service` candidate with a clean dry-run was available;
- no `Case` entities exist in the current live admin data.
- the tested `Page` editor did not expose a delete control, so page removal could not be exercised through UI.

## UI / UX Friction Notes

The tested refusal flow is understandable and does not feel like a technical trap.

Minor friction:

- because the system currently has very little live ordinary data in these families, operator smoke cannot easily cover the happy path without preparing explicit smoke fixtures;
- the button text still renders with mojibake in one editor action row snapshot path, although the dedicated dry-run page itself reads correctly enough to understand the action.
- for operators trying to clean up old test pages, the absence of any visible delete path in the tested page editor is likely to be confusing.

## Verdict

`NOT VERIFIED DUE TO MISSING TEST DATA OR ACCESS`

More specifically:

- access is no longer the blocker;
- the remaining blocker is missing suitable live subjects for allowed-path cases.

## Smallest Next Polish Step

Prepare one bounded smoke fixture for each family:

1. one ordinary published `Page` with no surviving incoming refs;
2. one ordinary published `Service` with no surviving incoming refs or review state;
3. one ordinary published `Case` with no surviving incoming refs or review state.

Then rerun the same operator smoke and execute the allowed path once per family.
