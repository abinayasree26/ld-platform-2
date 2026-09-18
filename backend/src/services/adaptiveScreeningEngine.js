/**
 * Adaptive Screening Engine (Phase 2)
 * ------------------------------------------------------------------
 * PURE, DETERMINISTIC assessment logic for the NEW adaptive screening
 * (English + Mathematics). No DB, no network, no AI here — objective
 * scores are computed first; Gemma is used LATER (Phase 5) only for
 * explanations/practice, never to decide a score.
 *
 * This module does NOT touch the existing LD screening, auth, routes,
 * or the Practice module. It only reads the Phase-1 question bank.
 *
 * Exposed pure functions:
 *   scoreAnswer(question, studentAnswer)      -> { correct, awarded, points, method, needsAI }
 *   computeSkillScores(questions, answers)    -> { bySkill, bySubject }
 *   classifyLevel(percent)                    -> "Advanced"|"Intermediate"|"Beginner"
 *   bandFor(percent)                          -> "Strong"|"Developing"|"Needs Support"
 *   detectStrengthsWeaknesses(skillScores)    -> { strong, developing, needsSupport }
 *   recommendedPracticeFor(subject, skill)    -> [string]
 *   buildScreeningResult({...})               -> full result dashboard object
 *   generateNextLevelTestBlueprint({...})     -> personalized next-test plan
 *
 * Thresholds (per spec):
 *   80–100% -> Strong / Advanced
 *   60–79%  -> Developing / Intermediate
 *   0–59%   -> Needs Support / Beginner
 */

'use strict';

// ─── helpers ──────────────────────────────────────────────────────
const norm = (v) =>
  v === null || v === undefined
    ? ''
    : String(v).trim().toLowerCase().replace(/\s+/g, ' ');

// numeric compare: strip currency/units, keep digits, sign, decimal, slash
const numNorm = (v) =>
  String(v == null ? '' : v)
    .toLowerCase()
    .replace(/[₹$,]/g, '')
    .replace(/\b(cm2|cm²|cm|m|degrees|°|kg|g|rs\.?)\b/g, '')
    .replace(/\s+/g, '')
    .trim();

// scoring methods that a computer can grade objectively right now
const OBJECTIVE = new Set([
  'exact-match', 'numeric-match', 'normalized-match',
  'ordered-match', 'matching-pairs',
]);
// methods that need STT transcript and/or Gemma rubric (graded elsewhere)
const NEEDS_AI = new Set(['stt-match', 'semantic-response', 'ai-rubric']);

/**
 * Objectively score a single answer. For AI/STT methods we return
 * needsAI=true and awarded=0 (the caller fills these in after Gemma/STT).
 * studentAnswer shapes:
 *   MCQ/short: a string
 *   ordering:  array of strings (the ordered options)
 *   matching:  object map { left: right }
 */
function scoreAnswer(question, studentAnswer) {
  const points = question.points || 1;
  const method = question.scoringMethod;
  const res = { correct: false, awarded: 0, points, method, needsAI: false };

  if (NEEDS_AI.has(method)) {
    res.needsAI = true; // graded by STT/Gemma layer; objective score deferred
    return res;
  }

  switch (method) {
    case 'exact-match': {
      res.correct = norm(studentAnswer) === norm(question.correctAnswer);
      break;
    }
    case 'numeric-match': {
      const accept = (question.expectedAnswer && question.expectedAnswer.accept) || [];
      const targets = [question.correctAnswer, ...accept].map(numNorm).filter(Boolean);
      res.correct = targets.includes(numNorm(studentAnswer));
      break;
    }
    case 'normalized-match': {
      const accept = (question.expectedAnswer && question.expectedAnswer.accept) || [];
      const targets = [question.correctAnswer, ...accept].map(norm).filter(Boolean);
      res.correct = targets.includes(norm(studentAnswer));
      break;
    }
    case 'ordered-match': {
      const want = (question.expectedAnswer && question.expectedAnswer.orderedAnswer) ||
        String(question.correctAnswer || '').split(',');
      const got = Array.isArray(studentAnswer)
        ? studentAnswer
        : String(studentAnswer || '').split(',');
      res.correct =
        want.length === got.length &&
        want.every((w, i) => norm(w) === norm(got[i]));
      break;
    }
    case 'matching-pairs': {
      const want = (question.expectedAnswer && question.expectedAnswer.pairs) || {};
      const got = studentAnswer && typeof studentAnswer === 'object' ? studentAnswer : {};
      const keys = Object.keys(want);
      res.correct =
        keys.length > 0 &&
        keys.every((k) => norm(got[k]) === norm(want[k]));
      break;
    }
    default:
      res.correct = false;
  }

  res.awarded = res.correct ? points : 0;
  return res;
}

/**
 * Compute % scores per skill and per subject.
 * questions: array of bank questions that were ASKED
 * answers:   array of { id, studentAnswer, awarded?, needsAI? }
 *   - If an answer for an AI/STT question already carries `awarded`
 *     (filled by the STT/Gemma layer), we use it. Otherwise objective.
 */
function computeSkillScores(questions, answers) {
  const ansById = new Map(answers.map((a) => [a.id, a]));
  const skillAgg = {};   // skill -> { subject, earned, possible, asked, aiPending }
  const subjectAgg = {}; // subject -> { earned, possible }

  for (const q of questions) {
    const a = ansById.get(q.id);
    const points = q.points || 1;
    const skill = q.skill;
    if (!skillAgg[skill]) skillAgg[skill] = { subject: q.subject, earned: 0, possible: 0, asked: 0, aiPending: 0 };
    if (!subjectAgg[q.subject]) subjectAgg[q.subject] = { earned: 0, possible: 0 };

    skillAgg[skill].asked += 1;
    skillAgg[skill].possible += points;
    subjectAgg[q.subject].possible += points;

    let awarded = 0;
    if (a) {
      if (typeof a.awarded === 'number') {
        awarded = a.awarded;              // pre-graded (objective or AI-filled)
      } else {
        const s = scoreAnswer(q, a.studentAnswer);
        if (s.needsAI) {
          skillAgg[skill].aiPending += 1; // awaiting STT/Gemma grade
        }
        awarded = s.awarded;
      }
    }
    skillAgg[skill].earned += awarded;
    subjectAgg[q.subject].earned += awarded;
  }

  const bySkill = {};
  for (const [skill, v] of Object.entries(skillAgg)) {
    const percent = v.possible ? Math.round((v.earned / v.possible) * 100) : 0;
    bySkill[skill] = {
      subject: v.subject,
      percent,
      asked: v.asked,
      level: classifyLevel(percent),
      band: bandFor(percent),
      aiPending: v.aiPending,
    };
  }
  const bySubject = {};
  for (const [subject, v] of Object.entries(subjectAgg)) {
    const percent = v.possible ? Math.round((v.earned / v.possible) * 100) : 0;
    bySubject[subject] = { percent, level: classifyLevel(percent) };
  }
  return { bySkill, bySubject };
}

function classifyLevel(percent) {
  if (percent >= 80) return 'Advanced';
  if (percent >= 60) return 'Intermediate';
  return 'Beginner';
}

function bandFor(percent) {
  if (percent >= 80) return 'Strong';
  if (percent >= 60) return 'Developing';
  return 'Needs Support';
}

/**
 * Bucket skills into strong / developing / needsSupport.
 * skillScores: output of computeSkillScores().bySkill
 */
function detectStrengthsWeaknesses(bySkill) {
  const strong = [], developing = [], needsSupport = [];
  for (const [skill, v] of Object.entries(bySkill)) {
    if (v.band === 'Strong') strong.push(skill);
    else if (v.band === 'Developing') developing.push(skill);
    else needsSupport.push(skill);
  }
  return { strong, developing, needsSupport };
}

// ─── recommended practice (deterministic, per skill) ──────────────
const PRACTICE = {
  // English
  Speaking: ['Pronunciation practice', 'Short sentence speaking', 'Everyday conversation'],
  Writing: ['Sentence construction', 'Spelling drills', 'Guided short writing'],
  Reading: ['Sight-word practice', 'Short passage reading', 'Meaning & vocabulary'],
  Listening: ['Audio word ID', 'Listen-and-answer', 'Follow spoken instructions'],
  Production: ['Build sentences from words', 'Describe pictures', 'Respond to prompts'],
  Literacy: ['Letter & word recognition', 'Phonics', 'Basic spelling'],
  Comprehension: ['Read & answer detail', 'Find the main idea', 'Simple inference'],
  Conversation: ['Greetings & replies', 'Situational responses', 'Follow-up questions'],
  // Mathematics
  'Number Sense': ['Counting', 'Compare & order numbers', 'Place value'],
  'Basic Arithmetic': ['Addition facts', 'Subtraction facts', 'Two-step sums'],
  'Addition & Subtraction': ['Single-digit sums', 'Two-digit sums', 'Regrouping'],
  'Multiplication & Division': ['Times tables', 'Simple division', 'Multi-digit'],
  'Fractions & Decimals': ['Identify fractions', 'Compare fractions', 'Fraction–decimal conversion'],
  'Mathematical Reasoning': ['Number patterns', 'Odd-one-out', 'Multi-step logic'],
  'Word Problems': ['One-step word problems', 'Money problems', 'Multi-step problems'],
  'Algebraic Thinking': ['Missing numbers', 'Simple equations', 'Evaluate expressions'],
  'Geometry & Measurement': ['Identify shapes', 'Perimeter & area', 'Measurement & angles'],
  'Data Interpretation': ['Read charts', 'Compare values', 'Totals & averages'],
};
function recommendedPracticeFor(subject, skill) {
  return PRACTICE[skill] || ['Skill reinforcement practice'];
}

/**
 * Build the full results-dashboard object.
 * Inputs:
 *   questions: the asked bank questions
 *   answers:   [{ id, studentAnswer, awarded?, needsAI? }]
 * Output: structured object the UI/API can render directly.
 */
function buildScreeningResult({ questions, answers }) {
  const { bySkill, bySubject } = computeSkillScores(questions, answers);

  const bySubjectSkills = { English: {}, Mathematics: {} };
  for (const [skill, v] of Object.entries(bySkill)) {
    bySubjectSkills[v.subject][skill] = {
      score: v.percent,
      level: v.level,
      band: v.band,
      strength: v.band === 'Strong',
      weakness: v.band === 'Needs Support',
      recommendedPractice: recommendedPracticeFor(v.subject, skill),
      aiPending: v.aiPending,
    };
  }

  const sw = detectStrengthsWeaknesses(bySkill);

  return {
    generatedAt: new Date().toISOString(),
    overall: {
      English: bySubject.English || { percent: 0, level: 'Beginner' },
      Mathematics: bySubject.Mathematics || { percent: 0, level: 'Beginner' },
    },
    skills: bySubjectSkills,
    summary: {
      strong: sw.strong,
      developing: sw.developing,
      needsSupport: sw.needsSupport,
    },
    // convenience: skills that should drive the next level test
    focusSkills: sw.needsSupport.concat(sw.developing),
  };
}

/**
 * Generate a personalized next Level-Test blueprint from a result.
 * Weak skills get the most questions, developing get some, strong get
 * few (and pushed to a higher difficulty). Returns a composition plan
 * the question-selection layer can fill from the bank.
 *
 * options: { totalQuestions = 20 }
 */
function generateNextLevelTestBlueprint(result, options = {}) {
  const total = options.totalQuestions || 20;
  const { strong, developing, needsSupport } = result.summary;

  // Weight skills: needsSupport=3, developing=2, strong=1
  const weights = [];
  needsSupport.forEach((s) => weights.push({ skill: s, w: 3, targetDifficulty: 'Beginner' }));
  developing.forEach((s) => weights.push({ skill: s, w: 2, targetDifficulty: 'Intermediate' }));
  strong.forEach((s) => weights.push({ skill: s, w: 1, targetDifficulty: 'Advanced' }));

  const totalW = weights.reduce((a, b) => a + b.w, 0) || 1;
  let allocated = 0;
  const plan = weights.map((x) => {
    const count = Math.max(x.w >= 3 ? 2 : 1, Math.round((x.w / totalW) * total));
    allocated += count;
    // find subject for the skill
    const subject =
      result.skills.English[x.skill] ? 'English' :
      result.skills.Mathematics[x.skill] ? 'Mathematics' : 'Unknown';
    return {
      subject,
      skill: x.skill,
      count,
      targetDifficulty: x.targetDifficulty,
      reason:
        x.w === 3 ? 'Needs support — more practice at this skill'
        : x.w === 2 ? 'Developing — reinforce and stretch'
        : 'Strong — advance to harder questions',
    };
  });

  return {
    totalRequested: total,
    totalAllocated: allocated,
    focus: needsSupport,
    plan: plan.sort((a, b) => b.count - a.count),
  };
}

module.exports = {
  scoreAnswer,
  computeSkillScores,
  classifyLevel,
  bandFor,
  detectStrengthsWeaknesses,
  recommendedPracticeFor,
  buildScreeningResult,
  generateNextLevelTestBlueprint,
  OBJECTIVE,
  NEEDS_AI,
};
