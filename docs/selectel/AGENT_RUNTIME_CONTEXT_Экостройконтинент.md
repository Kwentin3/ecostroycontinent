# AGENT_RUNTIME_CONTEXT_Экостройконтинент

Статус: agent-facing runtime briefing
Назначение: короткая памятка для аудитов public site, content inventory, Services/Cases/Media/Equipment и deployed data.

## 1. Hard Runtime Truth

- Workspace агента не является source of truth для runtime data.
- В workspace по умолчанию нет production/stage PostgreSQL базы.
- Фактический опубликованный контент живет в deployed runtime на сервере/хостинге.
- `ECONNREFUSED` при обращении к локальному Postgres из workspace сам по себе не доказывает дефект продукта, отсутствие published content или поломку сайта.
- Для published content проверок используй deployed site/server/admin/API по ops-документам проекта.
- Не начинай local DB provisioning, seed или repair, если задача явно не просит local runtime setup.

## 2. Always Separate These Layers

1. Code/schema contract in repository.
2. Local workspace capabilities.
3. Deployed runtime on server.
4. Actual published content visible in public/admin/runtime data.

`Service`, `Case`, `MediaAsset`, `Gallery` и `Equipment` contracts могут существовать и быть корректными в коде, даже если workspace не подключается к локальной БД.

## 3. Published Content Checks

Для задач про опубликованные услуги, кейсы, медиа, технику и карточки:

- сначала проверь code/schema contract в репозитории;
- затем проверь deployed runtime, если задача требует фактического content inventory;
- используй только read-only операции без отдельного разрешения на изменения;
- не делай вывод "контент отсутствует" только из локального `ECONNREFUSED`;
- не создавай отдельный публичный `/equipment` domain без отдельного продуктового решения.

Принятые ops-источники:

- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.FACTUAL_RESOURCE_INVENTORY_Экостройконтинент_v0.2.md`
- `docs/selectel/INFRA.Contract_VM_Runtime_and_Host_Setup_Экостройконтинент_v0.1.md`
- `docs/selectel/INFRA.Contract_Deploy_GHCR_Runner_and_Compose_Surface_Экостройконтинент_v0.1.md`
- `compose.yaml`
- `.env.example`

## 4. Site Structure Tasks

Перед аудитом структуры публичного сайта прочитай:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`
- этот runtime briefing

Продуктовая трактовка для текущего канона:

- Services продают коммерческие направления.
- Equipment является supporting content для аренды техники, пока отдельно не принято решение делать public equipment domain.
- Cases / portfolio доказывают выполненные работы.
- Media визуально подтверждают услуги и кейсы через IDs/refs, а не через raw URL truth.

## 5. Sticky Rule For Future Agents

Local workspace may not have the runtime DB. Do not treat local Postgres `ECONNREFUSED` as proof of missing published content. Verify live published content through deployed runtime/server/admin/API according to this document and the Selectel runbook.
