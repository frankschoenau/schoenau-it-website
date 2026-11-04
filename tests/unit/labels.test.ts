import { describe, expect, it } from "vitest";

import {
  assessmentLabel,
  automationTypeLabel,
  priorityLabel,
  priorityShort,
  priorityTone,
  warningHint,
} from "@/lib/health-check/labels";

/**
 * Beschriftungen.
 *
 * Sie sind der einzige Ort, an dem die Codes der Engine zu Sätzen für Kunden
 * werden. Der wichtigste Test ist der letzte: Ein unbekannter Code darf nicht
 * verschwinden, sondern muss als Bezeichner sichtbar bleiben — sonst sieht
 * eine Lücke wie eine Aussage aus.
 */
describe("labels", () => {
  it("übersetzt bekannte Bewertungscodes", () => {
    expect(assessmentLabel("HIGH_RISK")).toBe("Hohes Risiko");
    expect(assessmentLabel("PAYBACK_WITHIN_12_MONTHS")).toBe(
      "Amortisation innerhalb von zwölf Monaten",
    );
  });

  it("übersetzt Prioritäten und ihre Kurzform", () => {
    expect(priorityLabel("P1_QUICK_WIN")).toBe("Quick Win");
    expect(priorityShort("P1_QUICK_WIN")).toBe("P1");
    expect(priorityShort("unbekannt")).toBe("–");
  });

  it("ordnet Prioritäten der Ampel zu", () => {
    expect(priorityTone("P1_QUICK_WIN")).toBe("p1");
    expect(priorityTone("P2_HIGH_POTENTIAL")).toBe("p2");
    expect(priorityTone("P3_STRATEGIC")).toBe("p2");
    expect(priorityTone("P5_DEFER")).toBe("p3");
  });

  it("übersetzt Automatisierungstypen", () => {
    expect(automationTypeLabel("CLASSIC")).toBe("Klassische Automatisierung");
    expect(automationTypeLabel("AI_ASSISTED")).toBe("KI-unterstützte Automatisierung");
  });

  it("gibt Hinweise nur zu Codes, für die es einen gibt", () => {
    expect(warningHint("LOW_CONFIDENCE")).toContain("Angaben");
    expect(warningHint("HIGH_RISK")).toBeUndefined();
  });

  it("verschluckt unbekannte Codes nicht", () => {
    expect(assessmentLabel("CODE_AUS_EINER_NEUEREN_ENGINE")).toBe("CODE_AUS_EINER_NEUEREN_ENGINE");
    expect(priorityLabel("P9_UNBEKANNT")).toBe("P9_UNBEKANNT");
  });
});
