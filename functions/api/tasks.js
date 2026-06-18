/**
 * Route /api/tasks — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/tasks?project_id=...   -> liste des tâches d'un projet
 * POST   /api/tasks                  -> crée une tâche
 * PUT    /api/tasks                  -> met à jour une tâche (statut seul, ou tâche complète)
 * DELETE /api/tasks?id=...&project_id=...  -> supprime une tâche
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, getDb } from "./_utils.js";

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get("project_id");

    let stmt;
    if (projectId) {
      stmt = db
        .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC")
        .bind(projectId);
    } else {
      stmt = db.prepare("SELECT * FROM tasks ORDER BY start_date ASC");
    }

    const { results } = await stmt.all();
    return json({ tasks: results || [] });
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
        `INSERT INTO tasks
          (id, project_id, phase, category, name, duration, start_date, end_date,
           responsible_user_id, responsible_name, predecessor, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.id,
        body.project_id,
        body.phase || "Préparation",
        body.category || "",
        body.name,
        body.duration || "1 jour",
        body.start_date,
        body.end_date,
        body.responsible_user_id || null,
        body.responsible_name || "",
        body.predecessor || "",
        body.status || "À faire",
        body.sort_order || 0
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
    if (!body || !body.id || !body.project_id) {
      return error("Champs requis : id, project_id");
    }

    // Mise à jour complète si la charge utile décrit une tâche entière (présence de `name`),
    // sinon mise à jour du seul statut (compat avec le PUT historique).
    if (body.name !== undefined) {
      await db
        .prepare(
          `UPDATE tasks SET
             phase = ?, category = ?, name = ?, duration = ?,
             start_date = ?, end_date = ?, responsible_user_id = ?,
             responsible_name = ?, predecessor = ?, status = ?,
             updated_at = datetime('now')
           WHERE id = ? AND project_id = ?`
        )
        .bind(
          body.phase || "Préparation",
          body.category || "",
          body.name,
          body.duration || "1 jour",
          body.start_date,
          body.end_date,
          body.responsible_user_id || null,
          body.responsible_name || "",
          body.predecessor || "",
          body.status || "À faire",
          body.id,
          body.project_id
        )
        .run();
      return json({ ok: true });
    }

    if (!body.status) return error("Champs requis : status (ou tâche complète avec name)");
    await db
      .prepare(
        "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ? AND project_id = ?"
      )
      .bind(body.status, body.id, body.project_id)
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
    const projectId = url.searchParams.get("project_id");
    if (!id) return error("Paramètre requis : id");

    // project_id facultatif : la tâche est identifiée par (id, project_id) au schéma,
    // mais l'id reste unique en pratique côté front.
    if (projectId) {
      await db.prepare("DELETE FROM tasks WHERE id = ? AND project_id = ?").bind(id, projectId).run();
    } else {
      await db.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    }
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
