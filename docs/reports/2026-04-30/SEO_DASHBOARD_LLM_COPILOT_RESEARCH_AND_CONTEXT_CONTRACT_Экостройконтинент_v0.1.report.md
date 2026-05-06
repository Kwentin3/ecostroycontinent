# SEO Dashboard LLM Copilot Research and Context Contract Report

Проект: «Экостройконтинент»
Дата: 2026-04-30
Статус: internet research + documentation refine

## 1. Что сделано

Проведен интернет-ресёрч по LLM-copilot patterns для analytics, BI, product analytics, SEO/content и responsible AI.

Обновлены:

- `docs/product-ux/SEO_Visibility_Traffic_Conversion_Dashboard_PRD_Экостройконтинент_v0.1.md`;
- `docs/product-ux/SEO_Dashboard_Data_and_Event_Taxonomy_Экостройконтинент_v0.1.md`.

Создан companion document:

- `docs/product-ux/SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`.

Создан этот report:

- `docs/reports/2026-04-30/SEO_DASHBOARD_LLM_COPILOT_RESEARCH_AND_CONTEXT_CONTRACT_Экостройконтинент_v0.1.report.md`.

## 2. Источники, которые были изучены

Analytics / BI copilots:

- Microsoft Power BI Copilot: `https://learn.microsoft.com/en-us/power-bi/explore-reports/copilot-pane-summarize-content`
- Tableau Pulse: `https://help.tableau.com/current/online/en-us/pulse_intro.htm`
- Mixpanel Spark AI: `https://mixpanel.com/spark-ai/`
- Mixpanel Spark launch/details: `https://mixpanel.com/blog/spark-bringing-generative-ai-to-mixpanel/`
- Mixpanel Generative AI legal/privacy notes: `https://mixpanel.com/legal/gen-ai-features`
- Pendo Insights: `https://support.pendo.io/hc/en-us/articles/29020867436059-Insights`

Grounding / context / structured outputs:

- Azure Grounding Data Design: `https://learn.microsoft.com/en-us/azure/well-architected/ai/grounding-data-design`
- Google Vertex AI Grounding overview: `https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview`
- OpenAI Structured Outputs: `https://platform.openai.com/docs/guides/structured-outputs`
- OpenAI Data Controls: `https://platform.openai.com/docs/guides/your-data/`
- Anthropic Citations: `https://docs.anthropic.com/en/docs/build-with-claude/citations`

Human-AI / security / SEO:

- Microsoft Human-AI Interaction Guidelines: `https://www.microsoft.com/en-us/research/?p=564561`
- AWS mapping to OWASP Top 10 for LLM Applications: `https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-security/owasp-top-ten.html`
- Google Search Central helpful content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google Search Central AI-generated content guidance: `https://developers.google.com/search/docs/fundamentals/using-gen-ai-content`

## 3. Найденные применимые паттерны

### Pattern 1: Grounded report/model context

Power BI Copilot and Tableau Pulse are useful when AI works from curated report visuals, metric definitions or prepared insight context, not from an unlimited data lake.

Applied decision:

- LLM gets backend-generated context packets.
- Context packet includes evidence, source freshness, sample size and interpretation limits.
- No direct raw SQL/raw event access.

### Pattern 2: Contextual assistant, not primary free chat

Analytics products expose AI through report panes, summaries, metric exploration, suggested questions and contextual prompts.

Applied decision:

- Use contextual buttons: `Объяснить страницу`, `Предложить действия`, `Создать черновик рекомендации`, `Сравнить до/после`.
- Free-form chat is not the primary UI.
- Follow-up questions are allowed later only inside a bounded page/recommendation/period context.

### Pattern 3: Evidence and citation-style grounding

Modern AI analytics patterns emphasize visible source data, report visual references, citations or traceability back to the metric.

Applied decision:

- Add `LLM Evidence Item` model to taxonomy.
- LLM output must include "what data this is based on".
- Response UI should show evidence, sample size, freshness and confidence.

### Pattern 4: AI helps with explanation and drafting, not deterministic signal ownership

Mixpanel Spark and similar tools can translate natural language into objective reports or explanations, but "why" questions require caution and inspectable data.

Applied decision:

- Deterministic issue detector owns issue signals.
- LLM explains and drafts hypotheses/recommendations.
- LLM cannot mark issues resolved without human/deterministic evidence.

### Pattern 5: Sample size and eligibility thresholds matter

Pendo Insights and BI copilots use thresholds, eligibility and quantified opportunity framing.

Applied decision:

- LLM context includes sample size, denominator, confidence and uncertainty flags.
- Small samples must be labelled as insufficient.
- LLM must say when a signal is only a hypothesis.

### Pattern 6: Human-AI interaction needs clear capability boundaries

Microsoft Human-AI guidelines emphasize making clear what the system can do, how well it can do it, efficient invocation, dismissal and correction.

Applied decision:

- LLM UI patterns are contextual and dismissible.
- Output must show limitations.
- User remains decision maker.

### Pattern 7: Grounding data should be prepared and scoped

Azure/Vertex guidance treats grounding as data provided at inference time to improve relevance and factuality.

Applied decision:

- Context packets are scoped per task.
- No raw data dump.
- No all-data RAG layer for click/session logs.
- Context is generated by backend builders.

### Pattern 8: Security risks include prompt injection, sensitive disclosure and excessive agency

OWASP-aligned LLM security materials emphasize prompt injection, sensitive information disclosure and excessive agency.

Applied decision:

- No secrets/tokens in context.
- No personal data/form values/raw logs.
- No publish or Content Core mutation permissions.
- No autonomous agent loop.

### Pattern 9: AI-assisted SEO content must remain helpful and factual

Google Search Central guidance focuses on helpful, reliable, people-first content; automation used primarily to manipulate ranking is risky.

Applied decision:

- LLM may draft title/description/H1/FAQ/CTA.
- All claims-heavy public text is draft and requires owner/editor review.
- LLM cannot invent prices, deadlines, guarantees or commercial claims.

## 4. Паттерны, которые отвергнуты

- Autonomous SEO agent: rejected because it conflicts with Content Core, publish workflow and owner confirmation.
- Universal BI chat: rejected because it invites unbounded data access and creates enterprise analytics scope.
- Direct SQL for LLM: rejected because it increases security, privacy and hallucination risk.
- Raw event RAG: rejected because raw sessions/clicks are noisy, sensitive and unnecessary for SEO actionability.
- LLM as issue detector replacement: rejected because deterministic rules must own metrics and issue signals.
- LLM-driven publishing: rejected because AI is advisory-only.
- Memory layer over all admin/user interactions: rejected until separate privacy/product justification exists.
- Visual heatmap interpretation by LLM in MVP: rejected because visual heatmap itself is not MVP.

## 5. Что добавлено в PRD

Добавлены sections:

- `LLM Copilot Purpose`;
- `LLM Copilot Use Cases`;
- `Non-Goals for LLM Copilot`;
- `LLM Context Contract Summary`;
- `Context Packet Types`;
- `Confidence / Uncertainty Model`;
- `LLM Output Contract`;
- `LLM Prompt / System Instruction Requirements`;
- `LLM UI Patterns`;
- `LLM Privacy / Security`;
- `Research Findings Applied to Our Product`.

Также обновлены:

- `Required Product / Engineering Changes`;
- `Phasing`: добавлена `Phase C4: LLM Context Contract Foundation` и future `Phase G: LLM Copilot UI`;
- `MVP Recommendation`;
- `Acceptance Criteria`;
- `Open Questions`;
- `PRD Acceptance Checklist`.

## 6. Что добавлено в companion context contract

Создан `SEO_Dashboard_LLM_Context_Contract_Экостройконтинент_v0.1.md`.

Документ описывает:

- purpose;
- product stance;
- context packet types;
- common context envelope;
- source freshness;
- page diagnostic context;
- dashboard summary context;
- recommendation context;
- owner brief context;
- content draft context;
- anomaly context;
- evidence model;
- confidence/uncertainty model;
- allowed outputs;
- forbidden outputs;
- privacy filters;
- output contracts;
- prompt/system instruction requirements;
- compact example packet;
- future implementation notes.

## 7. Что обновлено в taxonomy

Добавлены:

- `LLM Context Data Requirements`;
- `LLM Evidence Item`;
- `LLM Confidence and Uncertainty Fields`;
- связь `Integration Sync Status` с `data_freshness`;
- требование применять privacy/admin/bot/QA exclusions до context packet construction.

## 8. Открытые вопросы

1. Which LLM provider/deployment posture is acceptable for analytics context?
2. Should generated context packets be stored for audit or generated on demand only?
3. What retention applies to generated LLM outputs and drafts?
4. Should Business Owner receive AI briefs directly or only after SEO Manager review?
5. What minimum eval set is needed before enabling LLM UI?
6. Should recommendation feedback improve deterministic rules or remain manual product feedback?
7. Which content payload fields are safe for `content_draft_context`?
8. Should context packets be red-team tested for prompt injection before LLM UI launch?

## 9. Runtime / Git Confirmation

Runtime-код не менялся.

Не менялись:

- migrations;
- UI components;
- API routes;
- package/dependency files;
- external API integrations;
- LLM provider configuration.

Observed git status summary:

- untracked documentation files under `docs/product-ux`: PRD, taxonomy, LLM context contract;
- untracked reports under `docs/reports/2026-04-30`: discovery/refine/Yandex-first/LLM research reports;
- existing tracked `D` entries under `docs/out`;
- no runtime/code/package/migration files changed.

The `docs/out` deletions were already present in the working tree context and were not changed or restored as part of this task.
