import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { accountHeaders, apiHeaders, type ApiConfig } from "@/lib/health-check/api";

/**
 * Kopfzeilen des Assessment-Aufrufs (AP-04.32, B-1).
 *
 * Der Fehler aus AP-04.31 war ein statischer `x-tenant-ref` ohne
 * Benutzerassertion. Diese Tests halten fest, dass der kundenbezogene Aufruf
 * anders aussieht.
 */

const SECRET = "ein-testgeheimnis-mit-mindestens-32-byte-laenge";
const config: ApiConfig = { base: "http://127.0.0.1:1", token: "test-token", tenant: "aahc-default" };

function payload(header: string): Record<string, unknown> {
  const segment = header.split(".")[1];
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<string, unknown>;
}

describe("accountHeaders", () => {
  it("sendet eine Benutzerassertion und keinen Mandanten", () => {
    process.env.AAHC_IDENTITY_SECRET = SECRET;
    const headers = accountHeaders(config, "konto-1");

    expect(headers.get("x-user-assertion")).toBeTruthy();
    expect(headers.get("x-tenant-ref")).toBeNull();
    expect(headers.get("authorization")).toBe("Bearer test-token");
  });

  it("signiert die Assertion mit HS256 und dem Konto als sub", () => {
    process.env.AAHC_IDENTITY_SECRET = SECRET;
    const token = String(accountHeaders(config, "konto-1").get("x-user-assertion"));
    const [kopf, rumpf, signatur] = token.split(".");

    const erwartet = createHmac("sha256", SECRET).update(`${kopf}.${rumpf}`).digest("base64url");
    expect(signatur).toBe(erwartet);
    expect(payload(token).sub).toBe("konto-1");
    expect((JSON.parse(Buffer.from(kopf, "base64url").toString("utf8")) as { alg: string }).alg).toBe("HS256");
  });

  it("übernimmt keinen Mandanten aus zusätzlichen Kopfzeilen", () => {
    process.env.AAHC_IDENTITY_SECRET = SECRET;
    const headers = accountHeaders(config, "konto-1", { "content-type": "application/json" });
    expect(headers.get("x-tenant-ref")).toBeNull();
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("verweigert die Assertion ohne ausreichendes Geheimnis", () => {
    process.env.AAHC_IDENTITY_SECRET = "zu-kurz";
    expect(() => accountHeaders(config, "konto-1")).toThrow();
  });
});

describe("apiHeaders (Dienstweg)", () => {
  it("bleibt für Aufrufe ohne Benutzeridentität beim Mandanten", () => {
    const headers = apiHeaders(config);
    expect(headers.get("x-tenant-ref")).toBe("aahc-default");
    expect(headers.get("x-user-assertion")).toBeNull();
  });
});
