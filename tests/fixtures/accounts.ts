/**
 * Testdaten für Konten und Authentifizierung.
 *
 * **Keine echten Personen, keine echten Adressen, keine echten Passwörter.**
 * Die Domäne `example.test` ist nach RFC 2606 für Tests reserviert und kann
 * nicht registriert werden. Die Hashes sind mit demselben Verfahren erzeugt
 * wie in `src/lib/auth/password.ts` (scrypt, NFKC-normalisiert) — sie sind
 * damit echte Prüfobjekte, aber für nichts anderes zu gebrauchen.
 */

export interface AccountFixture {
  id: string;
  email: string;
  emailNormalized: string;
  password: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
}

/**
 * Der Hash gehört zu `password`. Er wurde einmalig mit der echten
 * Node-Implementierung erzeugt und hier fest eingetragen — fest, damit der
 * Test nicht von Zufall abhängt.
 */
export const FIXTURE_PASSWORD = "Grüße-ÄÖÜ-2026!";

export const FIXTURE_PASSWORD_HASH =
  "scrypt$16384$8$1$G3xe1CSnT6KFP5atkch9Hw==$ovja2QTnWucE0N1ophDB2GZNFthVUof4xZVEHnwsHGmCS0HkpDPVKcz4C6yDXdQqtC1iHsxUCkZp4hxoDksUUw==";

export const ACCOUNTS: AccountFixture[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "Anna.Betrieb@example.test",
    emailNormalized: "anna.betrieb@example.test",
    password: FIXTURE_PASSWORD,
    passwordHash: FIXTURE_PASSWORD_HASH,
    emailVerifiedAt: "2026-11-02T09:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "  buchhaltung@example.test  ",
    emailNormalized: "buchhaltung@example.test",
    password: "ein-zweites-testpasswort",
    passwordHash: "",
    emailVerifiedAt: null,
  },
];

/** Ein Konto, das noch nicht bestätigt ist — für Negativtests. */
export const UNVERIFIED_ACCOUNT = ACCOUNTS[1];

/** Ein zweites Konto, das fremde Daten anfragen wird. */
export const OTHER_ACCOUNT = ACCOUNTS[1];

export const SESSION_COOKIE_NAME = "aahc_session";

/** Sieht aus wie ein Token, ist keines: nur für Formprüfungen. */
export const FAKE_SESSION_TOKEN = "test-token-nicht-verwenden-000000000000";
