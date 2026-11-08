/**
 * Mailversand über Microsoft Graph (AP-04.46).
 *
 * Ablauf: OAuth 2.0 Client Credentials gegen den Mandanten, danach
 * `POST /v1.0/users/{absender}/sendMail`. Es gibt genau einen Absender,
 * `noreply@schoenau-it.de`; die Exchange-Application-RBAC ist auf dieses
 * Postfach eingeschränkt, und diese Datei prüft dieselbe Grenze ein zweites
 * Mal, bevor sie sendet.
 *
 * Grundsätze:
 * - Nur serverseitig. Gelesen werden ausschließlich `MS_TENANT_ID`,
 *   `MS_CLIENT_ID`, `MS_CLIENT_SECRET` und `MAIL_FROM`; kein `NEXT_PUBLIC_`.
 * - Kein SMTP: es gibt keinen Zweitweg, der die RBAC-Grenze umgeht.
 * - Nichts Geheimes wird protokolliert: kein Secret, kein Access-Token, kein
 *   Bestätigungstoken, kein Mailtext. Fehler tragen nur eine Einordnung,
 *   einen HTTP-Status und einen Graph-Fehlercode.
 * - Kein stiller Erfolg: ohne gültige Konfiguration oder bei einem Fehler von
 *   OAuth bzw. Graph wirft `sendMail`. Der Aufrufer kann also nicht glauben,
 *   es sei etwas verschickt worden.
 */

export const MAIL_SENDER = "noreply@schoenau-it.de";

const LOGIN_ROOT = "https://login.microsoftonline.com";
const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

const TOKEN_TIMEOUT_MS = 10_000;
const SEND_TIMEOUT_MS = 15_000;

/** Ein Access-Token wird kurz vor Ablauf nicht mehr benutzt. */
const TOKEN_SAFETY_MS = 60_000;
const TOKEN_FALLBACK_MS = 60 * 60 * 1000;

export type MailErrorReason =
  /** Umgebungsvariablen fehlen oder der Absender ist nicht erlaubt. */
  | "CONFIG"
  /** Die übergebene Mail ist unbrauchbar (z. B. leere Empfängeradresse). */
  | "INPUT"
  /** Der Token-Endpunkt hat abgelehnt oder kein Token geliefert. */
  | "OAUTH"
  /** Graph hat den Versand abgelehnt. */
  | "GRAPH"
  /** Der Endpunkt war nicht erreichbar. */
  | "NETWORK";

/**
 * Fehler des Mailversands. `message` ist bewusst ein kurzer, stabiler Code mit
 * Variablennamen — nie ein Antwortkörper, nie ein Secret.
 */
export class MailError extends Error {
  readonly reason: MailErrorReason;
  readonly status: number | null;
  readonly code: string | null;
  /** Standardisierter AADSTS-Code aus `error_codes`, z. B. 7000215. */
  readonly aadsts: number | null;
  /** Graph-Request-ID für den Supportfall, nur nach Prüfung übernommen. */
  readonly requestId: string | null;

  constructor(
    reason: MailErrorReason,
    message: string,
    options: {
      status?: number;
      code?: string | null;
      aadsts?: number | null;
      requestId?: string | null;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "MailError";
    this.reason = reason;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.aadsts = options.aadsts ?? null;
    this.requestId = options.requestId ?? null;
  }
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface MailConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  sender: string;
}

/**
 * Liest die Konfiguration. Fehlende Variablen werden **mit Namen** gemeldet,
 * damit der Betrieb den Fehler findet, ohne dass ein Wert im Log landet.
 */
export function readMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const missing = ["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET"].filter(
    (name) => !env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new MailError("CONFIG", `MAIL_CONFIG_MISSING:${missing.join(",")}`);
  }

  // Ein abweichender Absender ist kein Konfigurationsdetail, sondern ein
  // Fehler: Die RBAC-Rolle gilt nur für dieses eine Postfach.
  const sender = (env.MAIL_FROM?.trim() || MAIL_SENDER).toLowerCase();
  if (sender !== MAIL_SENDER) {
    throw new MailError("CONFIG", "MAIL_SENDER_NOT_ALLOWED");
  }

  return {
    tenantId: (env.MS_TENANT_ID as string).trim(),
    clientId: (env.MS_CLIENT_ID as string).trim(),
    clientSecret: (env.MS_CLIENT_SECRET as string).trim(),
    sender,
  };
}

/** Für Statusanzeigen — prüft, ohne zu werfen und ohne etwas zu senden. */
export function isMailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    readMailConfig(env);
    return true;
  } catch {
    return false;
  }
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
  /** Mandant und Client: wechseln die Zugangsdaten, ist der Cache ungültig. */
  key: string;
}

let cachedToken: CachedToken | null = null;

/** Nur für Tests: setzt den Token-Cache zurück. */
export function resetMailState(): void {
  cachedToken = null;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Ein Fehlercode aus einer Fremdantwort ist nur brauchbar, wenn er wie einer
 * aussieht. Alles andere — Fließtext, Beschreibungen, Adressen — wird
 * verworfen, damit keine fremde Fehlermeldung ins Log wandert.
 */
function safeCode(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value) ? value : null;
}

/**
 * AADSTS-Code aus `error_codes`. Nur positive, plausible Ganzzahlen; alles
 * andere — auch Fließtext — wird verworfen.
 */
function safeAadsts(value: unknown): number | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (
      typeof entry === "number" &&
      Number.isInteger(entry) &&
      entry > 0 &&
      entry < 10_000_000
    ) {
      return entry;
    }
  }
  return null;
}

/**
 * Graph-Request-ID. Die Kopfzeile ist ein Fremdwert und wird deshalb nur
 * übernommen, wenn sie wie eine Kennung aussieht: 8 bis 64 Zeichen aus
 * Buchstaben, Ziffern, Punkt, Unterstrich und Bindestrich.
 */
function safeRequestId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9._-]{7,63}$/.test(trimmed) ? trimmed : null;
}

async function requestToken(config: MailConfig): Promise<string> {
  const url = `${LOGIN_ROOT}/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials",
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new MailError("NETWORK", "MAIL_OAUTH_UNREACHABLE", { cause });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    // `error` ist ein kurzer OAuth-Code (invalid_client, invalid_scope …).
    // `error_description` enthält teils Mandanten- und App-Interna und wird
    // deshalb nicht übernommen.
    throw new MailError("OAUTH", "MAIL_OAUTH_REJECTED", {
      status: response.status,
      code: safeCode(payload?.error),
      aadsts: safeAadsts(payload?.error_codes),
    });
  }

  const accessToken = typeof payload?.access_token === "string" ? payload.access_token : "";
  if (!accessToken) {
    throw new MailError("OAUTH", "MAIL_OAUTH_NO_TOKEN", { status: response.status });
  }

  const expiresIn = Number(payload?.expires_in);
  const lifetimeMs =
    Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : TOKEN_FALLBACK_MS;

  cachedToken = {
    accessToken,
    // Mindestens 30 s nutzbar, damit ein sehr kurzes `expires_in` nicht zu
    // einem Token führt, das schon beim Absenden abgelaufen ist.
    expiresAt: Date.now() + Math.max(lifetimeMs - TOKEN_SAFETY_MS, 30_000),
    key: `${config.tenantId}:${config.clientId}`,
  };

  return accessToken;
}

async function accessToken(config: MailConfig): Promise<string> {
  const key = `${config.tenantId}:${config.clientId}`;
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }
  return requestToken(config);
}

async function postMail(
  config: MailConfig,
  token: string,
  mail: Mail & { to: string },
): Promise<Response> {
  const url = `${GRAPH_ROOT}/users/${encodeURIComponent(config.sender)}/sendMail`;
  const payload = {
    message: {
      subject: mail.subject,
      body: { contentType: "Text", content: mail.text },
      toRecipients: [{ emailAddress: { address: mail.to } }],
    },
    // Kein Ablagefach im Postfach des Absenders: Die Anwendung ist kein
    // Mitarbeiter, und das Postfach soll nicht zum Archiv werden.
    saveToSentItems: false,
  };

  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new MailError("NETWORK", "MAIL_SEND_UNREACHABLE", { cause });
  }
}

/**
 * Versendet eine Textmail. Löst bei jedem Fehlschlag `MailError` aus; es gibt
 * keinen Rückgabewert, der als Erfolg gedeutet werden könnte.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const recipient = mail.to.trim();
  if (!recipient.includes("@")) {
    throw new MailError("INPUT", "MAIL_RECIPIENT_INVALID");
  }

  const config = readMailConfig();
  let token = await accessToken(config);
  let response = await postMail(config, token, { ...mail, to: recipient });

  // Ein abgelehntes Token ist kein Versandfehler: einmal mit frischem Token
  // wiederholen. Der erste Aufruf hat nichts zugestellt, doppelte Mails sind
  // damit ausgeschlossen.
  if (response.status === 401) {
    cachedToken = null;
    token = await accessToken(config);
    response = await postMail(config, token, { ...mail, to: recipient });
  }

  if (response.status >= 200 && response.status < 300) return;

  const payload = await readJson(response);
  const graphError = payload?.error;
  const code =
    typeof graphError === "object" && graphError !== null
      ? safeCode((graphError as { code?: unknown }).code)
      : null;
  const requestId = safeRequestId(
    response.headers.get("request-id") ?? response.headers.get("x-ms-request-id"),
  );

  throw new MailError("GRAPH", "MAIL_SEND_REJECTED", { status: response.status, code, requestId });
}

/**
 * Genau eine Diagnosezeile je fehlgeschlagenem Versand.
 *
 * Bewusst eng: keine Empfängeradresse, kein Betreff, kein Inhalt, kein Link,
 * kein Token, kein Secret. `message` ist ausschließlich der von uns gesetzte
 * Stabilcode; bei CONFIG nennt er höchstens Variablennamen. `code`, `aadsts`
 * und `requestId` sind bereits validiert, `cause` stammt aus einer festen
 * Liste. Die Funktion darf den Ablauf nicht verändern — deshalb fängt sie
 * eigene Fehler ab.
 */
export function logMailFailure(error: unknown, context: string): void {
  try {
    const mailError = error instanceof MailError ? error : null;
    const cause = (mailError?.cause ?? (error as { cause?: unknown } | null)?.cause) as
      | { name?: unknown }
      | undefined;
    const causeName = cause?.name;

    const record = {
      event: "mail_send_failed",
      context: /^[a-z][a-z0-9_-]{0,31}$/.test(context) ? context : "unknown",
      reason: mailError?.reason ?? "UNKNOWN",
      message: mailError?.message ?? "UNEXPECTED_ERROR",
      status: mailError?.status ?? null,
      code: mailError?.code ?? null,
      aadsts: mailError?.aadsts ?? null,
      requestId: mailError?.requestId ? safeRequestId(mailError.requestId) : null,
      cause:
        typeof causeName === "string" &&
        ["TypeError", "TimeoutError", "AbortError"].includes(causeName)
          ? causeName
          : null,
    };

    console.error(`[mail-diag] ${JSON.stringify(record)}`);
  } catch {
    // Eine Diagnosezeile darf den Versandpfad nie zum Absturz bringen.
  }
}
