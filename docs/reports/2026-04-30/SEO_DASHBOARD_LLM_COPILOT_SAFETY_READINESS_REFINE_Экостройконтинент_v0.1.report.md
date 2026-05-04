# SEO Dashboard LLM Copilot Safety Readiness Refine Report

Проект: «Экостройконтинент»
Дата: 2026-04-30
Статус: documentation-only safety / implementation-readiness refine

## 1. Что изменено

Изменены документы:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`.

Создан report:

- `docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_SAFETY_READINESS_REFINE_Экостройконтинент_v0.1.report.md`.

## 2. Какие разделы добавлены / усилены

В PRD добавлены или усилены:

- `LLM Evaluation and Red-Team Set`;
- `Context Packet Storage and Audit Policy`;
- `LLM Output and Draft Retention`;
- `Prompt Injection and Untrusted Content Handling`;
- `Context Packet and Output Schema Validation`;
- `LLM Rollout Order and Safety Gate`;
- `LLM Feedback and Correction`;
- `LLM Provider / Deployment Posture`;
- `Phase G0: LLM Copilot Safety Gate`;
- acceptance criteria and open questions for safe LLM enablement.

В LLM Context Contract добавлены:

- context/output schema validation requirements;
- prompt injection and untrusted content handling;
- full eval/red-team set with cases A-L;
- eval success criteria;
- context packet storage and audit policy;
- LLM output/draft retention;
- staged rollout order;
- feedback/correction policy;
- provider/deployment posture;
- expanded open questions.

В taxonomy добавлен:

- `LLM Audit and Retention Metadata`.

## 3. Как усилена safety/readiness модель

Главная позиция сохранена:

```text
deterministic signals / issue detector
-> backend context packet
-> LLM explanation / hypotheses / draft recommendation
-> SEO Manager decision
-> editorial workflow
-> before/after monitoring
```

Дополнительно зафиксировано:

- LLM UI нельзя включать без прохождения eval/red-team набора.
- Context packets и machine-consumed outputs должны валидироваться по schema.
- Persistent recommendation/task objects нельзя создавать из свободного текста без validation и human action.
- Content fields считаются untrusted data, not instructions.
- Full context packets не хранятся постоянно по умолчанию.
- Saved LLM drafts должны иметь audit marker вроде `ai_generated_draft = true`.
- Provider/deployment posture является отдельным security/product decision.
- Feedback от LLM UI не меняет deterministic issue detector автоматически.

## 4. Первые LLM-сценарии

Первый безопасный rollout:

- `Объяснить страницу`;
- `Почему низкий CTR?`;
- `Почему есть трафик, но нет обращений?`;
- `Предложить следующие действия`;
- `Объяснить ограничения данных`.

Второй безопасный rollout:

- `Создать черновик рекомендации`;
- draft task for SEO Manager;
- draft next actions.

Условия второго rollout:

- structured output;
- evidence attached;
- schema validation;
- human confirmation;
- no auto status change.

## 5. Отложенные сценарии

Отложить до более поздних стадий:

- owner-friendly briefs without SEO Manager review;
- title/description/H1 drafts;
- FAQ/CTA/content drafts;
- follow-up bounded chat;
- any all-data chat;
- any raw SQL/raw event exploration;
- autonomous agent loop.

Особенно важно: не начинать LLM implementation с SEO/content field drafts, потому что это самый рискованный сценарий для неподтвержденных коммерческих claims и SEO-манипулятивности.

## 6. Открытые вопросы

1. Где хранить LLM outputs, если они сохраняются?
2. Хранить ли full context packets или только hashes/evidence snapshots?
3. Какой retention у LLM outputs и drafts?
4. Какой retention у debug context packets?
5. Какой LLM provider допустим?
6. Нужны ли no-training / zero-retention / enterprise terms?
7. Кто утверждает eval/red-team set?
8. Нужен ли отдельный audit log для LLM actions?
9. Кто может видеть owner briefs?
10. Должен ли Business Owner видеть AI output напрямую или только после SEO Manager review?
11. Нужно ли red-team тестирование prompt injection перед каждым расширением rollout stage?

## 7. Runtime / Git Confirmation

Runtime-код не менялся.

Не менялись:

- migrations;
- UI components;
- API routes;
- env/provider config;
- package/dependency files;
- external API integrations;
- LLM API/provider integration.

Observed git status summary:

- untracked documentation files under `docs/product-ux`: PRD, taxonomy, LLM context contract;
- untracked reports under `docs/reports/2026-04-30`: discovery/refine/Yandex-first/LLM research/LLM safety readiness reports;
- existing tracked `D` entries under `docs/out`;
- no runtime/code/package/migration/env/provider files changed.

The `docs/out` deletions were already present in the working tree context and were not changed or restored as part of this task.
