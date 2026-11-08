"use client";

import { useState } from "react";

/** Abmelden und Konto löschen. Beides braucht eine bewusste Handlung. */
export default function AccountActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as { ok?: boolean; code?: string };
    if (payload.ok) {
      window.location.href = "/?geloescht=1";
      return;
    }
    setError(
      payload.code === "WRONG_PASSWORD"
        ? "Das Passwort stimmt nicht."
        : "Das Konto konnte nicht gelöscht werden.",
    );
    setBusy(false);
  }

  return (
    <div className="mt-8 space-y-6">
      <button type="button" onClick={logout} disabled={busy} className="hc-btn hc-btn--secondary">
        Abmelden
      </button>

      <div className="hc-glass p-6">
        <h2 className="font-medium">Konto löschen</h2>
        <p className="hc-hint mt-2">
          Damit werden Konto, Sitzungen und alle gespeicherten Checks entfernt.
          Das lässt sich nicht rückgängig machen.
        </p>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="hc-btn hc-btn--quiet mt-4"
            style={{ paddingLeft: 0 }}
          >
            Konto löschen …
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label htmlFor="confirm-password" className="block text-sm text-slate-300">
              Zur Sicherheit Ihr Passwort
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="current-password"
              className="hc-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm" style={{ color: "#F87171" }}>
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={remove} disabled={busy || !password} className="hc-btn hc-btn--primary">
                Endgültig löschen
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="hc-btn hc-btn--quiet">
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
