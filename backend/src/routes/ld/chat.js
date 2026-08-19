/**
 * LD Chatbot Route — AI-powered student assistant using local llama.cpp
 * 
 * POST /api/ld/chat
 *   Body: { message: string, history?: [{role, text}] }
 *   Returns: { reply: string, suggestions?: string[] }
 * 
 * The chatbot has access to the student's real data (level, mastery,
 * screening results, practice history) and can answer questions about
 * their progress, give encouragement, explain LD concepts, and
 * connect them with their support team.
 */

const router = require('express').Router();
const llamaService = require('../../services/llamaService');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');

// ─── Gather student context from DB ─────────────────────────────────────
async function getStudentContext(userId) {
  try {
    const [profile, sessions, screening, streak] = await Promise.all([
      query(`SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`, [userId]).catch(() => ({ rows: [] })),
      query(`SELECT id, score, duration_minutes, exercises_count, DATE(created_at) as date FROM practice_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId]).catch(() => ({ rows: [] })),
      query(`SELECT ld_type, risk_score, reasoning, created_at FROM screenings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]).catch(() => ({ rows: [] })),
      query(`SELECT streak_count, longest_streak FROM students WHERE user_id = $1`, [userId]).catch(() => ({ rows: [] })),
    ]);

    const student = profile.rows[0] || {};
    const lastScreening = screening.rows[0] || {};

    return {
      name: student.name || 'Student',
      level: student.current_level || 1,
      streak: student.streak_count || 0,
      longestStreak: student.longest_streak || 0,
      ldType: lastScreening.ld_type || student.ld_type || 'not yet screened',
      riskScore: lastScreening.risk_score || student.ld_risk_score || null,
      screeningDate: lastScreening.created_at ? new Date(lastScreening.created_at).toISOString().slice(0, 10) : null,
      screeningReasoning: lastScreening.reasoning || null,
      recentSessions: sessions.rows.map(s => ({
        date: s.date,
        score: s.score,
        duration: s.duration_minutes,
        exercises: s.exercises_count,
      })),
      totalSessions: sessions.rows.length,
    };
  } catch (err) {
    console.error('[chat] getStudentContext failed:', err.message);
    return { name: 'Student', level: 1, ldType: 'unknown', recentSessions: [] };
  }
}

// ─── Fallback responses when the AI is unavailable ──────────────────────
function getFallbackResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('progress') || msg.includes('status')) {
    return { reply: "I'd love to tell you about your progress! My AI brain is currently offline, but you can check your dashboard for all your stats. 📊", suggestions: ['Check dashboard', 'Try again later'] };
  }
  if (msg.includes('teacher') || msg.includes('help') || msg.includes('connect')) {
    return { reply: "👨‍🏫 To connect with your teacher, you can use the Messages section in the sidebar. Your teacher reviews your progress weekly!", suggestions: ['Open Messages', 'View my progress'] };
  }
  if (msg.includes('practice') || msg.includes('what should')) {
    return { reply: "💡 Head to the Practice section! The adaptive system will automatically pick exercises at the right difficulty for you.", suggestions: ['Start Practice', 'View weak areas'] };
  }
  return { reply: "I'm your LD learning assistant! I can help with your progress, practice tips, and connecting with your teacher. My AI is briefly offline — try again in a moment! 🤖", suggestions: ['My progress', 'What to practice', 'Contact teacher'] };
}

// ─── POST /api/ld/chat ──────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required' });
    }

    // If llama.cpp isn't running, use fallback
    if (!(await llamaService.isAvailable())) {
      return res.json(getFallbackResponse(message));
    }

    // Gather student context
    const ctx = await getStudentContext(req.user.id);

    const systemPrompt = `You are "LD Buddy", a friendly, warm AI assistant for a student using the LD Schools ERP platform — an educational tool for children with learning disabilities (dyslexia, dyscalculia, dysgraphia).

## Your Role:
- Answer questions about the student's progress, scores, level, and practice
- Give encouragement and motivation (these are children aged 6-14)
- Explain what their LD type means in simple, non-stigmatizing language
- Suggest what to practice next based on their weak areas
- Help them understand the platform (how tests work, how levels work, etc.)
- Connect them with their teacher/parent when they need human support

## Student Context (REAL DATA):
- Name: ${ctx.name}
- Current Level: ${ctx.level}/5
- Streak: ${ctx.streak} days (longest: ${ctx.longestStreak})
- LD Type: ${ctx.ldType}
- Risk Score: ${ctx.riskScore !== null ? ctx.riskScore + '/100' : 'Not assessed yet'}
- Last Screening: ${ctx.screeningDate || 'Not yet'}
- Recent Practice Sessions: ${ctx.recentSessions.length > 0 ? ctx.recentSessions.map(s => `${s.date}: ${s.score}% in ${s.duration}min`).join(', ') : 'No sessions yet'}

## Rules:
- Use simple English (max Grade 4 reading level)
- Keep responses SHORT — max 3-4 sentences unless asked to explain more
- Use emojis to keep it fun 🌟
- NEVER say anything discouraging about their LD
- If they ask something you don't know or that requires a real teacher, say "Let me connect you with your teacher for this one! 👨‍🏫"
- If they ask about other students' data, politely say you can only see their own info
- For "contact teacher" requests, provide clear guidance on how to reach their teacher
- End with a relevant suggestion when natural

## Response Format:
Respond in plain text. Keep it conversational and warm.`;

    // Build message history for context
    const messages = [];
    if (history && Array.isArray(history)) {
      // Include last 6 messages for context (to keep tokens low)
      const recent = history.slice(-6);
      for (const h of recent) {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text,
        });
      }
    }
    messages.push({ role: 'user', content: message.trim() });

    const reply = await llamaService.chatCompletion({
      messages,
      systemPrompt,
      maxTokens: 300,
      temperature: 0.8,
    });

    if (!reply) {
      return res.json(getFallbackResponse(message));
    }

    // Generate contextual suggestions
    const suggestions = generateSuggestions(message, ctx);

    res.json({ reply, suggestions });
  } catch (err) {
    console.error('[chat] AI chat failed:', err.message);
    // Fallback gracefully
    res.json(getFallbackResponse(req.body.message || ''));
  }
});

// Generate contextual quick-reply suggestions
function generateSuggestions(message, ctx) {
  const msg = message.toLowerCase();
  if (msg.includes('progress') || msg.includes('level')) {
    return ['What should I practice?', 'Am I ready for the test?', 'Show my weak areas'];
  }
  if (msg.includes('practice') || msg.includes('weak')) {
    return ['Start practice now', 'How does adaptive work?', 'My recent scores'];
  }
  if (msg.includes('teacher') || msg.includes('parent')) {
    return ['My progress report', 'When is my next test?', 'Help me practice'];
  }
  if (msg.includes('screening') || msg.includes('ld type')) {
    return ['What does this mean?', 'How can I improve?', 'Talk to teacher'];
  }
  // Default suggestions
  return ['📊 My progress', '💡 What to practice', '👨‍🏫 Talk to teacher'];
}

module.exports = router;
