import { NextResponse } from "next/server";

import { sessionState } from "@/lib/auth/session";
import { apiConfig, postAssessment } from "@/lib/health-check/api";
import { buildAssessmentRequest, type Answers, type Economic } from "@/lib/health-check/questionnaire";
import { isSubmissionId, newSubmissionId } from "@/lib/health-check/submission";
import { deriveProcessId } from "@/lib/health-check/process-id";
import { createCheck } from "@/lib/health-check/checks";
import { ApiError, classifyApiFailure } from "@/lib/api/errors";
import type { AssessmentResult } from "@/lib/health-check/result";

/**
 * Nimmt die Antworten des Dialogs entgegen, laesst sie bewerten und legt das
 * Ergebnis am Konto ab.
 *
 * Der Browser schickt nur Antworten. Den Anfragekoerper baut der Server aus
 * dem Fragebogenmodul — dieselbe Funktion, die auch die Tests benutzen, damit
 * es keine zweite Uebersetzung gibt.
 *
 * Mandant (AP-04.31 B-1, korrigiert in AP-04.32): Der Aufruf traegt die
 * Benutzerassertion der geprueften Sitzung und **keinen** `X-Tenant-Ref`. Die
 * API liest den Mandanten dann aus `web.account` — derselbe Mandant, unter dem
 * anschliessend auch der Check gespeichert wird.
 */

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 120_000;

function fail(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, code, ...extra }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const state = await sessionState();

  if (state.kind === "unavailable") {
    // Die API antwortet nicht. Das ist kein Grund, den Kunden abzumelden.
    return fail("API_UNREACHABLE", 503);
  }
  if (state.kind === "error") {
    return fail("API_ERROR", 502);
  }
  if (state.kind === "forbidden") {
    return fail("ACCOUNT_BLOCKED", 403);
  }
  if (state.kind === "signed-out") {
    return fail("SIGN_IN_REQUIRED", 401);
  }

  const account = state.account;
  if (account.emailVerifiedAt === null) {
    return fail("EMAIL_NOT_VERIFIED", 403);
  }

  const config = apiConfig();
  if (!config) {
    return fail("API_NOT_CONFIGURED", 503);
  }

  let payload: { answers?: Answers; economic?: Economic; submissionId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return fail("INVALID_BODY", 400);
  }

  const answers = payload.answers;
  const economic = payload.economic;
  if (!answers || typeof answers !== "object" || !economic || typeof economic !== "object") {
    return fail("INVALID_BODY", 400);
  }

  // Vorgangs-ID (AP-04.34): Sie ist der Schluessel, an dem die API eine
  // Wiederholung erkennt, und zugleich die fachliche Assessment-ID. Fehlt sie
  // (aeltere Clients), entsteht eine neue — das Verhalten bleibt dann wie vor
  // der Aenderung. Eine vorhandene, aber unbrauchbare ID wird abgewiesen und
  // nicht stillschweigend ersetzt.
  const roheId = payload.submissionId;
  let submissionId: string;
  if (roheId === undefined || roheId === null || roheId === "") {
    submissionId = newSubmissionId();
  } else if (!isSubmissionId(roheId)) {
    return fail("INVALID_BODY", 400);
  } else {
    submissionId = roheId;
  }

  // Prozess-ID deterministisch aus der Vorgangs-ID: bei einer Wiederholung
  // entsteht derselbe Payload, sonst koennte die API sie nicht als solche
  // erkennen (input_payload_hash).
  const body = buildAssessmentRequest(answers, economic, {
    assessmentId: submissionId,
    processId: deriveProcessId(submissionId),
  });

  let upstream: Response;
  try {
    // Kein x-tenant-ref: der Mandant kommt aus dem angemeldeten Konto.
    upstream = await postAssessment(config, account.id, body, submissionId, TIMEOUT_MS);
  } catch {
    return fail("API_UNREACHABLE", 503);
  }

  if (!upstream.ok) {
    // Den Code der API weiterreichen: er ist stabil und die Oberflaeche kann
    // ihn uebersetzen. Den Text der API nicht — der ist fuer den Betrieb.
    let code = `API_${upstream.status}`;
    try {
      const error = (await upstream.json()) as { error?: string };
      if (typeof error.error === "string") code = error.error;
    } catch {
      /* Antwort ohne JSON: der Statuscode bleibt. */
    }
    const failure = classifyApiFailure(upstream.status, code);
    return fail(code, upstream.status, { kind: failure.kind, retryable: failure.retryable });
  }

  const envelope = (await upstream.json()) as { result?: AssessmentResult };
  if (!envelope.result) {
    return fail("API_EMPTY_RESULT", 502);
  }

  // Die Bewertung steht. Scheitert das Speichern des Checks, wird sie nicht
  // verworfen und nichts geloescht: der Vorgang bleibt ueber die Assessment-ID
  // nachvollziehbar. Ein zweiter Versuch ist gefahrlos, weil die API denselben
  // Check ueber den Unique-Constraint (Konto, Assessment) erkennt.
  let checkId: string | null = null;
  let letzterFehler: ApiError | null = null;
  for (let versuch = 0; versuch < 2 && checkId === null; versuch += 1) {
    try {
      checkId = await createCheck(account.id, envelope.result);
    } catch (error) {
      letzterFehler = error instanceof ApiError ? error : null;
    }
  }

  if (checkId === null) {
    const failure = letzterFehler?.failure ?? classifyApiFailure(502, null);
    return fail("CHECK_NOT_SAVED", 502, {
      // Die Vorgangs-ID ist zugleich die Assessment-ID; der Client kann den
      // Speicherversuch damit spaeter wiederholen.
      assessmentId: submissionId,
      kind: failure.kind,
      retryable: true,
    });
  }

  return NextResponse.json({ ok: true, checkId });
}
