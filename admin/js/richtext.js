function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitize(html) {
  return (window.SeekhoSanitize && window.SeekhoSanitize.sanitizeHtml)
    ? window.SeekhoSanitize.sanitizeHtml(html)
    : String(html || '');
}

function strip(html) {
  return (window.SeekhoSanitize && window.SeekhoSanitize.stripHtml)
    ? window.SeekhoSanitize.stripHtml(html)
    : String(html || '').replace(/<[^>]+>/g, ' ').trim();
}

function toolbarButtons() {
  const b = (cmd, title, inner, extra = '') =>
    `<button type="button" class="richtext__btn" data-cmd="${cmd}" ${extra} title="${title}" aria-label="${title}">${inner}</button>`;
  return `
    <div class="richtext__toolbar" role="toolbar" aria-label="Text formatting">
      ${b('bold', 'Bold', '<b>B</b>')}
      ${b('italic', 'Italic', '<i>I</i>')}
      ${b('underline', 'Underline', '<u>U</u>')}
      ${b('strikeThrough', 'Strikethrough', '<s>S</s>')}
      <span class="richtext__sep" aria-hidden="true"></span>
      ${b('formatBlock', 'Heading 1', 'H1', 'data-value="h1"')}
      ${b('formatBlock', 'Heading 2', 'H2', 'data-value="h2"')}
      ${b('formatBlock', 'Heading 3', 'H3', 'data-value="h3"')}
      ${b('formatBlock', 'Normal paragraph', 'P', 'data-value="p"')}
      <span class="richtext__sep" aria-hidden="true"></span>
      ${b('insertUnorderedList', 'Bullet list', '•')}
      ${b('insertOrderedList', 'Numbered list', '1.')}
      ${b('formatBlock', 'Quote', '“ ”', 'data-value="blockquote"')}
      <span class="richtext__sep" aria-hidden="true"></span>
      ${b('justifyLeft', 'Align left', '⬅')}
      ${b('justifyCenter', 'Align centre', '⬌')}
      ${b('justifyRight', 'Align right', '➡')}
      <span class="richtext__sep" aria-hidden="true"></span>
      ${b('createLink', 'Add or edit link', '🔗')}
      ${b('unlink', 'Remove link', '⛓')}
      ${b('removeFormat', 'Clear formatting', 'Clear')}
    </div>`;
}

export function richTextField({
  name,
  value = '',
  required = false,
  placeholder = '',
  minHeight = '140px'
} = {}) {
  const safeName = escapeHtml(name);
  return `
    <div class="richtext" data-richtext data-name="${safeName}" data-required="${required ? 'true' : 'false'}" data-initial="${escapeHtml(value || '')}">
      ${toolbarButtons()}
      <div class="richtext__editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${safeName}" data-placeholder="${escapeHtml(placeholder)}" style="min-height:${escapeHtml(minHeight)}"></div>
      <input type="hidden" name="${safeName}" value="">
      <p class="form-hint">Select text, then use the toolbar. You do not need to type HTML.</p>
    </div>
  `;
}

export function titleBoldToggle({ name = 'title_bold', checked = false, label = 'Bold title' } = {}) {
  return `<label class="form-check"><input type="checkbox" name="${escapeHtml(name)}" ${checked ? 'checked' : ''}> ${escapeHtml(label)}</label>`;
}

function syncOne(wrap) {
  const editor = wrap.querySelector('.richtext__editor');
  const hidden = wrap.querySelector('input[type="hidden"]');
  if (!editor || !hidden) return;
  hidden.value = sanitize(editor.innerHTML);
}

export function syncRichText(root = document) {
  root.querySelectorAll('[data-richtext]').forEach(syncOne);
}

export function validateRichText(root = document) {
  let ok = true;
  root.querySelectorAll('[data-richtext][data-required="true"]').forEach((wrap) => {
    const editor = wrap.querySelector('.richtext__editor');
    const empty = !editor || !strip(editor.innerHTML);
    wrap.classList.toggle('richtext--error', empty);
    if (empty) ok = false;
  });
  return ok;
}

function execOn(editor, cmd, value) {
  editor.focus();
  if (cmd === 'insertLineBreak') {
    const ok = document.execCommand('insertHTML', false, '<br>');
    if (!ok) document.execCommand('insertLineBreak', false, null);
    return;
  }
  if (cmd === 'removeFormat') {
    document.execCommand('removeFormat', false, null);
    document.execCommand('unlink', false, null);
    return;
  }
  if (cmd === 'createLink') {
    const url = window.prompt('Enter the link (https://… or a site path such as /pages/booking.html)', 'https://');
    if (!url || !String(url).trim()) return;
    document.execCommand('createLink', false, String(url).trim());
    return;
  }
  if (cmd === 'formatBlock') {
    const tag = value || 'p';
    document.execCommand('formatBlock', false, tag);
    return;
  }
  document.execCommand(cmd, false, value || null);
}

export function bindRichText(root = document) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('[data-richtext]').forEach((wrap) => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const editor = wrap.querySelector('.richtext__editor');
    if (!editor) return;
    editor.innerHTML = sanitize(wrap.dataset.initial || '');
    syncOne(wrap);

    wrap.querySelectorAll('.richtext__btn').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', () => {
        execOn(editor, btn.dataset.cmd, btn.dataset.value);
        syncOne(wrap);
        wrap.classList.remove('richtext--error');
      });
    });

    editor.addEventListener('input', () => {
      syncOne(wrap);
      wrap.classList.remove('richtext--error');
    });
    editor.addEventListener('blur', () => syncOne(wrap));
  });
}
