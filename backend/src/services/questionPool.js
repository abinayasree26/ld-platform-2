/**
 * questionPool.js — Pre-generated question bank (offline fallback)
 *
 * Two-tier question strategy:
 *   ONLINE  → AI generates fresh questions (and we auto-save them here)
 *   OFFLINE → we serve from this stored pool, organized by grade+level+category,
 *             avoiding questions the student has already seen.
 */

const { query } = require('../config/database');

/**
 * Save AI-generated questions into the pool for later offline reuse.
 * De-duplicates via the UNIQUE(scope, category, grade, level, question_text) constraint.
 * Returns the pool row IDs for the saved/existing questions (so callers can
 * mark them seen). Safe to call — never throws to the caller.
 */
async function savePooled({ scope = 'practice', category, grade = null, level = 1, ldType = null, questions = [] }) {
  if (!Array.isArray(questions) || !questions.length) return [];
  const ids = [];
  for (const q of questions) {
    try {
      const { rows } = await query(
        `INSERT INTO question_pool (scope, category, grade, level, ld_type, question_text, options, correct_answer, explanation, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ai')
         ON CONFLICT (scope, category, grade, level, question_text)
         DO UPDATE SET explanation = EXCLUDED.explanation
         RETURNING id`,
        [scope, category, grade, level, ldType, q.q, JSON.stringify(q.options), q.answer, q.explanation || '']
      );
      if (rows[0]?.id) ids.push(rows[0].id);
    } catch { /* ignore individual insert failures */ }
  }
  return ids;
}

/**
 * Fetch questions from the pool for a given grade+level+category, preferring
 * ones the student hasn't seen yet. Falls back to grade-agnostic rows, then to
 * any row for that level+category if the exact-grade pool is thin.
 *
 * Returns array of { q, options, answer, explanation, _poolId } or [].
 */
async function getPooled({ scope = 'practice', category, grade = null, level = 1, userId = null, count = 5 }) {
  // Prefer unseen, exact grade match; relax progressively if not enough rows.
  const attempts = [
    { g: grade, unseenOnly: true },
    { g: grade, unseenOnly: false },
    { g: null, unseenOnly: false },   // grade-agnostic
    { g: 'any', unseenOnly: false },  // any grade for this level+category
  ];

  for (const a of attempts) {
    const params = [scope, category, level, count];
    let gradeClause;
    if (a.g === 'any') {
      gradeClause = '';
    } else if (a.g === null) {
      gradeClause = 'AND grade IS NULL';
    } else {
      gradeClause = 'AND grade = $5';
      params.splice(3, 0, a.g); // insert grade before count
    }

    let seenClause = '';
    if (a.unseenOnly && userId) {
      const uidPos = params.length + 1;
      seenClause = `AND qp.id NOT IN (SELECT question_id FROM student_seen_pool WHERE user_id = $${uidPos})`;
      params.push(userId);
    }

    // Rebuild params cleanly for clarity
    const rows = await fetchRows(scope, category, level, a.g, count, a.unseenOnly ? userId : null);
    if (rows.length >= Math.min(count, 1)) {
      return rows.map(mapRow);
    }
  }
  return [];
}

async function fetchRows(scope, category, level, grade, count, userId) {
  const params = [scope, category, level];
  let gradeClause = '';
  if (grade === null) {
    gradeClause = 'AND grade IS NULL';
  } else if (grade !== 'any') {
    params.push(grade);
    gradeClause = `AND grade = $${params.length}`;
  }
  let seenClause = '';
  if (userId) {
    params.push(userId);
    seenClause = `AND qp.id NOT IN (SELECT question_id FROM student_seen_pool WHERE user_id = $${params.length})`;
  }
  params.push(count);
  const limitPos = params.length;

  const { rows } = await query(
    `SELECT qp.id, qp.question_text, qp.options, qp.correct_answer, qp.explanation
       FROM question_pool qp
      WHERE qp.scope = $1 AND qp.category = $2 AND qp.level = $3
        ${gradeClause}
        ${seenClause}
      ORDER BY qp.times_served ASC, RANDOM()
      LIMIT $${limitPos}`,
    params
  );
  return rows;
}

function mapRow(r) {
  let options = r.options;
  if (typeof options === 'string') { try { options = JSON.parse(options); } catch { options = []; } }
  return {
    q: r.question_text,
    options,
    answer: r.correct_answer,
    explanation: r.explanation || '',
    _poolId: r.id,
  };
}

/**
 * Mark pooled questions as seen by a student (so they rotate on retake) and
 * bump their served counter.
 */
async function markSeen(userId, poolIds = []) {
  if (!userId || !poolIds.length) return;
  for (const id of poolIds) {
    try {
      await query(
        `INSERT INTO student_seen_pool (user_id, question_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [userId, id]
      );
      await query('UPDATE question_pool SET times_served = times_served + 1 WHERE id = $1', [id]);
    } catch { /* ignore */ }
  }
}

/**
 * Return the set of question TEXTS a student has already seen (from the pool),
 * so freshly AI-generated questions can be filtered against them to guarantee
 * no repeats — even in the online path where the AI has no memory.
 */
async function getSeenTexts(userId, { scope, category } = {}) {
  if (!userId) return new Set();
  try {
    const { rows } = await query(
      `SELECT LOWER(TRIM(qp.question_text)) AS t
         FROM student_seen_pool sp
         JOIN question_pool qp ON qp.id = sp.question_id
        WHERE sp.user_id = $1
          AND ($2::text IS NULL OR qp.scope = $2)
          AND ($3::text IS NULL OR qp.category = $3)`,
      [userId, scope || null, category || null]
    );
    return new Set(rows.map(r => r.t));
  } catch {
    return new Set();
  }
}

/** How many pooled questions exist for a slot (used to decide if seeding is needed). */
async function countPooled({ scope = 'practice', category, grade = null, level = 1 }) {
  const params = [scope, category, level];
  let gradeClause = 'AND grade IS NULL';
  if (grade !== null) { params.push(grade); gradeClause = `AND grade = $${params.length}`; }
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM question_pool WHERE scope=$1 AND category=$2 AND level=$3 ${gradeClause}`,
    params
  );
  return rows[0]?.n || 0;
}

module.exports = { savePooled, getPooled, markSeen, countPooled, getSeenTexts };
