// Shared recommendation content — used by both the Recommendations page and
// the "related recommendations" panel on the Practice page.
// `key` (when present) maps a tip to a Practice category so "Start Practice"
// can jump straight into that skill instead of just the category picker.
export const RECOMMENDATIONS_BY_LD_TYPE = {
  dyslexia: [
    { icon: '📖', title: 'Daily Read-Aloud', tip: 'Read a short passage out loud for 10 minutes a day to build word-sound connections.', category: 'Reading', key: 'reading' },
    { icon: '🔤', title: 'Phonics Drills', tip: 'Practice blending letter sounds — start with 3-letter words before moving to longer ones.', category: 'Phonics', key: 'phonics' },
    { icon: '🎧', title: 'Audiobooks + Text', tip: "Follow along with the text while listening to an audiobook to strengthen word recognition.", category: 'Reading', key: 'reading' },
  ],
  dysgraphia: [
    { icon: '✍️', title: 'Letter Formation Practice', tip: 'Spend 5 minutes tracing letters that commonly get reversed (b/d, p/q).', category: 'Writing', key: 'writing' },
    { icon: '⌨️', title: 'Typing Practice', tip: 'Use typing instead of handwriting for longer assignments to reduce fatigue.', category: 'Writing', key: 'writing' },
  ],
  dyscalculia: [
    { icon: '🔢', title: 'Number Line Games', tip: 'Use a physical or digital number line to visualise addition and subtraction.', category: 'Math', key: 'math' },
    { icon: '➗', title: 'Times Table Practice', tip: 'Practice one times table at a time using flashcards, 5 minutes daily.', category: 'Math', key: 'math' },
  ],
  mixed: [
    { icon: '⏱️', title: 'Short Focused Sessions', tip: 'Break practice into 10-minute focused sessions with a 2-minute break in between.', category: 'Focus' },
    { icon: '🎯', title: 'One Skill at a Time', tip: "Pick a single weak category from Practice each day rather than mixing everything.", category: 'Focus' },
  ],
  not_detected: [
    { icon: '🌟', title: 'Keep Up the Streak', tip: "You're doing great — keep practicing a little every day to stay sharp.", category: 'General' },
  ],
};

export const GENERAL_TIPS = [
  { icon: '⏰', title: 'Consistent Practice Time', tip: 'Practicing at the same time each day builds a habit that sticks.', category: 'Habit' },
  { icon: '🧘', title: 'Take Breaks', tip: 'A 5-minute break every 20–25 minutes keeps focus sharp — try the Pomodoro method.', category: 'Focus' },
  { icon: '🏆', title: 'Celebrate Small Wins', tip: 'Finishing a practice set is worth celebrating, even if the score wasn’t perfect.', category: 'Motivation' },
];
