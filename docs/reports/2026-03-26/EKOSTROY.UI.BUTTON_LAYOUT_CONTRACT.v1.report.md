# EKOSTROY.UI.BUTTON_LAYOUT_CONTRACT.v1

## To-do list
- Review all button/action patterns in admin surfaces.
- Make buttons obey container width instead of behaving like isolated pills.
- Keep multi-action rows readable and compact.
- Make single CTA forms stretch to the card/form width when appropriate.
- Verify the change on the live server.

## Implemented
- Added a global button layout contract in `components/admin/admin-ui.module.css`.
- Constrained primary/secondary/danger buttons with:
  - `max-width: 100%`
  - `box-sizing: border-box`
  - wrapped text
  - safer `min-width: 0`
- Added `stretchButton` for full-width single CTA forms.
- Applied the stretch pattern to:
  - admin logout
  - login
  - superadmin bootstrap
  - media upload
  - users create form
- Kept review/action rows with multiple buttons compact and readable.

## Verification
- Local build: `npm run build` ✅
- Local tests: `npm test` ✅
- Build workflow: `23606688671` ✅
- Build workflow: `23606878234` ✅
- Deploy workflow: `23606762301` ✅
- Deploy workflow: `23606949082` ✅

## Live routes checked
- `/admin/users`
- `/admin/login`
- `/admin/bootstrap/superadmin`
- `/admin/review/rev_ec990634-3e1e-43d9-9ace-478390d74c44`
- `/admin/revisions/rev_ec990634-3e1e-43d9-9ace-478390d74c44/publish`

## Live result
- `Создать пользователя` now stretches across the full card width.
- `Войти` now stretches across the auth card width.
- `Создать учётную запись` now stretches across the bootstrap card width.
- Multi-action review rows remain compact and intact.

## Residuals
- Publish/review screens still have compact multi-action rows by design.
- Runtime proof data and some media fixture noise remain a separate content/runtime track.
