/**
 * Route /api/users — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/users          -> liste des utilisateurs (sans hash de mot de passe)
 * POST   /api/users          -> crée un utilisateur
 * PUT    /api/users          -> met à jour un utilisateur (profil ; mot de passe optionnel)
 * DELETE /api/users?id=...   -> supprime un utilisateur
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, getDb } from "./_utils.js";

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const { results } = await db
      .prepare(
        `SELECT id, agency_id, username, email, name, role, color, theme, avatar_url, is_active, created_at
         FROM users ORDER BY name ASC`
      )
      .all();
    return json({ users: results || [] });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.id || !body.username || !body.name) {
      return error("Champs requis : id, username, name");
    }

    await db
      .prepare(
        `INSERT INTO users (id, agency_id, username, password_hash, email, name, role, color, theme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.id,
        body.agency_id || null,
        body.username,
        body.password_hash || "",
        body.email || null,
        body.name,
        body.role || "client",
        body.color || "#4318FF",
        body.theme || "light"
      )
      .run();

    return json({ id: body.id, ok: true }, 201);
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.id) return error("Champ requis : id");

    // Profil
    await db
      .prepare(
        `UPDATE users SET
           name = ?, role = ?, color = ?, theme = ?, email = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        body.name,
        body.role || "client",
        body.color || "#4318FF",
        body.theme || "light",
        body.email || null,
        body.id
      )
      .run();

    // Mot de passe : mis à jour uniquement s'il est explicitement fourni (déjà hashé en amont).
    if (body.password_hash) {
      await db
        .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(body.password_hash, body.id)
        .run();
    }

    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const db = getDb(context.env);
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (!id) return error("Paramètre requis : id");

    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
