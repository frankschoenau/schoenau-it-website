/**
 * Der Fragebogen des AAHC als TypeScript-Modul.
 *
 * Übertragen aus `digi_prod/src/ux/concierge/questionnaire.js`, Stand b2ee94b.
 * Die Kennungen (Q-001..Q-041) und die erlaubten Werte sind NICHT hier erfunden:
 * sie stammen aus dem Fragebogen-Adapter des Backends
 * (`src/api/questionnaire_adapter.py`) und der Fragebogendefinition der Datenbank
 * (`question_definition`, QUESTIONNAIRE-0.1). Die Formulierungen sind die der
 * bestehenden Oberfläche.
 *
 * Warum hier nur beschriftet und nicht übersetzt wird
 * ---------------------------------------------------
 * Der Adapter des Backends liest die ROEHEN Antworten und leitet daraus die
 * Felder der Bewertungsengine ab. Diese Übersetzung gehört dorthin und nicht in
 * den Browser: eine zweite Übersetzung wäre eine zweite Wahrheit über dieselbe
 * Antwort. Was hier steht, ist die Beschriftung für Menschen; der Wert bleibt
 * der Wert des Backends.
 *
 * `required` ist genau dann true, wenn der Adapter die Frage mit `_required`
 * liest. Diese Liste ist keine Designentscheidung.
 */

export type Level = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type YesNo = "YES" | "NO";

export interface Option {
  value: string;
  label: string;
}

export type QuestionType = "text" | "textarea" | "number" | "select" | "list";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: readonly Option[];
  min?: number;
  max?: number;
  step?: string;
  default?: number;
  hint?: string;
  help?: string;
  /** Stufenbeschreibungen: [Kurzform, Bedeutung] je Auswahlwert. */
  scaleHelp?: ReadonlyArray<readonly [string, string]>;
  /** Bedingung, unter der die Frage überhaupt erscheint. */
  when?: WhenKey;
  /** Trägt eine Angabe des Vertrags, nicht der Engine (Q-001 -> process_name). */
  contractField?: string;
  /** Fragen, bei deren Antwort die Sichtbarkeit anderer Fragen neu bewertet wird. */
  triggersRerender?: boolean;
}

export type WhenKey =
  | "personalData"
  | "highPersonalData"
  | "externalCommunication"
  | "sendsExternally"
  | "financialImpact"
  | "aiSuitable";

export interface Section {
  /** Kapitel 1..5 — die Gliederung des Dialogs. */
  chapter: 1 | 2 | 3 | 4 | 5;
  title: string;
  hint: string;
  /** Wirtschaftliche Annahmen: keine Kundenfragen, sondern Vorbelegung. */
  economic?: boolean;
  questions: Question[];
}

export const LEVELS: readonly Level[] = ["NONE", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"];

const LEVEL_LABEL: Record<Level, string> = {
  NONE: "Keine / gar nicht",
  LOW: "Gering",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  VERY_HIGH: "Sehr hoch",
};

const YESNO_LABEL: Record<YesNo, string> = { YES: "Ja", NO: "Nein" };

function scale(values: readonly string[], labels: Record<string, string> = LEVEL_LABEL): Option[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export const OPTIONS = {
  frequency: [
    { value: "LESS_THAN_MONTHLY", label: "Seltener als monatlich" },
    { value: "MONTHLY_1_4", label: "Monatlich (1–4×)" },
    { value: "WEEKLY_5_19", label: "Wöchentlich (5–19×)" },
    { value: "DAILY_20_99", label: "Täglich (20–99×)" },
    { value: "HIGH_100_499", label: "Mehrmals täglich (100–499×)" },
    { value: "VERY_HIGH_500_PLUS", label: "Sehr häufig (500× und mehr)" },
  ],
  level: scale(LEVELS),
  // Q-015 kennt nur vier Stufen: das Backend bildet sie auf 0/40/70/100 ab.
  personal: scale(["NONE", "LOW", "MEDIUM", "HIGH"]),
  integration: scale(LEVELS),
  // Bei den Prozessvarianten ist "viel" das Risiko, nicht die Staerke.
  variants: [
    { value: "NONE", label: "Keine – ein einheitlicher Ablauf" },
    { value: "LOW", label: "Wenige (2–3)" },
    { value: "MEDIUM", label: "Einige (4–10)" },
    { value: "HIGH", label: "Viele (11–20)" },
    { value: "VERY_HIGH", label: "Sehr viele (über 20)" },
  ],
  inputData: [
    { value: "PAPER_MANUAL", label: "Papier oder manuell erfasst" },
    { value: "SCANNED_IMAGE", label: "Gescannte Bilder" },
    { value: "PDF_DOCUMENT", label: "PDF-Dokumente" },
    { value: "STRUCTURED_FILE", label: "Strukturierte Dateien (z. B. CSV, XML)" },
    { value: "API_DATABASE", label: "Schnittstelle oder Datenbank" },
  ],
  yesno: scale(["YES", "NO"], YESNO_LABEL),
  errorBand: [
    { value: "UNDER_100", label: "Unter 100 €" },
    { value: "100_999", label: "100 – 999 €" },
    { value: "1K_9999", label: "1.000 – 9.999 €" },
    { value: "10K_99999", label: "10.000 – 99.999 €" },
    { value: "100K_PLUS", label: "100.000 € und mehr" },
  ],
} as const satisfies Record<string, readonly Option[]>;

/* ------------------------------------------------------------------ *
 * Die Stufenbeschreibungen sind sprachliche Definitionen ("trifft kaum
 * zu"), keine erfundenen Zahlen. Eine Prozentangabe waere eine Behauptung
 * ueber die Rechnung des Backends.
 * ------------------------------------------------------------------ */

const SCALE_LEVEL = [
  ["Keine", "trifft nicht zu"],
  ["Gering", "trifft kaum zu"],
  ["Mittel", "trifft teilweise zu"],
  ["Hoch", "trifft überwiegend zu"],
  ["Sehr hoch", "trifft durchgängig zu"],
] as const;

const SCALE_PERSONAL = [
  ["Keine", "keine personenbezogenen Daten"],
  ["Gering", "einzelne Felder, z. B. Name und Anschrift"],
  ["Mittel", "regelmäßig, aber überschaubar"],
  ["Hoch", "umfangreich oder sensibel"],
] as const;

const SCALE_VARIANTS = [
  ["Keine", "ein einheitlicher Ablauf"],
  ["Wenige", "2–3 Varianten"],
  ["Einige", "4–10 Varianten"],
  ["Viele", "11–20 Varianten"],
  ["Sehr viele", "über 20 Varianten"],
] as const;

export const CHAPTERS: Record<number, { title: string; intro: string }> = {
  1: {
    title: "Der Prozess",
    intro: "Worum geht es, wie oft läuft er, wie lange dauert ein Vorgang.",
  },
  2: {
    title: "Ablauf und Systeme",
    intro: "Wie gleichförmig der Ablauf ist und womit eine Automatisierung sich verbinden müsste.",
  },
  3: {
    title: "Risiko und Wirkung",
    intro: "Was auf dem Spiel steht, wenn etwas schiefgeht.",
  },
  4: {
    title: "KI-Eignung und heute",
    intro: "Wie viel Verstehen im Prozess steckt — und wo es heute schon weh tut.",
  },
  5: {
    title: "Annahmen",
    intro: "Womit gerechnet wird. Vorbelegt, änderbar.",
  },
};

const HELP: Record<string, string> = {
  "Q-001": "Der Name, unter dem der Vorgang im Bericht erscheint — kurz und erkennbar.",
  "Q-002": "Ein Satz genügt: Was kommt am Anfang hinein, was steht am Ende fest?",
  "Q-003": "Wie oft der Ablauf im Alltag angestoßen wird — nicht die Zahl der Einzelvorgänge.",
  "Q-004": "Durchschnittliche Vorgänge pro Monat. Diese Zahl trägt die Wirtschaftlichkeit.",
  "Q-005": "Zeit von Eingang bis Abschluss je Vorgang, im Durchschnitt. Teilstunden sind erlaubt (z. B. 7,5).",
  "Q-006": "Wie viele Personen den Ablauf regelmäßig bearbeiten — auch anteilig.",
  "Q-007": "Standardisiert heißt: Es gibt einen festen Ablauf, der in den meisten Fällen gleich läuft.",
  "Q-008": "Wiederholbar heißt: Derselbe Eingang führt zuverlässig zum selben Ergebnis.",
  "Q-009": "Gemeint sind ausdrückliche Wenn-Dann-Regeln, die eine Maschine ausführen könnte.",
  "Q-010": "Die Form, in der die Informationen ankommen — nicht die Form, in der sie abgelegt werden.",
  "Q-011": "Alle Systeme, zwischen denen Daten bewegt oder geprüft werden.",
  "Q-012": "Gemeint ist, ob es dokumentierte Wege gibt, über die die Systeme Daten austauschen — API, Dateiimport oder Datenbankzugriff.",
  "Q-013": "Wie viele deutlich unterschiedliche Abläufe es gibt — nicht wie viele Fälle.",
  "Q-014": "Gemeint ist, ob die nötigen Angaben vorhanden, aktuell und einheitlich erfasst sind — nicht, ob sie digital vorliegen.",
  "Q-015": "Personenbezogene Daten sind Angaben zu identifizierbaren Personen.",
  "Q-016": "Was ein Fehler typischerweise kostet — nicht der schlimmste denkbare Fall.",
  "Q-017": "Wie stark ein Ausfall oder Fehler das Geschäft trifft.",
  "Q-018": "E-Mail, Brief, Portal oder Schnittstelle an Kunden, Lieferanten oder Behörden.",
  "Q-019": "Folgen einer falschen Entscheidung: Nacharbeit, Vertrauensverlust, Haftung.",
  "Q-020": "Gesetze, Aufsicht, Zertifizierungen oder verbindliche interne Regeln — zum Beispiel Vier-Augen-Prinzip oder Dokumentationspflicht.",
  "Q-021": "Freitext, E-Mails, PDFs, Gesprächsnotizen — Inhalte ohne festes Schema.",
  "Q-022": "Muss Bedeutung erfasst werden, nicht nur ein Feld ausgelesen?",
  "Q-023": "Zum Beispiel nach Art, Priorität oder Zuständigkeit — nicht nur weiterleiten.",
  "Q-024": "Zum Beispiel Rechnungsnummer, Betrag oder Datum aus einer PDF-Datei herauslesen.",
  "Q-025": "Wie oft fehlen Angaben oder lassen sie mehrere Deutungen zu?",
  "Q-026": "Wie viel Erfahrungswissen ist nötig, um richtig zu entscheiden?",
  "Q-027": "Wird abgewogen oder eingeschätzt, statt nur nach fester Regel weiterzuleiten?",
  "Q-028": "Vorhandene Skripte, Makros, Roboter oder Schnittstellen. Leer lassen, wenn es keine gibt.",
  "Q-029": "Der Punkt, der heute am meisten Zeit oder Ärger kostet.",
  "Q-030": "Schritte, die aus fachlichen oder rechtlichen Gründen ein Mensch tun muss.",
  internal_cost_rate: "Vollkosten je Stunde inklusive Nebenkosten. Die Vorgabe ist eine Annahme, keine Messung.",
  implementation_cost: "Einmalige Einführung: Entwicklung, Integration, Schulung.",
  recurring_cost_monthly: "Betrieb, Lizenzen und Wartung pro Monat.",
  external_one_time_cost: "Einmalige Fremdkosten, etwa Beratung oder Lizenzen.",
  automation_percentage: "Anteil der Vorgänge, den die Automatisierung übernimmt.",
  realization_factor: "Anteil der gesparten Zeit, der tatsächlich wirksam wird.",
  cash_realization_factor: "Anteil, der als echte Kostenersparnis ankommt.",
};


/**
 * Antwortleitern je Frageart.
 *
 * Der Grund: eine einzige Intensitaetsleiter ("Keine ... Sehr hoch") passt auf
 * "Wie stark ist der Prozess standardisiert?", aber nicht auf "Gibt es APIs?"
 * oder "Wie ist die Datenqualitaet?" — dort heisst "Keine" etwas anderes als
 * "schwache Auspraegung", und bei den Prozessvarianten bedeutet "Keine" sogar
 * das Gegenteil, naemlich den besten Fall.
 *
 * Die WERTE bleiben unveraendert (NONE..VERY_HIGH). Die Engine liest nur sie.
 * Geaendert wird ausschliesslich, was der Mensch liest.
 */
const LEITER = {
  // Wie verlaesslich sind die Daten? (Zustand, nicht Grad)
  qualitaet: [
    { value: "NONE", label: "Lückenhaft — Angaben fehlen oft oder widersprechen sich" },
    { value: "LOW", label: "Uneinheitlich — je nach Fall anders erfasst" },
    { value: "MEDIUM", label: "Brauchbar — meist vollständig, einzelne Lücken" },
    { value: "HIGH", label: "Weitgehend vollständig und aktuell" },
    { value: "VERY_HIGH", label: "Vollständig, aktuell und einheitlich" },
  ],
  // Wie weit reichen die Schnittstellen? (Abdeckung)
  abdeckung: [
    { value: "NONE", label: "Keine — nur per Hand oder Datei" },
    { value: "LOW", label: "Dateiimport oder -export" },
    { value: "MEDIUM", label: "Datenbankzugriff oder eine einzelne Schnittstelle" },
    { value: "HIGH", label: "Dokumentierte Schnittstellen für die meisten Systeme" },
    { value: "VERY_HIGH", label: "Durchgängige Schnittstellen für alle beteiligten Systeme" },
  ],
  // Wie oft kommt etwas vor? (Häufigkeit)
  haeufig: [
    { value: "NONE", label: "Nie" },
    { value: "LOW", label: "Selten" },
    { value: "MEDIUM", label: "Bei etwa der Hälfte der Fälle" },
    { value: "HIGH", label: "Meistens" },
    { value: "VERY_HIGH", label: "Immer" },
  ],
  // Verlässt der Prozess das Unternehmen? (Reichweite nach außen)
  extern: [
    { value: "NONE", label: "Nein — der Prozess endet intern" },
    { value: "LOW", label: "Selten — einzelne Nachrichten" },
    { value: "MEDIUM", label: "Regelmäßig, aber überschaubar" },
    { value: "HIGH", label: "Häufig — viele Nachrichten nach außen" },
    { value: "VERY_HIGH", label: "Ständig — der Prozess besteht überwiegend daraus" },
  ],
  // Welche Vorgaben gelten? (Art der Bindung)
  vorgaben: [
    { value: "NONE", label: "Keine besonderen Vorgaben" },
    { value: "LOW", label: "Allgemeine Sorgfaltspflichten" },
    { value: "MEDIUM", label: "Interne Vorgaben oder Standards" },
    { value: "HIGH", label: "Gesetzliche Anforderungen mit Nachweispflicht" },
    { value: "VERY_HIGH", label: "Aufsicht, Zertifizierung oder Meldepflicht" },
  ],
  // Wie stark trifft ein Fehler finanziell? (Wirkung, nicht Betrag)
  wirkung: [
    { value: "NONE", label: "Kaum spürbar" },
    { value: "LOW", label: "Spürbar, aber verkraftbar" },
    { value: "MEDIUM", label: "Deutlich — Nacharbeit und Kulanz" },
    { value: "HIGH", label: "Erheblich — Umsatz- oder Vertrauensverlust" },
    { value: "VERY_HIGH", label: "Existenzbedrohend oder haftungsrelevant" },
  ],
  // Wie viel fachliches Urteil steckt drin? (Anspruch)
  urteil: [
    { value: "NONE", label: "Kein fachliches Urteil nötig" },
    { value: "LOW", label: "Gelegentlich — nach klaren Regeln" },
    { value: "MEDIUM", label: "Regelmäßig — mit etwas Erfahrung" },
    { value: "HIGH", label: "Häufig — braucht Erfahrungswissen" },
    { value: "VERY_HIGH", label: "In jedem Fall — ohne Fachkenntnis nicht entscheidbar" },
  ],
} as const;

export const SECTIONS: Section[] = [
  {
    chapter: 1,
    title: "Der Prozess",
    hint: "Worum geht es? Name und Ergebnis des Prozesses.",
    questions: [
      { id: "Q-001", label: "Wie heißt der Prozess?", type: "text", required: true,
        contractField: "process_name", help: HELP["Q-001"] },
      { id: "Q-002", label: "Was ist das Ziel bzw. Ergebnis des Prozesses?", type: "textarea", required: false,
        help: HELP["Q-002"] },
    ],
  },
  {
    chapter: 1,
    title: "Volumen und Aufwand",
    hint: "Wie oft und wie lange? Diese beiden Angaben tragen die Wirtschaftlichkeit.",
    questions: [
      { id: "Q-003", label: "Wie häufig wird der Prozess ausgeführt?", type: "select", options: OPTIONS.frequency, required: false,
        help: HELP["Q-003"] },
      { id: "Q-004", label: "Wie viele Vorgänge fallen durchschnittlich pro Monat an?", type: "number", min: 0, required: true,
        help: HELP["Q-004"], triggersRerender: true },
      { id: "Q-005", label: "Wie viele Minuten benötigt ein Vorgang durchschnittlich?", type: "number", min: 0, step: "0.1", required: true,
        help: HELP["Q-005"] },
      { id: "Q-006", label: "Wie viele Personen arbeiten regelmäßig an diesem Prozess?", type: "number", min: 0, required: false,
        help: HELP["Q-006"] },
    ],
  },
  {
    chapter: 2,
    title: "Prozesscharakteristik",
    hint: "Wie gleichförmig und wie regelbasiert läuft der Prozess ab?",
    questions: [
      { id: "Q-007", label: "Wie stark ist der Prozess standardisiert?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-007"] },
      { id: "Q-008", label: "Wie wiederholbar ist der Ablauf?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-008"] },
      { id: "Q-009", label: "Wie stark ist der Prozess durch klare Regeln bzw. Wenn-Dann-Entscheidungen geprägt?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-009"] },
      { id: "Q-010", label: "In welcher Form liegen die wesentlichen Eingabedaten vor?", type: "select", options: OPTIONS.inputData, required: true,
        help: HELP["Q-010"] },
      { id: "Q-013", label: "Wie viele relevante Prozessvarianten gibt es?", type: "select", options: OPTIONS.variants, required: true,
        scaleHelp: SCALE_VARIANTS, help: HELP["Q-013"] },
    ],
  },
  {
    chapter: 2,
    title: "Systeme und Daten",
    hint: "Womit muss die Automatisierung sich verbinden, und wie gut sind die Daten?",
    questions: [
      { id: "Q-011", label: "Welche Systeme sind beteiligt?", type: "list", required: true,
        hint: "Mehrere durch Komma, Semikolon oder Zeilenumbruch trennen.", help: HELP["Q-011"] },
      { id: "Q-012", label: "Können die beteiligten Systeme miteinander sprechen?", type: "select", options: LEITER.abdeckung, required: true,
        help: HELP["Q-012"] },
      { id: "Q-014", label: "Wie verlässlich sind die Daten, mit denen der Prozess arbeitet?", type: "select", options: LEITER.qualitaet, required: true,
        help: HELP["Q-014"] },
    ],
  },
  {
    chapter: 3,
    title: "Risiko und Business Impact",
    hint: "Was steht auf dem Spiel, wenn etwas schiefgeht?",
    questions: [
      { id: "Q-015", label: "Werden personenbezogene Daten verarbeitet?", type: "select", options: OPTIONS.personal, required: true,
        scaleHelp: SCALE_PERSONAL, help: HELP["Q-015"], triggersRerender: true },
      { id: "Q-016", label: "Wie stark trifft ein Fehler das Geschäft finanziell?", type: "select", options: LEITER.wirkung, required: true,
        help: HELP["Q-016"], triggersRerender: true },
      { id: "Q-017", label: "Wie kritisch ist der Prozess für das Geschäft?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-017"] },
      { id: "Q-018", label: "Verlässt der Prozess das Unternehmen?", type: "select", options: LEITER.extern, required: true,
        help: HELP["Q-018"], triggersRerender: true },
      { id: "Q-019", label: "Welche Folgen hätte eine falsche Entscheidung oder ein fehlerhaftes Ergebnis?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-019"] },
      { id: "Q-020", label: "Gelten für den Prozess besondere Vorgaben?", type: "select", options: LEITER.vorgaben, required: true,
        help: HELP["Q-020"] },
    ],
  },
  {
    chapter: 4,
    title: "KI-Eignung",
    hint: "Wie viel Verstehen, Deuten und Entscheiden steckt im Prozess?",
    questions: [
      { id: "Q-021", label: "Wie stark sind unstrukturierte Inhalte Bestandteil des Prozesses?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-021"], triggersRerender: true },
      { id: "Q-022", label: "Wie stark spielen Sprache, Bedeutung und semantische Interpretation eine Rolle?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-022"] },
      { id: "Q-023", label: "Muss im Prozess eingeordnet werden?", type: "select", options: LEITER.haeufig, required: true,
        help: HELP["Q-023"], triggersRerender: true },
      { id: "Q-024", label: "Müssen Dokumente gelesen und Angaben daraus gezogen werden?", type: "select", options: LEITER.haeufig, required: true,
        help: HELP["Q-024"] },
      { id: "Q-025", label: "Wie häufig sind mehrdeutige oder unvollständige Informationen vorhanden?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-025"] },
      { id: "Q-026", label: "Wie stark hängt eine Entscheidung vom Kontextwissen ab?", type: "select", options: OPTIONS.level, required: true,
        scaleHelp: SCALE_LEVEL, help: HELP["Q-026"] },
      { id: "Q-027", label: "Wie viel fachliches Urteil steckt in dem Prozess?", type: "select", options: LEITER.urteil, required: true,
        help: HELP["Q-027"] },
    ],
  },
  {
    chapter: 4,
    title: "Der heutige Ablauf",
    hint: "Wo drückt es, und was muss beim Menschen bleiben?",
    questions: [
      { id: "Q-028", label: "Welche Automatisierungen existieren bereits?", type: "list", required: false,
        hint: "Leer lassen, wenn es keine gibt.", help: HELP["Q-028"] },
      { id: "Q-029", label: "Was ist heute der größte manuelle Aufwand oder Schmerzpunkt?", type: "textarea", required: false,
        help: HELP["Q-029"] },
      { id: "Q-030", label: "Welche Prozessschritte benötigen zwingend einen Menschen?", type: "textarea", required: false,
        help: HELP["Q-030"] },
    ],
  },
  {
    chapter: 4,
    title: "Vertiefung",
    hint: "Diese Fragen erscheinen nur, wenn die vorigen Antworten sie aufwerfen.",
    questions: [
      { id: "Q-031", label: "Welche Arten personenbezogener Daten werden verarbeitet?", type: "list", required: false, when: "personalData" },
      { id: "Q-032", label: "Sind besondere Schutzmaßnahmen vorgeschrieben?", type: "select", options: OPTIONS.yesno, required: false, when: "highPersonalData" },
      { id: "Q-033", label: "Werden Daten an externe Systeme oder Anbieter übertragen?", type: "select", options: OPTIONS.yesno, required: false, when: "personalData" },
      { id: "Q-034", label: "Kann das System Inhalte direkt an externe Empfänger senden?", type: "select", options: OPTIONS.yesno, required: false, when: "externalCommunication", triggersRerender: true },
      { id: "Q-035", label: "Ist vor dem Versand eine menschliche Freigabe erforderlich?", type: "select", options: OPTIONS.yesno, required: false, when: "sendsExternally" },
      { id: "Q-036", label: "Welche Größenordnung hat der finanzielle Effekt eines Fehlers?", type: "select", options: OPTIONS.errorBand, required: false, when: "financialImpact" },
      { id: "Q-037", label: "Gibt es ein verbindliches Vier-Augen-Prinzip oder eine Freigabe?", type: "select", options: OPTIONS.yesno, required: false, when: "financialImpact" },
      { id: "Q-038", label: "Auf welche Systeme oder Werkzeuge müsste ein KI-Agent zugreifen?", type: "list", required: false, when: "aiSuitable" },
      { id: "Q-039", label: "Welche Aktionen dürfte er autonom ausführen?", type: "list", required: false, when: "aiSuitable" },
      { id: "Q-040", label: "Was passiert bei Unsicherheit, Fehlern oder fehlender Berechtigung?", type: "textarea", required: false, when: "aiSuitable" },
      { id: "Q-041", label: "Gibt es einen technisch kontrollierten Stop-/Kill-Switch für die Automatisierung?", type: "select", options: OPTIONS.yesno, required: false, when: "aiSuitable" },
    ],
  },
  {
    chapter: 5,
    title: "Wirtschaftliche Annahmen",
    hint: "Diese Angaben gehen in die Rechnung ein. Sie sind Vorbelegung, keine Frage an den Kunden.",
    economic: true,
    questions: [
      { id: "internal_cost_rate", label: "Interner Kostensatz pro Stunde (EUR)", type: "number", min: 0, step: "0.01", required: true, default: 60, help: HELP.internal_cost_rate },
      { id: "implementation_cost", label: "Einmalige Implementierungskosten (EUR)", type: "number", min: 0, step: "0.01", required: true, default: 12000, help: HELP.implementation_cost },
      { id: "recurring_cost_monthly", label: "Laufende monatliche Kosten (EUR)", type: "number", min: 0, step: "0.01", required: true, default: 180, help: HELP.recurring_cost_monthly },
      { id: "external_one_time_cost", label: "Externe einmalige Kosten (EUR)", type: "number", min: 0, step: "0.01", required: true, default: 0, help: HELP.external_one_time_cost },
      { id: "automation_percentage", label: "Erwarteter Automatisierungsanteil (%)", type: "number", min: 0, max: 100, required: true, default: 50, help: HELP.automation_percentage },
      { id: "realization_factor", label: "Realisierungsfaktor (%)", type: "number", min: 0, max: 100, required: true, default: 60, help: HELP.realization_factor },
      { id: "cash_realization_factor", label: "Anteil als tatsächliche Kosteneinsparung (%)", type: "number", min: 0, max: 100, required: true, default: 10, help: HELP.cash_realization_factor },
    ],
  },
];

/** Die Fragen, ohne die das Backend die Antwort nicht annimmt. */
export const REQUIRED_QUESTION_IDS: string[] = SECTIONS
  .filter((section) => !section.economic)
  .flatMap((section) => section.questions.filter((q) => q.required).map((q) => q.id));

export const SECTIONS_COUNT = SECTIONS.length;

export type Answers = Record<string, string | number | undefined>;
export type Economic = Record<string, string | number>;

/**
 * Ist eine bedingte Frage in diesem Zustand überhaupt zu stellen?
 *
 * Die Bedingungen sind die des vorhandenen Prototyps. Wichtig: keine
 * Pflichtfrage ist bedingt — sonst verlangte das Formular eine Antwort, die
 * es nicht anbietet.
 */
export function isVisible(question: Question, answers: Answers): boolean {
  const at = (id: string) => answers[id];
  const isHigh = (id: string) => at(id) === "HIGH" || at(id) === "VERY_HIGH";
  switch (question.when) {
    case undefined: return true;
    case "personalData": return Boolean(at("Q-015")) && at("Q-015") !== "NONE";
    case "highPersonalData": return at("Q-015") === "HIGH";
    case "externalCommunication": return isHigh("Q-018");
    case "sendsExternally": return at("Q-034") === "YES";
    case "financialImpact": return isHigh("Q-016");
    case "aiSuitable": return isHigh("Q-021") && isHigh("Q-023");
    default: return false;
  }
}

/** Die im aktuellen Zustand tatsächlich gestellten Fragen, in Reihenfolge. */
export function visibleQuestions(answers: Answers): Question[] {
  return SECTIONS
    .filter((section) => !section.economic)
    .flatMap((section) => section.questions.filter((q) => isVisible(q, answers)));
}

/** Auswahllisten werden als Text gesendet — so liest der Adapter des Backends sie. */
function listValue(raw: unknown): string[] {
  return String(raw ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Die Zuversicht des Assessments. Ein Wert, nicht zwei — er steht auch am Szenario. */
export const CONFIDENCE = 85;

export interface RoiScenario {
  scenario_id: "CONSERVATIVE" | "LIKELY" | "OPTIMISTIC";
  automation_percentage: number;
  realization_factor: number;
  cash_realization_factor: number;
  confidence: number;
}

export interface RoiRequest {
  monthly_volume: number;
  minutes_per_transaction: number;
  internal_cost_rate: number;
  implementation_cost: number;
  recurring_cost_monthly: number;
  external_one_time_cost: number;
  scenarios: RoiScenario[];
}

/**
 * Baut die ROI-Annahme aus den wirtschaftlichen Angaben.
 *
 * Die drei Szenarien werden deterministisch abgeleitet: das erwartete Szenario
 * ist die Angabe selbst, das vorsichtige rechnet 20 Punkte tiefer, das
 * optimistische 20 Punkte hoeher (auf 0..100 begrenzt). Die Kostenmultiplikatoren
 * werden bewusst NICHT gesendet — sie sind Vorgaben der Engine, keine Eingaben
 * des Kunden.
 */
export function buildRoi(answers: Answers, economic: Economic): RoiRequest {
  const automation = Number(economic.automation_percentage);
  const realization = Number(economic.realization_factor);
  const cash = Number(economic.cash_realization_factor);
  const clamp = (value: number) => Math.max(0, Math.min(100, value));

  const scenario = (
    id: RoiScenario["scenario_id"],
    automationPercentage: number,
    realizationFactor: number,
  ): RoiScenario => ({
    scenario_id: id,
    automation_percentage: automationPercentage,
    realization_factor: realizationFactor,
    cash_realization_factor: cash,
    confidence: CONFIDENCE,
  });

  return {
    monthly_volume: Number(answers["Q-004"]),
    minutes_per_transaction: Number(answers["Q-005"]),
    internal_cost_rate: Number(economic.internal_cost_rate),
    implementation_cost: Number(economic.implementation_cost),
    recurring_cost_monthly: Number(economic.recurring_cost_monthly),
    external_one_time_cost: Number(economic.external_one_time_cost),
    scenarios: [
      scenario("CONSERVATIVE", clamp(automation - 20), clamp(realization - 20)),
      scenario("LIKELY", clamp(automation), clamp(realization)),
      scenario("OPTIMISTIC", clamp(automation + 20), clamp(realization + 20)),
    ],
  };
}

export interface AssessmentRequest {
  schema_version: "AAHC-INPUT-0.1";
  assessment_id: string;
  process_id: string;
  process_name: string;
  answers: Record<string, string | number | string[]>;
  roi: RoiRequest;
  confidence: number;
}

function findQuestion(id: string): Question | undefined {
  for (const section of SECTIONS) {
    const hit = section.questions.find((q) => q.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Baut den Anfragekoerper fuer POST /api/v1/assessments.
 *
 * `answers` geht unveraendert durch: die Uebersetzung in Engine-Felder macht der
 * Adapter des Backends. Was hier hinzukommt, ist allein die Huelle, die der
 * Vertrag AAHC-INPUT-0.1 verlangt.
 */
export function buildAssessmentRequest(
  answers: Answers,
  economic: Economic,
  identity: { assessmentId: string; processId: string },
): AssessmentRequest {
  const payload: AssessmentRequest = {
    schema_version: "AAHC-INPUT-0.1",
    assessment_id: identity.assessmentId,
    process_id: identity.processId,
    process_name: String(answers["Q-001"] ?? "").trim(),
    answers: {},
    roi: buildRoi(answers, economic),
    confidence: CONFIDENCE,
  };

  for (const [id, value] of Object.entries(answers)) {
    if (value === undefined || value === null || value === "") continue;
    const question = findQuestion(id);
    payload.answers[id] = question?.type === "list" ? listValue(value) : value;
  }

  return payload;
}

/** Die Vorbelegung der wirtschaftlichen Annahmen. */
export function defaultEconomic(): Economic {
  const economic: Economic = {};
  for (const section of SECTIONS.filter((s) => s.economic)) {
    for (const question of section.questions) {
      if (question.default !== undefined) economic[question.id] = question.default;
    }
  }
  return economic;
}
