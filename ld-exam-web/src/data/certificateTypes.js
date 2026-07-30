// Single source of truth for certificate/badge types — used by both the
// sidebar (as Certification sub-links) and the Certification page itself.
export const CERTIFICATE_TYPES = [
  { key: 'course-completion', icon: '🎓', title: 'Course Completion', description: 'Finish a module', earned: true, date: '2026-06-01' },
  { key: 'level-completion',  icon: '🏆', title: 'Level Completion',  description: 'Complete a level', earned: true, date: '2026-05-20' },
  { key: 'weekly-star',       icon: '🌟', title: 'Weekly Star',       description: 'Weekly top performer', earned: true, date: '2026-07-06' },
  { key: 'practice-streak',   icon: '🔥', title: 'Practice Streak',   description: 'Maintain daily practice', earned: true, date: '2026-07-10' },
  { key: 'improvement-award', icon: '📈', title: 'Improvement Award', description: 'Significant progress', earned: false, progress: 65 },
  { key: 'reading-master',    icon: '📖', title: 'Reading Master',    description: 'Reading proficiency', earned: true, date: '2026-04-18' },
  { key: 'writing-master',    icon: '✍️', title: 'Writing Master',    description: 'Writing proficiency', earned: false, progress: 40 },
  { key: 'phonics-master',    icon: '🔤', title: 'Phonics Master',    description: 'Phonics proficiency', earned: false, progress: 80 },
];

export const HOW_TO_EARN = {
  'course-completion': 'Complete every exercise in a practice module (Phonics, Reading, Writing, or Math).',
  'level-completion': 'Score 70% or above on a Level Test to unlock and complete that level.',
  'weekly-star': 'Finish among the top scorers in your class for the week.',
  'practice-streak': 'Practice at least once a day for 7 days in a row.',
  'improvement-award': 'Improve your average score by 15% or more compared to last month.',
  'reading-master': 'Reach 90% mastery across all Reading practice categories.',
  'writing-master': 'Reach 90% mastery across all Writing practice categories.',
  'phonics-master': 'Reach 90% mastery across all Phonics practice categories.',
};
