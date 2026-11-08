import { NextResponse } from "next/server";
import {
  register,
  login,
  verifyEmail,
  deleteAccount,
  resendConfirmation,
  normalizeEmail,
  looksLikeEmail,
  type AuthCode,
} from "@/lib/auth/accounts";
import { destroySession, sessionState } from "@/lib/auth/session";
import { hit, type RateLimitRule } from "@/lib/auth/rate-limit";

/**
 * Kontostrecke: registrieren, anmelden, abmelden, bestätigen, löschen.
 *
 * Eine Route statt fünf, weil alle fünf dasselbe Format sprechen und dieselbe
 * Fehlerbehandlung brauchen. Was sie unterscheidet, ist der Name im Pfad.
 *
 * Die Route gibt stabile Codes zurück, keine deutschen Sätze: die Formulierung
 * gehört in die Oberfläche, sonst gibt es zwei Wahrheiten über denselben Fehler.
 */

export const dynamic = "force-dynamic";

const STATUS: Record<AuthCode, number> = {
  INVALID_EMAIL: 400,
  WEAK_PASSWORD: 400,
  EMAIL_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  TOKEN_INVALID: 400,
  WRONG_PASSWORD: 403,
  // Das Konto ist angelegt, der Mailversand ist gescheitert. 502 sagt das:
  // Der Fehler liegt beim nachgelagerten Dienst, nicht in der Anfrage.
  MAIL_FAILED: 502,
  RESEND_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
};

/**
 * Drei Anfragen pro Stunde und Schlüssel. Der Wert ist absichtlich knapp:
 * Ein Mensch braucht die Wiederholung selten, ein Skript soll sie nicht
 * durchlaufen können.
 */
const RESEND_RULE: RateLimitRule = { limit: 3, windowSeconds: 60 * 60 };

/**
 * Grenzen der Registrierung (AP-04.46, Befund M-1).
 *
 * Jede erfolgreiche Registrierung löst eine echte Mail über Microsoft Graph
 * aus. Ohne Bremse ließe sich das Absenderpostfach mit beliebig vielen
 * Adressen bewerfen. Die beiden Grenzen greifen unabhängig voneinander.
 */
const REGISTER_IP_RULE: RateLimitRule = { limit: 5, windowSeconds: 60 * 60 };
const REGISTER_EMAIL_RULE: RateLimitRule = { limit: 3, windowSeconds: 60 * 60 };

/**
 * Adresse des Aufrufers für die Ratenbegrenzung.
 *
 * Auf Vercel setzt die Plattform `x-forwarded-for`; der erste Eintrag ist der
 * Client. Der Wert ist fälschbar, taugt also nur als grobe Bremse — genau
 * dafür wird er benutzt. Ohne Kopfzeile landen alle Aufrufer im selben Eimer.
 */
function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unbekannt";
}

function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, code: "RATE_LIMITED" },
    { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
  );
}

function fail(code: AuthCode) {
  return NextResponse.json({ ok: false, code }, { status: STATUS[code] ?? 400 });
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await request.json();
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ action: string }> },
): Promise<Response> {
  const { action } = await ctx.params;

  if (action === "register") {
    // Beide Grenzen stehen vor dem API-Aufruf: Bei Überschreitung entsteht
    // kein Konto — und damit auch keine Mail.
    const byAddress = hit(`register:ip:${clientAddress(request)}`, REGISTER_IP_RULE);
    if (!byAddress.allowed) return tooMany(byAddress.retryAfterSeconds);

    const payload = await body(request);
    const email = normalizeEmail(str(payload.email));

    // Ohne gültige Adresse gibt es keinen Empfänger-Eimer; die IP-Bremse deckt
    // den Fall ab. So entsteht kein gemeinsamer "leer"-Eimer über alle Clients.
    const byEmail = looksLikeEmail(email)
      ? hit(`register:email:${email}`, REGISTER_EMAIL_RULE)
      : null;
    if (byEmail && !byEmail.allowed) return tooMany(byEmail.retryAfterSeconds);

    // Die Adresse im Bestätigungslink darf nicht aus dem Anfrage-Host kommen:
    // hinter einem Proxy ist das der interne Name, und der Link in der Mail
    // wäre unbrauchbar. APP_BASE_URL hat Vorrang.
    const baseUrl = process.env.APP_BASE_URL ?? new URL(request.url).origin;
    const result = await register(str(payload.email), str(payload.password), baseUrl);
    if (!result.ok) return fail(result.code);
    return NextResponse.json({ ok: true, next: "/anmelden?neu=1" });
  }

  if (action === "resend") {
    // Ratenbegrenzung vor allem anderen: Sie soll auch dann greifen, wenn die
    // Anfrage sonst nichts auslösen würde.
    const byAddress = hit(`resend:ip:${clientAddress(request)}`, RESEND_RULE);
    if (!byAddress.allowed) return tooMany(byAddress.retryAfterSeconds);

    const payload = await body(request);
    const email = normalizeEmail(str(payload.email));

    // Zweiter Eimer je Adresse: Ein einzelner Client soll nicht beliebig viele
    // verschiedene Empfänger durchprobieren, und ein Empfänger soll nicht von
    // vielen Adressen gleichzeitig beworfen werden.
    const byEmail = hit(`resend:email:${email || "leer"}`, RESEND_RULE);
    if (!byEmail.allowed) return tooMany(byEmail.retryAfterSeconds);

    const result = resendConfirmation(email);
    if (!result.ok) return fail(result.code);

    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const payload = await body(request);
    const result = await login(
      str(payload.email),
      str(payload.password),
      request.headers.get("user-agent"),
    );
    if (!result.ok) return fail(result.code);
    return NextResponse.json({ ok: true, next: "/meine-checks" });
  }

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true, next: "/" });
  }

  if (action === "delete") {
    const state = await sessionState();
    if (state.kind === "unavailable") {
      return NextResponse.json({ ok: false, code: "API_UNAVAILABLE" }, { status: 503 });
    }
    if (state.kind !== "signed-in") {
      return NextResponse.json({ ok: false, code: "NOT_SIGNED_IN" }, { status: 401 });
    }
    const account = state.account;

    const payload = await body(request);
    const result = await deleteAccount(account.id, str(payload.password));
    if (!result.ok) return fail(result.code);

    await destroySession();
    return NextResponse.json({ ok: true, next: "/?geloescht=1" });
  }

  return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ action: string }> },
): Promise<Response> {
  const { action } = await ctx.params;

  if (action !== "verify") {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await verifyEmail(token);

  // Ein Link in einer Mail führt in den Browser, nicht in eine JSON-Antwort.
  const target = result.ok ? "/anmelden?bestaetigt=1" : "/anmelden?fehler=token";
  return NextResponse.redirect(new URL(target, request.url), 303);
}
