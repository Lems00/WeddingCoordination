/**
 * Route /api/conducteur-phases — Cloudflare Pages Function (JavaScript pur).
 *
 * POST   /api/conducteur-phases   -> crée une phase (+ ses actions et responsables)
 * PUT    /api/conducteur-phases   -> met à jour une phase (remplace actions et responsables)
 * DELETE /api/conducteur-phases?id=...  -> supprime une phase (cascade actions/responsables)
 *
 * Le payload attendu correspond à ConducteurPhase (src/components/Conducteur.tsx) :
 *   { id?, jour_id, title, time_slot, actions: [{id?, content, sort_order}],
 *     note?, custom_html?, responsables: [{type, ref_id, scope}], completed?, sort_order? }
 *
 * Nécessite un binding D1 nommé "DB".
 */

import { json, error, readJson, getDb, uid } from "./_utils.js";

async function replaceActionsAndResponsables(db, phaseId, actions, responsables) {
  await db.prepare("DELETE FROM conducteur_actions WHERE phase_id = ?").bind(phaseId).run();
  for (const a of actions || []) {
    await db
      .prepare("INSERT INTO conducteur_actions (id, phase_id, content, sort_order) VALUES (?, ?, ?, ?)")
      .bind(a.id || uid("a"), phaseId, a.content, Number(a.sort_order || 0))
      .run();
  }

  await db.prepare("DELETE FROM conducteur_phase_responsibles WHERE phase_id = ?").bind(phaseId).run();
  for (const r of responsables || []) {
    await db
      .prepare(
        `INSERT INTO conducteur_phase_responsibles (phase_id, vendor_id, user_id, scope_label, role_label)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        phaseId,
        r.type === "vendor" ? r.ref_id : null,
        r.type === "user" ? r.ref_id : null,
        r.scope || "",
        "responsable"
      )
      .run();
  }
}

export async function onRequestPost(context) {
  try {
    const db = getDb(context.env);
    const body = await readJson(context.request);
    if (!body || !body.jour_id || !body.title || !body.time_slot) {
      return error("Champs requis : jour_id, title, time_slot");
    }
    const id = body.id || uid("ph");

    await db
      .prepare(
        `INSERT OR REPLACE INTO conducteur_phases
          (id, jour_id, title, time_slot, note, custom_html, completed, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.jour_id,
        body.title,
        body.time_slot,
        body.note || "",
        body.custom_html || "",
        body.completed ? 1 : 0,
        Number(body.sort_order || 0)
      )
      .run();

    await replaceActionsAndResponsables(db, id, body.actions, body.responsables);

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

    // Mise à jour du seul statut "terminé" (bascule rapide, sans repasser toutes les actions)
    if (body.completedOnly !== undefined) {
      await db
        .prepare("UPDATE conducteur_phases SET completed = ? WHERE id = ?")
        .bind(body.completedOnly ? 1 : 0, body.id)
        .run();
      return json({ ok: true });
    }

    if (!body.title || !body.time_slot) return error("Champs requis : title, time_slot");

    await db
      .prepare(
        `UPDATE conducteur_phases SET
           title = ?, time_slot = ?, note = ?, custom_html = ?, completed = ?, sort_order = ?
         WHERE id = ?`
      )
      .bind(
        body.title,
        body.time_slot,
        body.note || "",
        body.custom_html || "",
        body.completed ? 1 : 0,
        Number(body.sort_order || 0),
        body.id
      )
      .run();

    await replaceActionsAndResponsables(db, body.id, body.actions, body.responsables);

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

    await db.prepare("DELETE FROM conducteur_phases WHERE id = ?").bind(id).run();
    return json({ ok: true });
  } catch (e) {
    return error(e.message, 500);
  }
}
