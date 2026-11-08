import { describe, expect, it } from "vitest";

import {
  REQUIRED_QUESTION_IDS,
  SECTIONS,
  SECTIONS_COUNT,
  buildRoi,
  isVisible,
  type Answers,
  type Economic,
} from "@/lib/health-check/questionnaire";

/**
 * Der Fragebogen als Daten — nicht als Oberfläche.
 *
 * Geprüft werden die Eigenschaften, auf die sich alles Weitere verlässt:
 * 41 Fragen, keine bedingte Pflichtfrage, und eine ROI-Ableitung, die
 * deterministisch aus den Angaben folgt. Was hier festgehalten wird, ist die
 * Grundlage der kostenlosen Auswertung (ADR-016).
 */
describe("Fragebogen", () => {
  it("enthält 41 Kundenfragen und 7 wirtschaftliche Angaben", () => {
    const customer = SECTIONS
      .filter((section) => !section.economic)
      .reduce((count, section) => count + section.questions.length, 0);
    const economic = SECTIONS
      .filter((section) => section.economic)
      .reduce((count, section) => count + section.questions.length, 0);

    // Die Zusage „41 Fragen“ gilt den Kundenfragen. Die sieben wirtschaftlichen
    // Angaben sind Vorbelegungen, die der Nutzer nur bei Bedarf ändert —
    // deshalb zählen sie nicht als Fragen, stehen aber im Modul.
    expect(customer).toBe(41);
    expect(economic).toBe(7);
    expect(SECTIONS_COUNT).toBe(SECTIONS.length);
    expect(SECTIONS_COUNT).toBeGreaterThanOrEqual(8);
  });

  it("hat eindeutige Fragenkennungen", () => {
    const ids = SECTIONS.flatMap((section) => section.questions.map((question) => question.id));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("verlangt keine Antwort, die bedingt ausgeblendet sein kann", () => {
    const byId = new Map(
      SECTIONS.flatMap((section) => section.questions).map((question) => [question.id, question]),
    );

    for (const id of REQUIRED_QUESTION_IDS) {
      const question = byId.get(id);
      expect(question, `Pflichtfrage ${id} fehlt im Fragebogen`).toBeDefined();
      expect(question?.when, `Pflichtfrage ${id} ist bedingt`).toBeUndefined();
    }
  });

  it("blendet bedingte Fragen ohne Voraussetzung aus", () => {
    const conditional = SECTIONS.flatMap((section) => section.questions).find(
      (question) => question.when !== undefined,
    );

    expect(conditional, "keine bedingte Frage gefunden").toBeDefined();
    if (!conditional) return;

    expect(isVisible(conditional, {})).toBe(false);
  });
});

describe("buildRoi", () => {
  const answers: Answers = { "Q-004": 400, "Q-005": "8" };
  const economic: Economic = {
    automation_percentage: "50",
    realization_factor: "40",
    cash_realization_factor: "80",
    internal_cost_rate: "60",
    implementation_cost: "12000",
    recurring_cost_monthly: "180",
    external_one_time_cost: "0",
  };

  it("leitet drei Szenarien deterministisch ab", () => {
    const roi = buildRoi(answers, economic);

    expect(roi.scenarios.map((scenario) => scenario.scenario_id)).toEqual([
      "CONSERVATIVE",
      "LIKELY",
      "OPTIMISTIC",
    ]);
    expect(roi.scenarios[1].automation_percentage).toBe(50);
    expect(roi.scenarios[0].automation_percentage).toBe(30);
    expect(roi.scenarios[2].automation_percentage).toBe(70);
  });

  it("übernimmt Volumen und Zeit aus den Antworten", () => {
    const roi = buildRoi(answers, economic);

    expect(roi.monthly_volume).toBe(400);
    expect(roi.minutes_per_transaction).toBe(8);
    expect(roi.internal_cost_rate).toBe(60);
  });

  it("begrenzt Szenarien auf 0 bis 100", () => {
    const roi = buildRoi(answers, { ...economic, automation_percentage: "95" });

    expect(roi.scenarios[2].automation_percentage).toBe(100);
    expect(roi.scenarios[1].automation_percentage).toBe(95);

    const low = buildRoi(answers, { ...economic, automation_percentage: "5" });
    expect(low.scenarios[0].automation_percentage).toBe(0);
  });

  it("liefert bei gleichen Eingaben gleiche Werte (Reproduzierbarkeit)", () => {
    expect(buildRoi(answers, economic)).toEqual(buildRoi(answers, economic));
  });
});
