/**
 * optionImages.js — maps a screening/practice option word to a hosted image URL.
 *
 * Strategy (C2 — hosted image URLs, keyless / always-on):
 *  Known concrete nouns → a curated Twemoji SVG (rendered big as a "picture"),
 *  served from a public jsDelivr CDN, no API key, very reliable and instant.
 *
 *  Words with no curated picture (e.g. "the", "run", numbers, sentences)
 *  return null and are rendered as plain text — we do NOT show random photos.
 */

// Twemoji CDN base (SVG assets). Filename is the emoji codepoint(s) in hex.
const TWEMOJI = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';

// Convert an emoji character to its Twemoji SVG URL.
const emojiUrl = (emoji) => {
  const cps = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((h) => h !== 'fe0f') // drop variation selector
    .join('-');
  return `${TWEMOJI}${cps}.svg`;
};

// Curated word → emoji map for the common screening/practice vocabulary.
const WORD_EMOJI = {
  // animals
  cow: '🐄', bird: '🐦', fish: '🐟', dog: '🐶', cat: '🐱', duck: '🦆',
  frog: '🐸', horse: '🐴', pig: '🐷', sheep: '🐑', lion: '🦁', bee: '🐝',
  bear: '🐻', rabbit: '🐰', mouse: '🐭', monkey: '🐵', elephant: '🐘',
  snake: '🐍', chicken: '🐔', hen: '🐔', owl: '🦉', fox: '🦊', goat: '🐐',
  // food
  apple: '🍎', banana: '🍌', egg: '🥚', cake: '🍰', bread: '🍞', milk: '🥛',
  grapes: '🍇', orange: '🍊', carrot: '🥕', corn: '🌽', pizza: '🍕',
  // objects / toys
  ball: '⚽', book: '📖', bag: '🎒', bell: '🔔', box: '📦', bus: '🚌',
  car: '🚗', cup: '☕', drum: '🥁', fan: '🪭', hat: '🎩', key: '🔑',
  kite: '🪁', pen: '🖊️', pencil: '✏️', ring: '💍', shoe: '👟', shop: '🏪',
  sun: '☀️', star: '⭐', tree: '🌳', umbrella: '☂️', clock: '🕐',
  door: '🚪', chair: '🪑', table: '🪑', boat: '⛵', train: '🚆', plane: '✈️',
  // nature
  moon: '🌙', cloud: '☁️', rain: '🌧️', flower: '🌸', leaf: '🍃',
};

// Normalise a word: lowercase, strip punctuation and trailing plural noise.
const norm = (w) =>
  String(w || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim();

/**
 * Return a hosted image URL for an option, or null if it's not picture-worthy
 * (e.g. numbers, sentences, single letters).
 */
export const getOptionImage = (option) => {
  const w = norm(option);
  if (!w) return null;

  // Don't imagize sentences, numbers, or single letters.
  if (w.length <= 1) return null;
  if (w.split(' ').length > 2) return null;
  if (/^\d+$/.test(w)) return null;

  // 1. Curated emoji (exact word, then first word of a two-word option).
  if (WORD_EMOJI[w]) return emojiUrl(WORD_EMOJI[w]);
  const first = w.split(' ')[0];
  if (WORD_EMOJI[first]) return emojiUrl(WORD_EMOJI[first]);

  // No curated picture for this word → return null (render as text only).
  // We deliberately do NOT use a random photo fallback: words like "the",
  // "run", "is" are not picturable and random photos confuse the child.
  return null;
};

/**
 * Decide whether a question should show pictures for its options.
 * Picture questions: type is audio_image_tap, requires_image flag, or the
 * text literally says "picture"/"tap the picture".
 */
export const isPictureQuestion = (q) => {
  if (!q) return false;
  const t = String(q.question_text || '').toLowerCase();

  // Reading/word tasks are NOT picture questions, even if flagged as image
  // type. "Tap the WORD 'the'" must show text, not pictures. This guard wins.
  if (/\b(word|words|letter|letters|sentence|spell|spelling|rhymes?)\b/.test(t)) {
    return false;
  }

  // Explicit picture intent in the text.
  const wantsPicture =
    t.includes('picture') || t.includes('image') || t.includes('object') ||
    t.includes('animal') || t.includes('photo');
  if (wantsPicture) return true;

  // Fall back to data flags ONLY when the text didn't rule it out above.
  if (q.requires_image === true) return true;
  if (q.question_type === 'audio_image_tap') return true;

  return false;
};
