import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';
import { trackCMSAction } from '../../services/analytics';

const EXERCISE_TYPES = ['phonics', 'reading', 'writing', 'math', 'speaking'];
const LD_TARGETS = ['dyslexia', 'dysgraphia', 'dyscalculia', 'mixed'];
const CATEGORIES = ['phonics', 'reading', 'writing', 'math'];
const LEVELS = [1, 2, 3, 4, 5];
const DIFFICULTIES = [1, 2, 3];
const PAGE_SIZE = 20;

const Badge = ({ children, color = 'bg-slate-100 text-[var(--text-muted)]' }) => (
  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{children}</span>
);

const TYPE_COLORS = {
  phonics: 'bg-purple-100 text-purple-700',
  reading: 'bg-blue-100 text-blue-700',
  writing: 'bg-orange-100 text-orange-700',
  math: 'bg-green-100 text-green-700',
  speaking: 'bg-teal-100 text-teal-700',
};

// ─── Question Form ─────────────────────────────────────────────────────────────
const QuestionForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    level: 1, questionType: 'mcq', category: 'phonics',
    questionText: '', options: ['', '', '', ''], correctAnswer: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOpt = (i, v) => {
    const opts = [...form.options];
    opts[i] = v;
    setForm((f) => ({ ...f, options: opts }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const nonEmpty = form.options.filter((o) => o.trim());
    if (nonEmpty.length < 2) { toast.error('At least 2 options required'); return; }
    if (!form.correctAnswer.trim()) { toast.error('Correct answer required'); return; }
    if (!nonEmpty.includes(form.correctAnswer.trim())) {
      toast.error('Correct answer must match one of the options');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, options: nonEmpty, correctAnswer: form.correctAnswer.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Level</label>
          <select value={form.level} onChange={(e) => set('level', Number(e.target.value))}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm">
            {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm capitalize">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
          <select value={form.questionType} onChange={(e) => set('questionType', e.target.value)}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm">
            {['mcq', 'speaking', 'fill_blank'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Question Text</label>
        <textarea
          value={form.questionText} onChange={(e) => set('questionText', e.target.value)}
          rows={3} required minLength={5}
          className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Enter the question…"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Options</label>
        <div className="grid grid-cols-2 gap-2">
          {form.options.map((opt, i) => (
            <input key={i} value={opt} onChange={(e) => setOpt(i, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm"
            />
          ))}
        </div>
        <button type="button" onClick={() => setForm((f) => ({ ...f, options: [...f.options, ''] }))}
          className="mt-1 text-xs text-blue-600 hover:underline">
          + Add option
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Correct Answer (must match an option exactly)</label>
        <input value={form.correctAnswer} onChange={(e) => set('correctAnswer', e.target.value)}
          required className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Option A text" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-slate-500 hover:bg-[var(--bg-main)]">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

// ─── Exercise Form ─────────────────────────────────────────────────────────────
const ExerciseForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    exerciseType: 'phonics', ldTarget: 'dyslexia', level: 1,
    title: '', instruction: '', content: '{}',
  });
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateJson = (v) => {
    try { JSON.parse(v); setJsonError(''); } catch { setJsonError('Invalid JSON'); }
  };

  const submit = async (e) => {
    e.preventDefault();
    let content;
    try { content = JSON.parse(form.content); } catch { toast.error('Fix JSON errors'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, level: Number(form.level), content });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Exercise Type</label>
          <select value={form.exerciseType} onChange={(e) => set('exerciseType', e.target.value)}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm capitalize">
            {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">LD Target</label>
          <select value={form.ldTarget} onChange={(e) => set('ldTarget', e.target.value)}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm capitalize">
            {LD_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Level</label>
          <select value={form.level} onChange={(e) => set('level', Number(e.target.value))}
            className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm">
            {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
        <input value={form.title} onChange={(e) => set('title', e.target.value)}
          required minLength={3} className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm"
          placeholder="Exercise title" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Instruction</label>
        <input value={form.instruction} onChange={(e) => set('instruction', e.target.value)}
          required minLength={5} className="w-full border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm"
          placeholder="Instruction shown to student" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          Content (JSON)
          {jsonError && <span className="ml-2 text-red-500 font-normal">{jsonError}</span>}
        </label>
        <textarea
          value={form.content}
          onChange={(e) => { set('content', e.target.value); validateJson(e.target.value); }}
          rows={8}
          className={`w-full border bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-2 text-xs font-mono resize-y ${jsonError ? 'border-red-400' : 'border-[var(--border-main)]'}`}
          placeholder={'{\n  "type": "letter_tap",\n  "items": []\n}'}
        />
        <p className="text-xs text-slate-500 mt-1">
          Types: letter_tap, word_blend, fill_blank, word_choice, word_builder, count_tap, word_problem, dictation, read_aloud
        </p>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-slate-500 hover:bg-[var(--bg-main)]">
          Cancel
        </button>
        <button type="submit" disabled={saving || !!jsonError}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)]">
        <h3 className="font-bold text-[var(--text-main)]">{title}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-500 text-xl font-bold">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Main CMS page ─────────────────────────────────────────────────────────────
const AdminCMS = () => {
  const [tab, setTab] = useState('questions'); // 'questions' | 'exercises'
  const [questions, setQuestions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [qTotal, setQTotal] = useState(0);
  const [eTotal, setETotal] = useState(0);
  const [qFilter, setQFilter] = useState({ level: '', category: '', page: 1 });
  const [eFilter, setEFilter] = useState({ type: '', page: 1 });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | { type: 'create-q' | 'edit-q' | 'create-e' | 'edit-e', data? }

  // ─── Load Questions from Supabase ───────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cms_content')
        .select('*', { count: 'exact' })
        .eq('content_type', 'question')
        .order('created_at', { ascending: false });

      if (qFilter.level) query = query.eq('level', Number(qFilter.level));
      if (qFilter.category) query = query.eq('category', qFilter.category);

      const from = (qFilter.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setQuestions(data || []);
      setQTotal(count || 0);
    } catch (err) {
      console.error('Load questions error:', err);
      toast.error('Could not load questions');
    } finally {
      setLoading(false);
    }
  }, [qFilter]);

  // ─── Load Exercises from Supabase ───────────────────────────────────────────
  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cms_content')
        .select('*', { count: 'exact' })
        .eq('content_type', 'exercise')
        .order('created_at', { ascending: false });

      if (eFilter.type) query = query.eq('exercise_type', eFilter.type);

      const from = (eFilter.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setExercises(data || []);
      setETotal(count || 0);
    } catch (err) {
      console.error('Load exercises error:', err);
      toast.error('Could not load exercises');
    } finally {
      setLoading(false);
    }
  }, [eFilter]);

  useEffect(() => { if (tab === 'questions') loadQuestions(); }, [tab, loadQuestions]);
  useEffect(() => { if (tab === 'exercises') loadExercises(); }, [tab, loadExercises]);

  // ─── Delete Question ────────────────────────────────────────────────────────
  const deleteQuestion = async (id) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('cms_content').delete().eq('id', id);
      if (error) throw error;
      toast.success('Question deleted');
      trackCMSAction('delete', 'question');
      loadQuestions();
    } catch { toast.error('Delete failed'); }
  };

  // ─── Delete Exercise ────────────────────────────────────────────────────────
  const deleteExercise = async (id) => {
    if (!window.confirm('Delete this exercise? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('cms_content').delete().eq('id', id);
      if (error) throw error;
      toast.success('Exercise deleted');
      trackCMSAction('delete', 'exercise');
      loadExercises();
    } catch { toast.error('Delete failed'); }
  };

  // ─── Save Question (Create / Update) ───────────────────────────────────────
  const saveQuestion = async (data) => {
    try {
      const row = {
        id: modal?.data?.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content_type: 'question',
        level: Number(data.level),
        title: data.questionText?.slice(0, 100) || 'Untitled Question',
        category: data.category,
        question_type: data.questionType,
        question_text: data.questionText,
        options: data.options,
        correct_answer: data.correctAnswer,
      };

      if (modal?.data?.id) {
        // Update existing
        const { id, ...updateRow } = row;
        const { error } = await supabase
          .from('cms_content')
          .update(updateRow)
          .eq('id', modal.data.id);
        if (error) throw error;
        trackCMSAction('update', 'question');
        toast.success('Question updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('cms_content')
          .insert(row);
        if (error) throw error;
        trackCMSAction('create', 'question');
        toast.success('Question created');
      }
      setModal(null);
      loadQuestions();
    } catch (err) {
      console.error('Save question error:', err);
      toast.error(err?.message || 'Save failed');
    }
  };

  // ─── Save Exercise (Create / Update) ───────────────────────────────────────
  const saveExercise = async (data) => {
    try {
      const row = {
        id: modal?.data?.id || `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content_type: 'exercise',
        level: Number(data.level),
        exercise_type: data.exerciseType,
        ld_target: data.ldTarget,
        title: data.title,
        instruction: data.instruction,
        content: data.content,
      };

      if (modal?.data?.id) {
        const { id, ...updateRow } = row;
        const { error } = await supabase
          .from('cms_content')
          .update(updateRow)
          .eq('id', modal.data.id);
        if (error) throw error;
        trackCMSAction('update', 'exercise');
        toast.success('Exercise updated');
      } else {
        const { error } = await supabase
          .from('cms_content')
          .insert(row);
        if (error) throw error;
        trackCMSAction('create', 'exercise');
        toast.success('Exercise created');
      }
      setModal(null);
      loadExercises();
    } catch (err) {
      console.error('Save exercise error:', err);
      toast.error(err?.message || 'Save failed');
    }
  };

  // ─── Bulk Import (JSON/CSV) ─────────────────────────────────────────────────
  const handleBulkImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      let items = [];

      if (file.name.endsWith('.json')) {
        items = JSON.parse(text);
        if (!Array.isArray(items)) items = [items];
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parse: first row = headers, rest = data
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
          items.push(obj);
        }
      }

      if (!items.length) { toast.error('No items found in file'); return; }

      // Determine type from data
      const isExercise = items[0].exercise_type || items[0].exerciseType || items[0].title;

      const rows = items.map(item => {
        if (isExercise) {
          return {
            content_type: 'exercise',
            level: Number(item.level) || 1,
            exercise_type: item.exercise_type || item.exerciseType || 'phonics',
            ld_target: item.ld_target || item.ldTarget || 'dyslexia',
            title: item.title || '',
            instruction: item.instruction || '',
            content: typeof item.content === 'string' ? JSON.parse(item.content) : (item.content || {}),
          };
        } else {
          return {
            content_type: 'question',
            level: Number(item.level) || 1,
            category: item.category || 'phonics',
            question_type: item.question_type || item.questionType || 'mcq',
            question_text: item.question_text || item.questionText || '',
            options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []),
            correct_answer: item.correct_answer || item.correctAnswer || '',
          };
        }
      });

      const { error } = await supabase.from('cms_content').insert(rows);
      if (error) throw error;

      toast.success(`Imported ${rows.length} ${isExercise ? 'exercises' : 'questions'} successfully!`);
      trackCMSAction('bulk_import', isExercise ? 'exercise' : 'question');
      if (tab === 'questions') loadQuestions(); else loadExercises();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed: ' + (err?.message || 'Invalid file format'));
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-main)]">Content Management</h2>
              <p className="text-slate-500 text-sm mt-1">Manage test questions and practice exercises</p>
            </div>
            <div className="flex gap-2">
              <input type="file" id="cms-import" accept=".csv,.json" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { handleBulkImport(file); e.target.value = ''; }
              }} />
              <button onClick={() => document.getElementById('cms-import').click()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                📥 Bulk Upload
              </button>
              <button onClick={() => {
                const exportData = tab === 'questions' ? questions : exercises;
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `${tab}_export_${new Date().toISOString().slice(0,10)}.json`; a.click();
                toast.success('Exported!');
              }} className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-slate-500 hover:border-purple-400 hover:text-purple-600 transition">
                📤 Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[var(--bg-main)] border border-[var(--border-main)] p-1 rounded-xl w-fit mb-6">
          {[['questions', 'Test Questions'], ['exercises', 'Practice Exercises']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition
                ${tab === key ? 'bg-[var(--bg-card)] text-purple-600 shadow-sm' : 'text-slate-500 hover:text-[var(--text-main)]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Questions tab */}
        {tab === 'questions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3 items-center">
                <select value={qFilter.level} onChange={(e) => setQFilter({ ...qFilter, level: e.target.value, page: 1 })}
                  className="border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-1.5 text-sm">
                  <option value="">All Levels</option>
                  {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
                </select>
                <select value={qFilter.category} onChange={(e) => setQFilter({ ...qFilter, category: e.target.value, page: 1 })}
                  className="border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-1.5 text-sm capitalize">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-[var(--text-muted)]">{qTotal} total</span>
              </div>
              <button onClick={() => setModal({ type: 'create-q' })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl">
                + New Question
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-main)] overflow-hidden bg-[var(--bg-card)] shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-[var(--bg-main)] border-b border-[var(--border-main)]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Question</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-20">Level</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-24">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-28">Correct Ans.</th>
                      <th className="w-20 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {questions.map((q) => (
                      <tr key={q.id} className="hover:bg-[var(--bg-main)] transition">
                        <td className="px-4 py-3 font-medium text-[var(--text-main)] max-w-xs truncate">{q.question_text}</td>
                        <td className="px-4 py-3"><Badge>L{q.level}</Badge></td>
                        <td className="px-4 py-3"><Badge color={TYPE_COLORS[q.category]}>{q.category}</Badge></td>
                        <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[7rem]">{q.correct_answer}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setModal({ type: 'edit-q', data: {
                              id: q.id,
                              questionText: q.question_text,
                              questionType: q.question_type || 'mcq',
                              correctAnswer: q.correct_answer,
                              options: Array.isArray(q.options) ? q.options : [],
                              level: q.level,
                              category: q.category,
                            }})} className="text-blue-600 hover:underline text-xs font-semibold">Edit</button>
                            <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:underline text-xs font-semibold">Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!questions.length && (
                      <tr><td colSpan={5} className="text-center py-12 text-[var(--text-muted)]">No questions yet — click "+ New Question" to add one</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {qTotal > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-4">
                <button disabled={qFilter.page <= 1} onClick={() => setQFilter((f) => ({ ...f, page: f.page - 1 }))}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-sm disabled:opacity-40">← Prev</button>
                <span className="text-sm text-slate-500 self-center">Page {qFilter.page} of {Math.ceil(qTotal / PAGE_SIZE)}</span>
                <button disabled={qFilter.page * PAGE_SIZE >= qTotal} onClick={() => setQFilter((f) => ({ ...f, page: f.page + 1 }))}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-sm disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}

        {/* Exercises tab */}
        {tab === 'exercises' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3 items-center">
                <select value={eFilter.type} onChange={(e) => setEFilter({ type: e.target.value, page: 1 })}
                  className="border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg px-3 py-1.5 text-sm capitalize">
                  <option value="">All Types</option>
                  {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-[var(--text-muted)]">{eTotal} total</span>
              </div>
              <button onClick={() => setModal({ type: 'create-e' })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl">
                + New Exercise
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-main)] overflow-hidden bg-[var(--bg-card)] shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-[var(--bg-main)] border-b border-[var(--border-main)]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-24">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-24">LD Target</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase w-16">Level</th>
                      <th className="w-20 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {exercises.map((ex) => (
                      <tr key={ex.id} className="hover:bg-[var(--bg-main)] transition">
                        <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                          <div className="text-[var(--text-main)] font-medium">{ex.title}</div>
                          <div className="text-xs text-[var(--text-muted)] truncate max-w-xs">{ex.instruction}</div>
                        </td>
                        <td className="px-4 py-3"><Badge color={TYPE_COLORS[ex.exercise_type]}>{ex.exercise_type}</Badge></td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs capitalize">{(ex.ld_target || '').replace('_', ' ')}</td>
                        <td className="px-4 py-3"><Badge>L{ex.level}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setModal({ type: 'edit-e', data: {
                              id: ex.id,
                              exerciseType: ex.exercise_type,
                              ldTarget: ex.ld_target,
                              level: ex.level,
                              title: ex.title,
                              instruction: ex.instruction,
                              content: JSON.stringify(ex.content || {}, null, 2),
                            }})} className="text-blue-600 hover:underline text-xs font-semibold">Edit</button>
                            <button onClick={() => deleteExercise(ex.id)} className="text-red-500 hover:underline text-xs font-semibold">Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!exercises.length && (
                      <tr><td colSpan={5} className="text-center py-12 text-[var(--text-muted)]">No exercises yet — click "+ New Exercise" to add one</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {eTotal > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-4">
                <button disabled={eFilter.page <= 1} onClick={() => setEFilter((f) => ({ ...f, page: f.page - 1 }))}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-sm disabled:opacity-40">← Prev</button>
                <span className="text-sm text-slate-500 self-center">Page {eFilter.page} of {Math.ceil(eTotal / PAGE_SIZE)}</span>
                <button disabled={eFilter.page * PAGE_SIZE >= eTotal} onClick={() => setEFilter((f) => ({ ...f, page: f.page + 1 }))}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-sm disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create-q' && (
        <Modal title="New Question" onClose={() => setModal(null)}>
          <QuestionForm onSave={saveQuestion} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'edit-q' && (
        <Modal title="Edit Question" onClose={() => setModal(null)}>
          <QuestionForm initial={modal.data} onSave={saveQuestion} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'create-e' && (
        <Modal title="New Exercise" onClose={() => setModal(null)}>
          <ExerciseForm onSave={saveExercise} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'edit-e' && (
        <Modal title="Edit Exercise" onClose={() => setModal(null)}>
          <ExerciseForm initial={modal.data} onSave={saveExercise} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </Layout>
  );
};

export default AdminCMS;
