import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "../db";

/**
 * Sitzungen.
 *
 * In der Datenbank steht nur der SHA-256 des Tokens. Wer die Tabelle liest,
 * kann sich damit nicht anmelden. Das Cookie ist `httpOnly` (kein Zugriff aus
 * JavaScript), `sameSite=lax` (kein CSRF über fremde Formulare) und trägt
 * `secure` in Produktion.
 */

const COOKIE_NAME = "aahc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionAccount {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(accountId: string, userAgent: string | null): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  await pool().query(
    "INSERT INTO web.session (account_id, token_hash, expires_at, user_agent) VALUES ($1, $2, $3, $4)",
    [accountId, hashToken(token), expiresAt, userAgent],
  );

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function currentAccount(): Promise<SessionAccount | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const result = await pool().query<{
    id: string;
    email: string;
    email_verified_at: Date | null;
  }>(
    `SELECT a.id, a.email, a.email_verified_at
       FROM web.session s
       JOIN web.account a ON a.id = s.account_id
      WHERE s.token_hash = $1 AND s.expires_at > now()
      LIMIT 1`,
    [hashToken(token)],
  );

  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, emailVerifiedAt: row.email_verified_at };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await pool().query("DELETE FROM web.session WHERE token_hash = $1", [hashToken(token)]);
  }
  store.delete(COOKIE_NAME);
}

/** Abgelaufene Sitzungen aufräumen. Wird beim Anmelden mitgerufen. */
export async function pruneExpiredSessions(): Promise<void> {
  await pool().query("DELETE FROM web.session WHERE expires_at <= now()");
}
