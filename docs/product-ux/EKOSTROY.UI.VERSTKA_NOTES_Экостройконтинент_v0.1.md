# EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1

Статус: working notes
Дата: 2026-03-26

Эта заметка нужна как рабочий файл для накопления наблюдений по вёрстке и интерфейсной подаче.
Код здесь не меняем, только фиксируем замечания и будущие точки для плана редактуры.

## Consolidated view

### What is already clear
- Left shell navigation should not behave like ordinary page content; it needs to stay available on long screens.
- Nested editor surfaces need a visible way to show depth and to return one level up.
- Right-side support/status blocks should feel more static and compact than the main editor scroll.
- Several screens repeat the same density problem: fields are too close together and the layout feels crowded.
- Some field names are semantically weak for ordinary users, especially where the UI already mixes business text, SEO text and internal workflow text.
- `Медиа`, `Галереи`, `Кейсы`, `Страницы` and `Услуги` are one repeated pattern, not five unrelated bugs.
- `Пользователи` is a separate structural issue: the screen feels like a squeezed one-page split and not a comfortable CRUD surface.
- We likely need a shared shell pattern for nested content editors so the user does not have to relearn layout and navigation on every screen.
- The goal is consistent interface grammar across screens, not a giant monolith component.

### Priority clusters
1. Shell and navigation
2. Layout density and spacing
3. Nested depth and return path
4. Field semantics and naming
5. Reuse vs duplication in media flows
6. CRUD structure for Пользователи
7. Shared shell pattern for repeated editor surfaces

### Screens covered by these notes
- `Админка` shell and dashboard
- `Настройки`
- `Проверка`
- `Медиа`
- `Галереи`
- `Кейсы`
- `Страницы`
- `Услуги` by repeated pattern from chat context
- `Пользователи`

### High-level direction
- Build one shared layout grammar for nested editors.
- Apply it first to `Медиа`, `Галереи`, `Кейсы`, `Страницы`, `Услуги`.
- Keep `Пользователи` compatible with the grammar, but allow a lighter variant if it needs a more CRUD-oriented split.
- Use the same rules for sidebar, breadcrumb/depth, right rail, and work area so screen switching feels familiar instead of cognitively expensive.

## Live notes

### 1. Левая навигационная панель не закреплена
- Surface: admin shell / left sidebar.
- Current observation: панель навигации ведёт себя как обычный потоковый блок и прокручивается вместе со страницей.
- DOM check on `/admin`: `ASIDE`, `position: static`, `overflow-y: visible`, то есть sticky/fixed поведения нет.
- Why it matters: навигация должна оставаться доступной на длинных экранах, иначе пользователь теряет контекст и вынужден возвращаться наверх, чтобы перейти в другой раздел.
- Desired direction: сделать левую панель статической для viewport-уровня shell, чтобы main content скроллился отдельно.
- Severity: medium.

### 2. Dashboard cards визуально читаются, но proof-data шумит
- Surface: admin dashboard.
- Current observation: shell стал русским, но карточки действий по-прежнему наполнены proof data и английскими названиями сущностей.
- Why it matters: это не ломает shell, но создаёт ощущение незавершённости и мешает оценивать вёрстку как чистый продуктовый экран.
- Desired direction: отдельно почистить runtime/content layer, чтобы визуальная оценка shell не смешивалась с proof fixtures.
- Severity: low.

### 3. Review/detail layout уже полезный, но перегружен служебными блоками
- Surface: review detail / entity detail.
- Current observation: двухколоночная схема понятная, но на длинных сущностях экран быстро превращается в очень высокий operational page.
- Live impression: левая колонка с формой и right preview одновременно содержат много повторяющегося proof-data, поэтому экран выглядит тяжелее, чем должен для рабочей проверки.
- Why it matters: для Business Owner и нетехнического пользователя плотность может быть тяжёлой, особенно если служебных карточек много.
- Desired direction: позже проверить, можно ли сократить плотность без изменения смысла workflow.
- Severity: low.

### 4. Экран глобальных настроек тесноват по вертикали и в блоках управления
- Surface: `Настройки` / global settings editor.
- Current observation: на скриншоте поля и правые status cards расположены очень плотно; визуально чувствуется нехватка воздуха между секциями.
- Live impression: текстовые поля, чекбокс, выпадающий список и соседняя readiness-колонка образуют довольно напряжённую композицию, особенно вокруг блока с пояснением к кнопке и правой sidebar-колонкой.
- Why it matters: для нетехнического пользователя такой экран выглядит более «админским», чем дружелюбным, даже если тексты уже русские.
- Desired direction: позже проверить вертикальные отступы, ширину левой колонки и ощущение иерархии между form area и support cards.
- Severity: medium.

### 5. Вложенные экраны не дают удобного пути назад по уровню
- Surface: nested admin flows, особенно `Проверка` -> `Открыть проверку`, а также entity list -> entity detail -> history.
- Current observation: у nested screen есть собственный content, но явной breadcrumb/map-of-depth навигации сверху нет; возврат в контекст приходится делать через sidebar или отдельные ссылки.
- Why it matters: при вложенности пользователь теряет ощущение "где я нахожусь" и "как вернуться на уровень выше" без лишнего поиска.
- Desired direction: потом выбрать один из двух вариантов:
  - либо раскрывающаяся вложенность в левой панели;
  - либо верхняя навигационная карта / breadcrumb, показывающая основной экран и подуровень.
- Severity: medium.

### 6. Медиа-редактор выглядит тесно в верхней части формы
- Surface: `Медиа` -> `Открыть` -> media detail editor.
- Current observation: в верхнем блоке редактора поля идут очень близко друг к другу; визуально заметно, что форма сжимается и теряет воздух между adjacent controls.
- Live impression: первая зона с `Смысл изменения`, `Название`, `Описание изображения`, `Подпись`, `Примечание о правах` и `Примечание об источнике` читается как dense operational form, а не как спокойный editor surface.
- Why it matters: для визуальной оценки это выглядит менее friendly и повышает риск accidental mistakes при заполнении.
- Desired direction: позже проверить, можно ли упростить сетку верхней части формы или сократить количество параллельных полей в одном ряду.
- Severity: medium.

### 7. Галерея повторяет ту же проблему вложенности и плотности
- Surface: `Галереи` -> `Открыть` -> gallery detail editor.
- Current observation: nested navigation здесь тоже не читается как явная карта уровней, а сам экран заполнен большим количеством карточек файлов.
- Live impression: файлы галереи и основной файл идут плотным блоком карточек; proof data сильно шумит и создает ощущение перегруженного media picker-а.
- Why it matters: для non-technical пользователя такой экран тяжело воспринимается как ясная рабочая форма, особенно если нужно быстро найти один конкретный файл.
- Desired direction: позже проверить, можно ли сократить визуальный шум карточек, добавить явный path-back и улучшить группировку файлов.
- Severity: medium.

### 8. Галерея семантически перегружена и плохо объясняет поля
- Surface: `Галереи` -> `Открыть` -> gallery detail editor.
- Current observation: название поля `Смысл изменения` не помогает обычному пользователю понять, что именно от него хотят; оно звучит внутренне и технически.
- Current observation: `Название` и `Подпись` для обычного человека выглядят почти как синонимы, хотя в верстке и SEO это разные сущности.
- Why it matters: экран не объясняет контекст полей, поэтому пользователь должен уже знать внутреннюю модель, чтобы заполнить форму без ошибок.
- Desired direction: позже переименовать поля так, чтобы было ясно, где текст участвует: заголовок карточки, подпись под изображением, SEO-описание, служебное пояснение к правке и т.д.
- Severity: high.
- Extra note: общий UX экрана пока не выглядит friendly; логика и названия полей запутывают и не ведут пользователя по шагам.

### 9. Кейс повторяет проблему вложенности и усиливает её связанными списками
- Surface: `Кейсы` -> `Открыть` -> case detail editor.
- Current observation: тот же паттерн nested detail без явной карты уровня вверх, но экран тяжелее из-за больших блоков связанных услуг, галерей и медиа.
- Live impression: для пользователя экран выглядит длинным operational workspace, где трудно быстро понять, где закончился базовый кейс и где начались связи.
- Why it matters: это прямо поддерживает идею про breadcrumb / depth navigation, потому что здесь без него проще потеряться.
- Desired direction: позже определить, нужна ли верхняя навигационная карта по уровням и/или более компактное размещение связанных сущностей.
- Severity: medium.

### 10. У кейса тоже есть семантически неочевидные поля и дублирующая медиа-загрузка
- Surface: `Кейсы` -> `Открыть` -> case detail editor.
- Current observation: поля `Тип проекта` и `Короткий адрес` не объясняют обычному пользователю, должен ли он придумать значение сам или выбрать из справочника.
- Current observation: блок `Быстрая загрузка медиа` выглядит как отдельный способ загрузки файлов, хотя рядом уже есть галерея и существующий media flow.
- Why it matters: пользователь может воспринимать это как дублирование функционала и не понимать, какой путь является основным.
- Desired direction: позже проверить, можно ли для кейса переиспользовать тот же media engine / gallery picker, чтобы не плодить параллельные сценарии и не расходиться в логике загрузки.
- Severity: high.
- Extra note: если `Тип проекта` должен быть справочником, это лучше показывать явно через select / picker, а не как текст, который надо придумывать вручную.

### 11. Правые служебные блоки должны быть компактнее и более статичными
- Surface: all nested/detail admin screens, especially `Галереи` and `Кейсы`.
- Current observation: right sidebar blocks are currently part of the main long scroll; even with little content they move together with the form and force the user to re-find status blocks.
- Why it matters: такое поведение утомляет и делает служебные карточки менее полезными, чем они могли бы быть.
- Desired direction: позже проверить вариант, где right rail remains compact and behaves as a mostly-static support panel, becoming scrollable only when its own content grows beyond the viewport.
- Severity: medium.
- Extra note: это относится не к одному экрану, а к общему паттерну вложенных admin surfaces.

### 12. Экран `Страницы` повторяет те же претензии
- Surface: `Страницы` -> `Открыть` -> page detail editor.
- Current observation: те же вопросы к семантике полей, вложенности, правому сайдбару и длинному рабочему скроллу.
- Why it matters: это подтверждает, что проблема не локальная, а системная для nested content editors.
- Desired direction: рассматривать `Страницы` вместе с `Галереями`, `Кейсами`, `Медиа` и `Услугами` как один паттерн редактуры, а не как отдельные мелкие баги.
- Severity: medium.

### 13. Экран `Услуги` тоже в том же классе проблем
- Surface: `Услуги` -> service list / service detail editor.
- Current observation: к этому экрану относятся те же претензии, что и к `Галереи`, `Кейсы`, `Страницы` и `Медиа`.
- Why it matters: это ещё одно подтверждение, что мы имеем не набор частных недочётов, а единый pattern-level UX issue для nested editors.
- Desired direction: потом править как общую схему, а не как четыре-пять разрозненных экрана.
- Severity: medium.

### 14. Экран `Пользователи` тесный и неочевидный по композиции
- Surface: `Пользователи`.
- Current observation: поля формы расположены очень плотно и местами визуально "наезжают" друг на друга, из-за чего экран выглядит нелогично и не очень friendly.
- Current observation: список пользователей, вероятно, лучше вынести в отдельную правую панель или в иной более спокойный layout-паттерн.
- Current observation: возможно, Пользователи стоит раскрывать как подвложенность в левом меню, если это лучше впишется в shell и поможет не смешивать список с формой.
- Why it matters: сейчас экран не очень хорошо поддерживает задачу управления пользователями и не даёт ощущения полноценного CRUD.
- Desired direction: позже выбрать либо более удобное разделение form/list, либо nested navigation pattern, но не оставлять это как плотный one-page split без иерархии.
- Severity: high.
- Extra note: здесь заметен не только layout issue, но и функциональный gap по ощущению полноценного CRUD flow.

## Decision points

- Нужно ли ввести единый breadcrumb / depth bar для всех nested detail screens?
- Нужна ли левой панели роль контекстного tree navigation для вложенных сущностей?
- Должен ли right rail быть sticky/support panel с собственным scroll threshold?
- Хотим ли мы вынести user list в отдельную правую панель или в child view по типу nested navigation?
- Должна ли быстрая загрузка медиа в кейсах и страницах переиспользовать gallery/media engine без отдельного параллельного сценария?
- Должны ли поля вроде `Тип проекта`, `Смысл изменения`, `Короткий адрес` быть явно переведены в справочники, select-и или более контекстные подписи?
- Нужно ли привести все repeated content editors к одному паттерну layout, чтобы редактировать их как семейство экранов?

## Open layout questions

- Нужно ли левую навигацию делать `sticky` или `fixed` в рамках текущего shell?
- Если оставить только `sticky`, хватит ли этого для длинных страниц?
- Есть ли смысл ограничить высоту sidebar и дать ей собственный внутренний скролл, или это будет лишним усложнением?

## Working rule

- Сначала собираем наблюдения.
- Потом, когда замечаний станет достаточно, делаем отдельный план редактуры.
- До этого этапа ничего не перепроектируем и не переименовываем.

## Review addendum after plan readback

- `Смысл изменения` скорее всего является внутренним `change intent`; нужно решить, это поле для пользователя или только для системы.
- Before renaming `Смысл изменения`, decide whether the field belongs in the user-facing form at all. If it is purely an internal audit/workflow field, the right fix may be to remove it from the visible editor, not to rename it.
- `Быстрая загрузка медиа` в кейсах лучше считать candidate anti-pattern, а не просто дополнительной кнопкой.
- До Wave 5 отдельно проверить loading, empty, error и no-access states на каждом семействе экранов.
- Для этого прохода admin first slice лучше считать desktop-first; responsive/mobile behavior можно оставить вне scope, если он не будет явно переоткрыт.

## Workflow addendum after role narrative readback

- Need explicit role landing states, not only shared dashboard logic. `SEO Manager` should see a working queue and next actions, `Business Owner` should land on a decision packet, and `Superadmin` should land on operational control and consequences.
- `Business Owner` review surface should behave like a compact decision packet: summary, real preview, risk notes, and a small set of action buttons. This is a screen pattern, not just a text tone issue.
- Comments must be able to point back to a concrete field or block so the user can jump directly to the problem area instead of searching the form again.
- Audit timeline needs to read like a human story: who changed what, why it changed, and whether AI was used. This is not the same as a technical event log.
- Publish side effects should be visible as a short, understandable checklist on the screen, not hidden in a separate technical layer.
- `Пользователи` still needs one more pass as an operational CRUD surface: list, role, last activity, add, deactivate, and the exact place where Superadmin manages access.
- The workflow narrative confirms that the grammar work is not enough by itself. We also need role-facing information architecture rules on top of the shared shell.
