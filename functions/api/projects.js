/**
 * Route /api/projects — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/projects        -> liste des projets (avec assigned_planners / assigned_clients)
 * POST   /api/projects        -> crée un projet + ses assignations
 * PUT    /api/projects        -> met à jour un projet + ses assignations
 * DELETE /api/projects?id=...  -> supprime un projet (cascade D1 sur tâches, vendors, etc.)
 *
 * Les assignations planners/clients vivent dans les tables de jonction
 * project_planners / project_clients (cf. database/schema.sql). On les
 * agrège ici pour exposer côté front les tableaux assigned_planners[] /
 * assigned_clients[] attendus par le store.
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, uid, getDb } from "./_utils.js";

/** Remplace l'ensemble des assignations (planners ou clients) d'un projet. */
async function replaceAssignments(db, table, projectId, userIds) {
  await db.prepare(`DELETE FROM ${table} WHERE project_id = ?`).bind(projectId).run();
  for (const userId of userIds || []) {
    await db
      .prepare(`INSERT OR IGNORE INTO ${table} (project_id, user_id) VALUES (?, ?)`)
      .bind(projectId, userId)
      .run();
  }
}

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const { results: projects } = await db
      .prepare("SELECT * FROM projects ORDER BY date ASC")
      .all();

    const { results: planners } = await db.prepare("SELECT project_id, user_id FROM project_planners").all();
    const { results: clients } = await db.prepare("SELECT project_id, user_id FROM project_clients").all();

    const group = (rows) =>
      (rows || []).reduce((acc, r) => {
        (acc[r.project_id] ||= []).push(r.user_id);
        return acc;
      }, {});
    const plannersByProject = group(planners);
    const clientsByProject = group(clients);

    const enriched = (projects || []).map((p) => ({
      ...p,
      assigned_planners: plannersByProject[p.id] || [],
      assigned_clients: clientsByProject[p.id] || [],
    }));

    return json({ projects: enriched });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.couple || !body.date) {
      return error("Champs requis : couple, date");
    }

    const id = body.id || uid("proj");
    await db
      .prepare(
        `INSERT INTO projects
          (id, agency_id, name, couple, date, venue, status, color, budget, currency, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.agency_id || null,
        body.name || body.couple,
        body.couple,
        body.date,
        body.venue || "",
        body.status || "brouillon",
        body.color || "#4318FF",
        body.budget || 0,
        body.currency || "MGA",
        body.notes || ""
      )
      .run();

    await replaceAssignments(db, "project_planners", id, body.assigned_planners);
    await replaceAssignments(db, "project_clients", id, body.assigned_clients);

    return json({ id, ok: true }, 201);
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
        `UPDATE projects SET
           name = ?, couple = ?, date = ?, venue = ?, status = ?,
           color = ?, budget = ?, currency = ?, notes = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(
        body.name || body.couple,
        body.couple,
        body.date,
        body.venue || "",
        body.status || "brouillon",
        body.color || "#4318FF",
        body.budget || 0,
        body.currency || "MGA",
        body.notes || "",
        body.id
      )
      .run();

    // Les tableaux d'assignation ne sont remplacés que s'ils sont fournis,
    // pour autoriser une mise à jour partielle (ex. patch de statut seul).
    if (Array.isArray(body.assigned_planners)) {
      await replaceAssignments(db, "project_planners", body.id, body.assigned_planners);
    }
    if (Array.isArray(body.assigned_clients)) {
      await replaceAssignments(db, "project_clients", body.id, body.assigned_clients);
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

    await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
