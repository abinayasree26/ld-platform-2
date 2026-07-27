import React, { useState } from 'react';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import StudentTestLevels from './test/StudentTestLevels';
import StudentTestQuiz from './test/StudentTestQuiz';
import StudentTestResult from './test/StudentTestResult';

// Single-page state machine: levels → quiz → result → levels
const VIEWS = { LEVELS: 'levels', QUIZ: 'quiz', RESULT: 'result' };

const StudentTestSpace = () => {
  const { collapsed } = useSidebarStore();
  const { user, setDemoAuth } = useAuthStore();

  const [view, setView] = useState(VIEWS.LEVELS);
  const [activeLevel, setActiveLevel] = useState(null);
  const [result, setResult] = useState(null);

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
    const token = localStorage.getItem('auth_token') || 'demo-token';
    setDemoAuth({ ...user, test_history: [...(user?.test_history || []), attempt] }, token);

    setResult(res);
    setView(VIEWS.RESULT);
  };

  const backToLevels = () => {
    setActiveLevel(null);
    setResult(null);
    setView(VIEWS.LEVELS);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {view === VIEWS.QUIZ && <StudentTestQuiz level={activeLevel} onResult={handleResult} onBack={backToLevels} />}
          {view === VIEWS.RESULT && <StudentTestResult result={result} level={activeLevel} onRetry={() => startTest(activeLevel)} onDone={backToLevels} />}
          {view === VIEWS.LEVELS && <StudentTestLevels onStart={startTest} />}
        </div>
      </main>
    </div>
  );
};

export default StudentTestSpace;
