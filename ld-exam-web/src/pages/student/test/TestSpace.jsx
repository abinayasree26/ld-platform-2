import React, { useState } from 'react';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import { recordTest } from '../../../services/progressStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import StudentTestLevels from './StudentTestLevels';
import StudentTestQuiz from './StudentTestQuiz';
import StudentTestResult from './StudentTestResult';

// Single-page state machine: levels → quiz → result → levels
const VIEWS = { LEVELS: 'levels', QUIZ: 'quiz', RESULT: 'result' };

const StudentTestSpace = () => {
  const { collapsed } = useSidebarStore();
  const { user, setDemoAuth } = useAuthStore();

  const [view, setView] = useState(VIEWS.LEVELS);
  const [activeLevel, setActiveLevel] = useState(null);
  const [result, setResult] = useState(null);
  const [levelsKey, setLevelsKey] = useState(0); // forces re-mount of StudentTestLevels

  const startTest = (level) => {
    setActiveLevel(level);
    setView(VIEWS.QUIZ);
  };

  // Every attempt — including retests — is appended to test_history so the
  // Test History panel can show the full timeline from first attempt to now.
  const handleResult = (res) => {
    const attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level: activeLevel,
      dateTime: new Date().toISOString(),
      scorePercent: res.scorePercent,
      passed: res.passed,
      correctCount: res.correctCount,
      totalQuestions: res.totalQuestions,
      timeTakenSeconds: res.timeTakenSeconds,
    };
    // Track highest passed level for unlocking
    const currentHighest = user?.highestPassedLevel || 0;
    const newHighest = res.passed ? Math.max(currentHighest, activeLevel) : currentHighest;

    const token = localStorage.getItem('auth_token') || 'demo-token';
    setDemoAuth({ ...user, test_history: [...(user?.test_history || []), attempt], highestPassedLevel: newHighest }, token);
    
    // Record in local progress store for dashboard updates
    recordTest({ level: activeLevel, score: res.scorePercent, passed: res.passed, durationSeconds: res.timeTakenSeconds });

    setResult(res);
    setView(VIEWS.RESULT);
  };

  const backToLevels = () => {
    setActiveLevel(null);
    setResult(null);
    setLevelsKey((k) => k + 1); // force re-fetch levels from backend
    setView(VIEWS.LEVELS);
  };

  return (
    <div className="sp-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {view === VIEWS.QUIZ && <StudentTestQuiz level={activeLevel} onResult={handleResult} onBack={backToLevels} />}
          {view === VIEWS.RESULT && <StudentTestResult result={result} level={activeLevel} onRetry={() => startTest(result?.passed ? Math.min(activeLevel + 1, 5) : activeLevel)} onDone={backToLevels} />}
          {view === VIEWS.LEVELS && <StudentTestLevels key={levelsKey} onStart={startTest} />}
        </div>
      </main>
    </div>
  );
};

export default StudentTestSpace;
