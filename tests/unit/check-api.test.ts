import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createCheck, deleteCheck, getCheck, listChecks } from "@/lib/api/checks";

/**
 * Check-Zugriffe der Website gegen einen lokalen API-Nachbau (AP-04.25).
 *
 * Kein Next.js, keine Datenbank: geprüft wird der Client, der die echten
 * Endpunkte aufruft — Kopfzeilen, Statuscodes, Fehlerabbildung. Der Server
 * hört auf einem freien Port und zeichnet jede Anfrage auf.
 */

interface Recorded {
  method: string;
  path: string;
  headers: IncomingMessage["headers"];
  body: string;
}

let server: Server;
let baseUrl = "";
const requests: Recorded[] = [];

const CREATED_ID = "11111111-1111-4111-8111-111111111111";

beforeAll(async () => {
  process.env.AAHC_API_BASE_URL = "";
  process.env.AAHC_API_TOKEN = "service-token-test";
  process.env.AAHC_IDENTITY_SECRET = "test-identity-secret-0123456789abcdef";
  process.env.AAHC_IDENTITY_ISSUER = "aahc-web";
  process.env.AAHC_IDENTITY_AUDIENCE = "aahc-api";

  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({ method: req.method ?? "GET", path: req.url ?? "/", headers: req.headers, body: raw });
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
      };
      const { method, url } = req;
      if (method === "POST" && url === "/api/v1/checks") {
        return send(201, { id: CREATED_ID, created: true });
      }
      if (method === "GET" && url === "/api/v1/checks") {
        return send(200, {
          checks: [
            {
              id: CREATED_ID,
              process_name: "Rechnungseingang",
              created_at: "2026-11-03T10:00:00+00:00",
              priority: "P3_AUTOMATE_LATER",
              annual_net_effect: 1200,
            },
          ],
        });
      }
      if (method === "GET" && url === "/api/v1/checks/boom") {
        return send(500, { error: "API_INTERNAL_ERROR" });
      }
      if (method === "GET" && url === `/api/v1/checks/${CREATED_ID}`) {
        return send(200, {
          check: {
            id: CREATED_ID,
            assessment_id: "ASM-1",
            process_name: "Rechnungseingang",
            created_at: "2026-11-03T10:00:00+00:00",
            result: { assessment_id: "ASM-1" },
          },
        });
      }
      if (url?.startsWith("/api/v1/checks/")) {
        // Fremde oder unbekannte Kennung: 404, nicht 403.
        return send(404, { error: "API_NOT_FOUND" });
      }
      return send(404, { error: "API_NOT_FOUND" });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.AAHC_API_BASE_URL = baseUrl;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe("Check-API-Client", () => {
  it("legt einen Check an und schickt Dienst- und Benutzeridentitaet", async () => {
    const id = await createCheck("account-1", { assessment_id: "ASM-1", process_name: "Rechnungseingang" });
    expect(id).toBe(CREATED_ID);

    const call = requests.at(-1)!;
    expect(call.headers["authorization"]).toBe("Bearer service-token-test");
    expect(call.headers["x-tenant-ref"]).toBeUndefined();
    const assertion = String(call.headers["x-user-assertion"]);
    const payload = JSON.parse(Buffer.from(assertion.split(".")[1], "base64url").toString("utf8"));
    expect(payload.sub).toBe("account-1");
    expect(JSON.parse(call.body).result.assessment_id).toBe("ASM-1");
  });

  it("listet Checks und bildet die Felder ab", async () => {
    const checks = await listChecks("account-1");
    expect(checks).toHaveLength(1);
    expect(checks[0].processName).toBe("Rechnungseingang");
    expect(checks[0].createdAt).toBeInstanceOf(Date);
    expect(checks[0].annualNetEffect).toBe(1200);
  });

  it("liest einen eigenen Check", async () => {
    const check = await getCheck("account-1", CREATED_ID);
    expect(check?.id).toBe(CREATED_ID);
    expect(check?.assessmentId).toBe("ASM-1");
  });

  it("liefert bei fremder Kennung null (404, kein Fehler)", async () => {
    expect(await getCheck("account-1", "fremde-id")).toBeNull();
  });

  it("wirft bei einem Serverfehler einen eingeordneten Fehler", async () => {
    // Seit AP-04.32 trägt der Fehler die Einordnung; der technische Code steht
    // in `failure.code`, der Text ist die Meldung für die Oberfläche.
    await expect(getCheck("account-1", "boom")).rejects.toMatchObject({
      name: "ApiError",
      failure: { kind: "server", status: 500 },
    });
  });

  it("gibt die kontrollierte Loeschabweisung weiter", async () => {
    const result = await deleteCheck("account-1", CREATED_ID);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("API_NOT_FOUND");
  });
});

describe("keine direkte Datenbank in der Website", () => {
  const root = join(process.cwd(), "src");

  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? files(path) : [path];
    });
  }

  it("importiert nirgends pg oder lib/db", () => {
    const offenders = files(root).filter((file) =>
      /\.(ts|tsx|js|jsx)$/.test(file) &&
      /from\s+["']pg["']|from\s+["']@\/lib\/db["']|from\s+["']\.\.?\/db["']/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("verwendet WEB_DATABASE_URL nicht mehr", () => {
    const offenders = files(root).filter((file) => readFileSync(file, "utf8").includes("WEB_DATABASE_URL"));
    expect(offenders).toEqual([]);
  });
});
