/**
 * Route /api/notifications — Cloudflare Pages Function (JavaScript pur).
 *
 * GET   /api/notifications?user_id=...   -> notifications d'un utilisateur
 * POST  /api/notifications               -> crée une notification
 * PATCH /api/notifications               -> marque comme lue(s)
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, uid, getDb } from "./_utils.js";

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("user_id");
    if (!userId) return error("Paramètre requis : user_id");

    const { results } = await db
      .prepare(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
      )
      .bind(userId)
      .all();

    return json({ notifications: results || [] });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.user_id || !body.type || !body.title) {
      return error("Champs requis : user_id, type, title");
    }

    const id = body.id || uid("n");
    await db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, project_id, type, title, message, is_read,
           related_entity_type, related_entity_id)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(
        id,
        body.user_id,
        body.project_id || null,
        body.type,
        body.title,
        body.message || "",
        body.related_entity_type || null,
        body.related_entity_id || null
      )
      .run();

    return json({ id, ok: true }, 201);
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPatch(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);

    // Marquer toutes lues pour un utilisateur
    if (body && body.markAll && body.user_id) {
      await db
        .prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?")
        .bind(body.user_id)
        .run();
      return json({ ok: true });
    }

    // Marquer une notification précise comme lue
    if (body && body.id) {
      await db
        .prepare("UPDATE notifications SET is_read = 1 WHERE id = ?")
        .bind(body.id)
        .run();
      return json({ ok: true });
    }

    return error("Fournir { id } ou { markAll: true, user_id }");
  } catch (e) {
    return error(e.message, 500);
  }
}
