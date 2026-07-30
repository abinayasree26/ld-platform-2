/**
 * SpeakButton — Reusable Text-to-Speech component
 * 
 * Reads any text aloud using the Browser Speech Synthesis API.
 * Optimized for Indian English with slower speech rate for LD students.
 * 
 * Usage:
 *   <SpeakButton text="What word rhymes with cat?" />
 *   <SpeakButton text={question.text} size="lg" label="Read aloud" />
 */

import React, { useState, useEffect } from 'react';

const SIZES = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-xs px-3 py-1.5 gap-1.5',
  lg: 'text-sm px-4 py-2 gap-2',
};

const SpeakButton = ({
  text,
  size = 'md',
  label = null,
  lang = 'en-IN',
  rate = 0.85,
  className = '',
}) => {
  const [state, setState] = useState('idle'); // idle | playing

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state === 'playing') {
        window.speechSynthesis?.cancel();
      }
    };
  }, [state]);

  if (!('speechSynthesis' in window)) return null;

  const speak = () => {
    if (state === 'playing') {
      window.speechSynthesis.cancel();
      setState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Prefer Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-IN')
      || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');

    setState('playing');
    window.speechSynthesis.speak(utterance);
  };

  const sizeClass = SIZES[size] || SIZES.md;
  const playingClass = 'bg-blue-600 text-white border-blue-600 animate-pulse';
  const idleClass = 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300';

  return (
    <button
      onClick={speak}
      type="button"
      title={state === 'playing' ? 'Stop reading' : 'Read aloud'}
      className={`inline-flex items-center font-semibold rounded-full border transition-all
        ${sizeClass} ${state === 'playing' ? playingClass : idleClass} ${className}`}
    >
      {state === 'playing' ? '⏸' : '▶'}
      {label !== null ? label : (state === 'playing' ? 'Stop' : 'Hear')}
    </button>
  );
};

export default SpeakButton;
