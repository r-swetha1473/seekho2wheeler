import { api, escapeHtml, uiIcon } from './admin.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function imageFieldHtml({ name, label, value = '', category = 'general' }) {
  const url = String(value || '');
  const has = Boolean(url);
  return `<div class="image-field form-group form-group--full" data-image-field data-image-category="${escapeHtml(category)}">
    <label>${escapeHtml(label)}</label>
    <div class="image-field__frame">
      <div class="image-field__preview" ${has ? '' : 'hidden'}>
        <img alt="" src="${escapeHtml(url)}">
      </div>
      <div class="image-field__empty" ${has ? 'hidden' : ''}>
        ${uiIcon('image')}
        <p>Upload an image</p>
        <p class="form-hint">JPG, PNG, WEBP, or GIF · max 5MB</p>
      </div>
      <p class="image-field__status" hidden>Uploading...</p>
    </div>
    <div class="image-field__actions">
      <button type="button" class="btn btn--sm btn--outline" data-image-choose>${uiIcon('image')}<span>${has ? 'Replace' : 'Choose image'}</span></button>
      <button type="button" class="btn btn--sm btn--danger" data-image-remove ${has ? '' : 'hidden'}>Remove</button>
    </div>
    <p class="form-hint image-field__file" hidden></p>
    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden data-image-file>
    <label class="image-field__url-label">Or use an image URL</label>
    <input class="form-control" type="text" data-image-url value="${escapeHtml(url)}" placeholder="https://">
    <input type="hidden" name="${escapeHtml(name)}" data-image-value value="${escapeHtml(url)}">
    <p class="form-hint image-field__error" hidden></p>
  </div>`;
}

function usableUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/') || url.startsWith('/images/')) return url;
  return null;
}

export function bindImageFields(root) {
  root.querySelectorAll('[data-image-field]').forEach((field) => {
    const fileInput = field.querySelector('[data-image-file]');
    const urlInput = field.querySelector('[data-image-url]');
    const valueInput = field.querySelector('[data-image-value]');
    const preview = field.querySelector('.image-field__preview');
    const img = preview.querySelector('img');
    const empty = field.querySelector('.image-field__empty');
    const status = field.querySelector('.image-field__status');
    const error = field.querySelector('.image-field__error');
    const choose = field.querySelector('[data-image-choose]');
    const remove = field.querySelector('[data-image-remove]');
    const chooseLabel = choose.querySelector('span');
    const fileName = field.querySelector('.image-field__file');
    let busy = false;

    function setBusy(on, text) {
      busy = on;
      choose.disabled = on;
      remove.disabled = on;
      urlInput.disabled = on;
      status.hidden = !on;
      if (on) status.textContent = text || 'Uploading...';
    }

    function showError(message) {
      error.hidden = !message;
      error.textContent = message || '';
    }

    function paint(url, name) {
      const next = String(url || '').trim();
      valueInput.value = next;
      urlInput.value = next;
      if (name) {
        fileName.hidden = false;
        fileName.textContent = name;
      } else {
        fileName.hidden = true;
        fileName.textContent = '';
      }
      if (next) {
        img.src = next;
        preview.hidden = false;
        empty.hidden = true;
        remove.hidden = false;
        chooseLabel.textContent = 'Replace';
      } else {
        img.removeAttribute('src');
        preview.hidden = true;
        empty.hidden = false;
        remove.hidden = true;
        chooseLabel.textContent = 'Choose image';
      }
    }

    img.addEventListener('error', () => {
      if (!valueInput.value) return;
      showError('That image link could not be loaded.');
    });

    choose.addEventListener('click', () => {
      if (!busy) fileInput.click();
    });

    remove.addEventListener('click', () => {
      if (busy) return;
      showError('');
      paint('');
    });

    urlInput.addEventListener('input', () => {
      if (busy) return;
      const raw = urlInput.value.trim();
      if (!raw) {
        showError('');
        paint('');
        return;
      }
      const url = usableUrl(raw);
      if (!url) {
        showError('Use a full image link starting with https://');
        return;
      }
      showError('');
      valueInput.value = url;
      fileName.hidden = true;
      fileName.textContent = '';
      img.src = url;
      preview.hidden = false;
      empty.hidden = true;
      remove.hidden = false;
      chooseLabel.textContent = 'Replace';
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file || busy) return;
      showError('');
      if (!ALLOWED.includes(file.type)) {
        showError('Please choose a JPG, PNG, WEBP, or GIF image.');
        return;
      }
      if (file.size > MAX_BYTES) {
        showError('Image is too large. Please choose a smaller image.');
        return;
      }
      const previous = valueInput.value;
      setBusy(true, 'Uploading...');
      try {
        const body = new FormData();
        body.append('image', file, file.name);
        body.append('category', field.dataset.imageCategory || 'general');
        const result = await api('/admin/uploads', {
          method: 'POST',
          formData: body,
          onProgress: (pct) => { status.textContent = `Uploading... ${pct}%`; }
        });
        paint(result.data && result.data.url, file.name);
      } catch (err) {
        paint(previous);
        showError(err.message && /large|5MB|JPG|PNG|GIF|WebP/i.test(err.message)
          ? err.message
          : 'Upload failed. Please try again.');
      } finally {
        setBusy(false);
      }
    });
  });
}
