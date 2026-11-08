import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetRateLimits } from "@/lib/auth/rate-limit";

/**
 * Die Resend-Route als Handler, ohne laufenden Server.
 *
 * Geprüft wird die Zusage aus dem Auftrag: neutrale Antwort, 503 solange die
 * API keine Route anbietet, und eine Bremse, die nach drei Anfragen greift.
 */

const route = await import("@/app/api/auth/[action]/route");

function call(body: unknown, ip = "203.0.113.7"): Promise<Response> {
  const request = new Request("http://localhost/api/auth/resend", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
  return route.POST(request, { params: Promise.resolve({ action: "resend" }) });
}

beforeEach(() => {
  resetRateLimits();
});

afterEach(() => {
  resetRateLimits();
});

describe("POST /api/auth/resend", () => {
  it("antwortet mit 503 und RESEND_UNAVAILABLE", async () => {
    const response = await call({ email: "anna@example.test" });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, code: "RESEND_UNAVAILABLE" });
  });

  it("antwortet für bekannte und unbekannte Adressen gleich", async () => {
    const bekannt = await call({ email: "buchhaltung@example.test" }, "198.51.100.1");
    const unbekannt = await call({ email: "niemand@example.test" }, "198.51.100.2");

    expect(bekannt.status).toBe(unbekannt.status);
    await expect(bekannt.json()).resolves.toEqual(await unbekannt.json());
  });

  it("weist eine unbrauchbare Adresse ab, ohne etwas über Konten zu verraten", async () => {
    const response = await call({ email: "keine-adresse" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, code: "INVALID_EMAIL" });
  });

  it("bremst nach drei Anfragen je Adresse und Client", async () => {
    for (let i = 0; i < 3; i += 1) {
      const allowed = await call({ email: "anna@example.test" });
      expect(allowed.status).toBe(503);
    }

    const blocked = await call({ email: "anna@example.test" });
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ ok: false, code: "RATE_LIMITED" });

    const retryAfter = Number(blocked.headers.get("retry-after"));
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
  });

  it("bremst auch einen Client, der viele Adressen durchprobiert", async () => {
    for (let i = 0; i < 3; i += 1) {
      await call({ email: `person${i}@example.test` }, "198.51.100.9");
    }

    const blocked = await call({ email: "person9@example.test" }, "198.51.100.9");
    expect(blocked.status).toBe(429);
  });

  it("lässt andere Clients mit anderer Adresse davon unberührt", async () => {
    for (let i = 0; i < 4; i += 1) {
      await call({ email: "anna@example.test" }, "198.51.100.20");
    }

    const other = await call({ email: "bernd@example.test" }, "198.51.100.21");
    expect(other.status).toBe(503);
  });

  it("bremst eine Adresse auch über wechselnde Clients", async () => {
    for (let i = 0; i < 3; i += 1) {
      await call({ email: "anna@example.test" }, `198.51.100.3${i}`);
    }

    // Ein Empfänger soll nicht von vielen Adressen gleichzeitig beworfen werden.
    const blocked = await call({ email: "anna@example.test" }, "198.51.100.39");
    expect(blocked.status).toBe(429);
  });
});
