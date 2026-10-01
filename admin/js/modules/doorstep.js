import { api, toast, escapeHtml, formatCurrency } from '../admin.js';

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading doorstep pricing…</div>';
  try {
    const { data } = await api('/admin/doorstep-pricing');
    paint(container, data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function paint(container, cfg) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-header__title">Doorstep Pricing</h2>
        <p class="page-header__subtitle">Distance-based scooty doorstep fees stored in Google Sheets</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card__header"><h3 class="card__title">Price configuration</h3></div>
      <div class="card__body">
        <p class="form-hint" style="margin-bottom:1rem">
          Assumption (confirm with the client): between the base distance and the maximum distance,
          price increases in whole-kilometre steps. Default extra is
          (max price − base price) ÷ (max km − base km) = ₹500 per extra km after 3 km, capped at the max price.
        </p>
        <form id="doorstepConfigForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Base km</label>
              <input class="form-control" type="number" name="base_km" min="0.1" step="0.1" required value="${escapeHtml(String(cfg.base_km ?? ''))}">
            </div>
            <div class="form-group">
              <label>Base price (₹)</label>
              <input class="form-control" type="number" name="base_price" min="0" step="0.01" required value="${escapeHtml(String(cfg.base_price ?? ''))}">
            </div>
            <div class="form-group">
              <label>Max km</label>
              <input class="form-control" type="number" name="max_km" min="0.1" step="0.1" required value="${escapeHtml(String(cfg.max_km ?? ''))}">
            </div>
            <div class="form-group">
              <label>Max price (₹)</label>
              <input class="form-control" type="number" name="max_price" min="0" step="0.01" required value="${escapeHtml(String(cfg.max_price ?? ''))}">
            </div>
            <div class="form-group">
              <label>Extra per km (₹)</label>
              <input class="form-control" type="number" name="per_km_extra" min="0" step="0.01" required value="${escapeHtml(String(cfg.per_km_extra ?? ''))}">
              <p class="form-hint" id="doorstepSuggested">Suggested: —</p>
            </div>
            <div class="form-group">
              <label>Pricing mode</label>
              <input class="form-control" name="pricing_mode" value="${escapeHtml(cfg.pricing_mode || 'linear_ceil')}">
            </div>
            <div class="form-group form-group--full">
              <label>Out-of-range message</label>
              <input class="form-control" name="out_of_range_message" required value="${escapeHtml(cfg.out_of_range_message || '')}">
            </div>
          </div>
          <button type="submit" class="btn btn--primary" style="margin-top:1rem">Save configuration</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card__header"><h3 class="card__title">Calculate price from kilometres</h3></div>
      <div class="card__body">
        <div class="form-group" style="max-width:280px">
          <label for="adminDoorstepKm">Kilometres</label>
          <input class="form-control" id="adminDoorstepKm" type="number" min="0.1" step="0.1" placeholder="e.g. 5">
        </div>
        <p id="adminDoorstepResult" class="form-hint" style="margin-top:0.75rem;font-size:1rem;color:var(--text)">Enter a distance to see the live API price.</p>
      </div>
    </div>
  `;

  const form = document.getElementById('doorstepConfigForm');
  const suggested = document.getElementById('doorstepSuggested');

  function updateSuggested() {
    const baseKm = Number(form.base_km.value);
    const maxKm = Number(form.max_km.value);
    const basePrice = Number(form.base_price.value);
    const maxPrice = Number(form.max_price.value);
    const span = maxKm - baseKm;
    if (span > 0 && Number.isFinite(basePrice) && Number.isFinite(maxPrice)) {
      const v = (maxPrice - basePrice) / span;
      suggested.textContent = `Suggested extra per km = (${maxPrice} − ${basePrice}) ÷ (${maxKm} − ${baseKm}) = ${v}`;
    } else {
      suggested.textContent = 'Suggested extra per km: enter valid base/max km and prices.';
    }
  }

  form.addEventListener('input', updateSuggested);
  updateSuggested();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      base_km: Number(form.base_km.value),
      base_price: Number(form.base_price.value),
      max_km: Number(form.max_km.value),
      max_price: Number(form.max_price.value),
      per_km_extra: Number(form.per_km_extra.value),
      pricing_mode: form.pricing_mode.value.trim(),
      out_of_range_message: form.out_of_range_message.value.trim()
    };
    try {
      const { data } = await api('/admin/doorstep-pricing', { method: 'PUT', json: payload });
      toast('Doorstep pricing saved', 'success');
      paint(container, data);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  const kmInput = document.getElementById('adminDoorstepKm');
  const resultEl = document.getElementById('adminDoorstepResult');
  let timer;
  kmInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const km = kmInput.value.trim();
      if (!km) {
        resultEl.textContent = 'Enter a distance to see the live API price.';
        resultEl.style.color = '';
        return;
      }
      try {
        const res = await api(`/doorstep/price?km=${encodeURIComponent(km)}`, { retries: 0 });
        const price = res.data?.price ?? res.price;
        resultEl.textContent = `${km} km → ${formatCurrency(price)}`;
        resultEl.style.color = 'var(--success)';
      } catch (err) {
        resultEl.textContent = err.message;
        resultEl.style.color = 'var(--error)';
      }
    }, 250);
  });
}
