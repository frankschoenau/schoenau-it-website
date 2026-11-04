import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { FIXTURE_PASSWORD, FIXTURE_PASSWORD_HASH } from "../fixtures/accounts";

/**
 * Passwörter.
 *
 * Der wichtigste Test hier ist der dritte: Er hält die **NFKC-Normalisierung**
 * fest. Ohne sie wäre ein Passwort mit Umlauten je nach Tastatur und
 * Eingabemethode ein anderes — und nach der geplanten Verlagerung der Prüfung
 * in die Python-API (ADR-018) müsste die dortige Implementierung dieselbe
 * Normalisierung anwenden, sonst sperrt die Migration bestehende Konten aus.
 */
describe("password", () => {
  it("prüft einen mit der echten Implementierung erzeugten Hash", async () => {
    await expect(verifyPassword(FIXTURE_PASSWORD, FIXTURE_PASSWORD_HASH)).resolves.toBe(true);
  });

  it("weist ein falsches Passwort ab", async () => {
    await expect(verifyPassword("falsches-passwort", FIXTURE_PASSWORD_HASH)).resolves.toBe(false);
  });

  it("behandelt vorab zusammengesetzte und zerlegte Unicode-Formen gleich (NFKC)", async () => {
    // "Grüße" einmal mit vorab zusammengesetztem ü (U+00FC) und einmal als
    // u + Trema (U+0075 U+0308). Für den Menschen dasselbe, für Bytes nicht.
    const composed = "Grüße-ÄÖÜ-2026!";
    const decomposed = "Grüße-ÄÖÜ-2026!";

    expect(composed).not.toBe(decomposed);
    await expect(verifyPassword(composed, FIXTURE_PASSWORD_HASH)).resolves.toBe(true);
    await expect(verifyPassword(decomposed, FIXTURE_PASSWORD_HASH)).resolves.toBe(true);
  });

  it("erzeugt das dokumentierte Format mit Parametern im Hash", async () => {
    const hash = await hashPassword("ein-testpasswort-mit-laenge");
    const parts = hash.split("$");

    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe("scrypt");
    expect(parts[1]).toBe("16384");
    expect(parts[2]).toBe("8");
    expect(parts[3]).toBe("1");
    await expect(verifyPassword("ein-testpasswort-mit-laenge", hash)).resolves.toBe(true);
  });

  it("erzeugt bei gleichem Passwort unterschiedliche Hashes (eigenes Salt)", async () => {
    const first = await hashPassword("gleiches-passwort-123");
    const second = await hashPassword("gleiches-passwort-123");

    expect(first).not.toBe(second);
    await expect(verifyPassword("gleiches-passwort-123", first)).resolves.toBe(true);
    await expect(verifyPassword("gleiches-passwort-123", second)).resolves.toBe(true);
  });

  it("weist einen unbekannten Hash nicht als gültig aus, sondern als Nein", async () => {
    for (const broken of ["", "nur-ein-string", "bcrypt$1$2$3$4$5", "scrypt$16384"]) {
      await expect(verifyPassword("irgendwas", broken)).resolves.toBe(false);
    }
  });
});
