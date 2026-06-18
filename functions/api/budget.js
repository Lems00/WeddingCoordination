/**
 * Route /api/budget — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/budget?project_id=...  -> dépenses d'un projet
 * POST   /api/budget                 -> crée une dépense
 * PUT    /api/budget                 -> met à jour une dépense
 * DELETE /api/budget?id=...          -> supprime une dépense
 *
 * Table cible : `expenses` (cf. database/schema.sql — source de vérité).
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
      .prepare("SELECT * FROM expenses WHERE project_id = ? ORDER BY date ASC")
      .bind(projectId)
      .all();
    return json({ expenses: results || [] });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.id || !body.project_id || !body.label) {
      return error("Champs requis : id, project_id, label");
    }

    await db
      .prepare(
        `INSERT INTO expenses
          (id, project_id, vendor_id, label, category, amount, date, paid, invoice_ref, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.id,
        body.project_id,
        body.vendor_id || null,
        body.label,
        body.category || "",
        Number(body.amount || 0),
        body.date,
        body.paid ? 1 : 0,
        body.invoice_ref || null,
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
        `UPDATE expenses SET
           label = ?, category = ?, amount = ?, date = ?, paid = ?,
           vendor_id = ?, invoice_ref = ?, notes = ?
         WHERE id = ?`
      )
      .bind(
        body.label,
        body.category || "",
        Number(body.amount || 0),
        body.date,
        body.paid ? 1 : 0,
        body.vendor_id || null,
        body.invoice_ref || null,
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

    await db.prepare("DELETE FROM expenses WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
