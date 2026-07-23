/* Branches — 4:3 framed cards */
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

  function slugify(name) {
    return String(name || '').toLowerCase().replace(/\s+branch$/i, '').replace(/\s+/g, '');
  }

  function render(list) {
    if (!grid) return;
    grid.className = 'branch-rail branch-rail--page';
    grid.innerHTML = list.length
      ? list.map((b) => `
        <article class="branch-card branch-rail__card" id="${slugify(b.area || b.name)}">
          <div class="branch-card__media media-frame media-frame--banner">
            ${safeImg(b.image, b.name, { w: 1200, h: 675 })}
          </div>
          <div class="branch-card__body">
            <h2 class="branch-card__name">${escapeHtml(b.area || b.name)}</h2>
            <p class="branch-card__addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(b.address)}</p>
            <a class="branch-card__phone" href="tel:${b.phone}"><i class="fa-solid fa-phone"></i> ${escapeHtml(b.phone)}</a>
            ${b.availableCourses?.length ? `<p class="branch-card__courses">${escapeHtml(b.availableCourses.join(' · '))}</p>` : ''}
            <div class="branch-card__actions">
              <a href="${b.mapsLink || '#'}" target="_blank" rel="noopener" class="btn btn--outline btn--sm"><i class="fa-solid fa-map"></i> Map</a>
              <a href="/pages/booking.html?branch=${encodeURIComponent(b.name)}" class="btn btn--primary btn--sm">Book</a>
            </div>
          </div>
        </article>`).join('')
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
    grid.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton media-skeleton" style="height:360px"></div>').join('');
    try {
      allBranches = (await api('/branches')).data;
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
          : allBranches.filter((b) => `${b.name} ${b.area} ${b.address}`.toLowerCase().includes(query));
        render(filtered);
      });
    }
  }

  init();
})();
