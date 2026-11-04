import { describe, expect, it } from "vitest";

import { classifyApiFailure, conflictMessage } from "@/lib/api/errors";

/**
 * Fehlerabbildung (AP-04.32, M-2).
 *
 * Die API liefert stabile Codes; hier wird geprüft, dass jeder Status genau
 * eine Einordnung bekommt und dass ein 401 nur dann als Abmeldung gilt, wenn
 * die API es ausdrücklich sagt.
 */

describe("classifyApiFailure", () => {
  it("behandelt eine ausdrückliche Sitzungsmeldung als abgemeldet", () => {
    expect(classifyApiFailure(401, "IDENTITY_SESSION_INVALID").kind).toBe("unauthenticated");
    expect(classifyApiFailure(401, "IDENTITY_SESSION_REQUIRED").kind).toBe("unauthenticated");
  });

  it("wertet ein 401 ohne Sitzungscode nicht als Abmeldung", () => {
    // Falsches Dienst-Token ist ein Betriebsfehler, keine abgelaufene Sitzung.
    const failure = classifyApiFailure(401, "API_AUTHENTICATION_REQUIRED");
    expect(failure.kind).toBe("server");
    expect(failure.kind).not.toBe("unauthenticated");
  });

  it("unterscheidet 403, 404, 409 und 400", () => {
    expect(classifyApiFailure(403, "API_AUTHORIZATION_DENIED").kind).toBe("forbidden");
    expect(classifyApiFailure(404, "API_NOT_FOUND").kind).toBe("not_found");
    expect(classifyApiFailure(409, "CHECK_HAS_PAYMENT").kind).toBe("conflict");
    expect(classifyApiFailure(400, "API_INPUT_INVALID:result").kind).toBe("invalid");
  });

  it("erkennt Ausfälle als wiederholbar", () => {
    for (const status of [502, 503, 504]) {
      const failure = classifyApiFailure(status, "API_UNREACHABLE");
      expect(failure.kind).toBe("unavailable");
      expect(failure.retryable).toBe(true);
    }
  });

  it("behandelt sonstige Serverfehler als technischen Fehler", () => {
    expect(classifyApiFailure(500, "CHECK_NOT_SAVED").kind).toBe("server");
    expect(classifyApiFailure(500, null).retryable).toBe(true);
  });

  it("gibt keinen Code der API als Meldung an die Oberfläche", () => {
    const failure = classifyApiFailure(409, "CHECK_RETENTION_UNDECIDED");
    expect(failure.message).not.toContain("CHECK_");
    expect(failure.code).toBe("CHECK_RETENTION_UNDECIDED");
  });
});

describe("conflictMessage", () => {
  it("nennt für die beiden 409-Fälle verschiedene Gründe", () => {
    expect(conflictMessage("CHECK_HAS_PAYMENT")).toContain("bezahlten Bestellung");
    expect(conflictMessage("CHECK_RETENTION_UNDECIDED")).toContain("nicht freigegeben");
    expect(conflictMessage("ETWAS_ANDERES")).not.toContain("CHECK_");
  });
});
