/**
 * Gespeicherte Checks eines Kontos — über die zentrale API.
 *
 * Die frühere Fassung dieser Datei sprach direkt mit PostgreSQL. Seit
 * AP-04.25 gibt es hier keine Datenbank mehr: alle Aufrufe gehen über
 * `src/lib/api/checks.ts`. `result` bleibt ein Schnappschuss des Ergebnisses,
 * das der Kunde gesehen hat.
 *
 * Die Signaturen sind unverändert, damit die Seiten (`/health-check/assess`,
 * `/meine-checks`, `/ergebnis/[id]`) nicht angepasst werden müssen.
 */

import {
  createCheck as apiCreateCheck,
  deleteCheck as apiDeleteCheck,
  getCheck as apiGetCheck,
  listChecks as apiListChecks,
  type CheckSummary,
  type StoredCheck,
} from "@/lib/api/checks";
import type { AssessmentResult } from "./result";

export type { CheckSummary, StoredCheck };

export async function createCheck(accountId: string, result: AssessmentResult): Promise<string> {
  return apiCreateCheck(accountId, result);
}

export async function listChecks(accountId: string): Promise<CheckSummary[]> {
  return apiListChecks(accountId);
}

/** Ein Check, aber nur der eigene: die API prüft Konto und Tenant. */
export async function getCheck(accountId: string, checkId: string): Promise<StoredCheck | null> {
  return apiGetCheck(accountId, checkId);
}

export async function deleteCheck(accountId: string, checkId: string) {
  return apiDeleteCheck(accountId, checkId);
}
