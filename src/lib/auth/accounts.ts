import { sendMail } from "./mail";
import {
  confirm,
  deleteAccount as apiDeleteAccount,
  login as apiLogin,
  register as apiRegister,
} from "../api/identity";
import { currentAccount, destroySession, startSessionFromToken } from "./session";

/**
 * Konten: anlegen, bestätigen, anmelden, löschen — über die zentrale API.
 *
 * Die Website führt keine Kontendatenbank mehr und hasht keine Passwörter
 * selbst. Sie prüft ihre Eingaben, ruft die API und übersetzt deren stabile
 * Codes in die Codes dieser Oberfläche. Die API ist die eine Identitätsquelle.
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

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Bewusst grob: eine E-Mail-Adresse endgültig zu prüfen ist nicht die Aufgabe
 * eines regulären Ausdrucks, sondern der Bestätigungsmail.
 */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function register(
  email: string,
  password: string,
  baseUrl: string,
): Promise<AuthResult<{ accountId: string }>> {
  const normalized = normalizeEmail(email);
  if (!looksLikeEmail(normalized)) return { ok: false, code: "INVALID_EMAIL" };
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, code: "WEAK_PASSWORD" };

  const result = await apiRegister(email.trim(), password);
  if (!result.ok || !result.data) {
    if (result.code === "IDENTITY_EMAIL_TAKEN") return { ok: false, code: "EMAIL_TAKEN" };
    if (result.code === "IDENTITY_EMAIL_INVALID") return { ok: false, code: "INVALID_EMAIL" };
    if (result.code?.startsWith("PASSWORD_")) return { ok: false, code: "WEAK_PASSWORD" };
    throw new Error(`REGISTER_FAILED:${result.code ?? result.status}`);
  }

  const link = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(result.data.confirm_token)}`;
  await sendMail({
    to: email.trim(),
    subject: "Bitte bestätigen Sie Ihre E-Mail-Adresse",
    text:
      "Guten Tag,\n\n" +
      "bitte bestätigen Sie Ihre Adresse, damit Ihr Health Check gespeichert werden kann:\n\n" +
      `${link}\n\n` +
      "Der Link ist 48 Stunden gültig. Wenn Sie sich nicht registriert haben, ignorieren Sie diese Mail.\n",
  });

  return { ok: true, value: { accountId: result.data.account_id } };
}

export async function verifyEmail(token: string): Promise<AuthResult<true>> {
  const result = await confirm(token);
  if (!result.ok) return { ok: false, code: "TOKEN_INVALID" };
  return { ok: true, value: true };
}

export async function login(
  email: string,
  password: string,
  _userAgent: string | null,
): Promise<AuthResult<{ accountId: string; emailVerified: boolean }>> {
  const result = await apiLogin(normalizeEmail(email), password);
  if (!result.ok || !result.data) {
    // Auch „nicht bestätigt“ wird wie falsche Zugangsdaten behandelt: die
    // Antwort soll nicht verraten, ob eine Adresse existiert.
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }
  await startSessionFromToken(result.data.session_token);
  return { ok: true, value: { accountId: result.data.account_id, emailVerified: true } };
}

export async function deleteAccount(_accountId: string, password: string): Promise<AuthResult<true>> {
  // Die API löscht über die Sitzung; das Passwort wird zusätzlich erneut
  // geprüft, indem eine frische Anmeldung versucht wird. Diese Sitzung wird
  // für die Löschung benutzt und verschwindet mit dem Konto.
  const account = await currentAccount();
  if (!account) return { ok: false, code: "INVALID_CREDENTIALS" };

  const check = await apiLogin(account.email, password);
  if (!check.ok || !check.data) return { ok: false, code: "WRONG_PASSWORD" };

  const deleted = await apiDeleteAccount(check.data.session_token);
  if (!deleted.ok) {
    if (deleted.code === "IDENTITY_ACCOUNT_HAS_ORDERS") {
      throw new Error("ACCOUNT_HAS_ORDERS");
    }
    throw new Error(`DELETE_FAILED:${deleted.code ?? deleted.status}`);
  }
  await destroySession();
  return { ok: true, value: true };
}

export { MIN_PASSWORD_LENGTH };
