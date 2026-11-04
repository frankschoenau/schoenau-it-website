import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { currentAccount } from "@/lib/auth/session";
import { apiConfig, apiHeaders } from "@/lib/health-check/api";
import { buildAssessmentRequest, type Answers, type Economic } from "@/lib/health-check/questionnaire";
import { createCheck } from "@/lib/health-check/checks";
import type { AssessmentResult } from "@/lib/health-check/result";

/**
 * Nimmt die Antworten des Dialogs entgegen, laesst sie bewerten und legt das
 * Ergebnis am Konto ab.
 *
 * Der Browser schickt nur Antworten. Den Anfragekoerper baut der Server aus
 * dem Fragebogenmodul — dieselbe Funktion, die auch die Tests benutzen, damit
 * es keine zweite Uebersetzung gibt.
 */

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 120_000;

export async function POST(request: Request): Promise<Response> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ ok: false, code: "SIGN_IN_REQUIRED" }, { status: 401 });
  }
  if (account.emailVerifiedAt === null) {
    return NextResponse.json({ ok: false, code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  }

  const config = apiConfig();
  if (!config) {
    return NextResponse.json({ ok: false, code: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  let payload: { answers?: Answers; economic?: Economic };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const answers = payload.answers;
  const economic = payload.economic;
  if (!answers || typeof answers !== "object" || !economic || typeof economic !== "object") {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const assessmentId = randomUUID();
  const body = buildAssessmentRequest(answers, economic, {
    assessmentId,
    processId: randomUUID(),
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${config.base}/api/v1/assessments`, {
      method: "POST",
      headers: apiHeaders(config, {
        "content-type": "application/json",
        "idempotency-key": assessmentId,
      }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json({ ok: false, code: "API_UNREACHABLE" }, { status: 502 });
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
    return NextResponse.json({ ok: false, code }, { status: upstream.status });
  }

  const envelope = (await upstream.json()) as { result?: AssessmentResult };
  if (!envelope.result) {
    return NextResponse.json({ ok: false, code: "API_EMPTY_RESULT" }, { status: 502 });
  }

  const checkId = await createCheck(account.id, envelope.result);
  return NextResponse.json({ ok: true, checkId });
}
