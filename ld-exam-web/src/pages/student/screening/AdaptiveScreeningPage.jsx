import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { adaptiveAPI } from '../../../services/api';

import { SpeakButton, SpeechInput } from '../../../components/accessibility';



/**

 * Adaptive Screening — NEW English + Mathematics skill assessment.

 * Clean, professional, age-neutral (not a children's game). Separate from

 * the existing LD screening page (ScreeningPage.jsx). Handles every

 * question type in the bank and includes an accessibility panel.

 *

 * Adaptivity (client-side ordering): questions are grouped by subject and

 * served easiest-first (Beginner -> Intermediate -> Advanced). After each

 * subject block we compute rolling per-skill accuracy so the harder items

 * are only reached once the learner shows readiness — while still covering

 * all skills. (Deeper server-side adaptivity can be layered later.)

 */



const SUBJECT_TABS = ['English', 'Mathematics'];

// Skills where a 'Hear' (read-aloud) button helps comprehension.

// Writing/Listening/Speaking deliberately excluded.

const HEAR_SKILLS = ['Reading', 'Comprehension'];

const DIFF_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };



// Resolve an asset path to a usable URL (falls back gracefully if missing).

const assetUrl = (asset) => (asset ? asset : null);



// Text to SPEAK for a listening/repeat question (TTS instead of an mp3 file).

// Prefers an explicit quoted sentence in the question text; otherwise reads

// the whole prompt. This is what the learner "listens" to.

function spokenTextFor(q) {

  if (!q) return '';

  // If the question embeds a quoted sentence, speak just that.

  const quoted = (q.question || '').match(/[\u2018'"\u201c]([^\u2019'"\u201d]+)[\u2019'"\u201d]/);

  if (quoted && quoted[1]) return quoted[1];

  // Otherwise strip a leading instruction like "Listen and answer:" and speak the rest.

  const stripped = (q.question || '')

    .replace(/^(listen( and (repeat|answer|choose))?|read (this )?(sentence )?aloud)\s*[:\-]?\s*/i, '')

    .trim();

  return stripped || q.question || '';

}



export default function AdaptiveScreeningPage() {

  const navigate = useNavigate();



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [sessionId, setSessionId] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [order, setOrder] = useState([]);          // indices into questions[]

  const [pos, setPos] = useState(0);

  const [answers, setAnswers] = useState({});       // questionId -> studentAnswer

  const [submitting, setSubmitting] = useState(false);

  const startedAt = useRef(Date.now());



  // Accessibility settings

  const [a11y, setA11y] = useState({

    dyslexicFont: false, fontScale: 1, highContrast: false, readingRuler: false,

  });

  const [showA11y, setShowA11y] = useState(false);



  // -- Load bank + start session --

  useEffect(() => {

    (async () => {

      try {

        // Load questions first (must succeed); start the session separately so

        // a session hiccup never blanks the whole screen.

        // NOTE: the api response interceptor returns res.data directly.

        const qRes = await adaptiveAPI.questions();

        const qs = (qRes && qRes.questions) || [];

        if (!qs.length) throw new Error('No questions returned from server');

        setQuestions(qs);

        // Adaptive-ish ordering: English block then Math block, each

        // sorted easiest -> hardest, interleaving skills so coverage is even.

        const build = (subject) => qs

          .map((q, i) => ({ q, i }))

          .filter((x) => x.q.subject === subject)

          .sort((a, b) =>

            (DIFF_ORDER[a.q.difficulty] - DIFF_ORDER[b.q.difficulty]));

        const ord = [...build('English'), ...build('Mathematics')].map((x) => x.i);

        setOrder(ord);

        // Start the session (non-fatal if it fails — we retry on submit).

        try {

          const sRes = await adaptiveAPI.start();

          setSessionId((sRes && sRes.sessionId) || null);

        } catch (se) {

          console.warn('[adaptive] start session failed (will retry on submit):', se);

        }

      } catch (e) {

        console.error('[adaptive] load failed:', e);

        const detail = e?.response?.status ? ` (server said ${e.response.status})` : ` (${e?.message || 'unknown error'})`;

        setError('Could not load the screening' + detail + '. Please make sure you are logged in and try again.');

      } finally {

        setLoading(false);

      }

    })();

  }, []);



  const total = order.length;

  const currentIdx = order[pos];

  const q = questions[currentIdx];

  const answeredCount = Object.keys(answers).length;

  const progress = total ? Math.round((pos / total) * 100) : 0;



  const setAnswer = (val) => setAnswers((a) => ({ ...a, [q.id]: val }));



  const recordAndNext = async () => {

    // Fire-and-forget incremental save; final scoring happens on submit.

    if (sessionId && q && answers[q.id] !== undefined) {

      adaptiveAPI.answer(sessionId, q.id, answers[q.id]).catch(() => {});

    }

    if (pos + 1 < total) setPos(pos + 1);

  };



  const handleSubmit = async () => {

    setSubmitting(true);

    try {

      // Ensure we have a session (start was non-fatal on load).

      let sid = sessionId;

      if (!sid) {

        const sRes = await adaptiveAPI.start();

        sid = sRes?.sessionId;

        setSessionId(sid);

      }

      const payload = Object.entries(answers).map(([id, studentAnswer]) => ({ id, studentAnswer }));

      const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);

      const res = await adaptiveAPI.submit(sid, payload, durationSeconds);

      navigate(`/student/adaptive-screening/result/${sid}`, { state: res });

    } catch (e) {

      console.error('[adaptive] submit failed:', e);

      setError('Could not submit' + (e?.response?.status ? ` (server said ${e.response.status})` : '') + '. Please try again.');

      setSubmitting(false);

    }

  };



  // -- Accessibility style --

  const rootStyle = {

    fontFamily: a11y.dyslexicFont ? "'OpenDyslexic','Comic Sans MS',sans-serif" : undefined,

    fontSize: `${a11y.fontScale}rem`,

    filter: a11y.highContrast ? 'contrast(1.25)' : undefined,

    background: a11y.highContrast ? '#000' : '#eef2f9',

    color: a11y.highContrast ? '#fff' : undefined,

    minHeight: '100vh',

  };



  if (loading) return <div style={{ padding: 40 }}>Loading screening...</div>;

  if (error) return <div style={{ padding: 40, color: '#b91c1c' }}>{error}</div>;

  if (!q) return <div style={{ padding: 40 }}>No questions available.</div>;



  const cardBg = a11y.highContrast ? '#111' : '#fff';

  const answered = answers[q.id] !== undefined && answers[q.id] !== '';



  return (

    <div style={rootStyle}>

      {a11y.readingRuler && (

        <div style={{ position: 'fixed', left: 0, right: 0, top: '50%', height: 44,

          background: 'rgba(255,221,87,0.25)', borderTop: '2px solid #f59e0b',

          borderBottom: '2px solid #f59e0b', pointerEvents: 'none', zIndex: 5 }} />

      )}



      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {/* Top bar: subject tabs + accessibility toggle */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>

          <div style={{ display: 'flex', gap: 8 }}>

            {SUBJECT_TABS.map((s) => (

              <span key={s} style={{

                padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,

                background: q.subject === s ? '#1E4FA0' : '#dbe4f3',

                color: q.subject === s ? '#fff' : '#33507e' }}>{s}</span>

            ))}

          </div>

          <button onClick={() => setShowA11y((v) => !v)}

            style={{ border: 'none', background: '#1E4FA0', color: '#fff', borderRadius: 8,

              padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>

            ♿ Accessibility

          </button>

        </div>



        {/* Accessibility panel */}

        {showA11y && (

          <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 12,

            boxShadow: '0 4px 16px rgba(15,60,107,0.08)', display: 'grid', gap: 10 }}>

            <label><input type="checkbox" checked={a11y.dyslexicFont}

              onChange={(e) => setA11y({ ...a11y, dyslexicFont: e.target.checked })} /> OpenDyslexic font</label>

            <label>Font size:{' '}

              <input type="range" min="0.9" max="1.6" step="0.1" value={a11y.fontScale}

                onChange={(e) => setA11y({ ...a11y, fontScale: parseFloat(e.target.value) })} /></label>

            <label><input type="checkbox" checked={a11y.highContrast}

              onChange={(e) => setA11y({ ...a11y, highContrast: e.target.checked })} /> High contrast</label>

            <label><input type="checkbox" checked={a11y.readingRuler}

              onChange={(e) => setA11y({ ...a11y, readingRuler: e.target.checked })} /> Reading ruler / focus line</label>

          </div>

        )}



        {/* Progress header */}

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>

          <span>Question {pos + 1} / {total}</span>

          <span>{progress}%</span>

        </div>

        <div style={{ height: 8, background: '#d7e0ef', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>

          <div style={{ width: `${progress}%`, height: '100%', background: '#1E4FA0', transition: 'width .3s' }} />

        </div>

        <div style={{ fontSize: 12, color: a11y.highContrast ? '#ddd' : '#64748b', marginBottom: 16 }}>

          {q.skill} · <em>{q.subSkill}</em> · Difficulty: {q.difficulty}

        </div>



        {/* Question card */}

        <div style={{ background: cardBg, borderRadius: 16, padding: 20, boxShadow: '0 4px 16px rgba(15,60,107,0.08)' }}>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

            <p style={{ fontSize: '1.15em', fontWeight: 700, margin: 0, flex: 1 }}>{q.question}</p>

            {/* Read-the-instruction TTS. Shown only where HEARING the prompt

                aids comprehension (Reading, Comprehension). NOT shown for:

                - Listening (has its own Play-audio button),

                - Writing (read-and-type task — no audio needed),

                - Speaking (mic-focused). */}

            {!q.audio && HEAR_SKILLS.includes(q.skill) &&

              <SpeakButton text={q.question} size="md" label="Hear" title="Read the question aloud" />}

          </div>



          {/* LISTENING questions — exactly ONE audio control. Plays the

              STIMULUS (q.audioText from the server), never the instruction. */}

          {q.audio && (

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>

              <SpeakButton text={q.audioText || spokenTextFor(q)} size="lg"

                label="🔊 Play audio" title={q.skill === 'Conversation' ? 'Play question audio' : 'Play listening sentence'} />

              <span style={{ fontSize: 12, color: '#64748b' }}>Tap to listen, then answer.</span>

            </div>

          )}



          {/* Image for image-based questions */}

          {q.image && q.image.asset && (

            <div style={{ marginTop: 12, textAlign: 'center' }}>

              <img src={assetUrl(q.image.asset)} alt={q.image.altText || 'question image'}

                style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8 }}

                onError={(e) => { e.currentTarget.style.display = 'none'; }} />

              <div style={{ fontSize: 12, color: '#94a3b8' }}>{q.image.altText}</div>

            </div>

          )}



          {/* Answer input by type */}

          <div style={{ marginTop: 16 }}>

            <AnswerInput q={q} value={answers[q.id]} onChange={setAnswer} highContrast={a11y.highContrast} />

          </div>

        </div>



        {/* Nav */}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>

          <button disabled={pos === 0} onClick={() => setPos(Math.max(0, pos - 1))}

            style={navBtn(false, pos === 0)}>◀ Back</button>

          {pos + 1 < total ? (

            <button disabled={!answered} onClick={recordAndNext} style={navBtn(true, !answered)}>Next ▶</button>

          ) : (

            <button disabled={submitting || answeredCount === 0} onClick={handleSubmit} style={navBtn(true, submitting)}>

              {submitting ? 'Analyzing...' : 'Finish & See Results'}

            </button>

          )}

        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>

          Answered {answeredCount} of {total}

        </div>

      </div>

    </div>

  );

}



function navBtn(primary, disabled) {

  return {

    padding: '12px 22px', borderRadius: 10, fontWeight: 700, border: 'none',

    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,

    background: primary ? '#1E4FA0' : '#e2e8f0', color: primary ? '#fff' : '#334155',

  };

}



/** Renders the right input widget for each questionType. */

function AnswerInput({ q, value, onChange, highContrast }) {

  const t = q.questionType;



  // ORDERING questions carry `options` (the items to arrange), but they are

  // NOT single-select MCQs. Handle them BEFORE the option-based branch so the

  // learner arranges ALL items instead of picking one. Submits an ARRAY in the

  // chosen order, which the engine grades via `ordered-match`.

  if (t === 'ordering') {

    return <OrderingInput q={q} value={value} onChange={onChange} highContrast={highContrast} />;

  }



  // Option-based (MCQ, image-MCQ, audio-MCQ, passage, identification, data-chart with options)

  const hasOptions = Array.isArray(q.options) && q.options.length > 0;

  if (hasOptions) {

    return (

      <div style={{ display: 'grid', gap: 10 }}>

        {q.options.map((opt, i) => (

          <button key={i} onClick={() => onChange(opt)}

            style={{

              textAlign: 'left', padding: '12px 16px', borderRadius: 10, cursor: 'pointer',

              border: `2px solid ${value === opt ? '#1E4FA0' : (highContrast ? '#444' : '#e2e8f0')}`,

              background: value === opt ? (highContrast ? '#123' : '#eaf1fb') : 'transparent',

              color: highContrast ? '#fff' : '#334155', fontWeight: 600 }}>

            <span style={{ fontWeight: 800, color: '#94a3b8', marginRight: 10 }}>

              {String.fromCharCode(65 + i)}.</span>{opt}

          </button>

        ))}

      </div>

    );

  }



  // SPEAKING skill -> microphone ONLY (no text box). Voice is the interaction.

  const SPEAKING_TYPES = [

    'speaking-response', 'read-aloud', 'short-spoken-answer',

    'image-description-speaking',

  ];

  if (q.skill === 'Speaking' || SPEAKING_TYPES.includes(t) || t.includes('speaking')) {

    return (

      <div>

        <SpeechInput onResult={(txt) => onChange(txt)} maxSeconds={60} />

        {value ? (

          <div style={{ marginTop: 8, fontSize: 13, color: highContrast ? '#ddd' : '#334155' }}>

            <strong>You said:</strong> {typeof value === 'string' ? value : ''}

          </div>

        ) : null}

        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>

          Tap the microphone and speak your answer. Accent is never judged.

        </div>

      </div>

    );

  }



  // Matching -> one select per left item

  if (t === 'matching') {

    const pairs = (q.expectedAnswer && q.expectedAnswer.pairs) || {};

    const lefts = Object.keys(pairs);

    const rights = Object.values(pairs);

    const cur = value && typeof value === 'object' ? value : {};

    return (

      <div style={{ display: 'grid', gap: 8 }}>

        {lefts.map((l) => (

          <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

            <span style={{ fontWeight: 700, minWidth: 60 }}>{l}</span>

            <select value={cur[l] || ''} onChange={(e) => onChange({ ...cur, [l]: e.target.value })}

              style={inStyle(highContrast)}>

              <option value="">— choose —</option>

              {rights.map((r) => <option key={r} value={r}>{r}</option>)}

            </select>

          </div>

        ))}

      </div>

    );

  }



  // Numeric

  if (t === 'numeric-answer' || t === 'math-problem-solving') {

    return <input inputMode="numeric" value={value || ''} onChange={(e) => onChange(e.target.value)}

      placeholder="Type your answer" style={inStyle(highContrast)} />;

  }



  // WRITING & other typed skills -> text input ONLY (no microphone).

  // (fill-in-the-blank, short-answer, sentence-construction, text-construction,

  //  short-response, conversation/situational/follow-up, reasoning,

  //  image-based-short-answer, image-based-conversation)

  const multiline = ['text-construction', 'sentence-construction', 'short-answer',

    'short-response', 'conversation-response', 'situational-response', 'follow-up-response',

    'math-reasoning', 'image-based-conversation'].includes(t);

  return multiline

    ? <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3}

        placeholder="Type your answer..." style={taStyle(highContrast)} />

    : <input value={value || ''} onChange={(e) => onChange(e.target.value)}

        placeholder="Type your answer..." style={inStyle(highContrast)} />;

}



/**

 * OrderingInput — click-to-order / reorder widget for `ordering` questions.

 * The learner arranges ALL items (not a single MCQ pick). Two ways to order:

 *   1) Click items in the "Available" list to append them to "Your order".

 *   2) Use the up / down arrows to nudge an already-placed item.

 * Submits an ARRAY of the item strings in the chosen order (engine grades it

 * with `ordered-match`). No external drag library required — keyboard- and

 * touch-friendly, and accessible.

 */

function OrderingInput({ q, value, onChange, highContrast }) {

  const items = Array.isArray(q.options) ? q.options : [];

  const placed = Array.isArray(value) ? value.filter((v) => items.includes(v)) : [];

  const available = items.filter((it) => !placed.includes(it));



  const place = (it) => onChange([...placed, it]);

  const removeAt = (i) => onChange(placed.filter((_, idx) => idx !== i));

  const move = (i, dir) => {

    const j = i + dir;

    if (j < 0 || j >= placed.length) return;

    const next = placed.slice();

    [next[i], next[j]] = [next[j], next[i]];

    onChange(next);

  };

  const reset = () => onChange([]);



  const chip = {

    padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: '1em',

    border: `2px solid ${highContrast ? '#444' : '#cbd5e1'}`,

    background: highContrast ? '#111' : '#fff', color: highContrast ? '#fff' : '#334155',

    cursor: 'pointer', minWidth: 44, textAlign: 'center',

  };



  return (

    <div style={{ display: 'grid', gap: 14 }}>

      <p style={{ fontSize: 13, color: highContrast ? '#ddd' : '#64748b', margin: 0 }}>

        Tap the items in the correct order. Use ▲ / ▼ to adjust, or ✕ to remove.

      </p>



      {/* Available items to place */}

      <div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Available</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 44 }}>

          {available.length === 0

            ? <span style={{ fontSize: 12, color: '#94a3b8' }}>All items placed.</span>

            : available.map((it) => (

                <button key={it} type="button" onClick={() => place(it)}

                  aria-label={`Add ${it} to your order`} style={chip}>{it}</button>

              ))}

        </div>

      </div>



      {/* The learner's chosen order */}

      <div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Your order</div>

        <div style={{ display: 'grid', gap: 8 }}>

          {placed.length === 0

            ? <span style={{ fontSize: 12, color: '#94a3b8' }}>Tap items above to build your answer.</span>

            : placed.map((it, i) => (

                <div key={`${it}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                  <span style={{ fontWeight: 800, color: '#94a3b8', minWidth: 22 }}>{i + 1}.</span>

                  <span style={{ ...chip, flex: 1, cursor: 'default', textAlign: 'left',

                    borderColor: '#1E4FA0', background: highContrast ? '#123' : '#eaf1fb' }}>{it}</span>

                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}

                    aria-label={`Move ${it} up`} style={miniBtn(highContrast, i === 0)}>▲</button>

                  <button type="button" onClick={() => move(i, 1)} disabled={i === placed.length - 1}

                    aria-label={`Move ${it} down`} style={miniBtn(highContrast, i === placed.length - 1)}>▼</button>

                  <button type="button" onClick={() => removeAt(i)}

                    aria-label={`Remove ${it}`} style={miniBtn(highContrast, false)}>✕</button>

                </div>

              ))}

        </div>

      </div>



      {placed.length > 0 && (

        <button type="button" onClick={reset}

          style={{ justifySelf: 'start', fontSize: 12, fontWeight: 700, color: '#64748b',

            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>

          Reset order

        </button>

      )}

    </div>

  );

}



const miniBtn = (hc, disabled) => ({

  width: 34, height: 34, borderRadius: 8, fontWeight: 800, fontSize: 13,

  border: `2px solid ${hc ? '#444' : '#e2e8f0'}`, background: hc ? '#111' : '#fff',

  color: hc ? '#fff' : '#334155', cursor: disabled ? 'not-allowed' : 'pointer',

  opacity: disabled ? 0.4 : 1,

});



const inStyle = (hc) => ({

  width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: '1em',

  border: `2px solid ${hc ? '#444' : '#e2e8f0'}`,

  background: hc ? '#111' : '#fff', color: hc ? '#fff' : '#334155', outline: 'none',

});



const taStyle = (hc) => ({ ...inStyle(hc), resize: 'vertical' });

