# Selectel Docs - Экостройконтинент

Статус: индекс актуальных Selectel/runtime документов.
Обновлено: 2026-06-11.

## Что осталось

- `AGENT_RUNTIME_CONTEXT_Экостройконтинент.md` - короткая памятка для агентов: где runtime truth, что нельзя выводить из локального workspace, как не перепутать CDN delivery и content truth.
- `RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md` - текущий operations runbook: VM, compose, deploy, health/readiness, smoke, CDN, runner, logs, backups, restore drill, SSH hardening.
- `README.md` - этот индекс.

## Что больше не держим здесь

В этой папке больше не храним исторические v0.1/v0.2 input packs, provisioning reports, review notes, gaps-аудиты и старые PRD/infra-contract документы. Они создавали противоречия с текущим runbook и текущим `compose.yaml`.

Для исторического контекста смотри date-based reports в `docs/reports/YYYY-MM-DD/`. Для текущего production/deploy решения используй runbook из этой папки.

## Текущие runtime источники

- `compose.yaml` - compose/env surface, который должен соответствовать VM runtime.
- `.env.example` - имена env-переменных без секретов.
- `/opt/ecostroycontinent/runtime/.env` на VM - production runtime env.
- live `/api/readiness` - факт, какой runtime сейчас отвечает.
- GitHub Actions + GHCR digest - deploy trace.

## Секреты

Секреты нельзя коммитить в docs.

Локально в этой папке могут лежать ignored operator files:

- `LOCAL_SECRETS_NOT_FOR_GIT.md`
- `rc.sh`
- PEM/key/cert bundles

Они нужны только оператору и скриптам, не являются документацией и не должны попадать в git.
