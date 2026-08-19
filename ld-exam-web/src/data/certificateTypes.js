// Certificate / badge definitions.
// Badges start UNEARNED — a new student has 0 badges. They should be unlocked
// based on real achievements (sessions, streaks, levels) rather than hardcoded.
// TODO: wire `earned` to real data from the DB (achievements) when that feature is built.
export const CERTIFICATE_TYPES = [
  { key: 'course-completion', icon: '🎓', title: 'Course Completion', description: 'Finish a module', earned: false, progress: 0 },
  { key: 'level-completion',  icon: '🏆', title: 'Level Completion',  description: 'Complete a level', earned: false, progress: 0 },
  { key: 'weekly-star',       icon: '🌟', title: 'Weekly Star',       description: 'Weekly top performer', earned: false, progress: 0 },
  { key: 'practice-streak',   icon: '🔥', title: 'Practice Streak',   description: 'Maintain daily practice', earned: false, progress: 0 },
  { key: 'improvement-award', icon: '📈', title: 'Improvement Award', description: 'Significant progress', earned: false, progress: 0 },
  { key: 'reading-master',    icon: '📖', title: 'Reading Master',    description: 'Reading proficiency', earned: false, progress: 0 },
  { key: 'writing-master',    icon: '✍️', title: 'Writing Master',    description: 'Writing proficiency', earned: false, progress: 0 },
  { key: 'phonics-master',    icon: '🔤', title: 'Phonics Master',    description: 'Phonics proficiency', earned: false, progress: 0 },
];

// How each badge is earned — shown on the Certification page.
export const HOW_TO_EARN = {
  'course-completion': 'Finish all modules in a course to earn this badge.',
  'level-completion':  'Complete and pass a full level to unlock this badge.',
  'weekly-star':       'Be among the top performers in a week of practice.',
  'practice-streak':   'Practice every day to build and keep a daily streak.',
  'improvement-award': 'Show significant improvement in your scores over time.',
  'reading-master':    'Reach high proficiency across reading exercises.',
  'writing-master':    'Reach high proficiency across writing exercises.',
  'phonics-master':    'Reach high proficiency across phonics exercises.',
};
