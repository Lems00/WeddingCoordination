/**
 * Route /api/conducteurs — Cloudflare Pages Function (JavaScript pur).
 *
 * GET    /api/conducteurs?project_id=...   -> arbre complet des jours du conducteur
 *                                              (jours -> phases -> actions + responsables),
 *                                              déjà au format attendu par le frontend
 *                                              (voir ConducteurJour dans src/components/Conducteur.tsx)
 * POST   /api/conducteurs                  -> crée un jour
 * PUT    /api/conducteurs                  -> met à jour un jour
 * DELETE /api/conducteurs?id=...           -> supprime un jour (cascade phases/actions/responsables)
 *
 * Les phases sont gérées par /api/conducteur-phases (voir ce fichier).
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, getDb, uid } from "./_utils.js";

export async function onRequestGet(context) {
  try {
    const db = getDb(context.env);
    const url = new URL(context.request.url);
    const projectId = url.searchParams.get("project_id");
    if (!projectId) return error("Paramètre requis : project_id");

    const { results: jours } = await db
      .prepare(
        "SELECT * FROM conducteur_jours WHERE project_id = ? ORDER BY date ASC, time_start ASC, sort_order ASC"
      )
      .bind(projectId)
      .all();

    if (!jours.length) return json({ jours: [] });

    const jourIds = jours.map((j) => j.id);
    const jourPlaceholders = jourIds.map(() => "?").join(",");

    const { results: phases } = await db
      .prepare(
        `SELECT * FROM conducteur_phases WHERE jour_id IN (${jourPlaceholders}) ORDER BY sort_order ASC`
      )
      .bind(...jourIds)
      .all();

    let actions = [];
    let responsables = [];
    if (phases.length) {
      const phaseIds = phases.map((p) => p.id);
      const phasePlaceholders = phaseIds.map(() => "?").join(",");

      ({ results: actions } = await db
        .prepare(
          `SELECT * FROM conducteur_actions WHERE phase_id IN (${phasePlaceholders}) ORDER BY sort_order ASC`
        )
        .bind(...phaseIds)
        .all());

      ({ results: responsables } = await db
        .prepare(
          `SELECT r.phase_id, r.vendor_id, r.user_id, r.scope_label,
                  COALESCE(v.name, u.name) AS label,
                  COALESCE(v.color, u.color) AS color
           FROM conducteur_phase_responsibles r
           LEFT JOIN vendors v ON v.id = r.vendor_id
           LEFT JOIN users u ON u.id = r.user_id
           WHERE r.phase_id IN (${phasePlaceholders})`
        )
        .bind(...phaseIds)
        .all());
    }

    const actionsByPhase = {};
    for (const a of actions) (actionsByPhase[a.phase_id] ||= []).push(a);
    const respByPhase = {};
    for (const r of responsables) (respByPhase[r.phase_id] ||= []).push(r);
    const phasesByJour = {};
    for (const p of phases) (phasesByJour[p.jour_id] ||= []).push(p);

    const jourList = jours.map((j) => ({
      id: j.id,
      label: j.label,
      date: j.date,
      subtitle: j.subtitle || "",
      time_start: j.time_start || "08:00",
      time_end: j.time_end || "23:00",
      guest_count: j.guest_count || 0,
      notes: j.notes || "",
      sort_order: j.sort_order,
      phases: (phasesByJour[j.id] || []).map((p) => ({
        id: p.id,
        title: p.title,
        time_slot: p.time_slot,
        actions: (actionsByPhase[p.id] || []).map((a) => ({
          id: a.id,
          content: a.content,
          sort_order: a.sort_order,
        })),
        note: p.note || "",
        custom_html: p.custom_html || "",
        responsables: (respByPhase[p.id] || []).map((r) => ({
          id: `r_${r.phase_id}_${r.vendor_id || r.user_id}`,
          type: r.vendor_id ? "vendor" : "user",
          ref_id: r.vendor_id || r.user_id,
          label: r.label || "",
          scope: r.scope_label || "",
          color: r.color || "#4318FF",
        })),
        completed: !!p.completed,
        sort_order: p.sort_order,
      })),
    }));

    return json({ jours: jourList });
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.project_id || !body.label || !body.date) {
      return error("Champs requis : project_id, label, date");
    }
    const id = body.id || uid("j");

    await db
      .prepare(
        `INSERT OR REPLACE INTO conducteur_jours
          (id, project_id, label, date, time_start, time_end, subtitle, guest_count, notes, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.project_id,
        body.label,
        body.date,
        body.time_start || "08:00",
        body.time_end || "23:00",
        body.subtitle || "",
        Number(body.guest_count || 0),
        body.notes || "",
        Number(body.sort_order || 0)
      )
      .run();

    return json({ id, ok: true }, 201);
  } catch (e) {
    return error(e.message, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.id || !body.label || !body.date) {
      return error("Champs requis : id, label, date");
    }

    await db
      .prepare(
        `UPDATE conducteur_jours SET
           label = ?, date = ?, time_start = ?, time_end = ?,
           subtitle = ?, guest_count = ?, notes = ?, sort_order = ?
         WHERE id = ?`
      )
      .bind(
        body.label,
        body.date,
        body.time_start || "08:00",
        body.time_end || "23:00",
        body.subtitle || "",
        Number(body.guest_count || 0),
        body.notes || "",
        Number(body.sort_order || 0),
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

    await db.prepare("DELETE FROM conducteur_jours WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
