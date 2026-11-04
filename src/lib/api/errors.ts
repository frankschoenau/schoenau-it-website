/**
 * Übersetzt API-Antworten in Zustände, die die Oberfläche versteht.
 *
 * Die API liefert stabile Codes und Statuscodes (AP-04.31). Diese Datei macht
 * daraus genau eine Einordnung — damit nicht jede Seite ihre eigene Deutung
 * erfindet und ein 502 nicht als „abgemeldet" endet.
 *
 * Nach außen gehen nur die hier hinterlegten Texte. Der Code der API bleibt
 * erhalten (für Protokoll und Tests), der Freitext der API nie.
 */

export type ApiFailureKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid"
  | "unavailable"
  | "server";

export interface ApiFailure {
  kind: ApiFailureKind;
  status: number;
  code: string | null;
  message: string;
  /** Ein erneuter Versuch ist sinnvoll. */
  retryable: boolean;
}

const MESSAGES: Record<ApiFailureKind, string> = {
  unauthenticated: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  forbidden: "Für diesen Vorgang fehlt die Berechtigung.",
  not_found: "Der Eintrag wurde nicht gefunden.",
  conflict: "Der Vorgang ist derzeit nicht möglich.",
  invalid: "Die Angaben sind unvollständig oder ungültig.",
  unavailable:
    "Der Dienst ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.",
  server: "Es ist ein interner Fehler aufgetreten. Bitte versuchen Sie es erneut.",
};

/** Codes, die eine Sitzung betreffen — nur die dürfen als Abmeldung gelten. */
const SESSION_CODES = new Set(["IDENTITY_SESSION_REQUIRED", "IDENTITY_SESSION_INVALID"]);

/**
 * Einordnung einer Fehlerantwort. `status` ist der HTTP-Status der API,
 * `code` der stabile Fehlercode aus dem Antwortkörper (falls vorhanden).
 */
export function classifyApiFailure(status: number, code: string | null): ApiFailure {
  const base = (kind: ApiFailureKind, retryable: boolean): ApiFailure => ({
    kind,
    status,
    code,
    message: MESSAGES[kind],
    retryable,
  });

  if (status === 401) {
    // Nur eine ausdrückliche Sitzungsmeldung bedeutet „abgemeldet". Ein 401
    // wegen eines falschen Dienst-Tokens ist ein Betriebsfehler, keine
    // abgelaufene Kundensitzung.
    if (code !== null && SESSION_CODES.has(code)) return base("unauthenticated", false);
    return base("server", false);
  }
  if (status === 403) return base("forbidden", false);
  if (status === 404) return base("not_found", false);
  if (status === 409) return base("conflict", false);
  if (status === 400 || status === 422) return base("invalid", false);
  if (status === 502 || status === 503 || status === 504) return base("unavailable", true);
  if (status >= 500) return base("server", true);
  return base("server", false);
}

/** Fehler mit Einordnung; `message` ist bereits der Text für die Oberfläche. */
export class ApiError extends Error {
  readonly failure: ApiFailure;

  constructor(failure: ApiFailure) {
    super(failure.message);
    this.name = "ApiError";
    this.failure = failure;
  }
}

/**
 * Meldung für einen Fehlschlag beim Löschen eines Checks. Die beiden
 * 409-Codes der API haben fachlich verschiedene Ursachen und dürfen nicht
 * denselben Satz bekommen.
 */
export function conflictMessage(code: string | null): string {
  if (code === "CHECK_HAS_PAYMENT") {
    return "Dieser Check gehört zu einer bezahlten Bestellung und kann nicht gelöscht werden.";
  }
  if (code === "CHECK_RETENTION_UNDECIDED") {
    return "Löschen ist noch nicht freigegeben. Der Check bleibt gespeichert.";
  }
  return MESSAGES.conflict;
}
