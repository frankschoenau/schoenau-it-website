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
