# DOCS.REFINE.PAGES_SINGLE_WORKFLOW.V1.report

## 1. Executive Summary

В этом проходе документация была выровнена из старой модели `Страницы + отдельная AI-верстка` в новую модель одного пользовательского домена `Страницы`.

Ключевой результат:
- закреплён один домен `Страницы`;
- закреплён один главный рабочий экран страницы;
- AI переведён в роль встроенного assistive panel/tool внутри page workspace;
- metadata переведены в отдельный управленческий слой;
- page composition и connective copy закреплены за `Page`;
- несколько engineering docs, которые тащили narrative отдельного top-level AI workspace, переписаны или получили alignment notes.

Главная цель была не переписать канон проекта, а убрать docs-drift вокруг двух конкурирующих surface и вернуть ownership туда, где он и должен быть: к `Page`.

## 2. Scope and Source Docs

### Canon / baseline docs actually used

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/reports/2026-04-10/ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1.md`

### Narrow docs audited

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/UI_RUSSIFICATION_IMPLEMENTATION_PLAN_v1.md`

### Requested but not found under the exact filenames in this workspace snapshot

Следующие файлы были названы в задании, но в текущем workspace не нашлись под этими exact filenames:
- `00_Context_Map_Экостройконтинент.md`
- `01_Project_Truth_and_Current_Phase_Экостройконтинент.md`
- `02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`
- `03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`
- `04_Decisions_Blockers_and_Next_Steps_Экостройконтинент.md`

Вместо этого я опирался на доступный канонический PRD, admin/product docs и уже подготовленный инженерный аудит, который зафиксировал те же boundary-выводы по ownership и AI posture.

## 3. Old Model vs New Model

| Area | Old model in docs | New model after refinement |
| --- | --- | --- |
| User domain | `Страницы` и `AI-верстка` читались как два соседних surface | Один домен `Страницы` |
| First entry | отдельный chooser / dedicated workspace screen | реестр страниц с карточками по умолчанию |
| Main work area | отдельный workspace narrative рядом с page editor | единый главный экран страницы |
| AI posture | dedicated workspace / separate surface | встроенная правая assistive panel |
| Metadata posture | часто торчали как часть main workspace narrative | отдельный tabbed movable metadata layer |
| Left rail | длинная библиотека / source context stack | компактные launcher-иконки + специализированные модалки выбора |
| Composition ownership | page truth acknowledged, but workspace still felt peer-like | `Page` owns composition and connective copy clearly |
| UX posture | bounded, but still engineering-console flavored | лёгкий SEO-specialist workflow |

## 4. Documents Audited

### Product / UX

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`

### Engineering / workflow / contracts

- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_REFINEMENT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/UI_RUSSIFICATION_IMPLEMENTATION_PLAN_v1.md`

## 5. Documents Updated

### New canonical product doc

- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`

### Updated / aligned docs

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`

## 6. Documents Fully Refactored

Полностью переписаны по смысловой модели, а не просто подпатчены:
- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`

Частично выровнены короткими alignment notes, без полной переписи:
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
## 7. Key Decisions Applied

1. Зафиксирован один пользовательский домен `Страницы`.
2. Убран narrative отдельного top-level AI screen.
3. Главный экран страницы описан как единый page workspace.
4. AI закреплён как встроенная assistive panel справа, а не как owner workflow.
5. Метаданные вынесены в отдельный управленческий слой с вкладками и movable modal posture.
6. Левая панель переведена из модели длинного source warehouse в модель компактных launcher-иконок и специализированных selection modals.
7. Connective copy закреплён как часть page-owned composition workflow.
8. UX posture переведён из engineer-dashboard narrative в лёгкий SEO-specialist workflow.

## 8. Ownership Alignment Notes

### Old formulations treated as outdated

Устаревшими признаны формулировки, которые:
- описывали `AI-верстка` как отдельный top-level surface;
- делали chooser обязательным первым входом в работу со страницей;
- допускали конкуренцию между source editor и workspace как будто это два peer workflow;
- описывали composition work как инженерный console-like surface;
- не фиксировали, что страница владеет связками и переходами;
- оставляли metadata на поверхности как главный способ мыслить о странице.

### Ownership after refinement

- `Page` = owner standalone page truth and page-level composition.
- AI = embedded assistant only.
- Metadata = separate management layer, but still page-owned fields.
- Connective copy = page-owned composition text.
- Review/publish = unchanged explicit downstream domain operation.

## 9. Landing Layout / Workspace PRD Refactor Notes

### What changed materially

- `PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md` перестал описывать отдельный landing workspace как продуктовый surface и стал описывать встроенную AI-помощь внутри `Страницы`.
- `AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md` больше не толкает проект к top-level sidebar entry `AI-верстка` и dedicated chooser как primary entry.
- `LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md` теперь описывает page registry, главный page workspace, source launchers, metadata modal и pinned AI panel.
- `LANDING_COMPOSITION_SPEC_CONTRACT_v1.md` теперь прямо фиксирует page-owned connective copy и отказ от detached bridge entity by default.
- `LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md` теперь собирает phases вокруг единого домена `Страницы`, а не вокруг отдельного AI workspace surface.
- `LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md` выровнен так, чтобы execution posture больше не закреплял отдельный first-layer AI domain.

## 10. Remaining Open Questions

1. Должен ли главный рабочий экран страницы жить на текущем page route или на nested route внутри домена `Страницы`.
2. Какие именно вкладки metadata modal нужны в первом implementation slice и что считается truly rare vs frequent.
3. Насколько жёстко фиксировать composition flow presets в центре: совсем narrow story rail или slightly more flexible bounded composition.
4. Какие AI actions входят в first slice pinned panel, чтобы панель была полезной, но не превратилась в prompt lab.
5. Нужно ли дальше переименовывать legacy engineering filenames, или достаточно переписанного содержания и alignment notes.
6. Нужен ли отдельный follow-up sweep по историческим docs вроде old russification / removal plans, если команда хочет убрать даже legacy wording из вторичных документов.

## 11. Recommended Next Documentation / Implementation Epics

1. Подготовить implementation epic по screen architecture для единого домена `Страницы` без изменения канона ownership.
2. Подготовить separate implementation design для metadata modal: вкладки, drag behavior, frequent vs rare fields.
3. Подготовить source-picker UX spec для `Медиа / Кейсы / Услуги` как specialized modal galleries.
4. Подготовить narrow AI-panel action spec: rewrite, bridge, strengthen, CTA help, with explicit guardrails.
5. Подготовить next seam-cut plan по runtime/UI contract, чтобы потом убрать остатки двойного edit narrative уже в коде.

## 12. Decisions I took directly

- Я не менял базовый PRD `PRD_Экостройконтинент_v0.3.1.md`, потому что канон ownership и AI posture там уже был правильный.
- Я ввёл новый canonical UX doc `PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`, потому что существующие узкие docs были слишком завязаны на старую workspace-терминологию и не давали одного чистого product source.
- Я сохранил legacy filenames у нескольких engineering docs, чтобы не запускать в этой задаче дополнительный цикл doc moves / redirects / cross-link cleanup. При этом содержимое этих файлов переписано под новую модель.
- Я не трогал runtime, API, DB, UI implementation и не переписывал исторические reports.

## 13. Conflicts Found Between Documents

Основные конфликты были такими:
- product/engineering docs местами говорили `Page is the truth owner`, но параллельно описывали отдельный workspace как primary surface;
- одни docs говорили `source editor remains truth surface`, а другие всё равно строили отдельный chooser + dedicated workspace как главный UX вход;
- одни docs предупреждали against page-builder drift, а другие по UI shape всё равно подталкивали к second editor / engineering dashboard posture;
- connective copy местами признавался page-scoped, но не был достаточно ясно закреплён как page-owned composition concern.

## 14. Intentionally Not Changed

Сознательно не переписывались:
- historical reports under `docs/reports/*`;
- broad working notes вроде `EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`;
- narrow historical implementation plans, если они не задают текущую canonical screen model напрямую;
- runtime-oriented removal/teardown/delete docs, где упоминание landing workspace не определяет продуктовую UX-модель.

Причина: задача была про выравнивание canonical product + workflow + key engineering docs вокруг одного screen model, а не про полную историческую санацию всех упоминаний старой терминологии в репозитории.
