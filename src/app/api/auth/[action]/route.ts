import { NextResponse } from "next/server";
import { register, login, verifyEmail, deleteAccount, type AuthCode } from "@/lib/auth/accounts";
import { currentAccount, destroySession } from "@/lib/auth/session";

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
};

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
    const payload = await body(request);
    // Die Adresse im Bestätigungslink darf nicht aus dem Anfrage-Host kommen:
    // hinter einem Proxy ist das der interne Name, und der Link in der Mail
    // wäre unbrauchbar. APP_BASE_URL hat Vorrang.
    const baseUrl = process.env.APP_BASE_URL ?? new URL(request.url).origin;
    const result = await register(str(payload.email), str(payload.password), baseUrl);
    if (!result.ok) return fail(result.code);
    return NextResponse.json({ ok: true, next: "/anmelden?neu=1" });
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
    const account = await currentAccount();
    if (!account) return NextResponse.json({ ok: false, code: "NOT_SIGNED_IN" }, { status: 401 });

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
