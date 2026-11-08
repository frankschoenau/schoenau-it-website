import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAIL_SENDER,
  MailError,
  isMailConfigured,
  readMailConfig,
  resetMailState,
  sendMail,
} from "@/lib/auth/mail";

/**
 * Graph-Mailversand ohne Netz.
 *
 * `fetch` wird ersetzt; jede Antwort ist eine Attrappe. Es geht **keine**
 * echte Mail raus, und es werden keine echten Zugangsdaten benutzt — die
 * Werte hier sind Testzeichenketten. Geprüft wird der Vertrag: welcher
 * Endpunkt, welche Kopfzeilen, welcher Absender, und wie Fehler ankommen.
 */

const ENV_KEYS = ["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MAIL_FROM"] as const;

const TENANT = "tenant-test-0001";
const CLIENT = "client-test-0001";
const SECRET = "secret-test-nur-fuer-tests";

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? "" : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(...responses: Array<Response | Error>): ReturnType<typeof vi.fn> {
  const mock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) mock.mockRejectedValueOnce(response);
    else mock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", mock);
  return mock;
}

function tokenResponse(token = "graph-token-test", expiresIn = 3599): Response {
  return jsonResponse({ access_token: token, token_type: "Bearer", expires_in: expiresIn });
}

const mail = { to: "anna@example.test", subject: "Bitte bestätigen", text: "Text der Mail" };

beforeEach(() => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.MS_TENANT_ID = TENANT;
  process.env.MS_CLIENT_ID = CLIENT;
  process.env.MS_CLIENT_SECRET = SECRET;
  delete process.env.MAIL_FROM;
  resetMailState();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  resetMailState();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Konfiguration", () => {
  it("meldet fehlende Variablen mit Namen, nicht mit Werten", () => {
    delete process.env.MS_CLIENT_SECRET;

    expect(isMailConfigured()).toBe(false);
    expect(() => readMailConfig()).toThrow(MailError);
    try {
      readMailConfig();
    } catch (error) {
      const failure = error as MailError;
      expect(failure.reason).toBe("CONFIG");
      expect(failure.message).toContain("MS_CLIENT_SECRET");
      // Kein Wert, auch nicht der eines vorhandenen Schlüssels.
      expect(failure.message).not.toContain(TENANT);
    }
  });

  it("liefert die Konfiguration, wenn alle Werte gesetzt sind", () => {
    const config = readMailConfig();
    expect(config.tenantId).toBe(TENANT);
    expect(config.clientId).toBe(CLIENT);
    expect(config.sender).toBe(MAIL_SENDER);
    expect(isMailConfigured()).toBe(true);
  });

  it("akzeptiert keinen anderen Absender", async () => {
    process.env.MAIL_FROM = "frank@schoenau-it.de";
    const fetchMock = stubFetch();

    await expect(sendMail(mail)).rejects.toMatchObject({
      reason: "CONFIG",
      message: "MAIL_SENDER_NOT_ALLOWED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("OAuth 2.0 Client Credentials", () => {
  it("fordert ein Token am richtigen Endpunkt mit dem Graph-Scope an", async () => {
    const fetchMock = stubFetch(tokenResponse(), jsonResponse(null, 202));

    await sendMail(mail);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/x-www-form-urlencoded",
    );

    const body = String(init.body);
    expect(body).toContain("grant_type=client_credentials");
    expect(body).toContain("scope=https%3A%2F%2Fgraph.microsoft.com%2F.default");
    expect(body).toContain(`client_id=${CLIENT}`);
    expect(body).toContain(`client_secret=${SECRET}`);
  });

  it("verwendet ein gültiges Token mehrfach", async () => {
    const fetchMock = stubFetch(
      tokenResponse(),
      jsonResponse(null, 202),
      jsonResponse(null, 202),
    );

    await sendMail(mail);
    await sendMail(mail);

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/oauth2/v2.0/token"),
    );
    expect(tokenCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("erkennt einen abgelehnten Tokenantrag als OAuth-Fehler", async () => {
    stubFetch(
      jsonResponse(
        {
          error: "invalid_client",
          error_description: "AADSTS7000215: Invalid client secret provided. Trace ID 1234.",
        },
        401,
      ),
    );

    const failure = (await sendMail(mail).catch((error: unknown) => error)) as MailError;

    expect(failure).toBeInstanceOf(MailError);
    expect(failure).toMatchObject({ reason: "OAUTH", status: 401, code: "invalid_client" });
    // Weder Secret noch die Beschreibung des Identitätsanbieters.
    expect(failure.message).not.toContain(SECRET);
    expect(failure.message).not.toContain("AADSTS");
  });

  it("meldet ein fehlendes Token im Antwortkörper", async () => {
    stubFetch(jsonResponse({ token_type: "Bearer", expires_in: 3599 }));

    await expect(sendMail(mail)).rejects.toMatchObject({
      reason: "OAUTH",
      message: "MAIL_OAUTH_NO_TOKEN",
    });
  });
});

describe("Graph-Versand", () => {
  it("sendet über das feste Absenderpostfach mit Textkörper", async () => {
    const fetchMock = stubFetch(tokenResponse(), jsonResponse(null, 202));

    await sendMail(mail);

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(
      "https://graph.microsoft.com/v1.0/users/noreply%40schoenau-it.de/sendMail",
    );
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe(
      "Bearer graph-token-test",
    );

    const payload = JSON.parse(String(init.body)) as {
      message: {
        subject: string;
        body: { contentType: string; content: string };
        toRecipients: Array<{ emailAddress: { address: string } }>;
      };
      saveToSentItems: boolean;
    };

    expect(payload.message.subject).toBe(mail.subject);
    expect(payload.message.body.contentType).toBe("Text");
    expect(payload.message.body.content).toBe(mail.text);
    expect(payload.message.toRecipients[0].emailAddress.address).toBe(mail.to);
    expect(payload.saveToSentItems).toBe(false);
  });

  it("wertet 202 als Erfolg", async () => {
    stubFetch(tokenResponse(), jsonResponse(null, 202));
    await expect(sendMail(mail)).resolves.toBeUndefined();
  });

  it("erkennt einen Graph-Fehler mit Status und sicherem Code", async () => {
    stubFetch(
      tokenResponse(),
      jsonResponse(
        {
          error: {
            code: "ErrorAccessDenied",
            message: "Access to OData is disabled. Besitzer: frank@schoenau-it.de",
          },
        },
        403,
      ),
    );

    const failure = (await sendMail(mail).catch((error: unknown) => error)) as MailError;

    expect(failure).toBeInstanceOf(MailError);
    expect(failure).toMatchObject({ reason: "GRAPH", status: 403, code: "ErrorAccessDenied" });
    expect(failure.message).not.toContain("Access to OData");
    expect(failure.message).not.toContain("frank@schoenau-it.de");
  });

  it("wiederholt einmal mit frischem Token, wenn Graph 401 meldet", async () => {
    const fetchMock = stubFetch(
      tokenResponse("token-eins"),
      jsonResponse(null, 401),
      tokenResponse("token-zwei"),
      jsonResponse(null, 202),
    );

    await expect(sendMail(mail)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const secondSend = fetchMock.mock.calls[3] as [string, RequestInit];
    expect((secondSend[1].headers as Record<string, string>).authorization).toBe(
      "Bearer token-zwei",
    );
  });

  it("meldet einen nicht erreichbaren Endpunkt als Netzwerkfehler", async () => {
    stubFetch(new TypeError("fetch failed"));

    await expect(sendMail(mail)).rejects.toMatchObject({
      reason: "NETWORK",
      message: "MAIL_OAUTH_UNREACHABLE",
    });
  });

  it("weist eine unbrauchbare Empfängeradresse ab", async () => {
    const fetchMock = stubFetch();

    await expect(sendMail({ ...mail, to: "keine-adresse" })).rejects.toMatchObject({
      reason: "INPUT",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
