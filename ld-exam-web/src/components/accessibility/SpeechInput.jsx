/**
 * SpeechInput — Reusable Speech-to-Text input component
 * 
 * Lets students answer by speaking instead of typing/clicking.
 * Uses the Web Speech Recognition API.
 * 
 * Usage:
 *   <SpeechInput onResult={(text) => handleAnswer(text)} />
 *   <SpeechInput onResult={handleAnswer} lang="en-IN" placeholder="Tap mic and speak" />
 */

import React, { useState, useRef } from 'react';

const SpeechInput = ({
  onResult,
  lang = 'en-IN',
  placeholder = 'Tap the mic and speak your answer',
  disabled = false,
  showSubmit = true,
  autoSubmit = false,
  className = '',
}) => {
  const [state, setState] = useState('idle'); // idle | listening | done
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-sm text-amber-700">
        🎤 Speech input requires Chrome or Edge browser.
      </div>
    );
  }

  const startListening = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setState('done');
      if (autoSubmit && text.trim()) {
        onResult(text.trim());
      }
    };

    recognition.onerror = () => setState('idle');
    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    setState('listening');
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setState('idle');
  };

  const submit = () => {
    if (transcript.trim()) {
      onResult(transcript.trim());
      setTranscript('');
      setState('idle');
    }
  };

  const retry = () => {
    setTranscript('');
    setState('idle');
  };

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
          {state === 'listening' ? '🎙️ Listening… speak now' : placeholder}
        </p>
      )}

      {/* Mic button */}
      <button
        type="button"
        onClick={state === 'listening' ? stopListening : startListening}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
          ${state === 'listening'
            ? 'bg-red-600 text-white animate-pulse scale-110'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {state === 'listening' ? '⏹' : '🎤'}
      </button>

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
