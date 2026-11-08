import { apiRequest, type ApiResult } from "./server";

/**
 * Identität über die Python-API. Die Website hält keine Kontendatenbank mehr.
 *
 * Alle Antworten mit Token sind Server-Antworten; sie werden nie an den
 * Browser gegeben (das Sitzungstoken liegt in einem HttpOnly-Cookie, die
 * Bestätigungs- und Reset-Token bleiben im Serverprozess).
 */

export interface RegisterResult {
  account_id: string;
  confirm_token: string;
  status: string;
}

export interface LoginResult {
  session_token: string;
  account_id: string;
  expires_at: string;
}

export interface SessionResult {
  account_id: string;
  email: string;
  role: string;
  status: string;
}

export function register(
  email: string,
  password: string,
  company?: string | null,
): Promise<ApiResult<RegisterResult>> {
  return apiRequest<RegisterResult>("/api/v1/identity/register", {
    method: "POST",
    body: { email, password, company: company ?? null },
  });
}

export function confirm(token: string): Promise<ApiResult<{ account_id: string; status: string }>> {
  return apiRequest("/api/v1/identity/confirm", { method: "POST", body: { token } });
}

export function login(email: string, password: string): Promise<ApiResult<LoginResult>> {
  return apiRequest<LoginResult>("/api/v1/identity/login", {
    method: "POST",
    body: { email, password },
  });
}

export function session(token: string): Promise<ApiResult<SessionResult>> {
  return apiRequest<SessionResult>("/api/v1/identity/session", { sessionToken: token });
}

export function logout(token: string): Promise<ApiResult<{ ok: boolean }>> {
  return apiRequest("/api/v1/identity/logout", { method: "POST", sessionToken: token });
}

export function forgetPassword(email: string): Promise<ApiResult<{ ok: boolean }>> {
  return apiRequest("/api/v1/identity/password/reset-request", {
    method: "POST",
    body: { email },
  });
}

export function deleteAccount(token: string): Promise<ApiResult<{ account_id: string; deleted: boolean }>> {
  return apiRequest("/api/v1/identity/account", { method: "DELETE", sessionToken: token });
}
