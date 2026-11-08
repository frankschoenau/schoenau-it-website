import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Passwörter mit scrypt.
 *
 * scrypt ist in Node enthalten; bcrypt oder argon2 wären eine weitere
 * Abhängigkeit für dieselbe Aufgabe. Die Parameter stehen im Hash selbst,
 * damit sich alte Hashes prüfen lassen, wenn die Werte später steigen.
 */

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// N=16384 braucht rund 16 MB; Nodes Vorgabe von 32 MB reicht knapp, deshalb
// ausdrücklich mehr.
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, keyB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(keyB64, "base64");

  const key = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  });

  // Längenprüfung vor dem Vergleich: timingSafeEqual wirft bei ungleicher Länge.
  if (key.length !== expected.length) return false;
  return timingSafeEqual(key, expected);
}
