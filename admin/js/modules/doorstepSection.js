import {
  api, toast,
  escapeHtml, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress
} from '../admin.js';
import { richTextField, titleBoldToggle, syncRichText, validateRichText, bindRichText } from '../richtext.js';

function strip(html) {
  return (window.SeekhoSanitize && window.SeekhoSanitize.stripHtml)
    ? window.SeekhoSanitize.stripHtml(html)
    : String(html || '').replace(/<[^>]+>/g, ' ').trim();
}

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading doorstep section…</div>';
  try {
    const { data, limits } = await api('/admin/home-sections/doorstep');
    paint(container, data, limits || { descriptionMax: 400, featureLineMax: 80, featureDetailMax: 2000 });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function paint(container, section, limits) {
  const features = Array.isArray(section.features) ? section.features : [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Doorstep Section</h2>
        <p class="page-header__subtitle">Home page service cards (expand in place). Stored in the home_sections Google Sheet.</p>
      </div>
    </div>

    <div class="card">
      <div class="card__body">
        <form id="doorstepSectionForm">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>Heading</label>
              ${richTextField({ name: 'title', value: section.title || '', required: true, minHeight: '72px' })}
              ${titleBoldToggle({ checked: !!section.title_bold, label: 'Bold heading (if using plain title)' })}
            </div>
            <div class="form-group form-group--full">
              <label>Subheading</label>
              ${richTextField({ name: 'subtitle', value: section.subtitle || '', minHeight: '64px' })}
            </div>
            <div class="form-group form-group--full">
              <label>Short description</label>
              ${richTextField({ name: 'description', value: section.description || '', required: true, minHeight: '100px' })}
              <p class="char-count" id="descCount"></p>
            </div>
            <div class="form-group">
              <label>Optional full-guide page</label>
              <input class="form-control" name="link_slug" value="${escapeHtml(section.link_slug || '')}" placeholder="doorstep-training">
              <p class="form-hint">If set, a “Read the full guide” link appears. Visitors expand services on Home without leaving the page.</p>
            </div>
            <div class="form-group">
              <label>Display order</label>
              <input class="form-control" type="number" name="sort_order" value="${escapeHtml(String(section.sort_order ?? 1))}">
            </div>
            <div class="form-group">
              <label class="form-check"><input type="checkbox" name="is_active" ${section.is_active !== false ? 'checked' : ''}> Active on home page</label>
            </div>
            <div class="form-group form-group--full">
              <label>Image</label>
              <input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
              <p class="form-hint">Max 5MB · Cloudinary URL stored in Sheets</p>
              <div id="doorstepSectionPreview">${section.image_url ? imagePreview(section.image_url) : ''}</div>
            </div>
            <div class="form-group form-group--full">
              <label>Services</label>
              <p class="form-hint">Each row is a Home card. Title max ${limits.featureLineMax} characters. Details (rich text) open when the visitor taps View details.</p>
              <div id="featureRows"></div>
              <button type="button" class="btn btn--outline" id="addFeatureBtn" style="margin-top:0.5rem">Add feature</button>
            </div>
          </div>
          <button type="submit" class="btn btn--primary" style="margin-top:1rem">Save section</button>
        </form>
      </div>
    </div>
  `;

  bindRichText(container);
  setupImagePreview(container.querySelector('[name="image"]'), document.getElementById('doorstepSectionPreview'));

  const listEl = document.getElementById('featureRows');

  function renderFeatures(list) {
    listEl.innerHTML = list.map((f, i) => `
      <div class="feature-row" data-index="${i}">
        <div class="feature-row__main">
          <input class="form-control feature-row__icon" value="${escapeHtml(f.icon || '')}" placeholder="Icon" aria-label="Service ${i + 1} icon">
          <div class="feature-row__text">
            <input class="form-control feature-row__line" value="${escapeHtml(f.text || '')}" placeholder="Service title" maxlength="${limits.featureLineMax}" aria-label="Service ${i + 1} title">
            <p class="char-count" data-feat-count></p>
          </div>
          <div class="feature-row__actions">
            <button type="button" class="btn btn--outline btn--sm" data-move="up" ${i === 0 ? 'disabled' : ''}>Up</button>
            <button type="button" class="btn btn--outline btn--sm" data-move="down" ${i === list.length - 1 ? 'disabled' : ''}>Down</button>
            <button type="button" class="btn btn--outline btn--sm" data-remove>Remove</button>
          </div>
        </div>
        <div class="feature-row__detail">
          <label>Details (shown when expanded)</label>
          ${richTextField({ name: `feature_detail_${i}`, value: f.detail || '', minHeight: '88px' })}
        </div>
      </div>
    `).join('') || '<p class="form-hint">No services yet. Add at least one card.</p>';
    updateFeatureCounts();
    bindRichText(listEl);
  }

  function readFeatures() {
    const form = document.getElementById('doorstepSectionForm');
    if (form) syncRichText(form);
    return [...listEl.querySelectorAll('.feature-row')].map((row, i) => ({
      icon: row.querySelector('.feature-row__icon')?.value.trim() || '',
      text: row.querySelector('.feature-row__line')?.value.trim() || '',
      detail: row.querySelector(`[name="feature_detail_${i}"]`)?.value || ''
    }));
  }

  function updateFeatureCounts() {
    listEl.querySelectorAll('.feature-row').forEach((row) => {
      const input = row.querySelector('.feature-row__line');
      const count = row.querySelector('[data-feat-count]');
      if (!input || !count) return;
      const n = input.value.length;
      count.textContent = `${n} / ${limits.featureLineMax}`;
      count.classList.toggle('char-count--over', n > limits.featureLineMax);
    });
  }

  function updateDescCount() {
    const form = document.getElementById('doorstepSectionForm');
    syncRichText(form);
    const n = strip(form.description.value).length;
    const el = document.getElementById('descCount');
    if (!el) return;
    el.textContent = `${n} / ${limits.descriptionMax} characters (plain text)`;
    el.classList.toggle('char-count--over', n > limits.descriptionMax);
  }

  renderFeatures(features);
  updateDescCount();

  listEl.addEventListener('input', (e) => {
    if (e.target.classList.contains('feature-row__line')) updateFeatureCounts();
  });
  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('.feature-row');
    if (!row) return;
    const list = readFeatures();
    const idx = Number(row.dataset.index);
    if (e.target.closest('[data-remove]')) {
      list.splice(idx, 1);
      renderFeatures(list);
      return;
    }
    const move = e.target.closest('[data-move]')?.dataset.move;
    if (move === 'up' && idx > 0) {
      [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      renderFeatures(list);
    }
    if (move === 'down' && idx < list.length - 1) {
      [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
      renderFeatures(list);
    }
  });

  document.getElementById('addFeatureBtn').addEventListener('click', () => {
    const list = readFeatures();
    list.push({ icon: '', text: '', detail: '' });
    renderFeatures(list);
  });

  container.querySelectorAll('[data-richtext] .richtext__editor').forEach((ed) => {
    ed.addEventListener('input', updateDescCount);
  });

  document.getElementById('doorstepSectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    syncRichText(form);
    if (!validateRichText(form)) {
      toast('Heading and short description are required.', 'warning');
      return;
    }
    const descLen = strip(form.description.value).length;
    if (descLen > limits.descriptionMax) {
      toast(`Short description must be at most ${limits.descriptionMax} characters.`, 'error');
      return;
    }
    const feats = readFeatures().filter((f) => f.icon || f.text || f.detail);
    const tooLong = feats.find((f) => f.text.length > limits.featureLineMax);
    if (tooLong) {
      toast(`Each service title must be at most ${limits.featureLineMax} characters.`, 'error');
      return;
    }
    const detailMax = limits.featureDetailMax || 2000;
    const longDetail = feats.find((f) => strip(f.detail).length > detailMax);
    if (longDetail) {
      toast(`Each service’s details must be at most ${detailMax} characters.`, 'error');
      return;
    }

    const fd = new FormData();
    fd.set('title', form.title.value);
    fd.set('subtitle', form.subtitle.value);
    fd.set('description', form.description.value);
    fd.set('link_slug', form.link_slug.value.trim());
    fd.set('sort_order', form.sort_order.value);
    fd.set('is_active', form.querySelector('[name="is_active"]').checked ? 'true' : 'false');
    fd.set('title_bold', form.querySelector('[name="title_bold"]').checked ? 'true' : 'false');
    fd.set('features_json', JSON.stringify(feats));

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    const progressEl = document.getElementById('doorstepSectionPreview');
    try {
      const fileInput = form.querySelector('[name="image"]');
      if (fileInput?.files?.[0]) {
        const [compressed] = await prepareImageFiles(fileInput.files, { maxWidth: 1200, maxHeight: 900 });
        fd.set('image', compressed, compressed.name);
      }
      await api('/admin/home-sections/doorstep', {
        method: 'PUT',
        formData: fd,
        onProgress: (pct) => renderUploadProgress(progressEl, pct)
      });
      clearUploadProgress(progressEl);
      toast('Doorstep section saved', 'success');
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
