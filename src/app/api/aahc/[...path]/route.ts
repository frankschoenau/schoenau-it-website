/**
 * Serverseitiger Durchreicher zur AAHC-API.
 *
 * Warum es diese Route gibt
 * -------------------------
 * Der Browser darf weder das Token noch den Mandanten kennen. Beides ist eine
 * Eigenschaft des Aufrufers, nicht des Formulars: das Token ist ein
 * Inhaber-Token ohne Ablauf, und der Mandant ist eine Aussage darüber, für wen
 * gehandelt wird. Lägen sie im Browser, wären sie in jedem Bundle, in jedem
 * Entwicklerwerkzeug und in jedem Fehlerbericht.
 *
 * Diese Route tut deshalb genau zwei Dinge: sie prüft, dass der Pfad zu den
 * vorgesehenen Endpunkten gehört, und sie setzt `Authorization` und
 * `X-Tenant-Ref` selbst. Sie rechnet nichts. Kein Score, keine
 * Wirtschaftlichkeit, keine Empfehlung entsteht hier.
 *
 * Was bewusst NICHT passiert
 * --------------------------
 * - Kein Pfad wird umgeschrieben oder ergänzt. Die Verträge
 *   `AAHC-INPUT-0.1`, `AAHC-REPORT-REQUEST-0.1` und `AAHC-STORED-REPORT-0.1`
 *   gelten unverändert.
 * - Kein Antwortfeld wird umbenannt, ergänzt oder weggelassen. Die Antwort geht
 *   byteweise durch, damit das PDF unverändert bleibt.
 * - Keine Umgebungsvariable gelangt in eine ausgelieferte Datei. Es gibt kein
 *   `NEXT_PUBLIC_` in dieser Datei und darf keines geben.
 * - Kein Standardziel. Fehlt eine Pflichtangabe, antwortet die Route mit 503
 *   und nennt den fehlenden Namen — statt auf ein produktives System
 *   auszuweichen.
 */

import { apiConfig, apiHeaders } from "@/lib/health-check/api";
import { sessionState, type SessionAccount } from "@/lib/auth/session";
import { mintUserAssertion } from "@/lib/api/server";

export const dynamic = "force-dynamic";

/** Nur diese ersten Pfadsegmente werden durchgereicht. Alles andere ist 404. */
const ALLOWED_ROOTS = new Set(["health", "assessments", "analysis", "reports"]);

/**
 * Die Analyse kann ein Sprachmodell befragen; das dauert. 120 Sekunden sind
 * großzügig, aber nicht unbegrenzt — eine hängende Anfrage soll nicht ewig
 * einen Serverplatz halten.
 */
const UPSTREAM_TIMEOUT_MS = 120_000;

function config() {
  return apiConfig();
}

function jsonError(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function forward(request: Request, segments: string[]): Promise<Response> {
  if (segments.length === 0 || !ALLOWED_ROOTS.has(segments[0])) {
    return jsonError(404, "API_NOT_FOUND");
  }

  // `/health` bleibt offen: die Startseite prueft damit, ob die Analyse
  // erreichbar ist, und das muss auch vor der Anmeldung gehen. Alles andere
  // setzt ein Konto voraus — sonst waere der Durchreicher ein offener Zugang
  // zur API mit unserem Token.
  let account: SessionAccount | null = null;
  if (segments[0] !== "health") {
    // Ein Ausfall der API ist keine abgelaufene Sitzung (AP-04.32, M-3).
    const state = await sessionState();
    if (state.kind === "signed-out") return jsonError(401, "SIGN_IN_REQUIRED");
    if (state.kind === "forbidden") return jsonError(403, "ACCOUNT_BLOCKED");
    if (state.kind === "unavailable") return jsonError(503, "AAHC_API_UNREACHABLE");
    if (state.kind !== "signed-in") return jsonError(502, "AAHC_API_ERROR");
    account = state.account;
    if (account.emailVerifiedAt === null) return jsonError(403, "EMAIL_NOT_VERIFIED");
  }

  const cfg = config();
  if (!cfg) {
    // Der Name der fehlenden Angabe ist für den Betrieb bestimmt, nicht für
    // den Kunden. Nach außen bleibt es bei einem stabilen Code.
    return jsonError(503, "AAHC_PROXY_NOT_CONFIGURED");
  }

  // `/health` liegt an der Wurzel der API, alles andere unter `/api/v1`.
  const path = segments[0] === "health" ? "/health" : `/api/v1/${segments.join("/")}`;
  const target = `${cfg.base}${path}`;

  const headers = apiHeaders(cfg, { accept: request.headers.get("accept") ?? "*/*" });

  // Fuer Kundenaufrufe ersetzt die Benutzeridentitaet den statischen Mandanten:
  // die API loest den Tenant aus dem Konto auf, ein mitgeschickter Fremdwert
  // wuerde abgewiesen. Die Assertion entsteht nur nach der Sitzungspruefung und
  // verlaesst den Server nie.
  if (account) {
    headers.delete("x-tenant-ref");
    headers.set("x-user-assertion", mintUserAssertion(account.id));
  }

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // Der Idempotenzschlüssel ist Teil des Vertrags von POST /api/v1/assessments
  // und POST /api/v1/reports. Er wird unverändert weitergereicht; die Route
  // erfindet keinen.
  const idempotency = request.headers.get("idempotency-key");
  if (idempotency) headers.set("idempotency-key", idempotency);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return jsonError(timedOut ? 504 : 502, timedOut ? "AAHC_UPSTREAM_TIMEOUT" : "AAHC_UPSTREAM_UNREACHABLE");
  }

  // Byteweise durchreichen: das PDF darf nicht durch eine Textkodierung gehen.
  const payload = await upstream.arrayBuffer();

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  responseHeaders.set("cache-control", "no-store");

  const disposition = upstream.headers.get("content-disposition");
  if (disposition) responseHeaders.set("content-disposition", disposition);

  // `set-cookie` wird bewusst nicht weitergereicht: die API setzt keine Cookies
  // für den Browser, und ein durchgereichtes Cookie wäre ein Cookie der API.
  return new Response(payload, { status: upstream.status, headers: responseHeaders });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Context): Promise<Response> {
  const { path } = await ctx.params;
  return forward(request, path ?? []);
}

export async function POST(request: Request, ctx: Context): Promise<Response> {
  const { path } = await ctx.params;
  return forward(request, path ?? []);
}
