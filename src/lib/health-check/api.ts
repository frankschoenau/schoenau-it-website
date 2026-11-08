import { mintUserAssertion } from "@/lib/api/server";

/**
 * Zugang zur Analyse-API. Nur serverseitig.
 *
 * Das Token ist ein Inhaber-Token ohne Ablauf. Es steht in der Umgebung des
 * Servers und wird hier an jede Anfrage gehängt — nie an den Browser.
 */

export interface ApiConfig {
  base: string;
  token: string;
  tenant: string;
}

export function apiConfig(): ApiConfig | null {
  const base = process.env.AAHC_API_BASE_URL?.replace(/\/+$/, "");
  const token = process.env.AAHC_API_TOKEN;
  const tenant = process.env.AAHC_TENANT_REF;
  if (!base || !token || !tenant) return null;
  return { base, token, tenant };
}

export function apiHeaders(config: ApiConfig, extra?: Record<string, string>): Headers {
  const headers = new Headers({
    authorization: `Bearer ${config.token}`,
    "x-tenant-ref": config.tenant,
    accept: "application/json",
  });
  for (const [name, value] of Object.entries(extra ?? {})) headers.set(name, value);
  return headers;
}

/**
 * Kopfzeilen für Aufrufe im Namen eines angemeldeten Kunden (AP-04.32).
 *
 * Hier steht **kein** `x-tenant-ref`: der Mandant ist keine Eigenschaft des
 * Aufrufs, sondern des Kontos. Die API liest ihn aus `web.account`, sobald eine
 * gültige Benutzerassertion vorliegt (api_v1.py `_resolve_tenant`). Ein
 * mitgeschickter Fremdwert würde abgewiesen — deshalb wird er gar nicht erst
 * gesetzt, auch nicht als Rückfall.
 */
export function accountHeaders(
  config: ApiConfig,
  accountId: string,
  extra?: Record<string, string>,
): Headers {
  const headers = new Headers({
    authorization: `Bearer ${config.token}`,
    accept: "application/json",
    "x-user-assertion": mintUserAssertion(accountId),
  });
  for (const [name, value] of Object.entries(extra ?? {})) headers.set(name, value);
  return headers;
}

/**
 * Legt ein Assessment im Namen des angemeldeten Kunden an.
 *
 * Eigene Funktion, damit der Ablauf testbar ist, ohne eine Next-Route zu
 * starten: dieselbe Kopfzeilenlogik, die auch der Route Handler benutzt.
 */
export function postAssessment(
  config: ApiConfig,
  accountId: string,
  body: unknown,
  idempotencyKey: string,
  timeoutMs = 120_000,
): Promise<Response> {
  return fetch(`${config.base}/api/v1/assessments`, {
    method: "POST",
    headers: accountHeaders(config, accountId, {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}
