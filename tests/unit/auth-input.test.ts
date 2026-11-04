import { describe, expect, it, vi } from "vitest";

/**
 * Eingabeprüfung für Konten.
 *
 * Die Funktionen liegen in `accounts.ts`, und diese Datei importiert die
 * Datenbank, den Mailversand und die Sitzungen. Für einen Unit-Test werden
 * genau diese drei Abhängigkeiten ersetzt — nicht weil sie stören, sondern
 * weil ein Test, der eine Datenbank braucht, kein Unit-Test ist. Die Mocks
 * **werfen**, wenn sie doch benutzt werden: So fällt auf, wenn eine geprüfte
 * Funktion heimlich mehr tut, als ihr Name sagt.
 */
vi.mock("@/lib/db", () => ({
  pool: () => {
    throw new Error("Unit-Test darf keine Datenbank öffnen");
  },
}));
vi.mock("@/lib/auth/mail", () => ({
  sendMail: async () => {
    throw new Error("Unit-Test darf keine Mail senden");
  },
}));
vi.mock("@/lib/auth/session", () => ({
  createSession: async () => {
    throw new Error("Unit-Test darf keine Sitzung anlegen");
  },
  pruneExpiredSessions: async () => {
    throw new Error("Unit-Test darf keine Sitzungen aufräumen");
  },
}));

const { normalizeEmail, looksLikeEmail } = await import("@/lib/auth/accounts");

describe("normalizeEmail", () => {
  it("entfernt Leerraum und senkt die Schreibweise", () => {
    expect(normalizeEmail("  Anna.Betrieb@Example.TEST  ")).toBe("anna.betrieb@example.test");
  });

  it("lässt eine bereits normale Adresse unverändert", () => {
    expect(normalizeEmail("buchhaltung@example.test")).toBe("buchhaltung@example.test");
  });

  it("macht aus zwei Schreibweisen dieselbe Adresse", () => {
    expect(normalizeEmail("Max@Beispiel.TEST")).toBe(normalizeEmail("max@beispiel.test"));
  });
});

describe("looksLikeEmail", () => {
  it("nimmt übliche Adressen an", () => {
    for (const address of [
      "anna@example.test",
      "a.b-c+tag@sub.example.test",
      "x@y.de",
    ]) {
      expect(looksLikeEmail(address)).toBe(true);
    }
  });

  it("weist offensichtlich falsche Eingaben ab", () => {
    for (const address of ["", "keine-adresse", "@example.test", "a@b", "a b@example.test"]) {
      expect(looksLikeEmail(address)).toBe(false);
    }
  });

  it("prüft eine Adresse mit Leerraum erst nach der Normalisierung", () => {
    // `looksLikeEmail` erwartet eine bereits normalisierte Adresse — der
    // Leerraum wird von `normalizeEmail` entfernt, nicht von der Prüfung.
    // Diese Reihenfolge ist Absicht: Wer die Prüfung direkt aufruft, muss
    // vorher normalisieren, sonst weist sie eine gültige Adresse ab.
    expect(looksLikeEmail("  anna@example.test  ")).toBe(false);
    expect(looksLikeEmail(normalizeEmail("  anna@example.test  "))).toBe(true);
  });
});
