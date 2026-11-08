import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Registrierung und Wiederholungsversand ohne API, ohne Mail, ohne Netz.
 *
 * Der Kern: Ein angelegtes Konto ist nicht dasselbe wie eine versendete Mail.
 * Wenn der Versand scheitert, darf die Anwendung keinen Erfolg melden.
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
}));

const { register, resendConfirmation } = await import("@/lib/auth/accounts");
const route = await import("@/app/api/auth/[action]/route");

function post(action: string, body: unknown): Promise<Response> {
  const request = new Request(`http://localhost/api/auth/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return route.POST(request, { params: Promise.resolve({ action }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  identity.register.mockResolvedValue({
    ok: true,
    status: 201,
    code: null,
    data: { account_id: "konto-test", confirm_token: "confirm-token-test", status: "pending" },
  });
  mail.sendMail.mockResolvedValue(undefined);
});

describe("register", () => {
  it("meldet Erfolg, wenn die Bestätigungsmail versendet wurde", async () => {
    const result = await register("Anna@Example.TEST", "ein-langes-passwort", "https://preview.test");

    expect(result).toEqual({ ok: true, value: { accountId: "konto-test" } });
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
  });

  it("sendet an die angegebene Adresse und baut den Link aus der Basisadresse", async () => {
    await register("Anna@Example.TEST", "ein-langes-passwort", "https://preview.test");

    const message = mail.sendMail.mock.calls[0][0] as { to: string; text: string };
    expect(message.to).toBe("Anna@Example.TEST");
    expect(message.text).toContain(
      "https://preview.test/api/auth/verify?token=confirm-token-test",
    );
  });

  it("meldet MAIL_FAILED statt Erfolg, wenn der Versand scheitert", async () => {
    mail.sendMail.mockRejectedValue(new Error("Graph nicht erreichbar"));

    const result = await register("anna@example.test", "ein-langes-passwort", "https://preview.test");

    expect(result).toEqual({ ok: false, code: "MAIL_FAILED" });
    expect(identity.register).toHaveBeenCalledTimes(1);
  });

  it("prüft die Eingabe, bevor die API gerufen wird", async () => {
    const result = await register("keine-adresse", "kurz", "https://preview.test");

    expect(result).toEqual({ ok: false, code: "INVALID_EMAIL" });
    expect(identity.register).not.toHaveBeenCalled();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/register", () => {
  const credentials = { email: "anna@example.test", password: "ein-langes-passwort" };

  it("meldet 200 und den nächsten Schritt, wenn die Mail raus ist", async () => {
    const response = await post("register", credentials);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, next: "/anmelden?neu=1" });
  });

  it("meldet 502 MAIL_FAILED, wenn der Versand scheitert — keinen Erfolg", async () => {
    mail.sendMail.mockRejectedValue(new Error("Graph nicht erreichbar"));

    const response = await post("register", credentials);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, code: "MAIL_FAILED" });
  });
});

describe("resendConfirmation", () => {
  it("antwortet ehrlich mit RESEND_UNAVAILABLE", () => {
    expect(resendConfirmation("anna@example.test")).toEqual({
      ok: false,
      code: "RESEND_UNAVAILABLE",
    });
  });

  it("ruft weder API noch Mailversand an", () => {
    resendConfirmation("anna@example.test");

    expect(identity.register).not.toHaveBeenCalled();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("weist eine unbrauchbare Adresse als Eingabefehler ab", () => {
    expect(resendConfirmation("  ")).toEqual({ ok: false, code: "INVALID_EMAIL" });
  });

  it("verhält sich für unbekannte und bekannte Adressen gleich", () => {
    const bekannt = resendConfirmation("buchhaltung@example.test");
    const unbekannt = resendConfirmation("niemand@example.test");

    expect(bekannt).toEqual(unbekannt);
  });
});
