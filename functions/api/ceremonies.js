export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('project_id');
  if (!projectId) return Response.json({ error: 'project_id requis' }, { status: 400 });

  const { results } = await env.DB.prepare(
    `SELECT * FROM ceremony_events WHERE project_id = ? ORDER BY start_time ASC`
  ).bind(projectId).all();
  return Response.json({ ceremonies: results });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const id = body.id || `ceremony_${Date.now()}`;
  await env.DB.prepare(
    `INSERT INTO ceremony_events
      (id, project_id, type, title, date, start_time, end_time, venue, included_in_scope, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.project_id,
      body.type || 'combined',
      body.title,
      body.date,
      body.start_time,
      body.end_time,
      body.venue || '',
      body.included_in_scope ? 1 : 0,
      body.notes || ''
    )
    .run();
  return Response.json({ ok: true, id }, { status: 201 });
}

export async function onRequestPut({ request, env }) {
  const body = await request.json();
  await env.DB.prepare(
    `UPDATE ceremony_events
     SET title = ?, date = ?, start_time = ?, end_time = ?, venue = ?, included_in_scope = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.title,
      body.date,
      body.start_time,
      body.end_time,
      body.venue || '',
      body.included_in_scope ? 1 : 0,
      body.notes || '',
      body.id
    )
    .run();
  return Response.json({ ok: true });
}
