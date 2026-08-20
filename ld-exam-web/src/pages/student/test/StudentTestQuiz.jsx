import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { trackTestStarted, trackTestCompleted, trackTestAbandoned } from '../../../services/analytics';
import { ldAPI } from '../../../services/api';

import { supabase } from '../../../services/supabaseClient';

const LEVEL_LABELS = ['', 'Starter', 'Basic', 'Intermediate', 'Advanced', 'Mastery'];
const LEVEL_COLORS = ['', 'bg-green-600', 'bg-blue-600', 'bg-orange-500', 'bg-purple-600', 'bg-amber-500'];
const TOTAL_TIME = 25 * 60; // 25 minutes in seconds

const pad = (n) => String(n).padStart(2, '0');

// Used when the backend isn't reachable, so a level test can still be taken end-to-end.
const DEMO_QUESTION_POOL = [
  { question_text: 'Which word rhymes with "cat"?', options: ['Hat', 'Dog', 'Sun', 'Fish'], correct_answer: 'Hat' },
  { question_text: 'What is 8 + 6?', options: ['12', '13', '14', '15'], correct_answer: '14' },
  { question_text: 'Which letter is written backwards: b, d, p, q, d?', options: ['b', 'd', 'p', 'q'], correct_answer: 'd' },
  { question_text: 'Which word means the opposite of "big"?', options: ['Small', 'Tall', 'Fast', 'Loud'], correct_answer: 'Small' },
  { question_text: 'What is 9 x 3?', options: ['24', '27', '30', '21'], correct_answer: '27' },
  { question_text: 'Pick the correctly spelled word.', options: ['Recieve', 'Receive', 'Receeve', 'Receve'], correct_answer: 'Receive' },
  { question_text: 'Which number is bigger: 342 or 423?', options: ['342', '423', 'Equal', "Can't tell"], correct_answer: '423' },
  { question_text: 'Which word starts with the same sound as "ship"?', options: ['Shop', 'Cat', 'Fun', 'Ball'], correct_answer: 'Shop' },
  { question_text: 'What is 20 ÷ 4?', options: ['4', '5', '6', '8'], correct_answer: '5' },
  { question_text: 'Which shape has 3 sides?', options: ['Triangle', 'Square', 'Circle', 'Pentagon'], correct_answer: 'Triangle' },
  { question_text: 'Read: "The cat sat on the mat." Where did the cat sit?', options: ['On the mat', 'On the bed', 'On the chair', 'On the roof'], correct_answer: 'On the mat' },
  { question_text: 'What punctuation ends a question?', options: ['?', '.', '!', ','], correct_answer: '?' },
  { question_text: 'Which word is plural?', options: ['Cats', 'Cat', 'Catty', 'Cating'], correct_answer: 'Cats' },
  { question_text: 'What is 15 - 7?', options: ['7', '8', '9', '6'], correct_answer: '8' },
  { question_text: 'Which sentence starts with a capital letter correctly?', options: ['The sun is bright.', 'the sun is bright.', 'THE sun is bright.', 'thE sun is bright.'], correct_answer: 'The sun is bright.' },
  { question_text: 'Which word comes first alphabetically?', options: ['Apple', 'Banana', 'Cherry', 'Date'], correct_answer: 'Apple' },
  { question_text: 'What is half of 18?', options: ['6', '9', '8', '12'], correct_answer: '9' },
  { question_text: 'Which letters make the "ch" sound in "chair"?', options: ['ch', 'sh', 'th', 'ph'], correct_answer: 'ch' },
  { question_text: '"She was happy." What did she feel?', options: ['Happy', 'Sad', 'Angry', 'Tired'], correct_answer: 'Happy' },
  { question_text: 'What is 6 + 7?', options: ['12', '13', '14', '11'], correct_answer: '13' },
];

const buildDemoQuestions = () =>
  DEMO_QUESTION_POOL.map((q, i) => ({ id: `demo-${i}`, question_type: 'mcq', ...q }));

const SpeakBtn = ({ text }) => {
  const [ttsState, setTtsState] = useState('idle'); // idle | playing

  const speak = () => {
    if (ttsState !== 'idle') {
      window.speechSynthesis.cancel();
      setTtsState('idle');
      return;
    }

    if (!window.speechSynthesis) {
      toast.error('Text-to-speech not supported in this browser');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    // Try to pick an Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
    if (indianVoice) utterance.voice = indianVoice;

    utterance.onend = () => setTtsState('idle');
    utterance.onerror = () => {
      toast.error('Could not play speech');
      setTtsState('idle');
    };

    setTtsState('playing');
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      title={ttsState === 'playing' ? 'Stop audio' : 'Hear question'}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
        ${ttsState === 'playing'
          ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}
    >
      {ttsState === 'playing' ? '⏸' : '▶'}
      {ttsState === 'playing' ? 'Stop' : 'Hear'}
    </button>
  );
};

const SpeakingInput = ({ onAnswer, submitting }) => {
  const [micState, setMicState] = useState('idle'); // idle | listening | done
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setMicState('done');
    };
    recognition.onerror = () => { toast.error('Could not hear speech'); setMicState('idle'); };
    recognition.onend = () => { if (micState === 'listening') setMicState('idle'); };

    setMicState('listening');
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setMicState('idle');
  };

  const submitSpeech = () => {
    if (transcript.trim()) onAnswer(transcript.trim());
  };

  const retry = () => { setTranscript(''); setMicState('idle'); };

  if (!SpeechRecognition) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-sm text-amber-700">
        Speech recognition requires Chrome or Edge browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {micState === 'done' && transcript ? (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">You said:</p>
          <p className="text-lg font-semibold text-slate-800">"{transcript}"</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {micState === 'listening' ? 'Listening⬦ speak now' : 'Tap the mic and speak your answer'}
        </p>
      )}

        <button
        onClick={micState === 'listening' ? stopListening : startListening}
        disabled={submitting}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all
          ${micState === 'listening'
            ? 'bg-red-600 text-white animate-pulse scale-110'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
      >
        {micState === 'listening' ? '⏹' : '🎤'}
      </button>

      {micState === 'done' && transcript && (
        <div className="flex gap-3">
          <button
            onClick={retry}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300"
          >
            Try Again
          </button>
          <button
            onClick={submitSpeech}
            disabled={submitting}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

const StudentTestQuiz = ({ level, onResult, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);
  const answered = useRef(false);

  const token = localStorage.getItem('auth_token');

  // Local scoring used when the backend isn't reachable, so a test can still be completed.
  const computeLocalResult = (finalAnswers, timeTakenMs) => {
    const scoredAnswers = questions.map((q) => {
      const studentAnswer = finalAnswers[q.id] || '';
      const isCorrect = studentAnswer === q.correct_answer;
      return {
        question_text: q.question_text,
        studentAnswer,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: isCorrect ? undefined : `The correct answer is "${q.correct_answer}".`,
      };
    });
    const correctCount = scoredAnswers.filter((a) => a.isCorrect).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercent >= 70;
    return {
      scorePercent,
      correctCount,
      totalQuestions: questions.length,
      passed,
      leveledUp: passed && level < 5,
      scoredAnswers,
      timeTakenSeconds: Math.round(timeTakenMs / 1000),
    };
  };

  const submitTest = useCallback(async (finalAnswers) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const timeTakenMs = Date.now() - startTime.current;
    let result = null;
    try {
      const answersList = Object.entries(finalAnswers).map(([questionId, studentAnswer]) => ({ questionId, studentAnswer }));
      result = await ldAPI.testSubmit(level, answersList, timeTakenMs);
      trackTestCompleted(level, result.score, result.passed, timeTakenMs);
    } catch {
      result = computeLocalResult(finalAnswers, timeTakenMs);
      trackTestCompleted(level, result.scorePercent, result.passed, timeTakenMs);
    }

    // Save test attempt to student's local & cloud attempts storage
    try {
      const userRaw = localStorage.getItem('student_user_data') || localStorage.getItem('user_data');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        const studentKey = u?.email?.toLowerCase() || u?.id || 'guest';
        const key = `student_test_attempts_${studentKey}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const newAttempt = {
          id: `att-${Date.now()}`,
          level,
          dateTime: new Date().toISOString(),
          scorePercent: result.scorePercent || result.score || 0,
          passed: !!result.passed,
          correctCount: result.correctCount || 0,
          totalQuestions: result.totalQuestions || questions.length || 20,
          timeTakenSeconds: Math.round(timeTakenMs / 1000),
        };
        localStorage.setItem(key, JSON.stringify([...existing, newAttempt]));

        // Real-time Cloud DB save to Supabase test_attempts table
        supabase.from('test_attempts').upsert([{
          id: newAttempt.id,
          student_id: u?.id || 'st-demo',
          student_email: studentKey,
          level: newAttempt.level,
          score_percent: newAttempt.scorePercent,
          passed: newAttempt.passed,
          correct_count: newAttempt.correctCount,
          total_questions: newAttempt.totalQuestions,
          time_taken_seconds: newAttempt.timeTakenSeconds,
          created_at: newAttempt.dateTime,
        }]).then(() => {}).catch(() => {});
      }
    } catch { /* ignore */ }

    onResult(result);
  }, [level, submitting, token, onResult, questions]);

  useEffect(() => {
    ldAPI.testQuestions(level)
      .then(({ questions: qs, error }) => {
        if (error || !qs || qs.length === 0) { setQuestions(buildDemoQuestions()); setLoading(false); trackTestStarted(level); return; }
        setQuestions(qs);
        setLoading(false);
        trackTestStarted(level);
      })
      .catch(() => {
        setQuestions(buildDemoQuestions());
        setLoading(false);
        trackTestStarted(level);
      });
  }, [level, token]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitTest(answers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, questions.length]);

  const selectOption = (option) => {
    if (answered.current || submitting) return;
    answered.current = true;
    setSelected(option);

    const newAnswers = { ...answers, [questions[current].id]: option };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
        answered.current = false;
      } else {
        submitTest(newAnswers);
      }
    }, 600);
  };

  const skipQuestion = () => {
    if (answered.current || submitting) return;
    answered.current = true;
    const newAnswers = { ...answers, [questions[current].id]: '' };
    setAnswers(newAnswers);
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
      answered.current = false;
    } else {
      submitTest(newAnswers);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading Level {level} test⬦</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400">No questions available for this level yet.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 text-sm hover:underline">← Back to levels</button>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft < 120 ? 'text-red-600' : timeLeft < 300 ? 'text-amber-500' : 'text-slate-600';
  const options = q.options || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { if (window.confirm('Exit test? Your answers will be lost.')) { trackTestAbandoned(level, current); onBack(); } }}
          className="text-slate-400 hover:text-slate-600 text-sm transition"
        >
          Exit
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">
            {current + 1} / {questions.length}
          </span>
          <span className={`text-sm font-bold tabular-nums ${timerColor}`}>
            ⏱ {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
          </span>
        </div>
        <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${LEVEL_COLORS[level]}`}>
          Level {level}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full rounded-full transition-all duration-300 ${LEVEL_COLORS[level]}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Timer ring warning */}
      {timeLeft < 120 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4 text-sm text-red-700 font-medium text-center">
          ⚠️ Less than 2 minutes remaining!
        </div>
      )}

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
          Question {current + 1}
        </p>
        <p className="text-lg font-bold text-slate-800 leading-relaxed mb-3">{q.question_text}</p>
        {/* Audio only for scenario-based questions in Level 4 & 5 */}
        {(level >= 4 && q.question_type === 'scenario') && <SpeakBtn text={q.question_text} />}
      </div>

      {/* Options or Speaking input */}
      {q.question_type === 'speaking' ? (
        <SpeakingInput
          onAnswer={(text) => {
            if (answered.current || submitting) return;
            answered.current = true;
            const newAnswers = { ...answers, [q.id]: text };
            setAnswers(newAnswers);
            setTimeout(() => {
              if (current + 1 < questions.length) {
                setCurrent((c) => c + 1);
                answered.current = false;
              } else {
                submitTest(newAnswers);
              }
            }, 400);
          }}
          submitting={submitting}
        />
      ) : (
        <div className="space-y-3">
          {options.map((opt, i) => {
            const isSelected = selected === opt;
            return (
              <button
                key={i}
                onClick={() => selectOption(opt)}
                disabled={!!selected || submitting}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-600 text-white scale-[1.01] shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.99]'}
                  disabled:cursor-not-allowed`}
              >
                <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-extrabold mr-3
                  ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Skip (only for MCQ) */}
      {q.question_type !== 'speaking' && (
        <div className="mt-5 text-center">
          <button
            onClick={skipQuestion}
            disabled={!!selected || submitting}
            className="text-slate-400 hover:text-slate-600 text-sm transition disabled:opacity-0"
          >
            Skip this question � 
          </button>
        </div>
      )}

      {/* Submit all button (last question, MCQ only) */}
      {current === questions.length - 1 && !selected && !submitting && q.question_type !== 'speaking' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => submitTest(answers)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition"
          >
            Submit Test
          </button>
        </div>
      )}

      {submitting && (
        <div className="mt-6 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Scoring your test⬦
        </div>
      )}
    </div>
  );
};

export default StudentTestQuiz;
