"use client";

import { useState } from "react";

/**
 * Formular für Registrierung und Anmeldung.
 *
 * Beide Wege unterscheiden sich nur in Beschriftung und Ziel; die Mechanik ist
 * dieselbe. Deshalb ein Bauteil statt zweier, die auseinanderlaufen können.
 */

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  WEAK_PASSWORD: "Das Passwort braucht mindestens 10 Zeichen.",
  EMAIL_TAKEN: "Für diese Adresse gibt es bereits ein Konto. Melden Sie sich an.",
  INVALID_CREDENTIALS: "E-Mail-Adresse oder Passwort stimmt nicht.",
  // Das Konto besteht; nur die Mail fehlt. Der Satz sagt genau das, damit
  // niemand auf eine Nachricht wartet, die nicht unterwegs ist.
  MAIL_FAILED:
    "Ihr Konto wurde angelegt, die Bestätigungsmail konnte aber nicht versendet werden. Bitte fordern Sie sie auf der Anmeldeseite erneut an oder schreiben Sie an frank@schoenau-it.de.",
  NETWORK: "Der Server antwortet nicht. Bitte versuchen Sie es erneut.",
};

export default function CredentialsForm({ mode }: { mode: "register" | "login" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; code?: string; next?: string };

      if (payload.ok && payload.next) {
        window.location.href = payload.next;
        return;
      }
      setError(MESSAGES[payload.code ?? ""] ?? "Das hat nicht geklappt. Bitte erneut versuchen.");
    } catch {
      setError(MESSAGES.NETWORK);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="hc-field"
          placeholder="name@unternehmen.de"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 10 : undefined}
          className="hc-field"
          placeholder={isRegister ? "mindestens 10 Zeichen" : ""}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm" style={{ color: "#F87171" }}>
          {error}
        </p>
      )}

      <button type="submit" className="hc-btn hc-btn--primary w-full" disabled={busy}>
        {busy ? "Einen Moment …" : isRegister ? "Konto anlegen" : "Anmelden"}
      </button>
    </form>
  );
}
