/**
 * Helpers d'authentification — Web Crypto uniquement (compatible Cloudflare
 * Workers / Pages Functions). Aucune dépendance native (bcrypt indisponible
 * sur le runtime Workers ; on utilise PBKDF2 via crypto.subtle, standard CF).
 *
 *  - hashPassword / verifyPassword : PBKDF2-SHA256 (sel aléatoire, 100k itérations)
 *  - signJwt / verifyJwt           : JWT HS256 signé par HMAC-SHA256
 *  - getJwtSecret                  : lit env.JWT_SECRET (avertit si absent)
 *
 * Format de hash stocké : "pbkdf2$<iterations>$<saltB64>$<hashB64>"
 */

const PBKDF2_ITERATIONS = 100_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

// --- encodage base64 / base64url ------------------------------------------
function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function b64url(b64) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return s;
}

/** Comparaison à temps constant (évite les attaques temporelles). */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ===========================================================================
//  Mots de passe — PBKDF2
// ===========================================================================
async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bufToB64(bits);
}

/** Produit un hash stockable à partir d'un mot de passe en clair. */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToB64(salt.buffer)}$${hash}`;
}

/** Vrai si `password` correspond au hash PBKDF2 stocké. */
export async function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.startsWith("pbkdf2$")) return false;
  const [, iterStr, saltB64, hashB64] = stored.split("$");
  const iterations = parseInt(iterStr, 10) || PBKDF2_ITERATIONS;
  const salt = new Uint8Array(b64ToBuf(saltB64));
  const candidate = await pbkdf2(password, salt, iterations);
  return timingSafeEqual(candidate, hashB64);
}

/** Vrai si la valeur stockée est un hash PBKDF2 (et non un mot de passe en clair hérité). */
export function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith("pbkdf2$");
}

// ===========================================================================
//  JWT — HS256
// ===========================================================================
export function getJwtSecret(env) {
  const secret = env && env.JWT_SECRET;
  if (!secret) {
    console.warn(
      "[auth] JWT_SECRET absent — secret de dev utilisé. Définissez-le via .dev.vars (local) ou `wrangler pages secret put JWT_SECRET` (prod)."
    );
    return "dev-insecure-secret-change-me";
  }
  return secret;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Signe un JWT HS256. `expiresInSec` par défaut : 7 jours. */
export async function signJwt(payload, secret, expiresInSec = 7 * 24 * 3600) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { iat: now, exp: now + expiresInSec, ...payload };
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${b64url(btoa(JSON.stringify(header)))}.${b64url(btoa(JSON.stringify(fullPayload)))}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64url(bufToB64(sig))}`;
}

/** Vérifie un JWT HS256 ; renvoie le payload ou null (signature/exp invalide). */
export async function verifyJwt(token, secret) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(b64ToBuf(unb64url(sigB64))),
    enc.encode(data)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(dec.decode(b64ToBuf(unb64url(payloadB64))));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
