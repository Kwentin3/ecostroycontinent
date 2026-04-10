# LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1

Статус: fully refactored to single-page-workflow UX model
Дата: 2026-04-10
Legacy filename note: retained for continuity; the document now describes the main page workspace inside `Страницы`, not a separate top-level landing workspace.

## 1. Objective

Зафиксировать правильный UX для первого рабочего среза page composition:
- один домен `Страницы`;
- один главный рабочий экран страницы;
- AI как встроенный помощник справа;
- лёгкий интерфейс для SEO-специалиста;
- page-owned composition and connective copy.

## 2. Product problem

Старая модель была directionally useful, но давала неправильный первый слой:
- отдельный AI surface рядом со `Страницы`;
- слишком заметный инженерный слой;
- длинный склад источников слева;
- неочевидный слой метаданных;
- слабая иерархия между частым и редким.

Новая цель - не “сделать красивее workspace”, а вернуть всё в единый page workflow.

## 3. Real operator job

SEO-специалист не управляет внутренними runtime-состояниями. Его задача:
- открыть нужную страницу;
- взять подходящие доказательства и источники;
- собрать читаемую историю;
- написать связки и переходы;
- быстро попросить AI помочь там, где это ускоряет работу;
- отправить результат дальше в existing review/publish path.

## 4. Screen model

### 4.1 Реестр страниц

Экран `Страницы` - обзор и вход в работу.

Первый слой:
- карточки по умолчанию;
- `Карточки / Список` как переключатель режима просмотра;
- поиск и фильтры;
- минимальные карточки без dashboard-overload.

### 4.2 Карточка страницы

На карточке видны только:
- название;
- превью;
- статус;
- `три точки`.

Клик по карточке открывает главный рабочий экран страницы.

`Три точки` дают:
- быстрые действия;
- вход в metadata modal.

### 4.3 Главный рабочий экран страницы

Основной layout:
- центр = story rail / canvas страницы;
- слева = компактные launcher-иконки источников;
- справа = закреплённая AI-панель.

Это не отдельный AI screen, не второй owner workflow и не page builder.

## 5. Center: page canvas / story rail

Центр должен ощущаться как рабочая сборка страницы, а не как form stack и не как инженерный dashboard.

### What belongs in the center

- сама история страницы;
- page-owned composition;
- inline connective text;
- bounded composition controls;
- быстрый preview reading.

### What does not belong in the center by default

- редкие metadata-поля;
- trace / candidate / memory jargon;
- технические отчёты как first-layer content;
- отдельный склад сущностей.

## 6. Left source panel

Левый rail должен быть коротким и понятным.

### First slice launchers

- `Медиа`
- `Кейсы`
- `Услуги`

### Interaction rule

По клику на launcher открывается специализированная модалка / галерея выбора.

То есть пользователь не читает бесконечную колонку карточек на rail. Он:
- выбирает нужный тип источника;
- видит удобный picker;
- берёт материал;
- возвращается в страницу.

Это помогает держать интерфейс лёгким для SEO-специалиста.

## 7. Connective copy and composition ownership

Страница владеет не только набором proof elements, но и связками между ними.

Поэтому connective copy должен:
- быть встроен в page workflow;
- редактироваться рядом с тем местом, где нужен переход;
- читаться как часть страницы, а не как отдельная сущность.

### UX rule

Связочный текст нельзя вытаскивать в отдельный detached form layer и нельзя описывать как внешний reusable object без жёсткой причины.

По умолчанию он page-owned.

## 8. Metadata management

Метаданные не должны конкурировать с основной работой над страницей.

Правильная модель:
- metadata открываются по требованию;
- layer оформлен как вкладочная двигаемая модалка;
- редкое и служебное живёт там, а не в центре.

### Metadata tabs: recommended first slice

- `Основное`
- `SEO`
- `Маршрут и статус`
- `Служебное`

Точный состав вкладок можно уточнять в implementation phase, но posture фиксируется уже сейчас: metadata = separate management layer.

## 9. AI posture

AI живёт внутри page workspace как pinned assistant panel.

### AI helps with

- draft wording;
- connective text;
- stronger transitions;
- CTA and framing improvements;
- quick rewrite assistance.

### AI does not become

- top-level product surface;
- second editor owner;
- prompt lab;
- autonomous publisher.

## 10. UX posture

Это инструмент SEO-специалиста, а не инженерная станция.

Поэтому главные правила такие:
- frequent work stays visible;
- rare and service controls move behind menus and modals;
- technical diagnostics stay behind disclosure;
- the screen should feel lighter than the current engineering-console posture.

## 11. Explicit non-goals

- отдельный top-level AI chooser;
- отдельный top-level AI editor;
- infinite left-rail warehouse;
- page-builder freedom;
- metadata as the main face of the page screen;
- overexposed internal runtime state.
