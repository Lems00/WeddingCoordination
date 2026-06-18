export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('project_id');

  if (!projectId) {
    return Response.json({ error: 'project_id is required' }, { status: 400 });
  }

  const documents = await env.DB.prepare(
    `SELECT * FROM conducteur_documents WHERE project_id = ? ORDER BY start_time ASC`
  ).bind(projectId).all();

  return Response.json({ conducteurs: documents.results });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const id = body.id || `cond_${Date.now()}`;

  await env.DB.prepare(
    `INSERT INTO conducteur_documents
      (id, project_id, ceremony_event_id, title, subtitle, start_time, end_time, teardown_time, guest_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.project_id,
      body.ceremony_event_id,
      body.title,
      body.subtitle || '',
      body.start_time,
      body.end_time,
      body.teardown_time || body.end_time,
      Number(body.guest_count || 0)
    )
    .run();

  return Response.json({ id, ok: true }, { status: 201 });
}