/**
 * Endpoint d'authentification — Cloudflare Pages Functions.
 *
 * POST /api/auth   Body : { username, password }   -> { ok, user, token }
 * GET  /api/auth   Diagnostic : liste des tables (binding D1).
 *
 * Sécurité (Jalon 1) :
 *  - mots de passe vérifiés via PBKDF2 (functions/api/_auth.js) ;
 *  - migration douce : un mot de passe encore stocké en clair (seed historique)
 *    est accepté UNE fois puis re-hashé automatiquement en base ;
 *  - jeton de session = JWT HS256 signé (plus de placeholder base64).
 */

import {
  hashPassword,
  verifyPassword,
  isHashed,
  signJwt,
  getJwtSecret,
} from "./_auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!username || !password) {
    return Response.json({ ok: false, error: "Identifiants requis" }, { status: 400 });
  }

  const user = await env.DB.prepare(
    `SELECT id, username, password_hash, name, role, color, theme, agency_id
     FROM users WHERE lower(username) = ? LIMIT 1`
  )
    .bind(username)
    .first();

  if (!user) {
    return Response.json({ ok: false, error: "Utilisateur introuvable" }, { status: 401 });
  }

  // 1) Mot de passe hashé (cas normal) : vérification PBKDF2.
  // 2) Mot de passe hérité en clair : comparaison directe, puis re-hash en base.
  let authok = false;
  if (isHashed(user.password_hash)) {
    authok = await verifyPassword(password, user.password_hash);
  } else if (user.password_hash === password) {
    authok = true;
    try {
      const upgraded = await hashPassword(password);
      await env.DB.prepare(
        "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
      )
        .bind(upgraded, user.id)
        .run();
    } catch (e) {
      console.warn("[auth] re-hash du mot de passe hérité échoué:", e.message);
    }
  }

  if (!authok) {
    return Response.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await signJwt(
    { sub: user.id, role: user.role, agency_id: user.agency_id },
    getJwtSecret(env)
  );

  return Response.json({
    ok: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      color: user.color,
      theme: user.theme,
      agency_id: user.agency_id,
    },
  });
}

export async function onRequestGet({ env }) {
  const tables = await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  ).all();
  return Response.json({ ok: true, tables: tables.results.map((r) => r.name) });
}
