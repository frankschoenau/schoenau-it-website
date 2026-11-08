/**
 * Ratenbegrenzung im Prozessspeicher (AP-04.46).
 *
 * Bewusst klein: kein Redis, keine Tabelle, keine neue Abhängigkeit. Das
 * genügt, um einen einzelnen Aufrufer am wiederholten Auslösen von Mails zu
 * hindern. Es ist **keine** verteilte Sperre — auf Vercel zählt jede Instanz
 * für sich, und ein Neustart setzt die Zähler zurück. Für den Schutz vor
 * versehentlichem Doppelklicken und grobem Missbrauch reicht das; für eine
 * harte Garantie bräuchte es einen gemeinsamen Speicher.
 */

export interface RateLimitRule {
  /** Erlaubte Treffer je Fenster. */
  limit: number;
  /** Fensterlänge in Sekunden. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Sinnvoller Wert für `Retry-After`; 0, wenn nichts zu warten ist. */
  retryAfterSeconds: number;
  remaining: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Obergrenze, damit ein Angriff mit vielen Schlüsseln den Speicher nicht füllt. */
const MAX_BUCKETS = 5_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Ein Treffer auf `key`. `now` ist injizierbar, damit Tests das Fenster
 * verschieben können, ohne zu warten.
 */
export function hit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(rule.limit - 1, 0) };
  }

  if (bucket.count >= rule.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(rule.limit - bucket.count, 0) };
}

/** Nur für Tests. */
export function resetRateLimits(): void {
  buckets.clear();
}
