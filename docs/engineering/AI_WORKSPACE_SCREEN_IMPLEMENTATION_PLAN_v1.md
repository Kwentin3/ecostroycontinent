# AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1

Статус: refactored to single-workflow model
Дата: 2026-04-10
Legacy filename note: path retained for continuity, but the target model below no longer introduces `AI-верстка` as a separate top-level screen.

## 1. Objective

Убрать старую поверхностную модель `Страницы + отдельная AI-верстка` и привести screen model к одному домену `Страницы`.

Implementation posture для docs:
- один пользовательский домен `Страницы`;
- один главный рабочий экран страницы;
- AI встроен как assistive panel внутри page workspace;
- metadata вынесены в отдельный управленческий слой;
- publish/review остаются existing explicit downstream workflow.

## 2. What the audit changed

Аудит показал, что старая модель создаёт:
- двойной вход в один page workflow;
- ownership drift;
- ощущение второго editor surface;
- лишний engineer-dashboard слой в первом UX-экране.

Поэтому больше не целимся в:
- отдельный sidebar entry `AI-верстка`;
- отдельный chooser как обязательный вход;
- отдельный dedicated AI screen как peer surface к `Страницы`.

## 3. Target screen model

### First level: `Страницы`

`Страницы` - это обзорный реестр страниц и основной вход в работу.

Expected first-layer behavior:
- default view = карточки;
- secondary view = список;
- поиск и фильтры доступны сразу;
- карточка страницы минимальная: название, превью, статус, `три точки`.

### Main page workspace

Клик по карточке страницы открывает единый главный экран страницы.

Workspace composition:
- центр = canvas / story rail страницы;
- слева = компактные source launchers;
- справа = закреплённая AI-панель.

### Metadata layer

Метаданные открываются не как отдельный экран, а как separate management layer:
- по `три точки` на карточке;
- по `три точки` внутри страницы;
- во вкладочной двигаемой модалке.

## 4. Navigation posture

### Must stay true

- Пользователь входит в composition work через домен `Страницы`.
- AI не получает своего top-level nav item.
- Если нужен технический nested route, он должен оставаться внутри домена `Страницы`, а не рядом с ним как отдельный primary surface.

### Route rule for future implementation

Документация не фиксирует единственный URL shape, но фиксирует boundary:
- допустим nested route внутри `Страницы`;
- недопустим новый top-level пользовательский домен `AI-верстка`.

## 5. Main page workspace composition

### Center

Центр - главный рабочий слой страницы:
- story rail / canvas;
- page-owned composition;
- inline work with connective text;
- быстрый preview reading without dashboard overload.

### Left source panel

Левый rail не должен быть бесконечным складом карточек сущностей.

First slice:
- `Медиа`
- `Кейсы`
- `Услуги`

Поведение:
- на rail видны только компактные точки входа;
- по клику открываются специализированные модалки / галереи выбора;
- пользователь выбирает источник и возвращается в canvas.

### Right AI panel

Правый rail - встроенный помощник:
- AI suggestions;
- rewrite / bridge / strengthen actions;
- лёгкая context help;
- без превращения в prompt lab.

## 6. Ownership boundary

- `Page` remains canonical owner of standalone page truth and page-level composition.
- Connective copy belongs to the page workflow itself.
- Metadata remain page-owned, but move into a separate management layer for UX clarity.
- AI can assist, but cannot appear as a second owner workflow.

## 7. Reuse vs new surface matrix

| Concern | Keep | Change |
| --- | --- | --- |
| Canonical `Page` ownership | yes | no second owner surface |
| Review / publish flow | yes | keep explicit downstream path |
| AI assistance | yes | move from separate-surface narrative into embedded right rail |
| Metadata editing | yes | move from first-layer clutter into modal management layer |
| Source selection | yes | replace long left lists with launcher + specialized modal pattern |

## 8. Documentation-driven implementation phases

### Phase 1

- Lock the one-domain posture: `Страницы` only.
- Remove the separate top-level AI screen narrative from implementation docs.
- Lock metadata-as-layer posture.

### Phase 2

- Define page registry behavior: cards by default, list as secondary mode, search and filters.
- Define minimal page card contract and three-dots actions.

### Phase 3

- Define main page workspace layout:
  - center canvas;
  - left source launcher rail;
  - right pinned AI panel.
- Define page-owned connective-copy UX.

### Phase 4

- Align engineering contracts so AI remains assistive and page remains owner.
- Keep review/publish/path semantics unchanged.

## 9. Explicit non-goals

- отдельный first-layer AI chooser;
- отдельный peer screen к `Страницы`;
- page-builder-first posture;
- long-scroll source warehouse on the left;
- surfacing rare metadata in the main workspace by default;
- turning the page screen into an engineering console.
