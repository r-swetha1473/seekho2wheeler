/**
 * Allowlist HTML sanitiser (b, strong, i, em, br, p, ul, ol, li, a).
 * Used by the API before Sheets writes and by the public site before innerHTML.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof root === 'object' && root) {
    root.SeekhoSanitize = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ALLOWED = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'p', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'blockquote', 'div']);
  const VOID = new Set(['br']);
  const ALIGN_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'div', 'blockquote', 'li']);

  function sanitizeAlign(attrs) {
    const s = String(attrs || '');
    const m = s.match(/text-align\s*:\s*(left|center|right|justify)/i);
    if (m) return ` style="text-align: ${m[1].toLowerCase()}"`;
    const a = s.match(/\balign\s*=\s*(?:"|'|)(left|center|right|justify)/i);
    if (a) return ` style="text-align: ${a[1].toLowerCase()}"`;
    return '';
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function sanitizeHref(href) {
    const h = String(href || '').trim();
    if (!h) return '';
    const lower = h.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return '';
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(h)) return h;
    return '';
  }

  function sanitizeHtml(input) {
    if (input == null) return '';
    let html = String(input);
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[\s\S]*?<\/style>/gi, '');

    return html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, rawTag, attrs) => {
      const tag = String(rawTag).toLowerCase();
      const closing = match.startsWith('</');
      if (!ALLOWED.has(tag)) return '';
      if (closing) return VOID.has(tag) ? '' : `</${tag}>`;
      if (tag === 'br') return '<br>';
      if (tag === 'a') {
        const hrefMatch = (attrs || '').match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const href = sanitizeHref(hrefMatch ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] : '');
        if (!href) return '<a>';
        return `<a href="${escapeAttr(href)}" rel="noopener noreferrer">`;
      }
      if (ALIGN_TAGS.has(tag)) return `<${tag}${sanitizeAlign(attrs)}>`;
      return `<${tag}>`;
    });
  }

  function stripHtml(input) {
    return String(input || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseBool(val, fallback = false) {
    if (val === undefined || val === null || val === '') return fallback;
    if (val === true || val === 'true' || val === 'on' || val === '1' || val === 1) return true;
    if (val === false || val === 'false' || val === 'off' || val === '0' || val === 0) return false;
    return fallback;
  }

  function sanitizeFields(payload, keys) {
    if (!payload || typeof payload !== 'object') return payload;
    keys.forEach((key) => {
      if (payload[key] !== undefined) payload[key] = sanitizeHtml(payload[key]);
    });
    return payload;
  }

  function formatTitle(text, bold) {
    const safe = String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return parseBool(bold) ? `<strong>${safe}</strong>` : safe;
  }

  return { sanitizeHtml, stripHtml, parseBool, sanitizeFields, formatTitle };
});
