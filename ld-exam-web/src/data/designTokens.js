/**
 * LD Learn — Design Tokens (Phase 0)
 * ---------------------------------------------------------------------------
 * A single source of truth for the visual system, mirrored from the CSS
 * variables in index.css. The Student pages are built with inline styles, so
 * this module lets them adopt the shared look WITHOUT rewriting their markup.
 *
 * Usage:
 *   import { LD, card, btnPrimary, chip } from '../../../data/designTokens';
 *   <div style={card()}> ... </div>
 *   <button style={btnPrimary()}>Next</button>
 *
 * IMPORTANT: This is additive styling only. It changes NO logic, data, routes,
 * scoring, or component behavior. Values match the .ld-* CSS classes so pages
 * can use either approach interchangeably.
 */

export const LD = {
  // Brand
  primary: '#2563EB',
  primary700: '#1D4ED8',
  primarySoft: '#EAF1FB',
  primaryRing: 'rgba(37, 99, 235, 0.35)',

  // Subject accents
  english: '#2563EB',
  englishSoft: '#EAF1FB',
  math: '#0EA5A4',
  mathSoft: '#E3F6F5',

  // Semantic
  strong: '#16A34A',
  strongSoft: '#E7F6EC',
  developing: '#F59E0B',
  developingSoft: '#FEF3E2',
  support: '#EF4444',
  supportSoft: '#FDECEC',

  // Neutrals
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',

  // Radii
  radiusSm: 10,
  radius: 16,
  radiusLg: 20,
  radiusPill: 999,

  // Shadows
  shadowSm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  shadow: '0 4px 16px rgba(15, 60, 107, 0.08)',
  shadowLg: '0 10px 30px rgba(15, 60, 107, 0.12)',

  // Spacing
  gapXs: 6,
  gapSm: 10,
  gap: 16,
  gapLg: 24,

  // Typography
  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
};

/** Dark-mode overrides. Pass `mode === 'dark'` from the page's themeStore. */
export const ldTheme = (dark = false) => dark
  ? {
      surface: '#1e293b',
      surfaceMuted: '#0f172a',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      border: '#334155',
      primarySoft: '#17233b',
      englishSoft: '#17233b',
      mathSoft: '#113536',
      strongSoft: '#12331f',
      developingSoft: '#33270f',
      supportSoft: '#331717',
      shadow: '0 4px 16px rgba(0,0,0,0.35)',
      shadowLg: '0 10px 30px rgba(0,0,0,0.45)',
    }
  : {
      surface: LD.surface,
      surfaceMuted: LD.surfaceMuted,
      text: LD.text,
      textMuted: LD.textMuted,
      border: LD.border,
      primarySoft: LD.primarySoft,
      englishSoft: LD.englishSoft,
      mathSoft: LD.mathSoft,
      strongSoft: LD.strongSoft,
      developingSoft: LD.developingSoft,
      supportSoft: LD.supportSoft,
      shadow: LD.shadow,
      shadowLg: LD.shadowLg,
    };

/* ── Reusable style builders (accept a `dark` flag so theme is respected) ── */

export const card = (dark = false) => {
  const t = ldTheme(dark);
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: LD.radius,
    boxShadow: t.shadow,
    padding: LD.gapLg,
  };
};

export const btnPrimary = (dark = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontWeight: 700, fontSize: '0.95rem', lineHeight: 1,
  padding: '12px 20px', borderRadius: LD.radiusPill,
  border: '2px solid transparent', cursor: 'pointer', minHeight: 44,
  background: LD.primary, color: '#fff',
  boxShadow: `0 6px 16px ${LD.primaryRing}`,
});

export const btnGhost = (dark = false) => {
  const t = ldTheme(dark);
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontWeight: 700, fontSize: '0.95rem', lineHeight: 1,
    padding: '12px 20px', borderRadius: LD.radiusPill,
    border: `2px solid ${t.border}`, cursor: 'pointer', minHeight: 44,
    background: 'transparent', color: t.text,
  };
};

/** kind: 'english' | 'math' | 'strong' | 'dev' | 'support' | 'neutral' */
export const chip = (kind = 'neutral', dark = false) => {
  const t = ldTheme(dark);
  const map = {
    english: [t.englishSoft, LD.english],
    math: [t.mathSoft, LD.math],
    strong: [t.strongSoft, LD.strong],
    dev: [t.developingSoft, LD.developing],
    support: [t.supportSoft, LD.support],
    neutral: [t.surfaceMuted, t.textMuted],
  };
  const [bg, fg] = map[kind] || map.neutral;
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: LD.radiusPill,
    fontSize: 12, fontWeight: 700, background: bg, color: fg,
  };
};

export default LD;
