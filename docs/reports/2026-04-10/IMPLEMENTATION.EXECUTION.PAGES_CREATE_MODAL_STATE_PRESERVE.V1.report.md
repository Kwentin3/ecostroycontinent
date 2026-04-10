# IMPLEMENTATION.EXECUTION.PAGES_CREATE_MODAL_STATE_PRESERVE.V1.report

## 1. Executive Summary

Выполнен узкий follow-up для registry-native create flow в домене `Страницы`: после server-side validation error create modal снова открывается в реестре и сохраняет введённые `pageType` и `title`. Решение осталось bounded: без нового draft-domain, без client storage слоя и без превращения create flow в wizard.

## 2. Source Docs Used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_SINGLE_WORKFLOW_EPIC.V1.report.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_FOLLOWUP_CLEANUP_AND_POLISH.V1.report.md`

Все заявленные пути найдены без подмены эквивалентами.

## 3. Chosen Preservation Mechanism

Выбран механизм `query-param reopen + bounded value rehydration`.

При create submit с `redirectMode=page_workspace` и server-side validation error сервер возвращает redirect обратно в page registry с коротким набором query-параметров:

- `create=1`
- `error=<operator message>`
- `createPageType=<pageType>`
- `createTitle=<title>`

Далее registry route собирает bounded create-state, а `PageRegistryClient`:

- автоматически переоткрывает modal;
- ре-гидрирует `pageType`;
- ре-гидрирует `title`;
- показывает сообщение об ошибке внутри modal.

## 4. Why This Mechanism Was Chosen

Это минимально достаточное решение для текущего bounded create contract:

- не требует отдельного хранилища состояния;
- не создаёт новый draft/domain слой;
- не меняет canonical page create lifecycle;
- остаётся совместимым с redirect-based server validation flow;
- затрагивает только registry create modal и failure return path.

Альтернативы вроде local/session storage или отдельного flash-store были бы тяжелее и добавили бы ненужную инфраструктуру для двух простых полей.

## 5. Fields Preserved

Сохраняются только поля текущего bounded create payload:

- `pageType`
- `title`

Также сохраняется continuity контекста ошибки:

- `error` как operator-facing validation message

## 6. Fields Intentionally Not Preserved

Сознательно не сохраняются:

- любые metadata-поля;
- SEO-поля;
- route/type ownership fields beyond current create contract;
- workspace/composition state;
- publish/review/history state.

Причина: этот epic закрывает только UX-хвост create modal и не должен раздувать create flow за пределы уже согласованного bounded payload.

## 7. Files Changed

- `app/admin/(console)/entities/[entityType]/page.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `lib/admin/page-registry-create.js`
- `tests/admin/entity-save.route.test.js`
- `tests/admin/page-registry-create.test.js`

## 8. Tests / Checks Run

- `npm test`
- `npm run build`
- `git push origin main`
- GitHub Actions `build-and-publish` run `24241557668`
- GitHub Actions `deploy-phase1` run `24241634341`

Результат:

- tests: green (`138/138`)
- build: green
- push: green
- image publish: green (`ghcr.io/kwentin3/ecostroycontinent-app@sha256:97b1fbed419aa036972f5da88de76324bc337ed805a922e41b60b016507fd21e`)
- server deploy + health probe through Traefik: green
- сохранён уже известный нерелевантный warning Turbopack NFT вокруг `next.config.mjs`; новый create flow его не добавлял

## 9. Risks Found

### Low — URL echo for bounded create values

`title` временно попадает в redirect query string. Для текущего bounded create flow это допустимо, потому что поле не является чувствительным и уже относится к будущему public-facing page title. При этом решение сознательно не расширено на более широкий набор полей.

### Low — Query-driven reopen tied to registry route contract

Переоткрытие modal теперь опирается на короткий query contract. Это узкая и осознанная связь; она остаётся допустимой, пока create modal живёт внутри registry narrative.

## 10. What Was Intentionally Deferred

- Любая client-side persistence beyond redirect cycle.
- Любое расширение create payload.
- Любой redesign modal.
- Любые изменения fallback route `/admin/entities/page/new`.
- Любые изменения page workspace / metadata / AI / preview architecture.

## 11. Remaining Open Questions

- Нужно ли в будущем очищать `create`-query из URL сразу после повторного открытия modal, или текущий redirect-safe вариант достаточно хорош для bounded registry flow.
- Нужно ли со временем унифицировать error flash handling между registry create modal и другими lightweight admin modals, если похожие сценарии появятся ещё где-то.

## 12. Recommended Next Step

Если follow-up окажется стабильным в реальной операторской работе, следующий разумный маленький шаг — не расширять create flow, а аккуратно унифицировать lightweight modal error-return pattern для других bounded admin actions только там, где реально есть такой же redirect-based UX seam.
