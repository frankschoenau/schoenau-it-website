"use client";

import { useState } from "react";

/**
 * Bestätigungsmail erneut anfordern.
 *
 * Der erneute Versand ist derzeit nicht möglich, weil die AAHC-API kein neues
 * Bestätigungstoken ausstellt. Die Oberfläche sagt das offen, statt einen
 * Versand zu behaupten. Sobald die API die Route anbietet, ändert sich hier
 * nur der Erfolgsfall — die Fehlerbehandlung bleibt.
 */

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  RESEND_UNAVAILABLE:
    "Der erneute Versand ist derzeit nicht eingerichtet. Ihre ursprüngliche Bestätigungsmail bleibt gültig. Wenn der Link abgelaufen ist, schreiben Sie bitte an frank@schoenau-it.de.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte versuchen Sie es später noch einmal.",
  NETWORK: "Der Server antwortet nicht. Bitte versuchen Sie es erneut.",
};

type Notice = { tone: "ok" | "warn"; text: string };

export default function ResendForm() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email") ?? "") }),
      });
      const payload = (await response.json()) as { ok?: boolean; code?: string };

      if (payload.ok) {
        // Absichtlich neutral: Die Antwort darf nicht verraten, ob es zu
        // dieser Adresse ein unbestätigtes Konto gibt.
        setNotice({
          tone: "ok",
          text: "Falls für diese Adresse ein unbestätigtes Konto besteht, ist eine Nachricht unterwegs.",
        });
        return;
      }

      setNotice({
        tone: "warn",
        text: MESSAGES[payload.code ?? ""] ?? MESSAGES.RESEND_UNAVAILABLE,
      });
    } catch {
      setNotice({ tone: "warn", text: MESSAGES.NETWORK });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm underline" style={{ color: "var(--hc-muted)" }}>
        Bestätigungsmail erneut anfordern
      </summary>

      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <div>
          <label htmlFor="resend-email" className="mb-2 block text-sm text-slate-300">
            E-Mail-Adresse
          </label>
          <input
            id="resend-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="hc-field"
            placeholder="name@unternehmen.de"
          />
        </div>

        {notice && (
          <p
            role="status"
            className="text-sm leading-relaxed"
            style={{ color: notice.tone === "ok" ? "#86EFAC" : "#F87171" }}
          >
            {notice.text}
          </p>
        )}

        <button type="submit" className="hc-btn hc-btn--secondary w-full" disabled={busy}>
          {busy ? "Einen Moment …" : "Mail erneut anfordern"}
        </button>
      </form>
    </details>
  );
}
