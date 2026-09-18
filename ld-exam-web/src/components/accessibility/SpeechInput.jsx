/**
 * SpeechInput — Reusable Speech-to-Text input component
 *
 * Lets students answer by speaking instead of typing/clicking.
 * Uses the Web Speech Recognition API.
 *
 * Usage:
 *   <SpeechInput onResult={(text) => handleAnswer(text)} />
 *   <SpeechInput onResult={handleAnswer} lang="en-IN" placeholder="Tap mic and speak" />
 *   <SpeechInput onResult={handleAnswer} maxSeconds={60} />  // 60s countdown
 *
 * `maxSeconds` (optional): when > 0, recording is capped at that many seconds
 * with a visible + accessible countdown. Recording still begins ONLY when the
 * learner clicks the mic (thinking time is unlimited before that). The learner
 * may stop earlier. At 0 the recording auto-stops and the transcript is kept.
 */

import React, { useState, useRef, useEffect } from 'react';

const SpeechInput = ({
  onResult,
  lang = 'en-IN',
  placeholder = 'Tap the mic and speak your answer',
  disabled = false,
  showSubmit = true,
  autoSubmit = false,
  maxSeconds = 0,          // 0 = no timer (default, unchanged behavior)
  className = '',
}) => {
  const [state, setState] = useState('idle'); // idle | listening | done
  const [transcript, setTranscript] = useState('');
  const [remaining, setRemaining] = useState(maxSeconds); // seconds left
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalRef = useRef('');     // accumulates final transcript across pauses
  const stateRef = useRef('idle'); // avoid stale closure in recognition handlers

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Keep a ref of the latest state for use inside recognition callbacks.
  useEffect(() => { stateRef.current = state; }, [state]);

  // Cleanup timer/recognition on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  }, []);

  if (!SpeechRecognition) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-sm text-amber-700">
        🎤 Speech input requires Chrome or Edge browser.
      </div>
    );
  }

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startListening = () => {
    finalRef.current = '';
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    // When a timer is set, allow continuous speech (with pauses) for the whole
    // window; otherwise keep the original single-utterance behavior.
    recognition.continuous = maxSeconds > 0;
    recognition.interimResults = maxSeconds > 0;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      finalRef.current = finalText.trim();
      const shown = (finalText + interim).trim();
      setTranscript(shown);
      // Original (no-timer) behavior: single result → done + optional autosubmit.
      if (maxSeconds === 0) {
        setState('done');
        if (autoSubmit && shown) onResult(shown);
      }
    };

    recognition.onerror = () => { clearTimer(); setState('idle'); };
    recognition.onend = () => {
      clearTimer();
      // If we captured anything, finalize to 'done'; else back to idle.
      const captured = (finalRef.current || transcript || '').trim();
      if (captured) {
        setTranscript(captured);
        setState('done');
        if (autoSubmit && captured) onResult(captured);
      } else if (stateRef.current === 'listening') {
        setState('idle');
      }
    };

    setState('listening');
    recognition.start();

    // Start the countdown ONLY now (after recording begins).
    if (maxSeconds > 0) {
      setRemaining(maxSeconds);
      clearTimer();
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            // Auto-stop at 0.
            try { recognitionRef.current?.stop(); } catch { /* noop */ }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopListening = () => {
    clearTimer();
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    // onend will finalize the transcript/state.
  };

  const submit = () => {
    const text = (transcript || finalRef.current || '').trim();
    if (text) {
      onResult(text);
      setTranscript('');
      finalRef.current = '';
      setState('idle');
      setRemaining(maxSeconds);
    }
  };

  const retry = () => {
    setTranscript('');
    finalRef.current = '';
    setState('idle');
    setRemaining(maxSeconds);
  };

  const listening = state === 'listening';
  const statusText = listening
    ? (maxSeconds > 0 ? `Recording. ${remaining} seconds remaining.` : 'Recording…')
    : '';

  return (
    <div className={`flex flex-col items-center gap-3 py-3 ${className}`}>
      {/* Transcript display */}
      {state === 'done' && transcript ? (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">You said:</p>
          <p className="text-base font-semibold text-slate-800">"{transcript}"</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {listening ? '🎙️ Listening… speak now' : placeholder}
        </p>
      )}

      {/* Mic button */}
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        aria-label={listening ? 'Stop recording' : 'Start speaking'}
        title={listening ? 'Stop recording' : 'Start speaking'}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
          ${listening
            ? 'bg-red-600 text-white animate-pulse scale-110'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {listening ? '⏹' : '🎤'}
      </button>

      {/* Recording status + countdown (visible + screen-reader accessible) */}
      {listening && (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-1 mt-1">
          <div className="text-sm font-semibold text-red-600">🔴 Recording…</div>
          {maxSeconds > 0 && (
            <div className="text-sm font-bold text-slate-700">
              Time remaining: {remaining}s
            </div>
          )}
          {/* Screen-reader-only live text */}
          <span className="sr-only">{statusText}</span>
          <button
            type="button"
            onClick={stopListening}
            className="mt-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"
            aria-label="Stop recording"
          >
            ⏹ Stop Recording
          </button>
        </div>
      )}

      {/* Action buttons after speech is captured */}
      {state === 'done' && transcript && showSubmit && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeechInput;
