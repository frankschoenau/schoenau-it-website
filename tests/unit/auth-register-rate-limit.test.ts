import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimits } from "@/lib/auth/rate-limit";

/**
 * Registrierung mit Ratenbegrenzung (AP-04.46, Befund M-1).
 *
 * Der Kern: Eine Registrierung löst eine echte Mail aus. Deshalb muss die
 * Bremse **vor** dem API-Aufruf greifen — bei Überschreitung darf weder ein
 * Konto entstehen noch eine Mail hinausgehen. Die API wird ersetzt; der Zähler
 * der Attrappe ist der Beweis, dass nichts weitergeleitet wurde.
 */

const identity = vi.hoisted(() => ({
  register: vi.fn(),
  confirm: vi.fn(),
  login: vi.fn(),
  deleteAccount: vi.fn(),
}));

const mail = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock("@/lib/api/identity", () => ({
  register: identity.register,
  confirm: identity.confirm,
  login: identity.login,
  deleteAccount: identity.deleteAccount,
}));

vi.mock("@/lib/auth/mail", () => ({ sendMail: mail.sendMail }));

vi.mock("@/lib/auth/session", () => ({
  currentAccount: vi.fn(),
  destroySession: vi.fn(),
  startSessionFromToken: vi.fn(),
  sessionState: vi.fn(),
}));

const route = await import("@/app/api/auth/[action]/route");

function call(email: string, ip: string): Promise<Response> {
  const request = new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email, password: "ein-langes-passwort" }),
  });
  return route.POST(request, { params: Promise.resolve({ action: "register" }) });
}

beforeEach(() => {
  resetRateLimits();
  vi.clearAllMocks();
  identity.register.mockResolvedValue({
    ok: true,
    status: 201,
    code: null,
    data: { account_id: "konto-test", confirm_token: "confirm-token-test", status: "pending" },
  });
  mail.sendMail.mockResolvedValue(undefined);
});

afterEach(() => {
  resetRateLimits();
});

describe("POST /api/auth/register — Ratenbegrenzung", () => {
  it("leitet unterhalb beider Grenzwerte an die API weiter", async () => {
    const response = await call("anna@example.test", "198.51.100.50");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, next: "/anmelden?neu=1" });
    expect(identity.register).toHaveBeenCalledTimes(1);
  });

  it("bremst den sechsten Versuch derselben Client-IP", async () => {
    for (let i = 1; i <= 5; i += 1) {
      const allowed = await call(`person${i}@example.test`, "198.51.100.51");
      expect(allowed.status).toBe(200);
    }

    const blocked = await call("person6@example.test", "198.51.100.51");

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ ok: false, code: "RATE_LIMITED" });
    // Kein sechster API-Aufruf, also auch kein sechstes Konto und keine Mail.
    expect(identity.register).toHaveBeenCalledTimes(5);
  });

  it("bremst den vierten Versuch derselben normalisierten Adresse", async () => {
    for (let i = 0; i < 3; i += 1) {
      const allowed = await call("anna@example.test", "198.51.100.52");
      expect(allowed.status).toBe(200);
    }

    const blocked = await call("anna@example.test", "198.51.100.52");

    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ ok: false, code: "RATE_LIMITED" });
    expect(identity.register).toHaveBeenCalledTimes(3);
  });

  it("lässt das IP-Limit bei wechselnden Adressen greifen", async () => {
    for (let i = 1; i <= 5; i += 1) {
      await call(`wechsel${i}@example.test`, "198.51.100.53");
    }

    const blocked = await call("wechsel6@example.test", "198.51.100.53");

    expect(blocked.status).toBe(429);
    expect(identity.register).toHaveBeenCalledTimes(5);
  });

  it("zählt Schreibweisen derselben Adresse als eine Adresse", async () => {
    const variants = ["Anna@Example.TEST", "  anna@example.test  ", "ANNA@example.test"];

    for (const variant of variants) {
      const allowed = await call(variant, "198.51.100.54");
      expect(allowed.status).toBe(200);
    }

    const blocked = await call("Anna@Example.test", "198.51.100.54");

    expect(blocked.status).toBe(429);
    expect(identity.register).toHaveBeenCalledTimes(3);
  });

  it("hält die Grenzen für verschiedene Clients und Adressen getrennt", async () => {
    for (let i = 1; i <= 3; i += 1) {
      expect((await call(`a${i}@example.test`, "198.51.100.55")).status).toBe(200);
    }
    for (let i = 1; i <= 3; i += 1) {
      expect((await call(`b${i}@example.test`, "198.51.100.56")).status).toBe(200);
    }

    expect(identity.register).toHaveBeenCalledTimes(6);
  });

  it("nennt eine sinnvolle Wartezeit im Retry-After-Kopf", async () => {
    for (let i = 1; i <= 3; i += 1) {
      await call("anna@example.test", "198.51.100.57");
    }

    const blocked = await call("anna@example.test", "198.51.100.57");
    const retryAfter = Number(blocked.headers.get("retry-after"));

    expect(blocked.status).toBe(429);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(3600);
  });

  it("verbraucht bei einer abgelehnten Adresse keine API-Anfrage", async () => {
    const response = await call("keine-adresse", "198.51.100.58");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, code: "INVALID_EMAIL" });
    expect(identity.register).not.toHaveBeenCalled();
  });

  it("legt für ungültige Eingaben keinen gemeinsamen Adress-Eimer an", async () => {
    for (let i = 0; i < 3; i += 1) {
      expect((await call("keine-adresse", "198.51.100.59")).status).toBe(400);
    }

    // Ein anderer Client mit ungültiger Eingabe bekommt weiterhin den
    // Eingabefehler — nicht die Bremse eines fremden Eimers.
    const other = await call("auch-keine-adresse", "198.51.100.60");

    expect(other.status).toBe(400);
    await expect(other.json()).resolves.toEqual({ ok: false, code: "INVALID_EMAIL" });
  });
});
