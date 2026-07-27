const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-6';
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// ─────────────────────────────────────────────────────────────────
// WRONG ANSWER FEEDBACK (real-time, per question)
// Plan §5.5 — returns null if Claude is unavailable or the call fails,
// so callers can fall back to plain right/wrong feedback.
// ─────────────────────────────────────────────────────────────────
const generateWrongAnswerFeedback = async ({ questionText, studentAnswer, correctAnswer, questionType, studentAge, ldType }) => {
  if (!client) return null;

  const systemPrompt = `You explain wrong answers to Indian children with learning disabilities in the simplest, warmest possible English. Never shame or blame. Always explain visually when possible.

Return a JSON object with:
- feedback_text: 2-3 sentences max. Start with a small encouragement. Explain the correct answer clearly. Use "remember b faces right, d faces left" style memory hooks where possible.
- memory_hook: one short phrase they can remember (or null if not applicable)

Max reading level: Grade 3 English. Respond ONLY with valid JSON object.`;

  const userMessage = JSON.stringify({ questionText, studentAnswer, correctAnswer, questionType, studentAge, ldType });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    });

    return JSON.parse(response.content[0].text.trim());
  } catch (err) {
    console.error('[claudeService] generateWrongAnswerFeedback failed:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// WEEKLY STUDENT TIPS (FR-06, plan §4 recommendations cron)
// Returns { tips: string[], content: string } or null if Claude is
// unavailable or the call fails.
// ─────────────────────────────────────────────────────────────────
const generateStudentTips = async ({ studentName, ldType, riskScore, currentLevel }) => {
  if (!client) return null;

  const userMessage = `A student named ${studentName} has ${ldType || 'no detected LD'} with risk score ${riskScore || 0}/100 at level ${currentLevel || 1}. Give 5 short, actionable learning tips for this student. Return as a JSON array of strings.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].text;
    const tips = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
    return { tips, content: text };
  } catch (err) {
    console.error('[claudeService] generateStudentTips failed:', err.message);
    return null;
  }
};

module.exports = { generateWrongAnswerFeedback, generateStudentTips };
