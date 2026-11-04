import { createHmac, randomUUID } from "node:crypto";

/**
 * Zentraler Zugang zur AAHC-API. Nur serverseitig.
 *
 * Diese Datei ist die einzige Stelle, die Basisadresse, Dienst-Credential und
 * Identitätsgeheimnis liest. Alle Aufrufe der Website laufen hier durch, damit
 * Timeouts, Fehlercodes und Kopfzeilen an einer Stelle stehen.
 *
 * Nicht in dieser Datei: Protokollierung von Kopfzeilen oder Antworten.
 * Dienst-Token, Sitzungstoken und Benutzerassertion dürfen nie in ein Log.
 */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  code: string | null;
}

export class ApiConfigError extends Error {
  constructor(missing: string) {
    super(`API-Konfiguration unvollständig: ${missing}`);
    this.name = "ApiConfigError";
  }
}

function baseUrl(): string {
  const value = process.env.AAHC_API_BASE_URL?.replace(/\/+$/, "");
  if (!value) throw new ApiConfigError("AAHC_API_BASE_URL");
  return value;
}

function serviceToken(): string {
  const value = process.env.AAHC_API_TOKEN;
  if (!value) throw new ApiConfigError("AAHC_API_TOKEN");
  return value;
}

export function apiConfigured(): boolean {
  return Boolean(process.env.AAHC_API_BASE_URL && process.env.AAHC_API_TOKEN);
}

/**
 * Kurzlebige Benutzerassertion (HS256, 60 s) für genau eine Anfrage.
 *
 * Wird ausschließlich nach einer serverseitigen Sitzungsprüfung erzeugt und
 * niemals an den Browser gegeben. Der Mandant steht nicht im Token; die API
 * liest ihn aus `web.account`.
 */
export function mintUserAssertion(accountId: string): string {
  const secret = process.env.AAHC_IDENTITY_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new ApiConfigError("AAHC_IDENTITY_SECRET");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: accountId,
    iss: process.env.AAHC_IDENTITY_ISSUER ?? "aahc-web",
    aud: process.env.AAHC_IDENTITY_AUDIENCE ?? "aahc-api",
    iat: now,
    exp: now + 60,
    jti: randomUUID(),
  };
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH";
  body?: unknown;
  /** Sitzungstoken des angemeldeten Kunden (Kopf `X-Session-Token`). */
  sessionToken?: string;
  /** Benutzerassertion für Kundenaufrufe; wird sonst nicht gesetzt. */
  userAssertion?: string;
  timeoutMs?: number;
}

/**
 * Ein Aufruf an die API. Keine Wiederholung: ein nicht idempotenter Schreib-
 * vorgang darf nicht durch einen automatischen Retry doppelt passieren.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceToken()}`,
    Accept: "application/json",
  };
  if (options.sessionToken) headers["X-Session-Token"] = options.sessionToken;
  if (options.userAssertion) headers["X-User-Assertion"] = options.userAssertion;

  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
  } catch {
    return { ok: false, status: 504, data: null, code: "API_UNREACHABLE" };
  }

  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }
  const code =
    data && typeof data === "object" && "error" in data
      ? String((data as { error?: unknown }).error ?? "")
      : null;

  return {
    ok: response.ok,
    status: response.status,
    data,
    code: code || (response.ok ? null : `API_HTTP_${response.status}`),
  };
}
