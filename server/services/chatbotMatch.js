/**
 * Deterministic chatbot matching (no LLM).
 * Lower-case, strip punctuation, tokenise; score keyword overlap + phrase match.
 */

const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
  'of', 'for', 'to', 'in', 'on', 'at', 'and', 'or', 'do', 'does', 'did',
  'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can', 'i', 'you',
  'your', 'my', 'me', 'please', 'tell', 'about'
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  return normalize(text).split(' ').filter((t) => t.length > 1 && !STOP.has(t));
}

function parseKeywords(raw) {
  if (Array.isArray(raw)) return raw.map((k) => String(k).trim()).filter(Boolean);
  return String(raw || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * @param {string} message
 * @param {{ question?: string, keywords?: string|string[] }} item
 */
function scoreItem(message, item) {
  const msg = normalize(message);
  if (!msg) return 0;
  const question = normalize(item.question || '');
  let score = 0;

  if (question) {
    if (msg === question) score += 10;
    else if (msg.includes(question) || (question.length >= 8 && question.includes(msg))) score += 5;
  }

  const kws = parseKeywords(item.keywords);
  kws.forEach((kw) => {
    const nkw = normalize(kw);
    if (!nkw) return;
    if (msg.includes(nkw)) score += nkw.includes(' ') ? 3 : 2;
  });

  const msgSet = new Set(tokens(msg));
  tokens(question).forEach((t) => {
    if (msgSet.has(t)) score += 1;
  });

  return score;
}

function pickBest(message, items, threshold) {
  const min = Number(threshold);
  const floor = Number.isFinite(min) ? min : 3;
  let best = null;
  let bestScore = -1;
  (items || []).forEach((item) => {
    const score = scoreItem(message, item);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  });
  if (!best || bestScore < floor) {
    return { matched: false, score: bestScore < 0 ? 0 : bestScore, item: null };
  }
  return { matched: true, score: bestScore, item: best };
}

function lastUserText(history) {
  if (!Array.isArray(history)) return '';
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const row = history[i];
    if (row && row.role === 'user' && String(row.text || '').trim()) {
      return String(row.text).trim().slice(0, 500);
    }
  }
  return '';
}

function isFollowUp(message) {
  const n = normalize(message);
  if (!n) return false;
  if (/^(hi|hello|hey|thanks|thank you|ok|okay)$/.test(n)) return false;
  const t = tokens(message);
  if (/^(what about|how about|and |also |on |for |what if)\b/.test(n)) return true;
  if (/\b(sunday|saturday|monday|tuesday|wednesday|thursday|friday|weekend|today|tomorrow)\b/.test(n) && t.length <= 6) {
    return true;
  }
  if (/\b(that|those|there|them)\b/.test(n) && t.length <= 5) return true;
  return t.length > 0 && t.length <= 3;
}

function composeMatchText(message, history) {
  const current = String(message || '').trim();
  const prev = lastUserText(history);
  if (prev && isFollowUp(current)) return `${prev} ${current}`.slice(0, 500);
  return current;
}

module.exports = {
  normalize,
  tokens,
  parseKeywords,
  scoreItem,
  pickBest,
  lastUserText,
  isFollowUp,
  composeMatchText
};
