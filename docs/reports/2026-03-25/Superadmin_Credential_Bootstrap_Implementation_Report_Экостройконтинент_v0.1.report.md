# Superadmin Credential Bootstrap Implementation Report Экостройконтинент v0.1

Дата: 2026-03-25  
Проект: «Экостройконтинент»  
Тип: implementation report / security-sensitive feature  
Место в репозитории: `docs/reports/2026-03-25/`

## Executive summary

Реализован узкий security-sensitive flow `bootstrap_superadmin_credentials` для проекта «Экостройконтинент».

Ключевой результат: bootstrap superadmin credentials теперь живёт в отдельном dedicated service boundary и не проходит через ordinary `users/create`. Поток остаётся human-mediated, fail-closed, auditable и one-time по смыслу. Plaintext secret не уходит в обычные логи, audit events, transcripts или отчёты. Для оператора предусмотрен отдельный thin bootstrap surface, а secure reveal выдаётся только в one-time human-only response.

Текущий статус работы: core implementation выполнен, локально проверен и остановлен на mandatory pre-commit review gate. Финальное закрытие ожидает человеческого review/approval.

## What was implemented

### 1. Dedicated bootstrap service boundary

Добавлен отдельный сервис `lib/auth/superadmin-bootstrap.js`, который и является реальной security boundary для операции bootstrap.

Сервис делает только узкий набор действий:

- проверяет, что bootstrap вообще разрешён конфигом;
- требует явного confirmation flag;
- проверяет authority token через fixed-match compare;
- использует fixed target identity из config;
- проверяет, что bootstrap target ещё не существует;
- генерирует server-side password;
- хеширует пароль перед записью;
- создаёт superadmin-учётку;
- пишет audit event без secret material;
- возвращает результат в one-time reveal форме;
- при audit failure делает best-effort cleanup и fail-closed abort.

Сервис не использует ordinary user CRUD как bootstrap primitive и не превращает обычное создание пользователя в скрытый privileged path.

### 2. Human-only secure reveal path

Добавлен отдельный route `app/api/admin/bootstrap/superadmin/route.js`, который вызывает только dedicated bootstrap service.

Публичного plaintext secret в обычных app outputs нет:

- response для reveal помечен `Cache-Control: no-store, no-cache, must-revalidate, private, max-age=0`;
- добавлены `Pragma: no-cache`, `Expires: 0`;
- response дополнительно защищён `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-Robots-Tag`;
- сам reveal выводится как одноразовый HTML response для человека-оператора, а не как обычный agent transcript payload.

### 3. Operator surface

Добавлена отдельная operator page `app/admin/bootstrap/superadmin/page.js`.

Это не полноценный auth platform UI и не user management dashboard. Это узкий operator surface для одного действия:

- показать фиксированный target login;
- принять bootstrap authority token;
- зафиксировать confirmation;
- сообщить, что пароль будет показан один раз;
- заблокировать использование, если bootstrap authority token не сконфигурирован.

### 4. Config and repository support

Добавлены минимальные config primitives в `lib/config.js` и `.env.example`:

- `BOOTSTRAP_SUPERADMIN_USERNAME`
- `BOOTSTRAP_SUPERADMIN_DISPLAY_NAME`
- `BOOTSTRAP_SUPERADMIN_ACCESS_TOKEN`

Это позволяет держать target identity locked и не принимать free-form target identity input.

В `lib/content-core/repository.js` добавлен narrow cleanup helper `deleteUserRecord`, чтобы failure path мог оставаться fail-closed, если audit write после create не удаётся.

### 5. Audit and redaction posture

Добавлены dedicated audit event keys в `lib/content-core/content-types.js`:

- `SUPERADMIN_CREDENTIAL_BOOTSTRAPPED`
- `SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED`

Audit event payloads intentionally do not include plaintext secret material. В деталях события есть только trace, authority class, target identity ref, outcome, failure code и флаг, что secret material не включён.

### 6. Focused tests

Добавлен focused test file `tests/auth.superadmin-bootstrap.test.js`, который проверяет:

- successful bootstrap creates reserved superadmin;
- secret material is absent from audit JSON;
- missing confirmation fails closed;
- wrong authority token fails closed;
- already existing reserved target fails closed;
- reveal HTML contains the password only in the intended one-time reveal surface.

## Canonical decisions preserved

Эта реализация удерживает frozen decisions, которые были приняты до coding:

- secure reveal model = server-generated password with one-time secure reveal;
- runtime service boundary = dedicated bootstrap service / operation;
- target identity model = fixed reserved bootstrap identity / locked exact-match config value;
- security posture = no plaintext secret in ordinary logs, reports, transcripts, or audit events;
- bootstrap semantics = one-time or tightly governed exceptional flow, not reset, not rotate, not role elevation, not reusable bypass.

## Files changed

- [lib/auth/superadmin-bootstrap.js](../../../lib/auth/superadmin-bootstrap.js) - dedicated bootstrap service, one-time reveal rendering, audit/redaction, fail-closed semantics.
- [app/api/admin/bootstrap/superadmin/route.js](../../../app/api/admin/bootstrap/superadmin/route.js) - dedicated POST route for bootstrap operation and secure reveal response.
- [app/admin/bootstrap/superadmin/page.js](../../../app/admin/bootstrap/superadmin/page.js) - operator page for the narrow bootstrap flow.
- [lib/config.js](../../../lib/config.js) - bootstrap identity and authority token config.
- [.env.example](../../../.env.example) - environment contract for bootstrap configuration.
- [lib/content-core/content-types.js](../../../lib/content-core/content-types.js) - dedicated audit event keys.
- [lib/content-core/repository.js](../../../lib/content-core/repository.js) - narrow cleanup helper for fail-closed rollback behavior.
- [tests/auth.superadmin-bootstrap.test.js](../../../tests/auth.superadmin-bootstrap.test.js) - focused verification coverage.

## Verification

### Focused test verification

- `npm test` → passed.
- Result observed during execution: `13/13` tests passed.

### Focused behavioral checks

Проверено, что:

- dedicated bootstrap service is separate from ordinary CRUD;
- ordinary `users/create` does not contain bootstrap semantics;
- target identity is fixed, not free-form;
- audit payload redacts secret material;
- wrong authority token and missing confirmation fail closed;
- already-existing bootstrap target is rejected;
- reveal response uses secure no-store/noindex posture.

### Regression boundary checks

Проверено, что ordinary user creation path не стал hidden bootstrap backdoor:

- bootstrap references are absent from ordinary user create route;
- bootstrap references are absent from ordinary user admin screen;
- bootstrap path is only available through the dedicated bootstrap route/service pair.

## Why it is safe

Безопасность здесь держится на нескольких жёстких швах:

1. Dedicated boundary. Реальная privileged logic вынесена из обычного CRUD path.
2. Fixed identity. Операция не принимает произвольный target identity.
3. Fail-closed authority. Без правильного authority token bootstrap не стартует.
4. One-time reveal. Plaintext secret не живёт в logs/audit/reports, а выводится только в одноразовом human-only response.
5. Secret redaction. Audit useful without secret material.
6. No hidden backdoor. Ordinary user creation remains ordinary user creation.
7. No scope drift. Feature не расширен в reset / rotate / broad IAM.

## Residual risks

Остались только реальные operational residuals:

- bootstrap authority token itself должен быть provisioned и stored safely как deployment secret;
- one-time reveal по определению не восстанавливается из normal app outputs;
- thin operator surface intentionally narrow и может потребовать later UX tightening, если команда решит изменить operator workflow;
- local/dev provisioning paths outside this feature, если они существуют, не были переписаны в broad auth refactor.

Никаких secret-leak residuals в ordinary outputs не выявлено.

## Stop triggers checked

На текущем этапе не сработали:

- plaintext secret outside reveal path;
- ordinary user CRUD as bootstrap path;
- free-form target identity;
- raw DB credential writes;
- audit requiring secret leakage;
- reusable admin bypass drift;
- reset / rotate / full IAM expansion;
- broad unrelated auth surface creep.

## Review gate status

Статус работы: `ready for review`.

Это означает:

- core bootstrap path реализован;
- focused verification пройден;
- дальнейшее движение без review/approval было бы уже не execution, а finalization.

Если после review потребуется, возможен только minimal cleanup. Scope beyond this feature should remain blocked.
