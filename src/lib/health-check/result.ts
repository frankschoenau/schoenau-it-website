/**
 * Die Form, in der die Analyse-API ein Ergebnis zurückgibt
 * (Vertrag AAHC-RESULT-0.1).
 *
 * Nur die Felder, die die Oberfläche liest. Was hier fehlt, ist nicht
 * verloren — es steht im Schnappschuss in `web.check.result`.
 */

export interface Scenario {
  scenario_id: string;
  automation_percentage: number;
  monthly_hours: number;
  annual_hours: number;
  saved_hours_monthly: number;
  gross_monthly_benefit: number;
  realized_monthly_benefit: number;
  cash_saving_monthly: number;
  capacity_value_monthly: number;
  recurring_cost_monthly: number;
  initial_investment: number;
  monthly_net_effect: number;
  annual_net_effect: number;
  payback_months: number;
  roi_12m_percent: number;
  tco_36m: number;
  net_effect_36m: number;
}

export interface AssessmentResult {
  schema_version: string;
  assessment_id: string;
  process_id: string;
  process_name: string;
  versions: Record<string, string>;
  scores: {
    automation_score: number;
    ai_opportunity_score: number;
    complexity_score: number;
    risk_score: number;
    confidence_score: number;
    economic_potential_score: number;
  };
  economics: {
    primary_scenario: string;
    payback_months: number;
    roi_12m_percent: number;
    tco_36m: number;
    net_effect_36m: number;
    scenarios: Record<string, Scenario>;
  };
  decision: {
    automation_type: string;
    priority: string;
    reason_codes: string[];
    block_reasons: string[];
    warnings: string[];
    next_action: string;
  };
}

export const SCENARIO_LABELS: Record<string, string> = {
  CONSERVATIVE: "Vorsichtig",
  LIKELY: "Erwartet",
  OPTIMISTIC: "Optimistisch",
};
