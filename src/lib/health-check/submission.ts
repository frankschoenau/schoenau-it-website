/**
 * Vorgangs-ID einer Bewertung (AP-04.34).
 *
 * Eine Vorgangs-ID entsteht, wenn ein Bewertungsvorgang beginnt, und bleibt für
 * alle Wiederholungen desselben Vorgangs gleich. Sie ist damit der Anker für
 * die Idempotenz: dieselbe ID bedeutet „derselbe Vorgang", eine neue ID
 * bedeutet „bewusst neu gestartet".
 *
 * Die ID lebt ausschließlich im Zustand der Komponente. Es gibt bewusst keine
 * Ablage in `localStorage` oder einem Cookie: ein Reload beginnt einen neuen
 * Vorgang, und zwei Tabs sind zwei Vorgänge.
 *
 * Diese Datei ist client-tauglich — kein `node:crypto`, keine Serverimporte.
 */

/** Der Vertrag der API erlaubt höchstens 100 Zeichen für `assessment_id`. */
export const MAX_SUBMISSION_ID_LENGTH = 100;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Eine neue Vorgangs-ID. `crypto.randomUUID` ist in jedem sicheren Kontext
 * verfügbar (HTTPS, localhost); der Rückfall deckt ältere Umgebungen ab und
 * erzeugt ebenfalls eine gültige v4-UUID.
 */
export function newSubmissionId(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Prüft, ob ein Wert als Vorgangs-ID taugt: UUID-Form und höchstens 100
 * Zeichen. Nur so kommt die ID in den Anfragekörper der API, deren
 * `assessment_id` ein `varchar(100)` ist.
 */
export function isSubmissionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_SUBMISSION_ID_LENGTH &&
    UUID_PATTERN.test(value)
  );
}
