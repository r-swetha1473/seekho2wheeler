import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge,
  iconBtn, addBtn
} from '../admin.js';

let faqs = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading FAQs…</div>';
  await loadFaqs(container);
}

async function loadFaqs(container) {
  try {
    const { data } = await api('/admin/faqs');
    faqs = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">FAQs</h2>
          <p class="page-header__subtitle">Frequently asked questions for the website</p>
        </div>
        ${addBtn('Add FAQ', 'addFaqBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${faqs.length ? faqTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addFaqBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">❓</div><div class="empty-state__title">No FAQs yet</div><p class="empty-state__text">Add common questions to help visitors.</p></div>`;
}

function faqTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Question</th>
            <th>Answer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${faqs.map((f) => `
            <tr data-id="${escapeHtml(f.id)}">
              <td>${f.displayOrder ?? '—'}</td>
              <td><strong>${escapeHtml(f.question)}</strong></td>
              <td style="max-width:320px;">${escapeHtml((f.answer || '').slice(0, 100))}${(f.answer || '').length > 100 ? '…' : ''}</td>
              <td>${f.active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('delete', 'Delete')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindEvents(container) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const faq = faqs.find((f) => f.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(faq, container));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm('Delete this FAQ?');
      if (!ok) return;
      try {
        await api(`/admin/faqs/${id}`, { method: 'DELETE' });
        toast('FAQ deleted', 'success');
        await loadFaqs(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(faq, container) {
  const isEdit = !!faq;

  openModal({
    title: isEdit ? 'Edit FAQ' : 'Add FAQ',
    body: `
      <form id="faqForm">
        <div class="form-group">
          <label>Question <span class="required">*</span></label>
          <input class="form-control" name="question" required value="${escapeHtml(faq?.question || '')}">
        </div>
        <div class="form-group">
          <label>Answer <span class="required">*</span></label>
          <textarea class="form-control" name="answer" required rows="4">${escapeHtml(faq?.answer || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Display Order</label>
          <input class="form-control" type="number" name="displayOrder" value="${faq?.displayOrder ?? faqs.length + 1}">
        </div>
        <div class="form-group">
          <label class="form-check"><input type="checkbox" name="active" ${faq?.active !== false ? 'checked' : ''}> Active</label>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelFaq">Cancel</button>
      <button class="btn btn--primary" id="saveFaq">${isEdit ? 'Update' : 'Create'}</button>
    `
  });

  document.getElementById('cancelFaq').addEventListener('click', closeModal);

  document.getElementById('saveFaq').addEventListener('click', async () => {
    const form = document.getElementById('faqForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const payload = {
      question: form.question.value,
      answer: form.answer.value,
      displayOrder: Number(form.displayOrder.value || 0),
      active: form.querySelector('[name="active"]').checked
    };

    const btn = document.getElementById('saveFaq');
    btn.disabled = true;

    try {
      if (isEdit) {
        await api(`/admin/faqs/${faq.id}`, { method: 'PUT', json: payload });
        toast('FAQ updated', 'success');
      } else {
        await api('/admin/faqs', { method: 'POST', json: payload });
        toast('FAQ created', 'success');
      }
      closeModal();
      await loadFaqs(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
