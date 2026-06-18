/**
 * Route /api/vendors — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/vendors?project_id=...  -> prestataires d'un projet
 * POST   /api/vendors                 -> crée un prestataire
 * PUT    /api/vendors                 -> met à jour un prestataire
 * DELETE /api/vendors?id=...          -> supprime un prestataire
 *
 * `statut` est stocké en code (confirme / en_recherche / contacte / refuse).
 * La conversion code <-> libellé affiché se fait côté front (apiClient.js).
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, getDb } from "./_utils.js";

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get("project_id");
    if (!projectId) return error("Paramètre requis : project_id");

    const { results } = await db
      .prepare("SELECT * FROM vendors WHERE project_id = ? ORDER BY name ASC")
      .bind(projectId)
      .all();
    return json({ vendors: results || [] });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.id || !body.project_id || !body.name) {
      return error("Champs requis : id, project_id, name");
    }

    await db
      .prepare(
        `INSERT INTO vendors
          (id, project_id, name, role, scope, color, statut,
           contact_name, contact_phone, contact_email, quote_amount, paid_amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.id,
        body.project_id,
        body.name,
        body.role || "",
        body.scope || null,
        body.color || "#4318FF",
        body.statut || "en_recherche",
        body.contact_name || null,
        body.contact_phone || null,
        body.contact_email || null,
        body.quote_amount ?? null,
        body.paid_amount ?? 0,
        body.notes || null
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

    await db
      .prepare(
        `UPDATE vendors SET
           name = ?, role = ?, scope = ?, color = ?, statut = ?,
           contact_name = ?, contact_phone = ?, contact_email = ?,
           quote_amount = ?, paid_amount = ?, notes = ?
         WHERE id = ?`
      )
      .bind(
        body.name,
        body.role || "",
        body.scope || null,
        body.color || "#4318FF",
        body.statut || "en_recherche",
        body.contact_name || null,
        body.contact_phone || null,
        body.contact_email || null,
        body.quote_amount ?? null,
        body.paid_amount ?? 0,
        body.notes || null,
        body.id
      )
      .run();

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

    await db.prepare("DELETE FROM vendors WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
