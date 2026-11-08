/**
 * Prozess-ID aus der Vorgangs-ID (AP-04.34).
 *
 * Die API verlangt je Assessment eine `process_id`. Sie darf bei einer
 * Wiederholung nicht neu entstehen — sonst ändert sich der Payload und der
 * Idempotenz-Hash des Backends passt nicht mehr. Deshalb wird sie
 * deterministisch aus der Vorgangs-ID abgeleitet (UUID v5, RFC 4122).
 *
 * Nur serverseitig: `node:crypto` steht im Browser nicht zur Verfügung.
 */

import { createHash } from "node:crypto";

/** Fester Namensraum dieser Anwendung; ändert sich nie. */
const NAMESPACE = "2f6b1d4e-8a3c-4f57-9d21-6b0e5a7c9f13";

/**
 * UUID v5 nach RFC 4122: SHA-1 über Namensraum-Bytes und Namen, danach Version
 * und Variante setzen.
 */
export function deriveProcessId(submissionId: string): string {
  const namespaceBytes = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const digest = createHash("sha1")
    .update(Buffer.concat([namespaceBytes, Buffer.from(submissionId, "utf8")]))
    .digest();

  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variante RFC 4122

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
