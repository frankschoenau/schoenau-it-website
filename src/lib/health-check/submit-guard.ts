/**
 * Riegel gegen doppeltes Absenden (AP-04.34).
 *
 * `busy` allein genügt nicht: der Zustandswert wird erst beim nächsten Rendern
 * sichtbar, zwei Klicks im selben Ereignis-Zyklus sehen also beide `false`.
 * Dieser Riegel wirkt sofort, weil er nicht am Rendern hängt.
 *
 * Bewusst klein und ohne React: so ist er prüfbar, ohne eine Oberfläche zu
 * rendern.
 */

export interface SubmitGuard {
  /** `true`, wenn dieser Aufruf den Vorgang beginnen darf. */
  tryAcquire(busy: boolean): boolean;
  /** Nach Abschluss oder Fehler wieder freigeben. */
  release(): void;
}

export function createSubmitGuard(): SubmitGuard {
  let inFlight = false;
  return {
    tryAcquire(busy: boolean): boolean {
      if (busy || inFlight) return false;
      inFlight = true;
      return true;
    },
    release(): void {
      inFlight = false;
    },
  };
}
