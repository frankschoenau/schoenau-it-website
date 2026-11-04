import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Ein minimaler Nachbau der künftigen API — nur für Tests.
 *
 * Warum ein eigener Server und kein Mock-Framework: Die Website wird ihre
 * Daten künftig über HTTP holen (ADR-018). Ein echter HTTP-Server prüft genau
 * die Dinge, die ein Funktions-Mock verschweigt — Kopfzeilen, Statuscodes,
 * Inhaltslängen, Cookies. Er läuft lokal, hört auf einem freien Port und
 * braucht weder Datenbank noch Netz.
 *
 * **Nicht Teil des Produkts.** Diese Datei liegt unter `tests/` und wird von
 * der Anwendung nicht importiert.
 */

export interface RecordedRequest {
  method: string;
  path: string;
  headers: IncomingMessage["headers"];
  body: string;
}

export interface MockApi {
  baseUrl: string;
  requests: RecordedRequest[];
  close: () => Promise<void>;
}

type Handler = (request: RecordedRequest) => {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Startet den Testserver.
 *
 * Die Verträge sind absichtlich **noch nicht** die der fertigen API: Sie
 * bilden den Zustand, den AP-04.39 herstellen soll. Wer sie ändert, ändert
 * einen Vertrag — und das soll auffallen.
 */
export async function startMockApi(): Promise<MockApi> {
  const requests: RecordedRequest[] = [];

  const handler: Handler = (request) => {
    const { method, path } = request;

    if (method === "GET" && path === "/health") {
      return { status: 200, body: { status: "ok" } };
    }

    if (method === "POST" && path === "/api/v1/session") {
      const hasIdentity = Boolean(request.headers["authorization"]);
      if (!hasIdentity) {
        return { status: 401, body: { error: "API_AUTHENTICATION_REQUIRED" } };
      }
      return { status: 200, body: { token: "session-token-test", expires_in: 3600 } };
    }

    if (method === "GET" && path === "/api/v1/checks") {
      return { status: 200, body: { checks: [] } };
    }

    if (method === "GET" && path.startsWith("/api/v1/checks/")) {
      const id = path.slice("/api/v1/checks/".length);
      // Der Kern der Entscheidung O-08: Eine fremde ID ergibt 404, nicht 403.
      if (id === "fremde-id") {
        return { status: 404, body: { error: "API_NOT_FOUND" } };
      }
      return { status: 200, body: { check_id: id, tenant_ref: "tenant-test" } };
    }

    return { status: 404, body: { error: "API_NOT_FOUND" } };
  };

  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const recorded: RecordedRequest = {
        method: req.method ?? "GET",
        path: req.url ?? "/",
        headers: req.headers,
        body: raw,
      };
      requests.push(recorded);

      const result = handler(recorded);
      const payload = result.body === undefined ? "" : JSON.stringify(result.body);
      res.writeHead(result.status, {
        "content-type": "application/json; charset=utf-8",
        ...result.headers,
      });
      res.end(payload);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
