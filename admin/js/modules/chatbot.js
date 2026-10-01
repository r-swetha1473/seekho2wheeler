import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, statusBadge,
  iconBtn, addBtn
} from '../admin.js';
import { richTextField, syncRichText, validateRichText } from '../richtext.js';

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading chatbot…</div>';
  try {
    const { data } = await api('/admin/chatbot');
    paint(container, data.config, data.items || [], data.unanswered || []);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function paint(container, config, items, unanswered) {
  const replies = Array.isArray(config.quick_replies) ? config.quick_replies : [];
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Chatbot</h2>
        <p class="page-header__subtitle">Deterministic Q&amp;A from Sheets — same question always gets the same answer</p>
      </div>
      ${addBtn('Add Q&A', 'addChatQaBtn')}
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card__header"><h3 class="card__title">Fallback & matching</h3></div>
      <div class="card__body">
        <form id="chatConfigForm">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>Greeting</label>
              <input class="form-control" name="greeting" value="${escapeHtml(config.greeting || '')}">
            </div>
            <div class="form-group form-group--full">
              <label>Fallback message</label>
              ${richTextField({ name: 'fallback_message', value: config.fallback_message || '', required: true, minHeight: '80px' })}
              <p class="form-hint">Shown when no Q&amp;A scores at or above the threshold. Use {{settings.phone}} if needed.</p>
            </div>
            <div class="form-group">
              <label>Match threshold</label>
              <input class="form-control" type="number" name="match_threshold" min="0" step="1" value="${escapeHtml(String(config.match_threshold ?? 3))}">
            </div>
            <div class="form-group form-group--full">
              <label>Quick-reply chips (JSON)</label>
              <textarea class="form-control" name="quick_replies" rows="6">${escapeHtml(JSON.stringify(replies, null, 2))}</textarea>
              <p class="form-hint">Array of { "label", "prompt" } — chips send the prompt as a question.</p>
            </div>
          </div>
          <button type="submit" class="btn btn--primary" style="margin-top:1rem">Save chatbot settings</button>
        </form>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card__header"><h3 class="card__title">Test a question</h3></div>
      <div class="card__body">
        <div class="form-group">
          <label for="chatTestInput">Type a question</label>
          <input class="form-control" id="chatTestInput" placeholder="e.g. scooty course fees">
        </div>
        <button type="button" class="btn btn--outline" id="chatTestBtn" style="margin-top:0.5rem">Match</button>
        <pre id="chatTestOut" class="form-hint" style="margin-top:0.75rem;white-space:pre-wrap"></pre>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card__header"><h3 class="card__title">Q&amp;A</h3></div>
      <div class="card__body" style="padding:0">
        ${items.length ? qaTable(items) : '<div class="empty-state"><p>No Q&amp;A yet.</p></div>'}
      </div>
    </div>

    <div class="card">
      <div class="card__header"><h3 class="card__title">Unanswered (latest)</h3></div>
      <div class="card__body">
        ${unanswered.length
          ? `<ul>${unanswered.map((u) => `<li><code>${escapeHtml(u.message || '')}</code> <small>${escapeHtml(u.created_at || '')}</small></li>`).join('')}</ul>`
          : '<p class="form-hint">None yet.</p>'}
      </div>
    </div>
  `;

  document.getElementById('addChatQaBtn')?.addEventListener('click', () => showQaForm(null, container, items));
  bindQaRows(container, items);
  bindConfig(container);
  bindTest();
}

function qaTable(items) {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Category</th>
            <th>Question</th>
            <th>Keywords</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr data-id="${escapeHtml(item.id)}">
              <td>${item.sort_order}</td>
              <td>${escapeHtml(item.category || '—')}</td>
              <td><strong>${escapeHtml(item.question)}</strong></td>
              <td style="max-width:220px;font-size:0.8rem">${escapeHtml((item.keywords || '').slice(0, 80))}</td>
              <td>${item.is_active !== false ? statusBadge('active') : statusBadge('inactive')}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('toggle', item.is_active !== false ? 'Deactivate' : 'Activate')}
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

function bindConfig(container) {
  document.getElementById('chatConfigForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    syncRichText(form);
    let quick;
    try {
      quick = JSON.parse(form.quick_replies.value);
    } catch {
      toast('Quick replies must be valid JSON.', 'error');
      return;
    }
    try {
      await api('/admin/chatbot/config', {
        method: 'PUT',
        json: {
          greeting: form.greeting.value.trim(),
          fallback_message: form.fallback_message.value,
          match_threshold: Number(form.match_threshold.value),
          quick_replies: quick
        }
      });
      toast('Chatbot settings saved', 'success');
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function bindTest() {
  const run = async () => {
    const message = document.getElementById('chatTestInput')?.value.trim();
    const out = document.getElementById('chatTestOut');
    if (!message || !out) return;
    try {
      const res = await api('/admin/chatbot/test', { method: 'POST', json: { message } });
      out.textContent = JSON.stringify({
        matched: res.matched,
        score: res.score,
        question: res.question,
        category: res.category,
        answer: res.answer
      }, null, 2);
    } catch (err) {
      out.textContent = err.message;
    }
  };
  document.getElementById('chatTestBtn')?.addEventListener('click', run);
  document.getElementById('chatTestInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });
}

function bindQaRows(container, items) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = items.find((p) => p.id === id);
    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showQaForm(item, container, items));
    row.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
      try {
        await api(`/admin/chatbot/qa/${id}`, { method: 'PUT', json: { is_active: item.is_active !== false ? false : true } });
        toast('Updated', 'success');
        await render(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm('Delete this Q&A?');
      if (!ok) return;
      try {
        await api(`/admin/chatbot/qa/${id}`, { method: 'DELETE' });
        toast('Deleted', 'success');
        await render(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showQaForm(item, container, items) {
  const isEdit = !!item;
  openModal({
    title: isEdit ? 'Edit Q&A' : 'Add Q&A',
    size: 'lg',
    body: `
      <form id="chatQaForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Question <span class="required">*</span></label>
            <input class="form-control" name="question" required value="${escapeHtml(item?.question || '')}">
          </div>
          <div class="form-group">
            <label>Category</label>
            <input class="form-control" name="category" value="${escapeHtml(item?.category || '')}" placeholder="Pricing">
          </div>
          <div class="form-group">
            <label>Display order</label>
            <input class="form-control" type="number" name="sort_order" value="${escapeHtml(String(item?.sort_order ?? items.length + 1))}">
          </div>
          <div class="form-group form-group--full">
            <label>Keywords (comma separated)</label>
            <input class="form-control" name="keywords" value="${escapeHtml(item?.keywords || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>Answer <span class="required">*</span></label>
            ${richTextField({ name: 'answer', value: item?.answer || '', required: true, minHeight: '120px' })}
            <p class="form-hint">Placeholders: {{course:scooty-training.price}}, {{course:scooty-training.classes}}, {{doorstep.base_price}}, {{settings.phone}}, {{courses.names}}</p>
          </div>
          <div class="form-group">
            <label class="form-check"><input type="checkbox" name="is_active" ${item?.is_active !== false ? 'checked' : ''}> Active</label>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelChatQa">Cancel</button>
      <button class="btn btn--primary" id="saveChatQa">${isEdit ? 'Update' : 'Create'}</button>
    `
  });
  document.getElementById('cancelChatQa').addEventListener('click', closeModal);
  document.getElementById('saveChatQa').addEventListener('click', async () => {
    const form = document.getElementById('chatQaForm');
    syncRichText(form);
    if (!form.checkValidity() || !validateRichText(form)) {
      form.reportValidity();
      return;
    }
    const payload = {
      question: form.question.value.trim(),
      keywords: form.keywords.value.trim(),
      answer: form.answer.value,
      category: form.category.value.trim(),
      sort_order: Number(form.sort_order.value || 0),
      is_active: form.querySelector('[name="is_active"]').checked
    };
    try {
      if (isEdit) await api(`/admin/chatbot/qa/${item.id}`, { method: 'PUT', json: payload });
      else await api('/admin/chatbot/qa', { method: 'POST', json: payload });
      toast(isEdit ? 'Q&A updated' : 'Q&A created', 'success');
      closeModal();
      await render(container);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
