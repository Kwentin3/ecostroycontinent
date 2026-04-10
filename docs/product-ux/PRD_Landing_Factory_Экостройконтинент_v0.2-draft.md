# PRD: Embedded AI Assistance for Page Composition in `Страницы`

Статус: draft, refactored to single-workflow model
Дата: 2026-04-10
Legacy filename note: path retained for continuity with earlier landing-factory discussion, but the product model below no longer describes a separate top-level landing workspace.

## 1. Purpose

Этот документ фиксирует узкий продуктовый слой AI-помощи внутри домена `Страницы`.

Он больше не описывает отдельный продуктовый surface `AI-верстка`. Вместо этого он описывает, как AI встраивается в единый page workflow, где canonical owner остаётся у `Page`.

## 2. Product position

В первом пользовательском слое существует один домен: `Страницы`.

Внутри него есть:
- экран всех страниц;
- главный рабочий экран страницы;
- отдельный metadata layer;
- встроенная AI-панель справа в page workspace.

AI не создаёт отдельный top-level screen, не является owner истины и не заменяет explicit review/publish flow.

## 3. Why this model

Эта модель решает реальные проблемы, выявленные аудитом:
- два соседних entry point в один page workflow;
- ownership drift между `Страницы` и `AI-верстка`;
- ощущение второго редактора страницы;
- избыточно инженерный UX вокруг composition work.

## 4. User-facing surfaces

### 4.1 Реестр страниц

`Страницы` - обзорный экран и точка входа в работу.

Expected behavior:
- default view = `Карточки`;
- secondary view = `Список`;
- поиск и фильтры доступны сразу;
- карточка страницы минимальная: название, превью, статус, `три точки`.

### 4.2 Главный рабочий экран страницы

Это единый page workspace.

Внутри:
- центр = canvas / story rail страницы;
- слева = компактные входы в источники (`Медиа`, `Кейсы`, `Услуги`);
- справа = закреплённая AI-панель.

### 4.3 Metadata layer

Метаданные не занимают главный экран. Они открываются как отдельный управленческий слой:
- по `три точки` с карточки;
- по `три точки` внутри страницы;
- в виде удобной вкладочной и двигаемой модалки.

## 5. What AI helps with

AI помогает внутри page workspace:
- draft copy;
- connective copy;
- усиление блока;
- формулировки переходов;
- CTA и компактные SEO-friendly варианты текста.

AI не помогает как отдельный owner workflow и не должен подменять canonical page truth.

## 6. Composition rule

Страница владеет:
- page-level composition;
- переходами между блоками;
- связочным текстом;
- порядком и логикой page-owned assembly.

Следствие:
- connective copy остаётся частью page workflow;
- он не становится отдельной библиотечной сущностью по умолчанию;
- AI может помогать его писать, но не владеть им.

## 7. UX posture

Это инструмент SEO-специалиста, а не инженерный пульт.

Поэтому в первом слое нельзя делать акцент на:
- Memory Card;
- trace / candidate / spec jargon;
- тяжёлую диагностику;
- отдельный chooser для AI surface.

В первом слое нужен ясный ответ на вопросы:
- какую страницу я сейчас собираю;
- из каких материалов;
- как читается история;
- где мне быстро попросить AI помочь;
- где открыть метаданные, если они понадобились.

## 8. Workflow summary

1. Открыть `Страницы`.
2. Найти нужную страницу через карточки/список, поиск и фильтры.
3. Кликнуть по карточке и войти в главный page workspace.
4. Собрать композицию страницы на центральном canvas.
5. При необходимости открыть источники слева через специализированные модалки выбора.
6. При необходимости обратиться к AI-панели справа.
7. При необходимости открыть metadata layer через `три точки`.
8. Дальше использовать существующий explicit review/publish flow.

## 9. Explicit non-goals

- отдельный top-level AI workspace;
- параллельный owner workflow для страницы;
- page-builder-first posture;
- prompt-lab UX;
- длинный левый склад сущностей;
- вываливание редких metadata-полей в основной центр экрана.

## 10. Documentation alignment rule

Все engineering- и UX-документы, которые описывают:
- `AI-верстка` как top-level раздел;
- chooser как обязательный первичный вход в page composition;
- два равноправных editor surface для страницы,

считаются устаревшими и должны быть выровнены с doc [PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1](./PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md).
