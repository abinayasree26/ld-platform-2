// Illustrated "explorer" avatars that level up as a student passes more level tests.
// Rendered via DiceBear's public avatar API (no key needed) — each level gets its own
// seed + colour so the character visibly changes as the student progresses.
export const LEVEL_AVATARS = [
  { level: 1, title: 'Starter Explorer', seed: 'ld-explorer-starter', bg: 'b6e3f4', ring: '#22c55e' },
  { level: 2, title: 'Basic Adventurer', seed: 'ld-explorer-basic', bg: 'c0aede', ring: '#3b82f6' },
  { level: 3, title: 'Intermediate Ranger', seed: 'ld-explorer-ranger', bg: 'ffd5dc', ring: '#f97316' },
  { level: 4, title: 'Advanced Voyager', seed: 'ld-explorer-voyager', bg: 'ffdfbf', ring: '#a855f7' },
  { level: 5, title: 'Master Champion', seed: 'ld-explorer-champion', bg: 'd1f7c4', ring: '#f59e0b' },
];

export const avatarImageUrl = (seed, bg) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;

export const getLevelAvatar = (level) => LEVEL_AVATARS.find((a) => a.level === level) || LEVEL_AVATARS[0];

// Demo-only: the real app would derive this from stored test progress. Here it defaults to
// Level 2, matching the demo level-test data used across the Tests module (Levels 1–2 passed).
export const currentAvatarLevel = (user) => user?.avatarLevel || 2;
