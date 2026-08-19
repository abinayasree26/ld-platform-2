/**
 * AACBoard — Augmentative & Alternative Communication Board
 * 
 * Provides a visual symbol-based communication board for students who have
 * difficulty with traditional text/speech input. Students can tap symbols/icons
 * to communicate answers, feelings, or requests.
 * 
 * Inspired by Cboard (free AAC tool referenced in PRD §8).
 * 
 * Features:
 * - Category-based symbol boards (Answers, Feelings, Requests, Numbers)
 * - Each symbol has an icon + label + optional TTS on tap
 * - Can output a selected symbol as an answer (for quizzes)
 * - Collapsible panel that can be toggled from the accessibility toolbar
 * 
 * Usage:
 *   <AACBoard onSelect={(symbol) => handleAnswer(symbol.label)} />
 *   <AACBoard mode="feelings" onSelect={handleFeelingSelected} />
 */

import React, { useState } from 'react';

// ─── Symbol sets ────────────────────────────────────────────────────
const SYMBOL_CATEGORIES = {
  answers: {
    label: 'Answers',
    icon: '✅',
    symbols: [
      { id: 'yes', icon: '👍', label: 'Yes', color: '#22c55e' },
      { id: 'no', icon: '👎', label: 'No', color: '#ef4444' },
      { id: 'maybe', icon: '🤔', label: 'Maybe', color: '#f59e0b' },
      { id: 'dont_know', icon: '❓', label: "Don't know", color: '#6b7280' },
      { id: 'again', icon: '🔄', label: 'Say again', color: '#3b82f6' },
      { id: 'help', icon: '🙋', label: 'Help me', color: '#8b5cf6' },
      { id: 'first', icon: '1️⃣', label: 'First one', color: '#0ea5e9' },
      { id: 'second', icon: '2️⃣', label: 'Second one', color: '#0ea5e9' },
      { id: 'third', icon: '3️⃣', label: 'Third one', color: '#0ea5e9' },
      { id: 'fourth', icon: '4️⃣', label: 'Fourth one', color: '#0ea5e9' },
    ],
  },
  feelings: {
    label: 'Feelings',
    icon: '😊',
    symbols: [
      { id: 'happy', icon: '😊', label: 'Happy', color: '#22c55e' },
      { id: 'sad', icon: '😢', label: 'Sad', color: '#3b82f6' },
      { id: 'confused', icon: '😕', label: 'Confused', color: '#f59e0b' },
      { id: 'frustrated', icon: '😤', label: 'Frustrated', color: '#ef4444' },
      { id: 'tired', icon: '😴', label: 'Tired', color: '#6b7280' },
      { id: 'excited', icon: '🤩', label: 'Excited', color: '#ec4899' },
      { id: 'scared', icon: '😨', label: 'Scared', color: '#8b5cf6' },
      { id: 'proud', icon: '🥳', label: 'Proud', color: '#f97316' },
    ],
  },
  requests: {
    label: 'Requests',
    icon: '🗣️',
    symbols: [
      { id: 'break', icon: '⏸️', label: 'Break please', color: '#6b7280' },
      { id: 'repeat', icon: '🔁', label: 'Repeat', color: '#3b82f6' },
      { id: 'slower', icon: '🐢', label: 'Slower', color: '#22c55e' },
      { id: 'louder', icon: '🔊', label: 'Louder', color: '#f59e0b' },
      { id: 'teacher', icon: '👨‍🏫', label: 'Teacher', color: '#8b5cf6' },
      { id: 'bathroom', icon: '🚽', label: 'Bathroom', color: '#0ea5e9' },
      { id: 'water', icon: '💧', label: 'Water', color: '#06b6d4' },
      { id: 'done', icon: '✅', label: "I'm done", color: '#22c55e' },
    ],
  },
  numbers: {
    label: 'Numbers',
    icon: '🔢',
    symbols: [
      { id: 'n0', icon: '0', label: '0', color: '#334155' },
      { id: 'n1', icon: '1', label: '1', color: '#334155' },
      { id: 'n2', icon: '2', label: '2', color: '#334155' },
      { id: 'n3', icon: '3', label: '3', color: '#334155' },
      { id: 'n4', icon: '4', label: '4', color: '#334155' },
      { id: 'n5', icon: '5', label: '5', color: '#334155' },
      { id: 'n6', icon: '6', label: '6', color: '#334155' },
      { id: 'n7', icon: '7', label: '7', color: '#334155' },
      { id: 'n8', icon: '8', label: '8', color: '#334155' },
      { id: 'n9', icon: '9', label: '9', color: '#334155' },
      { id: 'n10', icon: '10', label: '10', color: '#334155' },
      { id: 'n100', icon: '💯', label: '100', color: '#334155' },
    ],
  },
  letters: {
    label: 'Letters',
    icon: '🔤',
    symbols: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => ({
      id: `l_${l}`, icon: l, label: l, color: '#4f46e5',
    })),
  },
};

const AACBoard = ({
  onSelect,
  mode = null, // null = show all categories, or 'answers' | 'feelings' | etc.
  compact = false,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState(mode || 'answers');
  const [lastSelected, setLastSelected] = useState(null);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSymbolTap = (symbol) => {
    speak(symbol.label);
    setLastSelected(symbol);
    if (onSelect) onSelect(symbol);
  };

  const categories = mode
    ? { [mode]: SYMBOL_CATEGORIES[mode] }
    : SYMBOL_CATEGORIES;

  const currentSymbols = SYMBOL_CATEGORIES[activeCategory]?.symbols || [];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden ${className}`}>
      {/* Category tabs (hidden if single mode) */}
      {!mode && (
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {Object.entries(categories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition
                ${activeCategory === key
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Symbol grid */}
      <div className={`grid gap-2 p-3 ${compact ? 'grid-cols-5' : 'grid-cols-4 sm:grid-cols-5'}`}>
        {currentSymbols.map((symbol) => (
          <button
            key={symbol.id}
            onClick={() => handleSymbolTap(symbol)}
            title={symbol.label}
            className={`flex flex-col items-center justify-center rounded-xl p-2 border-2 transition-all
              active:scale-95 hover:shadow-md
              ${lastSelected?.id === symbol.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                : 'border-slate-200 bg-white hover:border-slate-300'}`}
            style={{ minHeight: compact ? 52 : 64 }}
          >
            <span className={compact ? 'text-lg' : 'text-2xl'}>{symbol.icon}</span>
            <span className="text-[10px] font-medium text-slate-600 mt-0.5 leading-tight text-center">
              {symbol.label}
            </span>
          </button>
        ))}
      </div>

      {/* Last selected indicator */}
      {lastSelected && (
        <div className="px-3 pb-2 flex items-center gap-2 text-xs text-slate-500">
          <span>Selected:</span>
          <span className="font-bold text-slate-700">{lastSelected.icon} {lastSelected.label}</span>
        </div>
      )}
    </div>
  );
};

export default AACBoard;
export { SYMBOL_CATEGORIES };
