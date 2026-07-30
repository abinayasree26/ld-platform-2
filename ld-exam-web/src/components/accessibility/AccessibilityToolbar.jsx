/**
 * AccessibilityToolbar — Floating accessibility controls
 * 
 * A compact, collapsible toolbar that provides:
 * - Read Page: Reads all visible text on the page aloud
 * - Dyslexia Font: Toggles a dyslexia-friendly font
 * - Larger Text: Increases text size
 * - High Contrast: Increases contrast
 * 
 * Place this component in the app layout so it appears on every student page.
 * 
 * Usage:
 *   <AccessibilityToolbar />
 */

import React, { useState, useEffect } from 'react';
import AACBoard from './AACBoard';

const AccessibilityToolbar = () => {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showAAC, setShowAAC] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(() => localStorage.getItem('a11y_font') === 'true');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('a11y_large') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('a11y_contrast') === 'true');

  // Apply settings on mount and change
  useEffect(() => {
    document.documentElement.classList.toggle('a11y-dyslexia-font', dyslexiaFont);
    localStorage.setItem('a11y_font', dyslexiaFont);
  }, [dyslexiaFont]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-large-text', largeText);
    localStorage.setItem('a11y_large', largeText);
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
    localStorage.setItem('a11y_contrast', highContrast);
  }, [highContrast]);

  // Read all visible text on the page
  const readPage = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const mainContent = document.querySelector('.sp-content') || document.querySelector('main') || document.body;
    const text = mainContent.innerText;

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000)); // limit to ~3000 chars
    utterance.lang = 'en-IN';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!('speechSynthesis' in window)) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        title="Accessibility tools"
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg
          flex items-center justify-center text-xl hover:bg-blue-700 transition-all active:scale-95"
      >
        {open ? '✕' : '♿'}
      </button>

      {/* Toolbar panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-64
          animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-sm font-bold text-slate-700 mb-3">♿ Accessibility</h3>

          <div className="space-y-2">
            {/* Read Page */}
            <button
              onClick={readPage}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition
                ${speaking ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="text-lg">{speaking ? '⏸' : '🔊'}</span>
              {speaking ? 'Stop Reading' : 'Read Page Aloud'}
            </button>

            {/* Dyslexia Font */}
            <button
              onClick={() => setDyslexiaFont(!dyslexiaFont)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition
                ${dyslexiaFont ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="text-lg">🔤</span>
              Dyslexia-Friendly Font
              {dyslexiaFont && <span className="ml-auto text-xs">ON</span>}
            </button>

            {/* Larger Text */}
            <button
              onClick={() => setLargeText(!largeText)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition
                ${largeText ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="text-lg">🔍</span>
              Larger Text
              {largeText && <span className="ml-auto text-xs">ON</span>}
            </button>

            {/* High Contrast */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition
                ${highContrast ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="text-lg">◐</span>
              High Contrast
              {highContrast && <span className="ml-auto text-xs">ON</span>}
            </button>
          </div>

          {/* AAC Board toggle */}
          <button
            onClick={() => { setShowAAC(!showAAC); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition
              bg-slate-50 text-slate-700 hover:bg-slate-100 mt-2 border border-slate-200"
          >
            <span className="text-lg">🗣️</span>
            AAC Communication Board
          </button>

          <p className="text-[10px] text-slate-400 mt-3 text-center">
            Settings are saved automatically
          </p>
        </div>
      )}

      {/* AAC Board panel */}
      {showAAC && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">🗣️ AAC Board</span>
            <button onClick={() => setShowAAC(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
          </div>
          <AACBoard onSelect={(symbol) => { /* students can tap to communicate */ }} />
        </div>
      )}
    </>
  );
};

export default AccessibilityToolbar;
