import { apiRequest, mintUserAssertion } from "./server";
import { ApiError, classifyApiFailure, conflictMessage } from "./errors";

/**
 * Gespeicherte Checks (AP-04.25).
 *
 * Alle Zugriffe laufen über die zentrale API; die Website kennt keine
 * Check-Tabelle und keine Datenbankverbindung. Die Benutzeridentität wird aus
 * der Sitzung abgeleitet (die aufrufende Seite übergibt die Konto-ID aus
 * `currentAccount()`), der Mandant entsteht ausschließlich in der API.
 */

export interface CheckSummary {
  id: string;
  processName: string;
  createdAt: Date;
  priority: string;
  annualNetEffect: number;
}

export interface StoredCheck {
  id: string;
  assessmentId: string;
  processName: string;
  createdAt: Date;
  result: unknown;
}

interface ApiCheckSummary {
  id: string;
  process_name: string;
  created_at: string;
  priority: string;
  annual_net_effect: number;
}

interface ApiCheck {
  id: string;
  assessment_id: string;
  process_name: string;
  created_at: string;
  result: unknown;
}

export async function createCheck(accountId: string, result: unknown): Promise<string> {
  const response = await apiRequest<{ id: string; created: boolean }>("/api/v1/checks", {
    method: "POST",
    body: { result },
    userAssertion: mintUserAssertion(accountId),
  });
  if (!response.ok || !response.data) {
    throw new ApiError(classifyApiFailure(response.status, response.code));
  }
  // `created` wird bewusst nicht ausgewertet: ein zweiter Aufruf für dasselbe
  // Assessment liefert dieselbe ID (Unique-Constraint der API, AP-04.31).
  return response.data.id;
}

export async function listChecks(accountId: string): Promise<CheckSummary[]> {
  const response = await apiRequest<{ checks: ApiCheckSummary[] }>("/api/v1/checks", {
    userAssertion: mintUserAssertion(accountId),
  });
  if (!response.ok || !response.data) {
    throw new ApiError(classifyApiFailure(response.status, response.code));
  }
  return response.data.checks.map((row) => ({
    id: row.id,
    processName: row.process_name,
    createdAt: new Date(row.created_at),
    priority: row.priority,
    annualNetEffect: row.annual_net_effect,
  }));
}

export async function getCheck(accountId: string, checkId: string): Promise<StoredCheck | null> {
  const response = await apiRequest<{ check: ApiCheck }>(`/api/v1/checks/${encodeURIComponent(checkId)}`, {
    userAssertion: mintUserAssertion(accountId),
  });
  // 404 heißt hier: fremd oder unbekannt — beides ergibt dieselbe Antwort.
  if (response.status === 404) return null;
  if (!response.ok || !response.data) {
    throw new ApiError(classifyApiFailure(response.status, response.code));
  }
  const row = response.data.check;
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    processName: row.process_name,
    createdAt: new Date(row.created_at),
    result: row.result,
  };
}

/**
 * Löschen ist in der API derzeit kontrolliert gesperrt (S-3 offen, Zahlungen
 * bleiben). Die Website bietet es deshalb nicht an; die Funktion existiert nur
 * für einen späteren, dann freigegebenen Weg.
 */
export async function deleteCheck(
  accountId: string,
  checkId: string,
): Promise<{ ok: boolean; code: string | null; message: string | null }> {
  const response = await apiRequest(`/api/v1/checks/${encodeURIComponent(checkId)}`, {
    method: "DELETE",
    userAssertion: mintUserAssertion(accountId),
  });
  if (response.ok) return { ok: true, code: null, message: null };
  const failure = classifyApiFailure(response.status, response.code);
  return {
    ok: false,
    code: response.code,
    message: failure.kind === "conflict" ? conflictMessage(response.code) : failure.message,
  };
}
