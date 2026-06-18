import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isHashed,
  signJwt,
  verifyJwt,
} from "./_auth.js";

describe("PBKDF2 — hachage de mot de passe", () => {
  it("produit un hash au format pbkdf2$...", async () => {
    const h = await hashPassword("Admin2026");
    expect(h.startsWith("pbkdf2$")).toBe(true);
    expect(isHashed(h)).toBe(true);
    expect(isHashed("Admin2026")).toBe(false);
  });

  it("vérifie le bon mot de passe et rejette le mauvais", async () => {
    const h = await hashPassword("Admin2026");
    expect(await verifyPassword("Admin2026", h)).toBe(true);
    expect(await verifyPassword("mauvais", h)).toBe(false);
  });

  it("deux hachages du même mot de passe diffèrent (sel aléatoire)", async () => {
    const a = await hashPassword("x");
    const b = await hashPassword("x");
    expect(a).not.toBe(b);
    expect(await verifyPassword("x", a)).toBe(true);
    expect(await verifyPassword("x", b)).toBe(true);
  });

  it("verifyPassword renvoie false sur une valeur non hachée", async () => {
    expect(await verifyPassword("x", "x")).toBe(false);
  });
});

describe("JWT HS256", () => {
  const secret = "secret-de-test";

  it("signe et vérifie un jeton valide", async () => {
    const token = await signJwt({ sub: "u1", role: "admin" }, secret, 3600);
    expect(token.split(".").length).toBe(3);
    const payload = await verifyJwt(token, secret);
    expect(payload).not.toBeNull();
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("admin");
  });

  it("rejette un jeton signé avec un autre secret", async () => {
    const token = await signJwt({ sub: "u1" }, secret, 3600);
    expect(await verifyJwt(token, "autre-secret")).toBeNull();
  });

  it("rejette un jeton expiré", async () => {
    const token = await signJwt({ sub: "u1" }, secret, -10); // déjà expiré
    expect(await verifyJwt(token, secret)).toBeNull();
  });

  it("rejette une entrée malformée", async () => {
    expect(await verifyJwt("pas-un-jwt", secret)).toBeNull();
    expect(await verifyJwt(null, secret)).toBeNull();
  });
});
