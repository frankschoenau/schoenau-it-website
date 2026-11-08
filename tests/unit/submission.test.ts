import { describe, expect, it } from "vitest";

import {
  deriveProcessId,
} from "@/lib/health-check/process-id";
import {
  MAX_SUBMISSION_ID_LENGTH,
  isSubmissionId,
  newSubmissionId,
} from "@/lib/health-check/submission";
import { createSubmitGuard } from "@/lib/health-check/submit-guard";
import {
  buildAssessmentRequest,
  defaultEconomic,
  type Answers,
} from "@/lib/health-check/questionnaire";

/**
 * Vorgangs-ID, Prozess-ID und Payload-Stabilität (AP-04.34).
 *
 * Der Kern: Ein Vorgang hat genau eine ID, aus ihr entsteht eine feste
 * Prozess-ID, und daraus ein Payload, der sich bei einer Wiederholung nicht
 * ändert — sonst erkennt die API die Wiederholung nicht.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ANTWORTEN: Answers = { "Q-001": "Rechnungseingang prüfen" };

describe("newSubmissionId", () => {
  it("erzeugt eine gültige UUID", () => {
    expect(newSubmissionId()).toMatch(UUID);
  });

  it("erzeugt bei jedem Aufruf eine andere ID", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newSubmissionId()));
    expect(ids.size).toBe(50);
  });
});

describe("isSubmissionId", () => {
  it("akzeptiert eine erzeugte ID", () => {
    expect(isSubmissionId(newSubmissionId())).toBe(true);
  });

  it("weist Fremdformate ab", () => {
    for (const wert of ["", "abc", "123", "nicht-uuid", null, undefined, 42, {}]) {
      expect(isSubmissionId(wert)).toBe(false);
    }
  });

  it("weist zu lange IDs ab", () => {
    const zuLang = `${newSubmissionId()}-${"x".repeat(MAX_SUBMISSION_ID_LENGTH)}`;
    expect(zuLang.length).toBeGreaterThan(MAX_SUBMISSION_ID_LENGTH);
    expect(isSubmissionId(zuLang)).toBe(false);
  });
});

describe("deriveProcessId", () => {
  it("liefert dieselbe Prozess-ID für dieselbe Vorgangs-ID", () => {
    const id = newSubmissionId();
    expect(deriveProcessId(id)).toBe(deriveProcessId(id));
  });

  it("liefert verschiedene Prozess-IDs für verschiedene Vorgänge", () => {
    expect(deriveProcessId(newSubmissionId())).not.toBe(deriveProcessId(newSubmissionId()));
  });

  it("erzeugt eine gültige UUID der Version 5", () => {
    const prozess = deriveProcessId(newSubmissionId());
    expect(prozess).toMatch(UUID);
    expect(prozess[14]).toBe("5");
  });
});

describe("Payload-Stabilität", () => {
  const economic = defaultEconomic();

  it("baut bei gleicher Vorgangs-ID einen byte-gleichen Payload", () => {
    const id = newSubmissionId();
    const a = buildAssessmentRequest(ANTWORTEN, economic, {
      assessmentId: id,
      processId: deriveProcessId(id),
    });
    const b = buildAssessmentRequest(ANTWORTEN, economic, {
      assessmentId: id,
      processId: deriveProcessId(id),
    });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("baut bei neuer Vorgangs-ID einen anderen Payload — auch bei gleichen Antworten", () => {
    const ersteId = newSubmissionId();
    const zweiteId = newSubmissionId();
    const a = buildAssessmentRequest(ANTWORTEN, economic, {
      assessmentId: ersteId,
      processId: deriveProcessId(ersteId),
    });
    const b = buildAssessmentRequest(ANTWORTEN, economic, {
      assessmentId: zweiteId,
      processId: deriveProcessId(zweiteId),
    });
    expect(a.assessment_id).not.toBe(b.assessment_id);
    expect(a.process_id).not.toBe(b.process_id);
    expect(JSON.stringify(a.answers)).toBe(JSON.stringify(b.answers));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("übernimmt die Vorgangs-ID als Assessment-ID", () => {
    const id = newSubmissionId();
    const payload = buildAssessmentRequest(ANTWORTEN, economic, {
      assessmentId: id,
      processId: deriveProcessId(id),
    });
    expect(payload.assessment_id).toBe(id);
  });
});

describe("createSubmitGuard", () => {
  it("lässt genau einen Aufruf durch", () => {
    const guard = createSubmitGuard();
    expect(guard.tryAcquire(false)).toBe(true);
    expect(guard.tryAcquire(false)).toBe(false);
    expect(guard.tryAcquire(false)).toBe(false);
  });

  it("sperrt auch dann, wenn `busy` noch nicht gerendert ist", () => {
    const guard = createSubmitGuard();
    expect(guard.tryAcquire(false)).toBe(true); // erster Klick
    expect(guard.tryAcquire(false)).toBe(false); // zweiter Klick im selben Tick
  });

  it("gibt nach Abschluss wieder frei", () => {
    const guard = createSubmitGuard();
    expect(guard.tryAcquire(false)).toBe(true);
    guard.release();
    expect(guard.tryAcquire(false)).toBe(true);
  });

  it("sperrt, solange busy gilt", () => {
    const guard = createSubmitGuard();
    expect(guard.tryAcquire(true)).toBe(false);
  });
});
