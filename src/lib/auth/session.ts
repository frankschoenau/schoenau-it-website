import { cookies } from "next/headers";
import { logout as apiLogout, session as apiSession } from "../api/identity";

/**
 * Sitzungen über die zentrale API (AP-04.24).
 *
 * Die Website führt keine eigene Sitzungstabelle mehr. Das Cookie trägt das
 * Sitzungstoken der API; es ist `httpOnly` (kein Zugriff aus JavaScript),
 * `sameSite=lax` (kein CSRF über fremde Formulare) und `secure` in Produktion.
 * Die Gültigkeit entscheidet ausschließlich die API.
 *
 * Seit AP-04.32 wird ein Ausfall der API nicht mehr als Abmeldung gedeutet:
 * `sessionState()` unterscheidet „nicht angemeldet", „gesperrt" und „Dienst
 * nicht erreichbar". Nur die ersten beiden führen zur Anmeldeseite.
 */

const COOKIE_NAME = "aahc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionAccount {
  id: string;
  email: string;
  /** `null`, solange das Konto nicht bestätigt (nicht `active`) ist. */
  emailVerifiedAt: Date | null;
}

export type SessionState =
  | { kind: "signed-in"; account: SessionAccount }
  | { kind: "signed-out" }
  | { kind: "forbidden" }
  | { kind: "unavailable" }
  | { kind: "error" };

/** Die API antwortet nicht — das ist kein Grund, den Kunden abzumelden. */
export class SessionUnavailableError extends Error {
  constructor() {
    super("SESSION_UNAVAILABLE");
    this.name = "SessionUnavailableError";
  }
}

export async function startSessionFromToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Zustand der Sitzung. Das Cookie bleibt in jedem Fall unangetastet — ein
 * Ausfall der API löscht keine Sitzung.
 */
export async function sessionState(): Promise<SessionState> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return { kind: "signed-out" };

  const result = await apiSession(token);

  if (result.ok && result.data) {
    return {
      kind: "signed-in",
      account: {
        id: result.data.account_id,
        email: result.data.email,
        // Die API liefert den Status; `active` ist das bestätigte Konto.
        emailVerifiedAt: result.data.status === "active" ? new Date() : null,
      },
    };
  }

  if (result.status === 401) {
    // Nur die ausdrückliche Sitzungsmeldung der API gilt als abgelaufen. Ein
    // 401 wegen eines falschen Dienst-Tokens ist ein Betriebsfehler.
    if (
      result.code === "IDENTITY_SESSION_REQUIRED" ||
      result.code === "IDENTITY_SESSION_INVALID"
    ) {
      return { kind: "signed-out" };
    }
    return { kind: "error" };
  }
  if (result.status === 403) return { kind: "forbidden" };
  if (result.status === 502 || result.status === 503 || result.status === 504) {
    return { kind: "unavailable" };
  }
  return { kind: "error" };
}

/**
 * Das Konto der Sitzung oder `null`, wenn niemand angemeldet ist.
 *
 * Bei einem Ausfall der API wird bewusst geworfen statt `null` geliefert:
 * `null` würde den Kunden auf die Anmeldeseite schicken, obwohl seine Sitzung
 * möglicherweise gültig ist. Wer den Ausfall behandeln will, nutzt
 * `sessionState()`.
 */
export async function currentAccount(): Promise<SessionAccount | null> {
  const state = await sessionState();
  if (state.kind === "signed-in") return state.account;
  if (state.kind === "signed-out" || state.kind === "forbidden") return null;
  throw new SessionUnavailableError();
}

export async function sessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    // Ein fehlgeschlagener Logout darf das Cookie trotzdem löschen.
    try {
      await apiLogout(token);
    } catch {
      /* Die Sitzung läuft spätestens mit ihrer Gültigkeit ab. */
    }
  }
  store.delete(COOKIE_NAME);
}
