import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logMailFailure, resetMailState, sendMail } from "@/lib/auth/mail";

/**
 * Diagnoseinstrumentierung (AP-04.47).
 *
 * Geprüft wird nicht der Versand, sondern was im Fehlerfall herausfällt: die
 * Klasse, der HTTP-Status, die standardisierten Codes — und vor allem, was
 * **nicht** im Log landet: Adresse, Secret, Beschreibung, Graph-Text.
 *
 * `fetch` ist überall ersetzt; es geht keine Mail hinaus.
 */

const ENV_KEYS = ["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MAIL_FROM"] as const;

const TENANT = "tenant-test-0001";
const CLIENT = "client-test-0001";
const SECRET = "secret-test-nur-fuer-tests";
const RECIPIENT = "anna@example.test";

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
let lines: string[] = [];

const mail = { to: RECIPIENT, subject: "Bitte bestätigen", text: "Text der Mail" };

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === null ? "" : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function tokenResponse(): Response {
  return jsonResponse({ access_token: "graph-token-test", token_type: "Bearer", expires_in: 3599 });
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

/** Genau eine Zeile, als JSON gelesen. */
function record(): Record<string, unknown> {
  expect(lines).toHaveLength(1);
  expect(lines[0].startsWith("[mail-diag] ")).toBe(true);
  return JSON.parse(lines[0].slice("[mail-diag] ".length)) as Record<string, unknown>;
}

async function failureOf(call: Promise<void>): Promise<unknown> {
  return call.then(
    () => {
      throw new Error("Es wurde kein Fehler geworfen");
    },
    (error: unknown) => error,
  );
}

beforeEach(() => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.MS_TENANT_ID = TENANT;
  process.env.MS_CLIENT_ID = CLIENT;
  process.env.MS_CLIENT_SECRET = SECRET;
  delete process.env.MAIL_FROM;
  resetMailState();

  lines = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(" "));
  });
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

describe("CONFIG", () => {
  it("nennt die fehlende Variable, aber keinen Wert", async () => {
    delete process.env.MS_CLIENT_ID;

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("CONFIG");
    expect(entry.message).toBe("MAIL_CONFIG_MISSING:MS_CLIENT_ID");
    expect(entry.status).toBeNull();
    expect(entry.code).toBeNull();
    expect(lines[0]).not.toContain(SECRET);
    expect(lines[0]).not.toContain(TENANT);
  });

  it("meldet einen unzulässigen Absender ohne den gesetzten Wert", async () => {
    process.env.MAIL_FROM = "frank@schoenau-it.de";

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("CONFIG");
    expect(entry.message).toBe("MAIL_SENDER_NOT_ALLOWED");
    // Die feste Absenderadresse ist Konfiguration, kein Empfänger — sie darf
    // hier nicht auftauchen, weil die Meldung sie gar nicht enthält.
    expect(lines[0]).not.toContain("@");
  });
});

describe("OAUTH", () => {
  it("erfasst Status, OAuth-Code und AADSTS-Nummer", async () => {
    stubFetch(
      jsonResponse(
        {
          error: "invalid_client",
          error_codes: [7000215],
          error_description: "AADSTS7000215: Invalid client secret provided. Trace ID 1234.",
        },
        401,
      ),
    );

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("OAUTH");
    expect(entry.status).toBe(401);
    expect(entry.code).toBe("invalid_client");
    expect(entry.aadsts).toBe(7000215);
  });

  it("protokolliert weder Beschreibung noch Secret", async () => {
    stubFetch(
      jsonResponse(
        {
          error: "invalid_client",
          error_codes: [7000215],
          error_description: `AADSTS7000215: Invalid client secret provided. Secret: ${SECRET}`,
        },
        401,
      ),
    );

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");
    record();

    expect(lines[0]).not.toContain(SECRET);
    expect(lines[0]).not.toContain("Invalid client secret");
    expect(lines[0]).not.toContain("AADSTS");
  });

  it("verwirft eine unplausible AADSTS-Angabe", async () => {
    stubFetch(
      jsonResponse({ error: "invalid_request", error_codes: ["7000215", -1, 0] }, 400),
    );

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    expect(record().aadsts).toBeNull();
  });
});

describe("GRAPH", () => {
  const guid = "9f1c2b3d-4e5f-4a6b-8c7d-0123456789ab";

  function graphFailure(headers: Record<string, string>): Promise<unknown> {
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
        headers,
      ),
    );
    return failureOf(sendMail(mail));
  }

  it("erfasst Status und Graph-Code", async () => {
    const error = await graphFailure({});
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("GRAPH");
    expect(entry.status).toBe(403);
    expect(entry.code).toBe("ErrorAccessDenied");
  });

  it("übernimmt eine gültige Request-ID", async () => {
    const error = await graphFailure({ "request-id": guid });
    logMailFailure(error, "register");

    expect(record().requestId).toBe(guid);
  });

  it("übernimmt die Request-ID auch aus x-ms-request-id", async () => {
    const error = await graphFailure({ "x-ms-request-id": guid });
    logMailFailure(error, "register");

    expect(record().requestId).toBe(guid);
  });

  it("verwirft eine ungültige Request-ID", async () => {
    const error = await graphFailure({ "request-id": "bad id!/../../etc/passwd" });
    logMailFailure(error, "register");

    expect(record().requestId).toBeNull();
  });

  it("verwirft eine überlange Request-ID", async () => {
    const error = await graphFailure({ "request-id": "a".repeat(200) });
    logMailFailure(error, "register");

    expect(record().requestId).toBeNull();
  });

  it("protokolliert den Graph-Fehlertext nicht", async () => {
    const error = await graphFailure({});
    logMailFailure(error, "register");
    record();

    expect(lines[0]).not.toContain("Access to OData");
    expect(lines[0]).not.toContain("frank@schoenau-it.de");
  });
});

describe("NETWORK", () => {
  it("bleibt nach der Umwandlung als Netzwerkfehler erkennbar", async () => {
    stubFetch(new TypeError("fetch failed"));

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("NETWORK");
    expect(entry.cause).toBe("TypeError");
    expect(lines[0]).not.toContain("fetch failed");
  });

  it("erkennt einen Timeout als zulässigen Cause-Wert", async () => {
    stubFetch(new DOMException("The operation was aborted due to timeout", "TimeoutError"));

    const error = await failureOf(sendMail(mail));
    logMailFailure(error, "register");

    const entry = record();
    expect(entry.reason).toBe("NETWORK");
    expect(entry.cause).toBe("TimeoutError");
  });
});

describe("INPUT und Unbekanntes", () => {
  it("meldet einen ungültigen Empfänger als INPUT", async () => {
    const fetchMock = stubFetch();

    const error = await failureOf(sendMail({ ...mail, to: "keine-adresse" }));
    logMailFailure(error, "register");

    expect(record().reason).toBe("INPUT");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gibt bei einem fremden Fehler keine freie Meldung aus", async () => {
    logMailFailure(new Error("Datenbank weg, Passwort im Text"), "register");

    const entry = record();
    expect(entry.reason).toBe("UNKNOWN");
    expect(entry.message).toBe("UNEXPECTED_ERROR");
    expect(lines[0]).not.toContain("Datenbank weg");
  });
});

describe("Querschnitt", () => {
  it("enthält in keiner Diagnosezeile eine Adresse oder ein Secret", async () => {
    const cases: Array<() => Promise<unknown>> = [
      async () => {
        delete process.env.MS_CLIENT_ID;
        return failureOf(sendMail(mail));
      },
      async () => {
        stubFetch(jsonResponse({ error: "invalid_client", error_codes: [7000215] }, 401));
        return failureOf(sendMail(mail));
      },
      async () => {
        stubFetch(tokenResponse(), jsonResponse({ error: { code: "ErrorAccessDenied" } }, 403));
        return failureOf(sendMail(mail));
      },
      async () => {
        stubFetch(new TypeError("fetch failed"));
        return failureOf(sendMail(mail));
      },
    ];

    for (const scenario of cases) {
      lines = [];
      resetMailState();
      process.env.MS_CLIENT_ID = CLIENT;
      logMailFailure(await scenario(), "register");
      record();
      expect(lines[0]).not.toContain("@");
      expect(lines[0]).not.toContain(SECRET);
      expect(lines[0]).not.toContain("Bearer");
    }
  });

  it("schreibt bei erfolgreichem Versand keine Zeile", async () => {
    stubFetch(tokenResponse(), jsonResponse(null, 202));

    await sendMail(mail);

    expect(lines).toHaveLength(0);
  });
});
