/**
 * Local Progress Store
 * 
 * In demo mode (no database), this stores the student's session progress
 * in localStorage so the dashboard can show real-time updates.
 * 
 * All pages (screening, practice, tests) write here.
 * The dashboard reads from here and merges with API data.
 */

const STORAGE_KEY = 'ld_local_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultProgress() {
  return {
    screenings: [],           // { date, riskScore, ldType, breakdown: { dyslexia, dyscalculia, dysgraphia } }
    practiceSessions: [],     // { date, category, score, duration, exercises }
    testAttempts: [],          // { date, level, score, passed, duration }
    weeklyPractice: {},        // { '2026-07-24': true, ... } — dates user practiced
    categoryScores: {},        // { letter_recognition: [85, 90], phonics: [60, 70], ... }
    highestLevel: 0,
    totalPracticeMinutes: 0,
    lastUpdated: null,
  };
}

// ——— Screening ———————————————————————————————————————————
export function recordScreening(result) {
  const progress = getProgress();
  progress.screenings.push({
    date: new Date().toISOString(),
    riskScore: result.riskScore,
    ldType: result.ldType || 'none',
    breakdown: result.breakdown || {},
  });
  progress.lastUpdated = new Date().toISOString();
  saveProgress(progress);
}

// ——— Practice Session ————————————————————————————————————
export function recordPractice({ category, score, durationMinutes, exercises }) {
  const progress = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  
  progress.practiceSessions.push({
    date: new Date().toISOString(),
    category,
    score,
    duration: durationMinutes,
    exercises,
  });
  
  // Mark today as practiced
  progress.weeklyPractice[today] = true;
  
  // Update category scores
  if (category) {
    if (!progress.categoryScores[category]) progress.categoryScores[category] = [];
    progress.categoryScores[category].push(score);
    // Keep only last 10 scores per category
    if (progress.categoryScores[category].length > 10) {
      progress.categoryScores[category] = progress.categoryScores[category].slice(-10);
    }
  }
  
  progress.totalPracticeMinutes += (durationMinutes || 0);
  progress.lastUpdated = new Date().toISOString();
  saveProgress(progress);
}

// ——— Test Attempt ————————————————————————————————————————
export function recordTest({ level, score, passed, durationSeconds }) {
  const progress = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  
  progress.testAttempts.push({
    date: new Date().toISOString(),
    level,
    score,
    passed,
    duration: Math.round((durationSeconds || 0) / 60),
  });
  
  // Mark today as practiced (tests count too)
  progress.weeklyPractice[today] = true;
  
  // Update highest level
  if (passed && level > progress.highestLevel) {
    progress.highestLevel = level;
  }
  
  progress.lastUpdated = new Date().toISOString();
  saveProgress(progress);
}

// ——— Dashboard reads ——————————————————————————————————————
export function getDashboardProgress() {
  const progress = getProgress();
  
  // Calculate weekly practice days (current week Mon-Sun)
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Go to Monday
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    if (d > today) {
      weekDays.push(null); // Future
    } else {
      weekDays.push(progress.weeklyPractice[dateStr] || false);
    }
  }
  
  // Calculate category mastery (average of recent scores)
  const categoryMastery = Object.entries(progress.categoryScores).map(([cat, scores]) => {
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const prevAvg = scores.length > 1 ? Math.round(scores.slice(0, -1).reduce((a, b) => a + b, 0) / (scores.length - 1)) : avg;
    const trend = avg > prevAvg ? 'up' : avg < prevAvg ? 'down' : 'stable';
    return { category: cat, mastery: avg, trend };
  });
  
  // Recent sessions (last 5)
  const allSessions = [
    ...progress.practiceSessions.map(s => ({ ...s, type: 'practice' })),
    ...progress.testAttempts.map(s => ({ ...s, type: 'test', score: s.score })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  // Last screening
  const lastScreening = progress.screenings.length > 0
    ? progress.screenings[progress.screenings.length - 1]
    : null;
  
  // Day streak
  let streak = 0;
  const todayStr = today.toISOString().slice(0, 10);
  let checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (progress.weeklyPractice[dateStr]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === todayStr) {
      // Today might not have activity yet — check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    if (streak > 365) break; // Safety limit
  }
  
  return {
    level: progress.highestLevel,
    streak,
    totalPracticeMinutes: progress.totalPracticeMinutes,
    totalTests: progress.testAttempts.length,
    totalPractices: progress.practiceSessions.length,
    weekDays,
    weeklyGoalCompleted: weekDays.filter(d => d === true).length,
    categoryMastery,
    recentSessions: allSessions.map(s => ({
      id: s.date,
      date: s.date.split('T')[0],
      score: s.score,
      duration: s.duration,
      exercises: s.exercises || 10,
    })),
    lastScreening: lastScreening ? {
      date: lastScreening.date.split('T')[0],
      riskScore: lastScreening.riskScore,
      ldType: lastScreening.ldType,
    } : null,
  };
}

// ——— Reset (for testing) —————————————————————————————————
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
