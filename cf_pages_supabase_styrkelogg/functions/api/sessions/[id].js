import { json } from '../../_lib.js';

// DELETE /api/sessions/:id – delete one of the user's own sessions
export async function onRequestDelete({ params, env, data }) {
  const result = await env.DB.prepare(
    'DELETE FROM workout_sessions WHERE id = ?1 AND user_email = ?2',
  ).bind(String(params.id), data.userEmail).run();

  if (!result.meta?.changes) {
    return json({ error: 'Fant ikke økten.' }, 404);
  }
  return json({ deleted: true });
}
