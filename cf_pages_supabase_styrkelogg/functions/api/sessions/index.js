import { json, toRow, fromRow, upsertStatement } from '../../_lib.js';

// GET /api/sessions – all sessions for the signed-in user
export async function onRequestGet({ env, data }) {
  const { results } = await env.DB.prepare(`
    SELECT id, session_date, workout_key, notes, payload_json, created_at, updated_at
    FROM workout_sessions
    WHERE user_email = ?1
    ORDER BY session_date ASC, created_at ASC
  `).bind(data.userEmail).all();
  return json({ sessions: (results || []).map(fromRow) });
}

// POST /api/sessions – create one session
export async function onRequestPost({ request, env, data }) {
  let row;
  try {
    const body = await request.json();
    row = toRow({ ...body, id: undefined }, data.userEmail);
  } catch (error) {
    return json({ error: error.message || 'Ugyldig forespørsel.' }, 400);
  }
  await upsertStatement(env.DB, row).run();
  return json({ session: fromRow(row) }, 201);
}

// PUT /api/sessions – bulk upsert (JSON import)
export async function onRequestPut({ request, env, data }) {
  let rows;
  try {
    const body = await request.json();
    if (!Array.isArray(body?.sessions) || !body.sessions.length) {
      throw new Error('Mangler sessions-array.');
    }
    if (body.sessions.length > 5000) throw new Error('For mange økter i én import.');
    rows = body.sessions.map(session => toRow(session, data.userEmail));
  } catch (error) {
    return json({ error: error.message || 'Ugyldig forespørsel.' }, 400);
  }

  const statements = rows.map(row => upsertStatement(env.DB, row));
  for (let i = 0; i < statements.length; i += 100) {
    await env.DB.batch(statements.slice(i, i + 100));
  }
  return json({ imported: rows.length });
}
