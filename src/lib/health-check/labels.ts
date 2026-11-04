/**
 * Codes der Engine als Sätze für Kunden.
 *
 * Die Tabellen sind aus `digi_prod/src/report/report_engine.py` übernommen
 * (ASSESSMENT_LABELS, PRIORITY_LABELS, AUTOMATION_TYPE_LABELS,
 * NEXT_ACTION_LABELS, WARNING_CLARIFICATIONS). Sie sind Beschriftung, keine
 * Berechnung — aber es sind zwei Stellen für denselben Wortlaut, und die
 * können auseinanderlaufen. Wenn dort etwas geändert wird, gehört es hierher.
 *
 * Unbekannte Codes werden nicht verschluckt: sie erscheinen mit ihrem
 * Bezeichner, damit niemand eine Lücke für eine Aussage hält.
 */

const ASSESSMENT: Record<string, string> = {
  HIGH_AUTOMATION_POTENTIAL: "Hohes Automatisierungspotenzial",
  HIGH_AI_OPPORTUNITY: "Hohes KI-Potenzial",
  HIGH_ECONOMIC_POTENTIAL: "Hoher wirtschaftlicher Hebel",
  HIGH_COMPLEXITY: "Hohe Komplexität",
  HIGH_RISK: "Hohes Risiko",
  PAYBACK_WITHIN_12_MONTHS: "Amortisation innerhalb von zwölf Monaten",
  LOW_CONFIDENCE: "Geringe Zuversicht der Angaben",
  MATERIAL_CONTRADICTION: "Plausibilitätshinweis zu den Angaben",
  FREQUENCY_EFFORT_CONTRADICTION:
    "Hohe Fallhäufigkeit bei sehr geringer Bearbeitungszeit",
  STANDARDIZATION_AUTOMATION_CONTRADICTION:
    "Hohe Standardisierung bei niedrigem Automatisierungspotenzial",
  AGENT_KILL_SWITCH_MISSING: "Kein Stop-/Kill-Switch für den Agenten",
  AGENT_ESCALATION_MISSING: "Keine Eskalation bei Unsicherheit definiert",
  AGENT_ACTION_SCOPE_UNDEFINED: "Kein Rahmen für autonome Aktionen definiert",
  RISK_TOO_HIGH_FOR_AUTONOMOUS_AGENT: "Risiko zu hoch für autonomes Handeln",
  COMPLEXITY_TOO_HIGH_FOR_AUTONOMOUS_AGENT: "Komplexität zu hoch für autonomes Handeln",
  CONFIDENCE_TOO_LOW_FOR_AUTONOMOUS_AGENT: "Zuversicht zu gering für autonomes Handeln",
};

const WARNING_HINTS: Record<string, string> = {
  FREQUENCY_EFFORT_CONTRADICTION:
    "Bitte prüfen Sie das Vorgangsvolumen und die Bearbeitungszeit je Vorgang.",
  STANDARDIZATION_AUTOMATION_CONTRADICTION:
    "Bitte prüfen Sie die Angabe zur Standardisierung.",
  LOW_CONFIDENCE: "Bitte prüfen Sie, ob die Angaben vollständig und zutreffend sind.",
  MATERIAL_CONTRADICTION: "Bitte prüfen Sie die genannten Plausibilitätshinweise.",
};

const PRIORITY: Record<string, string> = {
  P1_QUICK_WIN: "Quick Win",
  P2_HIGH_POTENTIAL: "Hohes Potenzial",
  P3_STRATEGIC: "Strategisch",
  P4_INVESTIGATE: "Zu prüfen",
  P5_DEFER: "Zurückstellen",
};

const PRIORITY_SHORT: Record<string, string> = {
  P1_QUICK_WIN: "P1",
  P2_HIGH_POTENTIAL: "P2",
  P3_STRATEGIC: "P3",
  P4_INVESTIGATE: "P4",
  P5_DEFER: "P5",
};

const AUTOMATION_TYPE: Record<string, string> = {
  CLASSIC: "Klassische Automatisierung",
  AI_ASSISTED: "KI-unterstützte Automatisierung",
  AI_AGENT: "Autonomer KI-Agent",
  HUMAN_IN_THE_LOOP: "Mensch im Ablauf",
  NONE: "Keine Automatisierung",
};

const NEXT_ACTION: Record<string, string> = {
  "technical automation design": "Technisches Automatisierungsdesign",
  "feasibility and solution design": "Machbarkeits- und Lösungsdesign",
  "architecture and business-case workshop": "Architektur- und Business-Case-Workshop",
  "clarify data, assumptions and contradictions": "Angaben und Annahmen klären",
  "defer to backlog": "Zurückstellen",
  "controlled agent feasibility assessment": "Machbarkeit eines kontrollierten Agenten prüfen",
  "design controlled human-in-the-loop alternative": "Kontrollierte Variante mit Mensch entwerfen",
};

export function assessmentLabel(code: string): string {
  return ASSESSMENT[code] ?? code;
}

export function warningHint(code: string): string | undefined {
  return WARNING_HINTS[code];
}

export function priorityLabel(code: string): string {
  return PRIORITY[code] ?? code;
}

export function priorityShort(code: string): string {
  return PRIORITY_SHORT[code] ?? "–";
}

export function automationTypeLabel(code: string): string {
  return AUTOMATION_TYPE[code] ?? code;
}

export function nextActionLabel(code: string): string {
  return NEXT_ACTION[code] ?? code;
}

/** Die Ampelstufe, an der die Priorität hängt — nur für die Farbe. */
export function priorityTone(code: string): "p1" | "p2" | "p3" {
  if (code === "P1_QUICK_WIN") return "p1";
  if (code === "P2_HIGH_POTENTIAL" || code === "P3_STRATEGIC") return "p2";
  return "p3";
}
