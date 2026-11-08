"use client";

import { useEffect, useState } from "react";

type State = "pruefe" | "ok" | "gestoert";

/**
 * Zeigt, ob der Durchreicher die API erreicht.
 *
 * Der Aufruf geht bewusst über `/api/aahc/health` und nicht direkt an die API:
 * genau dieser Weg ist der, den später jede Anfrage nimmt. Ein Test, der an der
 * Route vorbei prüft, würde beweisen, dass die API läuft — nicht, dass die Seite
 * sie erreicht.
 */
export default function ApiStatus() {
  const [state, setState] = useState<State>("pruefe");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/aahc/health", { signal: controller.signal, cache: "no-store" })
      .then((response) => setState(response.ok ? "ok" : "gestoert"))
      .catch(() => {
        if (!controller.signal.aborted) setState("gestoert");
      });

    return () => controller.abort();
  }, []);

  const label =
    state === "ok"
      ? "Analyse-API verbunden"
      : state === "gestoert"
        ? "Analyse-API nicht erreichbar"
        : "Verbindung wird geprüft";

  return (
    <p
      className="hc-hint"
      role="status"
      aria-live="polite"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background:
            state === "ok" ? "#22C55E" : state === "gestoert" ? "#F87171" : "#94A3B8",
        }}
      />
      {label}
    </p>
  );
}
