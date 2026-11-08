import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sitzungszustand (AP-04.32, M-3).
 *
 * Kernaussage: Nur ein ausdrückliches 401 der API gilt als Abmeldung. Ein
 * Ausfall der API darf die Sitzung weder beenden noch das Cookie löschen.
 */

const deleteCookie = vi.fn();
const setCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "aahc_session" ? { name, value: "sitzungstoken" } : undefined),
    set: setCookie,
    delete: deleteCookie,
  }),
}));

const BASIS = "http://127.0.0.1:9999";

function antwort(status: number, koerper: unknown): Response {
  return new Response(JSON.stringify(koerper), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function zustand() {
  const { sessionState } = await import("@/lib/auth/session");
  return sessionState();
}

beforeEach(() => {
  process.env.AAHC_API_BASE_URL = BASIS;
  process.env.AAHC_API_TOKEN = "dienst-token";
  deleteCookie.mockReset();
  setCookie.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sessionState", () => {
  it("erkennt ein gültiges Konto", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      antwort(200, { account_id: "konto-1", email: "a@example.test", role: "customer", status: "active" })));
    const state = await zustand();
    expect(state.kind).toBe("signed-in");
    if (state.kind === "signed-in") {
      expect(state.account.id).toBe("konto-1");
      expect(state.account.emailVerifiedAt).not.toBeNull();
    }
  });

  it("wertet IDENTITY_SESSION_INVALID als abgemeldet", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => antwort(401, { error: "IDENTITY_SESSION_INVALID" })));
    expect((await zustand()).kind).toBe("signed-out");
  });

  it("wertet ein fremdes 401 nicht als abgemeldet", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => antwort(401, { error: "API_AUTHENTICATION_REQUIRED" })));
    const state = await zustand();
    expect(state.kind).toBe("error");
    expect(state.kind).not.toBe("signed-out");
  });

  it("erkennt eine Sperre als 403", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => antwort(403, { error: "API_ACCOUNT_BLOCKED" })));
    expect((await zustand()).kind).toBe("forbidden");
  });

  it("erkennt 502/503/504 als Ausfall", async () => {
    for (const status of [502, 503, 504]) {
      vi.stubGlobal("fetch", vi.fn(async () => antwort(status, { error: "weg" })));
      expect((await zustand()).kind).toBe("unavailable");
    }
  });

  it("erkennt einen Netzwerkfehler als Ausfall", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));
    expect((await zustand()).kind).toBe("unavailable");
  });

  it("löscht bei einem Ausfall kein Sitzungscookie", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => antwort(503, { error: "weg" })));
    await zustand();
    expect(deleteCookie).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });
});

describe("currentAccount", () => {
  it("wirft bei einem Ausfall, statt abzumelden", async () => {
    const { currentAccount, SessionUnavailableError } = await import("@/lib/auth/session");
    vi.stubGlobal("fetch", vi.fn(async () => antwort(503, { error: "weg" })));
    await expect(currentAccount()).rejects.toBeInstanceOf(SessionUnavailableError);
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it("liefert null nur bei abgelaufener Sitzung", async () => {
    const { currentAccount } = await import("@/lib/auth/session");
    vi.stubGlobal("fetch", vi.fn(async () => antwort(401, { error: "IDENTITY_SESSION_REQUIRED" })));
    await expect(currentAccount()).resolves.toBeNull();
  });
});
