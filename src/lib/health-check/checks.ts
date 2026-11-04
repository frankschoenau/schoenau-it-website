import { pool } from "@/lib/db";
import type { AssessmentResult } from "./result";

/**
 * Gespeicherte Checks eines Kontos.
 *
 * `result` ist ein Schnappschuss des Ergebnisses, nicht eine neu berechnete
 * Zahl. Der Kunde soll später dasselbe sehen, was er beim Abschluss gesehen
 * hat — auch wenn die Engine zwischenzeitlich anders rechnet.
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
  result: AssessmentResult;
}

export async function createCheck(
  accountId: string,
  result: AssessmentResult,
): Promise<string> {
  const inserted = await pool().query<{ id: string }>(
    `INSERT INTO web.check (account_id, assessment_id, process_id, process_name, result)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [accountId, result.assessment_id, result.process_id, result.process_name, JSON.stringify(result)],
  );
  return inserted.rows[0].id;
}

export async function listChecks(accountId: string): Promise<CheckSummary[]> {
  const rows = await pool().query<{
    id: string;
    process_name: string;
    created_at: Date;
    result: AssessmentResult;
  }>(
    `SELECT id, process_name, created_at, result
       FROM web.check
      WHERE account_id = $1
      ORDER BY created_at DESC`,
    [accountId],
  );

  return rows.rows.map((row) => ({
    id: row.id,
    processName: row.process_name,
    createdAt: row.created_at,
    priority: row.result.decision?.priority ?? "",
    annualNetEffect:
      row.result.economics?.scenarios?.[row.result.economics.primary_scenario]?.annual_net_effect ?? 0,
  }));
}

/** Ein Check, aber nur der eigene: die Kontokennung steht in der Abfrage. */
export async function getCheck(accountId: string, checkId: string): Promise<StoredCheck | null> {
  // Eine ungültige UUID ist kein Fehler, sondern ein Nicht-Treffer.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkId)) {
    return null;
  }

  const rows = await pool().query<{
    id: string;
    assessment_id: string;
    process_name: string;
    created_at: Date;
    result: AssessmentResult;
  }>(
    `SELECT id, assessment_id, process_name, created_at, result
       FROM web.check
      WHERE account_id = $1 AND id = $2
      LIMIT 1`,
    [accountId, checkId],
  );

  const row = rows.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    assessmentId: row.assessment_id,
    processName: row.process_name,
    createdAt: row.created_at,
    result: row.result,
  };
}
