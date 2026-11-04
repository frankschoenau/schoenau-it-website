import { createHash, randomBytes } from "node:crypto";
import { pool } from "../db";
import { hashPassword, verifyPassword } from "./password";
import { sendMail } from "./mail";
import { createSession, pruneExpiredSessions } from "./session";

/**
 * Konten: anlegen, bestätigen, anmelden, löschen.
 *
 * Die Funktionen hier sind die einzige Stelle, die die Tabellen im Schema
 * `web` beschreibt. Routen prüfen ihre Eingaben und rufen sie auf; sie
 * schreiben nicht selbst.
 */

export type AuthResult<T> = { ok: true; value: T } | { ok: false; code: AuthCode };

export type AuthCode =
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "TOKEN_INVALID"
  | "WRONG_PASSWORD";

const MIN_PASSWORD_LENGTH = 10;
const VERIFY_TOKEN_MINUTES = 60 * 24;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Bewusst grob: eine E-Mail-Adresse endgültig zu prüfen ist nicht die Aufgabe
 * eines regulären Ausdrucks, sondern der Bestätigungsmail. Hier wird nur
 * abgewiesen, was offensichtlich keine Adresse ist.
 */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function register(
  email: string,
  password: string,
  baseUrl: string,
): Promise<AuthResult<{ accountId: string }>> {
  const normalized = normalizeEmail(email);

  if (!looksLikeEmail(normalized)) return { ok: false, code: "INVALID_EMAIL" };
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, code: "WEAK_PASSWORD" };

  const passwordHash = await hashPassword(password);

  let accountId: string;
  try {
    const inserted = await pool().query<{ id: string }>(
      `INSERT INTO web.account (email, email_normalized, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email.trim(), normalized, passwordHash],
    );
    accountId = inserted.rows[0].id;
  } catch (error) {
    // 23505 ist die Verletzung der Eindeutigkeit — die Adresse ist vergeben.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return { ok: false, code: "EMAIL_TAKEN" };
    }
    throw error;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_MINUTES * 60 * 1000);

  await pool().query(
    `INSERT INTO web.email_token (account_id, purpose, token_hash, expires_at)
     VALUES ($1, 'verify_email', $2, $3)`,
    [accountId, hashToken(token), expiresAt],
  );

  const link = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email.trim(),
    subject: "Bitte bestätigen Sie Ihre E-Mail-Adresse",
    text:
      "Guten Tag,\n\n" +
      "bitte bestätigen Sie Ihre Adresse, damit Ihr Health Check gespeichert werden kann:\n\n" +
      `${link}\n\n` +
      "Der Link ist 24 Stunden gültig. Wenn Sie sich nicht registriert haben, ignorieren Sie diese Mail.\n",
  });

  return { ok: true, value: { accountId } };
}

export async function verifyEmail(token: string): Promise<AuthResult<{ email: string }>> {
  const result = await pool().query<{ id: string; account_id: string; email: string }>(
    `SELECT t.id, t.account_id, a.email
       FROM web.email_token t
       JOIN web.account a ON a.id = t.account_id
      WHERE t.token_hash = $1
        AND t.purpose = 'verify_email'
        AND t.used_at IS NULL
        AND t.expires_at > now()
      LIMIT 1`,
    [hashToken(token)],
  );

  const row = result.rows[0];
  if (!row) return { ok: false, code: "TOKEN_INVALID" };

  await pool().query("UPDATE web.account SET email_verified_at = now() WHERE id = $1", [row.account_id]);
  await pool().query("UPDATE web.email_token SET used_at = now() WHERE id = $1", [row.id]);

  return { ok: true, value: { email: row.email } };
}

export async function login(
  email: string,
  password: string,
  userAgent: string | null,
): Promise<AuthResult<{ accountId: string; emailVerified: boolean }>> {
  const normalized = normalizeEmail(email);

  const result = await pool().query<{
    id: string;
    password_hash: string;
    email_verified_at: Date | null;
  }>(
    "SELECT id, password_hash, email_verified_at FROM web.account WHERE email_normalized = $1 LIMIT 1",
    [normalized],
  );

  const row = result.rows[0];
  if (!row) {
    // Auch ohne Konto wird gerechnet: die Antwortzeit soll nicht verraten, ob
    // eine Adresse existiert.
    await hashPassword(password);
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const matches = await verifyPassword(password, row.password_hash);
  if (!matches) return { ok: false, code: "INVALID_CREDENTIALS" };

  await pruneExpiredSessions();
  await createSession(row.id, userAgent);
  await pool().query("UPDATE web.account SET last_login_at = now() WHERE id = $1", [row.id]);

  return { ok: true, value: { accountId: row.id, emailVerified: row.email_verified_at !== null } };
}

export async function deleteAccount(accountId: string, password: string): Promise<AuthResult<true>> {
  const result = await pool().query<{ password_hash: string }>(
    "SELECT password_hash FROM web.account WHERE id = $1 LIMIT 1",
    [accountId],
  );

  const row = result.rows[0];
  if (!row) return { ok: false, code: "INVALID_CREDENTIALS" };
  if (!(await verifyPassword(password, row.password_hash))) {
    return { ok: false, code: "WRONG_PASSWORD" };
  }

  // Sitzungen und Token hängen per ON DELETE CASCADE am Konto.
  await pool().query("DELETE FROM web.account WHERE id = $1", [accountId]);
  return { ok: true, value: true };
}

export { MIN_PASSWORD_LENGTH };
