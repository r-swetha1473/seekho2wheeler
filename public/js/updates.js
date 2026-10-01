/* Site-wide fly-in announcements (deterministic list from Sheets) */
(function () {
  const STORE = 'seekho_dismissed_updates';
  const ROTATE_MS = 8000;

  function boot() {
    if (!window.Seekho) {
      setTimeout(boot, 40);
      return;
    }
    if (document.getElementById('seekhoFlyin')) return;
    const { api, sanitizeHtml } = Seekho;

    function dismissedIds() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORE) || '[]');
        return Array.isArray(raw) ? raw.map(String) : [];
      } catch {
        return [];
      }
    }

    function dismiss(id) {
      const next = new Set(dismissedIds());
      next.add(String(id));
      localStorage.setItem(STORE, JSON.stringify([...next]));
    }

    function escapeAttr(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
    }

    const wrap = document.createElement('aside');
    wrap.id = 'seekhoFlyin';
    wrap.className = 'seekho-flyin';
    wrap.hidden = true;
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);

    let queue = [];
    let idx = 0;
    let timer = null;

    function paint(item) {
      if (!item) {
        wrap.hidden = true;
        wrap.innerHTML = '';
        return;
      }
      wrap.hidden = false;
      const img = item.image_url
        ? `<img class="seekho-flyin__img" src="${escapeAttr(item.image_url)}" alt="">`
        : '';
      const ext = item.link_url && !String(item.link_url).startsWith('/');
      const link = item.link_url
        ? `<a class="seekho-flyin__link" href="${escapeAttr(item.link_url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${ext ? 'Open' : 'Read more'}</a>`
        : '';
      wrap.innerHTML = `
        <div class="seekho-flyin__card">
          <button type="button" class="seekho-flyin__close" aria-label="Dismiss update">&times;</button>
          ${img}
          <p class="seekho-flyin__kicker">Update</p>
          <strong class="seekho-flyin__title"></strong>
          <div class="seekho-flyin__msg"></div>
          ${link}
        </div>`;
      wrap.querySelector('.seekho-flyin__title').textContent = item.title || '';
      wrap.querySelector('.seekho-flyin__msg').innerHTML = sanitizeHtml(item.message || '');
      wrap.querySelector('.seekho-flyin__close').addEventListener('click', () => {
        dismiss(item.id);
        queue = queue.filter((row) => String(row.id) !== String(item.id));
        idx = idx % Math.max(queue.length, 1);
        if (!queue.length) {
          if (timer) clearInterval(timer);
          paint(null);
          return;
        }
        paint(queue[idx % queue.length]);
      });
    }

    api('/updates').then((res) => {
      const gone = new Set(dismissedIds());
      queue = (res.data || []).filter((row) => !gone.has(String(row.id)));
      if (!queue.length) return;
      paint(queue[0]);
      if (queue.length > 1) {
        timer = setInterval(() => {
          idx = (idx + 1) % queue.length;
          paint(queue[idx]);
        }, ROTATE_MS);
      }
    }).catch(() => { /* silent */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
