import { afterEach, describe, expect, it } from "vitest";

import { hit, resetRateLimits } from "@/lib/auth/rate-limit";

/**
 * Ratenbegrenzung mit injizierter Uhr — der Test wartet nicht eine Stunde.
 */

const RULE = { limit: 3, windowSeconds: 3600 };

afterEach(() => {
  resetRateLimits();
});

describe("hit", () => {
  it("lässt genau die erlaubte Anzahl durch", () => {
    const now = 1_000_000;

    expect(hit("a", RULE, now).allowed).toBe(true);
    expect(hit("a", RULE, now).allowed).toBe(true);
    expect(hit("a", RULE, now).allowed).toBe(true);

    const blocked = hit("a", RULE, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("nennt eine sinnvolle Wartezeit", () => {
    const now = 1_000_000;
    for (let i = 0; i < RULE.limit; i += 1) hit("b", RULE, now);

    const blocked = hit("b", RULE, now + 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(3540);
  });

  it("öffnet das Fenster nach Ablauf wieder", () => {
    const now = 1_000_000;
    for (let i = 0; i < RULE.limit; i += 1) hit("c", RULE, now);
    expect(hit("c", RULE, now).allowed).toBe(false);

    const afterWindow = now + RULE.windowSeconds * 1000;
    expect(hit("c", RULE, afterWindow).allowed).toBe(true);
  });

  it("trennt Schlüssel voneinander", () => {
    const now = 1_000_000;
    for (let i = 0; i < RULE.limit; i += 1) hit("ip:1", RULE, now);

    expect(hit("ip:1", RULE, now).allowed).toBe(false);
    expect(hit("ip:2", RULE, now).allowed).toBe(true);
  });
});
