import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMockApi, type MockApi } from "../helpers/mock-api";
import { OTHER_ACCOUNT } from "../fixtures/accounts";

/**
 * Vertragstest der künftigen Datenzugriffsschicht — **Grundlage**, nicht
 * Abnahme.
 *
 * Geprüft wird hier nicht die Anwendung, sondern die Annahme, auf der AP-04.39
 * aufsetzt: Die Website wird ihre Daten über HTTP holen, und die Antwort auf
 * eine **fremde Kennung** ist `404`, nicht `403` und nicht `200`. Das ist keine
 * Formalie: `403` würde bestätigen, dass die Kennung existiert (ADR-018 §7).
 *
 * Der Server läuft lokal auf einem freien Port. Keine Datenbank, kein Netz,
 * keine echten Daten.
 */
describe("Datenzugriff über HTTP (Vertragsgrundlage)", () => {
  let api: MockApi;

  beforeAll(async () => {
    api = await startMockApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it("meldet Gesundheit ohne Authentifizierung", async () => {
    const response = await fetch(`${api.baseUrl}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("verweigert eine Sitzung ohne Identitätsnachweis", async () => {
    const response = await fetch(`${api.baseUrl}/api/v1/session`, { method: "POST" });

    expect(response.status).toBe(401);
  });

  it("stellt eine Sitzung mit Identitätsnachweis aus", async () => {
    const response = await fetch(`${api.baseUrl}/api/v1/session`, {
      method: "POST",
      headers: { authorization: "Bearer test" },
    });
    const body = (await response.json()) as { token?: string };

    expect(response.status).toBe(200);
    expect(typeof body.token).toBe("string");
  });

  it("liefert die Checks des angemeldeten Kontos", async () => {
    const response = await fetch(`${api.baseUrl}/api/v1/checks`, {
      headers: { authorization: "Bearer test" },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ checks: [] });
  });

  it("beantwortet eine fremde Kennung mit 404 — nicht mit 403", async () => {
    const response = await fetch(`${api.baseUrl}/api/v1/checks/fremde-id`, {
      headers: { authorization: "Bearer test" },
    });

    expect(response.status).toBe(404);
  });

  it("kennt keine Route, die nicht im Vertrag steht", async () => {
    const response = await fetch(`${api.baseUrl}/api/v1/konten/${OTHER_ACCOUNT.id}`);

    expect(response.status).toBe(404);
  });

  it("zeichnet die Anfragen auf, damit Tests sie prüfen können", () => {
    expect(api.requests.length).toBeGreaterThan(0);
    expect(api.requests.every((request) => request.path.startsWith("/"))).toBe(true);
  });
});
