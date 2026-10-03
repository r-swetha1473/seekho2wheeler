/* Seekho deterministic chat widget */
(function () {
  function boot() {
    if (!window.Seekho) {
      setTimeout(boot, 40);
      return;
    }
    if (document.getElementById('seekhoChat')) return;
    const { api, sanitizeHtml } = Seekho;

    const wrap = document.createElement('div');
    wrap.id = 'seekhoChat';
    wrap.className = 'seekho-chat';
    wrap.innerHTML = `
      <div class="seekho-chat__panel" id="seekhoChatPanel" hidden role="dialog" aria-label="Seekho chat" aria-modal="true">
        <div class="seekho-chat__head">
          <div class="seekho-chat__brand">
            <img src="/images/brand/seekho-master.png" alt="" width="28" height="28" decoding="async">
            <strong>Seekho 2 Wheeler AI</strong>
          </div>
          <button type="button" class="seekho-chat__close" id="seekhoChatClose" aria-label="Close chat">&times;</button>
        </div>
        <div class="seekho-chat__msgs" id="seekhoChatMsgs"></div>
        <div class="seekho-chat__chips" id="seekhoChatChips"></div>
        <form class="seekho-chat__form" id="seekhoChatForm">
          <label class="sr-only" for="seekhoChatInput">Your question</label>
          <input id="seekhoChatInput" class="seekho-chat__input" autocomplete="off" maxlength="500" placeholder="Type a question…">
          <button type="submit" class="seekho-chat__send" aria-label="Send">Send</button>
        </form>
      </div>
      <button type="button" class="seekho-chat__launch" id="seekhoChatLaunch" aria-expanded="false" aria-controls="seekhoChatPanel">
        <i class="fa-solid fa-comments" aria-hidden="true"></i>
        Chat with us
      </button>
    `;
    document.body.appendChild(wrap);

    const panel = document.getElementById('seekhoChatPanel');
    const launch = document.getElementById('seekhoChatLaunch');
    const closeBtn = document.getElementById('seekhoChatClose');
    const msgs = document.getElementById('seekhoChatMsgs');
    const chips = document.getElementById('seekhoChatChips');
    const form = document.getElementById('seekhoChatForm');
    const input = document.getElementById('seekhoChatInput');
    const sendBtn = form.querySelector('.seekho-chat__send');
    let greeting = 'Hi! How can we help?';
    let replies = [];
    let openState = false;
    let sending = false;
    let greeted = false;
    const transcript = [];

    function setOpen(next) {
      openState = !!next;
      wrap.classList.toggle('seekho-chat--open', openState);
      panel.hidden = !openState;
      launch.hidden = openState;
      launch.setAttribute('aria-expanded', openState ? 'true' : 'false');
      launch.setAttribute('aria-hidden', openState ? 'true' : 'false');
      if (openState) {
        requestAnimationFrame(() => input.focus());
      } else {
        launch.focus();
      }
    }

    function bubble(html, who) {
      const el = document.createElement('div');
      el.className = `seekho-chat__bubble seekho-chat__bubble--${who}`;
      if (who === 'user' || who === 'typing') el.textContent = html;
      else el.innerHTML = html;
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
      return el;
    }

    function contactsHtml(c) {
      if (!c) return '';
      const bits = [];
      if (c.phone) bits.push(`<a href="tel:${encodeURIComponent(c.phone)}">${c.phone}</a>`);
      if (c.whatsapp) {
        const n = String(c.whatsapp).replace(/\D/g, '');
        bits.push(`<a href="https://wa.me/91${n.slice(-10)}" target="_blank" rel="noopener">WhatsApp</a>`);
      }
      return bits.length ? `<p class="seekho-chat__contacts">${bits.join(' · ')}</p>` : '';
    }

    function escapeChip(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    }

    function renderChips(list) {
      chips.innerHTML = (list || []).map((r) =>
        `<button type="button" class="seekho-chat__chip" data-prompt="${encodeURIComponent(r.prompt)}">${escapeChip(r.label)}</button>`
      ).join('');
    }

    function readAnswer(res) {
      if (!res) return '';
      if (typeof res.answer === 'string' && res.answer.trim()) return res.answer;
      if (res.data && typeof res.data.answer === 'string') return res.data.answer;
      return '';
    }

    function friendlyError(err) {
      console.error('[Seekho chat]', err);
      return 'Sorry, I could not reply just now. Please try again, or contact Seekho Two Wheeler Academy.';
    }

    async function send(text) {
      const q = String(text || '').trim();
      if (!q || sending) return;
      sending = true;
      if (sendBtn) sendBtn.disabled = true;
      input.disabled = true;
      bubble(q, 'user');
      transcript.push({ role: 'user', text: q });
      const typing = bubble('Seekho Bot is typing…', 'typing');
      try {
        const history = transcript.slice(0, -1).slice(-8);
        const res = await api('/chatbot/ask', {
          method: 'POST',
          body: { message: q, history },
          retries: 0
        });
        typing.remove();
        const ans = sanitizeHtml(readAnswer(res));
        const html = ans || 'I\'m sorry, I don\'t have that information right now. Please contact Seekho 2 Wheeler Academy for assistance.';
        const extra = res && res.matched ? '' : contactsHtml(res && res.contacts);
        bubble(`${html}${extra}`, 'bot');
        transcript.push({ role: 'bot', text: String(res && res.answer || '').replace(/<[^>]+>/g, ' ').trim() });
        if (res && res.quick_replies) renderChips(res.quick_replies);
      } catch (err) {
        typing.remove();
        bubble(friendlyError(err), 'bot');
      } finally {
        sending = false;
        if (sendBtn) sendBtn.disabled = false;
        input.disabled = false;
        if (openState) input.focus();
      }
    }

    api('/chatbot/config').then(({ data }) => {
      greeting = data.greeting || greeting;
      replies = data.quick_replies || [];
      if (!greeted) {
        bubble(sanitizeHtml(greeting), 'bot');
        greeted = true;
      }
      renderChips(replies);
    }).catch(() => {
      if (!greeted) {
        bubble(greeting, 'bot');
        greeted = true;
      }
    });

    launch.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    });
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openState) setOpen(false);
    });
    chips.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-prompt]');
      if (!btn || sending) return;
      send(decodeURIComponent(btn.getAttribute('data-prompt') || ''));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      send(v);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
