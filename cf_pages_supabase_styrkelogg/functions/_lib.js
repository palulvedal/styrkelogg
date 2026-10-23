// Shared helpers for the API handlers. Files starting with "_" are not routed.

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Validates one session from the client and turns it into a DB row.
// Throws with a readable message on invalid input.
export function toRow(session, userEmail) {
  if (!session || typeof session !== 'object') throw new Error('Ugyldig økt.');

  const date = String(session.date || '').slice(0, 10);
  if (!DATE_RE.test(date)) throw new Error('Ugyldig dato.');

  const workoutKey = String(session.workoutKey || '');
  if (!workoutKey || workoutKey.length > 64) throw new Error('Ugyldig økttype.');

  const exerciseLogs = Array.isArray(session.exerciseLogs) ? session.exerciseLogs
    .filter(log => log && typeof log.exerciseKey === 'string' && Array.isArray(log.sets))
    .map(log => ({
      exerciseKey: log.exerciseKey.slice(0, 64),
      sets: log.sets.slice(0, 50).map(set => ({
        weight: Number(set?.weight) || 0,
        reps: Number(set?.reps) || 0,
        seconds: Number(set?.seconds) || 0,
      })),
    })) : [];
  if (!exerciseLogs.length) throw new Error('Økten har ingen øvelser.');

  const now = new Date().toISOString();
  const id = session.id ? String(session.id).slice(0, 100) : crypto.randomUUID();

  return {
    id,
    user_email: userEmail,
    session_date: date,
    workout_key: workoutKey,
    notes: String(session.notes || '').slice(0, 5000),
    payload_json: JSON.stringify({ exerciseLogs }),
    created_at: validIso(session.createdAt) || now,
    updated_at: now,
  };
}

export function fromRow(row) {
  let payload = {};
  try {
    payload = JSON.parse(row.payload_json || '{}');
  } catch (_) {
    // keep empty payload
  }
  return {
    id: row.id,
    date: row.session_date,
    workoutKey: row.workout_key,
    notes: row.notes || '',
    exerciseLogs: Array.isArray(payload.exerciseLogs) ? payload.exerciseLogs : [],
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

// Insert, or overwrite an existing row only when it belongs to the same user.
export function upsertStatement(db, row) {
  return db.prepare(`
    INSERT INTO workout_sessions (id, user_email, session_date, workout_key, notes, payload_json, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ON CONFLICT (id) DO UPDATE SET
      session_date = excluded.session_date,
      workout_key = excluded.workout_key,
      notes = excluded.notes,
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
    WHERE workout_sessions.user_email = excluded.user_email
  `).bind(row.id, row.user_email, row.session_date, row.workout_key, row.notes, row.payload_json, row.created_at, row.updated_at);
}

function validIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
