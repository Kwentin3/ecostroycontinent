export function buildSeoDashboardLlmContextPacket(readModel, { task = "explain_page", pagePath = "" } = {}) {
  // Future LLM packets derive from the read model only: no raw events, secrets
  // or direct SQL. Output is advisory/draft-only; no publish or invented facts.
  const selectedPage = pagePath
    ? readModel.page_list.find((page) => page.page_path === pagePath)
    : readModel.selected_page_detail;
  const selectedPath = selectedPage?.page_path || selectedPage?.page_identity?.page_path || readModel.selected_page_detail?.page_identity?.page_path;

  return {
    version: "seo_dashboard_llm_context_packet.v0.1",
    task,
    generated_at: readModel.generated_at,
    period: readModel.period,
    selected_page_detail: selectedPath === readModel.selected_page_detail?.page_identity?.page_path
      ? readModel.selected_page_detail
      : null,
    evidence_items: (readModel.evidence_items || []).filter((item) => {
      return !selectedPath || item.linked_entity?.page_path === selectedPath;
    }).slice(0, 20),
    trend_summary: readModel.analytics_history?.metric_trends || {},
    published_changes: (readModel.classified_content_changes || []).filter((item) => {
      return !selectedPage?.entity_id || item.entity_id === selectedPage.entity_id;
    }).slice(0, 10),
    recommendation_history: (readModel.recommendations || []).filter((item) => {
      return !selectedPath || item.linked_page?.page_path === selectedPath;
    }).slice(0, 10),
    source_freshness: readModel.sources,
    limitations: readModel.limitations,
    uncertainty_flags: readModel.selected_page_detail?.uncertainty_flags || [],
    excluded: {
      raw_events: true,
      raw_sessions: true,
      form_values: true,
      ip_addresses: true,
      tokens: true,
      secrets: true,
      direct_sql: true,
      external_api_exports: true
    }
  };
}
