/**
 * adaptiveGemma.js (Phase 5) — Gemma/llama.cpp helpers for the adaptive
 * screening feature. AI is used ONLY for explanations / extra practice /
 * conversation — never to decide a screening score (scores are objective,
 * computed by adaptiveScreeningEngine).
 *
 * Every function degrades gracefully: if llama.cpp is unavailable or the
 * call fails, a deterministic fallback is returned so the app keeps working
 * offline. This service reuses the existing llamaService (no new AI stack).
 */

const llama = require('./llamaService');

// Safe JSON extraction from a model response that may include prose/fences.
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) return null;
  // try array then object
  for (const close of [']', '}']) {
    const end = raw.lastIndexOf(close);
    if (end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)); } catch { /* keep trying */ }
    }
  }
  try { return JSON.parse(raw.trim()); } catch { return null; }
}

/**
 * Beginner-friendly explanation of a wrong answer.
 * Returns { explanation, tip } — always returns something (fallback if AI off).
 */
async function explainMistake({ question, studentAnswer, correctAnswer, skill, subject }) {
  const fallback = {
    explanation: correctAnswer
      ? `The correct answer is "${correctAnswer}". ${question.explanation || ''}`.trim()
      : (question.explanation || 'Review this skill and try again.'),
    tip: `Practice more ${skill} questions to build confidence.`,
  };

  if (!(await llama.isAvailable())) return { ...fallback, source: 'fallback' };

  const sys = 'You are a kind, encouraging tutor for learners of any age (children to adults). '
    + 'Explain simply and warmly. Never mention accent. Keep it short.';
  const prompt = `Subject: ${subject} | Skill: ${skill}
Question: ${question.question}
Learner's answer: ${JSON.stringify(studentAnswer)}
Correct answer: ${correctAnswer ?? '(open response)'}

Return JSON only: {"explanation": "2-3 short sentences explaining the right answer simply", "tip": "one short practice tip"}`;

  const out = await llama.chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: sys, maxTokens: 300, temperature: 0.5,
  });
  const parsed = extractJson(out);
  if (parsed && parsed.explanation) return { ...parsed, source: 'ai' };
  return { ...fallback, source: 'fallback' };
}

/**
 * Generate extra practice questions for a weak skill.
 * Returns an array of { question, options, correctAnswer, explanation }.
 * Falls back to an empty array if AI is unavailable (caller can use the
 * deterministic practice recommendations instead).
 */
async function generateExtraPractice({ subject, skill, difficulty = 'Beginner', count = 3 }) {
  if (!(await llama.isAvailable())) return { questions: [], source: 'fallback' };

  const sys = 'You create clear, age-neutral practice questions for a learning-support platform. '
    + 'Use simple, real-life contexts. Do not assume the learner is a child.';
  const prompt = `Create ${count} ${difficulty} practice questions for:
Subject: ${subject}
Skill: ${skill}

Rules:
- Multiple choice with exactly 3 options, one correct.
- Age-neutral, real-life contexts.
- No duplicate options.

Return JSON array only:
[{"question":"...","options":["a","b","c"],"correctAnswer":"a","explanation":"why"}]`;

  const out = await llama.chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: sys, maxTokens: 900, temperature: 0.6,
  });
  const parsed = extractJson(out);
  if (Array.isArray(parsed)) {
    // sanitize: keep only well-formed items with the correct answer in options
    const clean = parsed.filter((q) =>
      q && q.question && Array.isArray(q.options) && q.options.length >= 2 &&
      q.correctAnswer && q.options.map(String).includes(String(q.correctAnswer)))
      .map((q, i) => ({
        id: `AIQ-${skill.replace(/\W+/g, '').toUpperCase()}-${i + 1}`,
        subject, skill, difficulty,
        questionType: 'multiple-choice',
        question: q.question,
        options: [...new Set(q.options.map(String))],
        correctAnswer: String(q.correctAnswer),
        explanation: q.explanation || '',
        points: 1, scoringMethod: 'exact-match', generatedBy: 'gemma',
      }));
    return { questions: clean, source: 'ai' };
  }
  return { questions: [], source: 'fallback' };
}

/**
 * One turn of conversational practice. history: [{role, content}].
 * level tunes difficulty of the reply. Returns { reply, source }.
 */
async function generateConversationTurn({ history = [], level = 'Beginner', topic = '' }) {
  const fallback = { reply: "That's interesting! Can you tell me a little more?", source: 'fallback' };
  if (!(await llama.isAvailable())) return fallback;

  const sys = `You are a friendly conversation partner helping someone practise English `
    + `at a ${level} level. Keep replies short, natural, and encouraging. Ask one simple `
    + `follow-up question. Never correct harshly; never mention accent.`;
  const msgs = history.length ? history : [{ role: 'user', content: topic || 'Hello!' }];
  const out = await llama.chatCompletion({
    messages: msgs, systemPrompt: sys, maxTokens: 120, temperature: 0.8,
  });
  return out ? { reply: out, source: 'ai' } : fallback;
}

module.exports = {
  explainMistake,
  generateExtraPractice,
  generateConversationTurn,
};
