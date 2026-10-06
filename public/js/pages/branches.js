/* Branches listing — uses location SSOT (/api/locations) */
(function () {
  const { api, qs, safeImg } = Seekho;

  const grid = qs('#branchGrid');
  const search = qs('#branchSearch');
  let allBranches = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(list) {
    if (!grid) return;
    grid.className = 'branch-rail branch-rail--page';
    grid.innerHTML = list.length
      ? list.map((b) => {
          const href = b.href || `/locations/${b.slug}`;
          return `
        <article class="branch-card branch-rail__card" id="${escapeHtml(b.slug || '')}">
          <div class="branch-card__media media-frame media-frame--banner">
            ${safeImg(b.image, b.name, { w: 1200, h: 675 })}
          </div>
          <div class="branch-card__body">
            <h2 class="branch-card__name">${escapeHtml(b.name || b.area)}</h2>
            <p class="branch-card__addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(b.address || b.landmark || '')}</p>
            ${b.establishedLabel ? `<p class="branch-card__meta">${escapeHtml(b.establishedLabel)}</p>` : ''}
            ${(b.phones && b.phones[0]) ? `<a class="branch-card__phone" href="tel:${b.phones[0]}"><i class="fa-solid fa-phone"></i> ${escapeHtml(b.phones[0])}</a>` : ''}
            ${b.trainingAvailable?.length ? `<p class="branch-card__courses">${escapeHtml(b.trainingAvailable.join(' · '))}</p>` : ''}
            <div class="branch-card__actions">
              <a href="${href}" class="btn btn--outline btn--sm">View Branch</a>
              <a href="/pages/booking.html?branchId=${encodeURIComponent(b.branchId || '')}&branch=${encodeURIComponent(b.slug || b.branchName || b.name)}" class="btn btn--primary btn--sm">Book</a>
            </div>
          </div>
        </article>`;
        }).join('')
      : '<p class="empty-state">No branches match your search.</p>';
    if (window.AOS) AOS.refresh();

    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function init() {
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 7 }, () => '<div class="skeleton media-skeleton" style="height:360px"></div>').join('');
    try {
      allBranches = (await api('/locations')).data;
      render(allBranches);
    } catch {
      grid.innerHTML = '<p class="empty-state">Unable to load branches.</p>';
      return;
    }

    if (search) {
      search.addEventListener('input', () => {
        const query = search.value.toLowerCase().trim();
        const filtered = !query
          ? allBranches
          : allBranches.filter((b) => `${b.name} ${b.area} ${b.address} ${b.landmark || ''}`.toLowerCase().includes(query));
        render(filtered);
      });
    }
  }

  init();
})();
