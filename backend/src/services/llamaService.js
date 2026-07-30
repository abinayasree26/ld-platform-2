/**
 * llamaService.js — On-device AI via llama.cpp (OpenAI-compatible API)
 * 
 * Replaces claudeService.js. All AI features route through here.
 * No internet required after model download. No API keys needed.
 * Model: gemma-4-E2B-it-Q3_K_M.gguf
 * llama.cpp server must be running at LLAMA_BASE_URL (default: http://127.0.0.1:8081)
 */

const env = require('../config/env');

const LLAMA_BASE_URL = env.llama?.baseUrl || 'http://127.0.0.1:8081';
const LLAMA_TIMEOUT = env.llama?.timeout || 30000;

// ─── Core: Send a chat completion request to llama.cpp ──────────────
async function chatCompletion({ messages, maxTokens = 256, temperature = 0.7, systemPrompt = '' }) {
  const body = {
    model: 'gemma',
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: maxTokens,
    temperature,
    stream: false,
  };

  try {
    const response = await fetch(`${LLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(LLAMA_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`llama.cpp returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('[llamaService] chatCompletion failed:', err.message);
    return null;
  }
}

// ─── Health check: Is llama.cpp running? ────────────────────────────
async function isAvailable() {
  try {
    const res = await fetch(`${LLAMA_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// WRONG ANSWER FEEDBACK (real-time, per question)
// Returns null if llama.cpp is unavailable or the call fails,
// so callers can fall back to plain right/wrong feedback.
// ─────────────────────────────────────────────────────────────────────
async function generateWrongAnswerFeedback({ questionText, studentAnswer, correctAnswer, questionType, studentAge, ldType }) {
  const systemPrompt = `You explain wrong answers to Indian children with learning disabilities in the simplest, warmest possible English. Never shame or blame. Always explain visually when possible.

Return a JSON object with:
- feedback_text: 2-3 sentences max. Start with a small encouragement. Explain the correct answer clearly. Use "remember b faces right, d faces left" style memory hooks where possible.
- memory_hook: one short phrase they can remember (or null if not applicable)

Max reading level: Grade 3 English. Respond ONLY with valid JSON object.`;

  const userMessage = JSON.stringify({ questionText, studentAnswer, correctAnswer, questionType, studentAge, ldType });

  const result = await chatCompletion({
    messages: [{ role: 'user', content: userMessage }],
    systemPrompt,
    maxTokens: 256,
    temperature: 0.5,
  });

  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch {
    // Try to extract JSON from response
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// WEEKLY STUDENT TIPS
// Returns { tips: string[], content: string } or null if llama.cpp
// is unavailable or the call fails.
// ─────────────────────────────────────────────────────────────────────
async function generateStudentTips({ studentName, ldType, riskScore, currentLevel }) {
  const userMessage = `A student named ${studentName} has ${ldType || 'no detected LD'} with risk score ${riskScore || 0}/100 at level ${currentLevel || 1}. Give 5 short, actionable learning tips for this student. Return as a JSON array of strings.`;

  const result = await chatCompletion({
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 500,
    temperature: 0.7,
  });

  if (!result) return null;

  try {
    const tips = JSON.parse(result.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return { tips, content: result };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// AI RECOMMENDATIONS — personalized "what to practice today"
// ─────────────────────────────────────────────────────────────────────
async function generateRecommendations({ studentName, ldType, riskScore, currentLevel, weakAreas, recentScores }) {
  const systemPrompt = `You are an AI tutor for children with learning disabilities. Based on the student's profile, generate personalized practice recommendations.

Return a JSON object with:
- primary: { title, reason, category, duration_minutes }
- alternates: [ { title, reason, category } ] (2-3 items)
- motivational_message: one encouraging sentence

Categories must be one of: Reading, Phonics, Writing, Math, Focus
Max reading level: Grade 3 English for the motivational message.
Respond ONLY with valid JSON.`;

  const userMessage = JSON.stringify({
    studentName,
    ldType: ldType || 'not_detected',
    riskScore: riskScore || 0,
    currentLevel: currentLevel || 1,
    weakAreas: weakAreas || [],
    recentScores: recentScores || [],
  });

  const result = await chatCompletion({
    messages: [{ role: 'user', content: userMessage }],
    systemPrompt,
    maxTokens: 500,
    temperature: 0.7,
  });

  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch {
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// LIVE CHAT (LD Buddy) — conversational AI assistant for students
// ─────────────────────────────────────────────────────────────────────
async function chat({ message, history = [], studentContext = {} }) {
  const systemPrompt = `You are "LD Buddy", a friendly, warm AI assistant for a student using the LD Schools platform — an educational tool for children with learning disabilities (dyslexia, dyscalculia, dysgraphia).

## Your Role:
- Answer questions about the student's progress, scores, level, and practice
- Give encouragement and motivation (these are children aged 6-14)
- Explain what their LD type means in simple, non-stigmatizing language
- Suggest what to practice next based on their weak areas
- Help them understand the platform (how tests work, how levels work, etc.)
- Connect them with their teacher/parent when they need human support

## Student Context:
- Name: ${studentContext.name || 'Student'}
- Current Level: ${studentContext.level || 1}/5
- Streak: ${studentContext.streak || 0} days (longest: ${studentContext.longestStreak || 0})
- LD Type: ${studentContext.ldType || 'not yet screened'}
- Risk Score: ${studentContext.riskScore ? studentContext.riskScore + '/100' : 'Not assessed'}
- Recent Sessions: ${studentContext.recentSessions?.length > 0 ? studentContext.recentSessions.map(s => `${s.date}: ${s.score}% in ${s.duration}min`).join(', ') : 'No sessions yet'}

## Rules:
- Use simple English (max Grade 4 reading level)
- Keep responses SHORT — max 3-4 sentences unless asked to explain more
- Use emojis to keep it fun 🌟
- NEVER say anything discouraging about their LD
- If they ask something you don't know, say "Let me connect you with your teacher for this one! 👨‍🏫"
- If they ask about other students' data, politely say you can only see their own info
- For "contact teacher" requests, provide clear guidance on how to reach their teacher
- End with a relevant suggestion when natural`;

  const messages = [];
  if (history.length > 0) {
    const recent = history.slice(-6);
    for (const h of recent) {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text,
      });
    }
  }
  messages.push({ role: 'user', content: message.trim() });

  const result = await chatCompletion({
    messages,
    systemPrompt,
    maxTokens: 300,
    temperature: 0.8,
  });

  return result || null;
}

module.exports = {
  chatCompletion,
  isAvailable,
  generateWrongAnswerFeedback,
  generateStudentTips,
  generateRecommendations,
  chat,
};
