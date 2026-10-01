import {
  api, toast, escapeHtml, setUnsaved
} from '../admin.js';
import { richTextField, syncRichText, bindRichText } from '../richtext.js';
import { CMS_PAGES, getPage, getSection, searchCatalog } from '../contentCatalog.js';

function copyQuery() {
  const q = String(location.hash.split('?')[1] || '');
  return new URLSearchParams(q);
}

function go(pageId, sectionId) {
  const sp = new URLSearchParams();
  if (pageId) sp.set('p', pageId);
  if (sectionId) sp.set('s', sectionId);
  const qs = sp.toString();
  location.hash = qs ? `#copy?${qs}` : '#copy';
}

function findRow(items, page, slot) {
  return (items || []).find((i) => i.page === page && i.slot === slot) || null;
}

function previewHtml(form) {
  syncRichText(form);
  const chunks = [];
  form.querySelectorAll('[data-cms-preview]').forEach((el) => {
    const label = el.getAttribute('data-cms-preview') || '';
    const kind = el.getAttribute('data-preview-kind');
    const name = el.getAttribute('data-field-name');
    const field = form.elements[name];
    const val = field ? field.value : '';
    if (!String(val).trim()) return;
    const body = kind === 'rich' ? val : escapeHtml(val);
    chunks.push(`<p class="cms-preview__label">${escapeHtml(label)}</p><div class="cms-preview__body">${body}</div>`);
  });
  return chunks.join('') || '<p class="form-hint">Nothing to preview yet.</p>';
}

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading content…</div>';
  try {
    const { data } = await api('/admin/page-copy');
    paint(container, data || []);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Unable to load content</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function paint(container, items) {
  const q = copyQuery();
  const pageId = q.get('p') || '';
  const sectionId = q.get('s') || '';
  const page = pageId ? getPage(pageId) : null;
  const section = page && sectionId ? getSection(pageId, sectionId) : null;

  if (section && page) {
    paintEditor(container, items, page, section);
    return;
  }
  if (page) {
    paintSections(container, items, page);
    return;
  }
  paintPages(container, items);
}

function crumb(parts) {
  return `<nav class="cms-crumb" aria-label="Location">${parts.map((p, i) => {
    if (p.href && i < parts.length - 1) {
      return `<a href="${escapeHtml(p.href)}">${escapeHtml(p.label)}</a><span class="cms-crumb__sep">›</span>`;
    }
    return `<span>${escapeHtml(p.label)}</span>`;
  }).join('')}</nav>`;
}

function paintPages(container, items) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Content Management</h2>
        <p class="page-header__subtitle">Choose a page, then a section. Each field is labelled with where it appears on the website. Phone numbers and emails stay in Settings. Course prices stay in Courses.</p>
      </div>
    </div>
    ${crumb([{ label: 'Content Management' }])}
    <div class="filters-bar cms-search-bar">
      <label class="sr-only" for="cmsSearch">Search content</label>
      <input id="cmsSearch" class="form-control" type="search" placeholder="Search content… (e.g. mission, contact, timings)">
    </div>
    <div id="cmsSearchHits" hidden class="cms-hits"></div>
    <div class="cms-page-grid" id="cmsPageGrid">
      ${CMS_PAGES.map((p) => {
        const n = (p.sections || []).length;
        return `
        <article class="cms-page-card">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.blurb || '')}</p>
          <p class="cms-page-card__meta">${n} section${n === 1 ? '' : 's'}</p>
          <button type="button" class="btn btn--primary" data-open-page="${escapeHtml(p.id)}">Open page</button>
        </article>`;
      }).join('')}
    </div>
  `;
  container.querySelectorAll('[data-open-page]').forEach((btn) => {
    btn.addEventListener('click', () => go(btn.dataset.openPage));
  });
  const search = container.querySelector('#cmsSearch');
  const hitsEl = container.querySelector('#cmsSearchHits');
  search.addEventListener('input', () => {
    const hits = searchCatalog(search.value);
    if (!search.value.trim()) {
      hitsEl.hidden = true;
      hitsEl.innerHTML = '';
      return;
    }
    hitsEl.hidden = false;
    hitsEl.innerHTML = hits.length
      ? hits.map((h) => `
        <button type="button" class="cms-hit" data-p="${escapeHtml(h.pageId)}" data-s="${escapeHtml(h.sectionId)}">
          <strong>${escapeHtml(h.pageTitle)}</strong>
          <span>→ ${escapeHtml(h.sectionTitle)}</span>
          <em>${escapeHtml(h.location || '')}</em>
        </button>`).join('')
      : '<p class="form-hint">No matching sections.</p>';
    hitsEl.querySelectorAll('.cms-hit').forEach((btn) => {
      btn.addEventListener('click', () => go(btn.dataset.p, btn.dataset.s));
    });
  });
}

function paintSections(container, items, page) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">${escapeHtml(page.title)}</h2>
        <p class="page-header__subtitle">${escapeHtml(page.blurb || '')}</p>
      </div>
    </div>
    ${crumb([
      { label: 'Content Management', href: '#copy' },
      { label: page.title }
    ])}
    <div class="cms-section-list">
      ${(page.sections || []).map((sec) => `
        <article class="cms-section-card">
          <div>
            <h3>${escapeHtml(sec.title)}</h3>
            <p class="cms-loc">📍 ${escapeHtml(sec.location || '')}</p>
            <p>${escapeHtml(sec.blurb || 'Edit the wording for this part of the website.')}</p>
          </div>
          <div class="cms-section-card__actions">
            ${sec.href
              ? `<a class="btn btn--primary" href="${escapeHtml(sec.href)}">${escapeHtml(sec.hrefLabel || 'Open')}</a>`
              : `<button type="button" class="btn btn--primary" data-open-sec="${escapeHtml(sec.id)}">Edit section</button>`}
            ${sec.extraHref ? `<a class="btn btn--outline" href="${escapeHtml(sec.extraHref)}">${escapeHtml(sec.extraHrefLabel || 'Related')}</a>` : ''}
          </div>
        </article>
      `).join('')}
    </div>
  `;
  container.querySelectorAll('[data-open-sec]').forEach((btn) => {
    btn.addEventListener('click', () => go(page.id, btn.dataset.openSec));
  });
}

function fieldControl(pageId, slot, field, row) {
  const name = `${slot}__${field.key}`;
  const val = row ? (row[field.key] || '') : '';
  const hint = field.hint ? `<p class="form-hint">${escapeHtml(field.hint)}</p>` : '';
  const loc = `<p class="form-hint">This is the “${escapeHtml(field.label)}” for this section.</p>`;
  if (field.type === 'rich') {
    return `
      <div class="form-group form-group--full" data-cms-preview="${escapeHtml(field.label)}" data-field-name="${escapeHtml(name)}" data-preview-kind="rich">
        <label>${escapeHtml(field.label)}</label>
        ${loc}${hint}
        ${richTextField({ name, value: val, minHeight: field.minHeight || '120px' })}
      </div>`;
  }
  const inputType = 'text';
  return `
    <div class="form-group form-group--full" data-cms-preview="${escapeHtml(field.label)}" data-field-name="${escapeHtml(name)}">
      <label for="${escapeHtml(name)}">${escapeHtml(field.label)}</label>
      ${loc}${hint}
      <input class="form-control" id="${escapeHtml(name)}" name="${escapeHtml(name)}" type="${inputType}" value="${escapeHtml(val)}">
    </div>`;
}

function paintEditor(container, items, page, section) {
  const slots = section.slots || [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">${escapeHtml(section.title)}</h2>
        <p class="page-header__subtitle">${escapeHtml(section.blurb || '')}</p>
      </div>
    </div>
    ${crumb([
      { label: 'Content Management', href: '#copy' },
      { label: page.title, href: `#copy?p=${encodeURIComponent(page.id)}` },
      { label: section.title }
    ])}
    <p class="cms-loc cms-loc--lg">📍 Appears on: ${escapeHtml(section.location || page.title)}</p>
    <div class="cms-tabs">
      <button type="button" class="btn btn--outline cms-tab is-active" data-tab="edit">Edit</button>
      <button type="button" class="btn btn--outline cms-tab" data-tab="preview">Preview</button>
    </div>
    <form id="cmsSectionForm" class="card" style="padding:1.1rem">
      ${slots.map((sl) => {
        const row = findRow(items, page.id, sl.slot);
        return (sl.fields || []).map((f) => fieldControl(page.id, sl.slot, f, row)).join('');
      }).join('')}
      ${section.extraHref ? `<p class="form-hint">Related: <a href="${escapeHtml(section.extraHref)}">${escapeHtml(section.extraHrefLabel || 'Open related screen')}</a></p>` : ''}
      <div class="form-actions cms-actions">
        <button type="button" class="btn btn--outline" id="cmsCancel">Cancel</button>
        <button type="submit" class="btn btn--primary" id="cmsSave">Save changes</button>
      </div>
    </form>
    <div id="cmsPreviewPane" class="cms-preview card" hidden></div>
  `;

  const form = document.getElementById('cmsSectionForm');
  bindRichText(form);
  setUnsaved(false);

  form.addEventListener('input', () => setUnsaved(true));
  form.addEventListener('change', () => setUnsaved(true));

  document.getElementById('cmsCancel').addEventListener('click', () => {
    if (window.__seekhoUnsaved && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    setUnsaved(false);
    go(page.id);
  });

  container.querySelectorAll('.cms-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.tab;
      container.querySelectorAll('.cms-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      const preview = document.getElementById('cmsPreviewPane');
      if (mode === 'preview') {
        form.hidden = true;
        preview.hidden = false;
        preview.innerHTML = `<h3 class="cms-preview__title">Preview</h3>${previewHtml(form)}`;
      } else {
        form.hidden = false;
        preview.hidden = true;
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    syncRichText(form);
    const saveBtn = document.getElementById('cmsSave');
    saveBtn.disabled = true;
    try {
      for (const sl of slots) {
        const row = findRow(items, page.id, sl.slot);
        const payload = {
          page: page.id,
          slot: sl.slot,
          title: row?.title || '',
          subtitle: row?.subtitle || '',
          body_html: row?.body_html || '',
          cta_text: row?.cta_text || '',
          cta_link: row?.cta_link || '',
          is_active: row?.is_active !== false,
          sort_order: row?.sort_order || 0
        };
        (sl.fields || []).forEach((f) => {
          const el = form.elements[`${sl.slot}__${f.key}`];
          if (!el) return;
          payload[f.key] = el.value;
        });
        if (row && row.id && row.from_seed !== true) {
          await api(`/admin/page-copy/${row.id}`, { method: 'PUT', json: payload });
        } else {
          await api('/admin/page-copy', { method: 'POST', json: payload });
        }
      }
      setUnsaved(false);
      toast('Content saved successfully', 'success');
      await render(container);
    } catch (err) {
      console.error(err);
      toast('Unable to save content. Please try again.', 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}
