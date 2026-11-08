import { createHmac } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { postAssessment, type ApiConfig } from "@/lib/health-check/api";
import { createCheck } from "@/lib/health-check/checks";
import type { AssessmentResult } from "@/lib/health-check/result";

/**
 * Mandant von Assessment und Check (AP-04.32, B-1).
 *
 * Geprüft wird der echte Client gegen einen lokalen API-Nachbau, der die
 * Mandantenregel der Produktions-API nachbildet (api_v1.py `_resolve_tenant`):
 *
 *   - mit gültiger Benutzerassertion  -> Mandant aus dem Konto
 *   - ohne Assertion, mit x-tenant-ref -> Mandant des Dienst-Credentials
 *   - genannter Mandant nicht erlaubt  -> 403 API_TENANT_MISMATCH
 *
 * Der Nachbau erfindet keine Regel: er bildet genau die Reihenfolge ab, die im
 * Backend steht. Was hier bewiesen wird, ist die Client-Seite — dass sie die
 * Assertion schickt und den statischen Mandanten weglässt.
 */

const SECRET = "testgeheimnis-mit-mindestens-32-byte-laenge";
const DIENST_MANDANT = "aahc-default";
const KONTEN: Record<string, string> = { "konto-a": "tenant-a", "konto-b": "tenant-b" };

interface Aufzeichnung {
  pfad: string;
  kopf: IncomingMessage["headers"];
  koerper: string;
  mandant: string | null;
}

let server: Server;
let basis = "";
let aufzeichnungen: Aufzeichnung[] = [];
let ablage: { assessment: Map<string, string>; check: Map<string, string> };

function antworte(res: ServerResponse, status: number, koerper: unknown) {
  const text = JSON.stringify(koerper);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(text);
}

function pruefeAssertion(token: string): string | null {
  const teile = token.split(".");
  if (teile.length !== 3) return null;
  const erwartet = createHmac("sha256", SECRET).update(`${teile[0]}.${teile[1]}`).digest("base64url");
  if (erwartet !== teile[2]) return null;
  try {
    const nutzlast = JSON.parse(Buffer.from(teile[1], "base64url").toString("utf8")) as { sub?: string };
    return nutzlast.sub ?? null;
  } catch {
    return null;
  }
}

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let koerper = "";
    req.on("data", (stueck) => {
      koerper += String(stueck);
    });
    req.on("end", () => {
      const assertion = req.headers["x-user-assertion"];
      const genannterMandant = req.headers["x-tenant-ref"];
      let mandant: string | null = null;

      if (typeof assertion === "string" && assertion) {
        const sub = pruefeAssertion(assertion);
        if (!sub) return antworte(res, 401, { error: "API_USER_IDENTITY_INVALID" });
        const kontoMandant = KONTEN[sub];
        if (!kontoMandant) return antworte(res, 401, { error: "API_USER_IDENTITY_INVALID" });
        // Ein abweichender genannter Mandant wird abgewiesen, nicht korrigiert.
        if (typeof genannterMandant === "string" && genannterMandant !== kontoMandant) {
          return antworte(res, 403, { error: "API_TENANT_MISMATCH" });
        }
        mandant = kontoMandant;
      } else if (typeof genannterMandant === "string") {
        if (genannterMandant !== DIENST_MANDANT) {
          return antworte(res, 403, { error: "API_TENANT_MISMATCH" });
        }
        mandant = DIENST_MANDANT;
      }

      const aufzeichnung: Aufzeichnung = {
        pfad: req.url ?? "",
        kopf: req.headers,
        koerper,
        mandant,
      };
      aufzeichnungen.push(aufzeichnung);

      if (req.url === "/api/v1/assessments" && req.method === "POST") {
        if (!mandant) return antworte(res, 401, { error: "API_USER_IDENTITY_REQUIRED" });
        const assessmentId = (JSON.parse(koerper) as { assessment_id?: string }).assessment_id ?? "";
        ablage.assessment.set(assessmentId, mandant);
        return antworte(res, 201, { result: { assessment_id: assessmentId, decision: { priority: "P3" } } });
      }

      if (req.url === "/api/v1/checks" && req.method === "POST") {
        if (!mandant) return antworte(res, 401, { error: "API_USER_IDENTITY_REQUIRED" });
        const ergebnis = (JSON.parse(koerper) as { result?: { assessment_id?: string } }).result;
        const assessmentId = ergebnis?.assessment_id ?? "";
        ablage.check.set(assessmentId, mandant);
        return antworte(res, 201, { id: "11111111-1111-4111-8111-111111111111", created: true });
      }

      return antworte(res, 404, { error: "API_NOT_FOUND" });
    });
  });

  await new Promise<void>((fertig) => server.listen(0, "127.0.0.1", fertig));
  basis = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  process.env.AAHC_API_BASE_URL = basis;
  process.env.AAHC_API_TOKEN = "dienst-token";
  process.env.AAHC_IDENTITY_SECRET = SECRET;
  process.env.AAHC_IDENTITY_ISSUER = "aahc-web";
  process.env.AAHC_IDENTITY_AUDIENCE = "aahc-api";
});

beforeEach(() => {
  aufzeichnungen = [];
  ablage = { assessment: new Map(), check: new Map() };
});

afterAll(async () => {
  await new Promise<void>((fertig) => server.close(() => fertig()));
});

const config: ApiConfig = { base: "", token: "dienst-token", tenant: DIENST_MANDANT };

/**
 * Der Check-Schnappschuss braucht serverseitig nur diese drei Felder
 * (check_service.py `create`). Der Typ beschreibt das vollständige Ergebnis,
 * das hier nicht nachgebaut werden muss.
 */
function ergebnis(assessmentId: string, processName: string): AssessmentResult {
  return {
    assessment_id: assessmentId,
    process_id: `PROC-${assessmentId}`,
    process_name: processName,
  } as unknown as AssessmentResult;
}

describe("Assessment und Check eines Kontos", () => {
  it("landen im selben Kundenmandanten", async () => {
    const cfg = { ...config, base: basis };
    const assessment = await postAssessment(cfg, "konto-a", { assessment_id: "ASM-1" }, "idem-1");
    expect(assessment.status).toBe(201);

    await createCheck("konto-a", ergebnis("ASM-1", "Rechnungseingang"));

    expect(ablage.assessment.get("ASM-1")).toBe("tenant-a");
    expect(ablage.check.get("ASM-1")).toBe("tenant-a");
    expect(ablage.assessment.get("ASM-1")).toBe(ablage.check.get("ASM-1"));
  });

  it("verwendet niemals den Dienstmandanten", async () => {
    const cfg = { ...config, base: basis };
    await postAssessment(cfg, "konto-a", { assessment_id: "ASM-2" }, "idem-2");
    await createCheck("konto-a", ergebnis("ASM-2", "Bestellung"));

    expect(ablage.assessment.get("ASM-2")).not.toBe(DIENST_MANDANT);
    expect(ablage.check.get("ASM-2")).not.toBe(DIENST_MANDANT);
  });

  it("sendet bei Assessment und Check keine Mandantenkopfzeile", async () => {
    const cfg = { ...config, base: basis };
    await postAssessment(cfg, "konto-a", { assessment_id: "ASM-3" }, "idem-3");
    await createCheck("konto-a", ergebnis("ASM-3", "Triage"));

    expect(aufzeichnungen).toHaveLength(2);
    for (const aufzeichnung of aufzeichnungen) {
      expect(aufzeichnung.kopf["x-tenant-ref"]).toBeUndefined();
      expect(aufzeichnung.kopf["x-user-assertion"]).toBeTruthy();
    }
  });

  it("trennt zwei Konten sauber", async () => {
    const cfg = { ...config, base: basis };
    await postAssessment(cfg, "konto-a", { assessment_id: "ASM-A" }, "idem-a");
    await postAssessment(cfg, "konto-b", { assessment_id: "ASM-B" }, "idem-b");
    expect(ablage.assessment.get("ASM-A")).toBe("tenant-a");
    expect(ablage.assessment.get("ASM-B")).toBe("tenant-b");
  });
});

describe("Gegenprobe am Nachbau", () => {
  it("weist einen fremden genannten Mandanten ab (403)", async () => {
    const kopf = new Headers({
      authorization: `Bearer ${process.env.AAHC_API_TOKEN}`,
      "content-type": "application/json",
    });
    // Assertion für konto-a, aber Mandant von konto-b genannt.
    const { mintUserAssertion } = await import("@/lib/api/server");
    kopf.set("x-user-assertion", mintUserAssertion("konto-a"));
    kopf.set("x-tenant-ref", "tenant-b");

    const antwort = await fetch(`${basis}/api/v1/assessments`, {
      method: "POST",
      headers: kopf,
      body: JSON.stringify({ assessment_id: "ASM-X" }),
    });
    expect(antwort.status).toBe(403);
    expect(ablage.assessment.has("ASM-X")).toBe(false);
  });

  it("lässt ohne Assertion kein kundenbezogenes Assessment zu", async () => {
    const antwort = await fetch(`${basis}/api/v1/assessments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assessment_id: "ASM-Y" }),
    });
    expect(antwort.status).toBe(401);
    expect(ablage.assessment.has("ASM-Y")).toBe(false);
  });
});
