/* Live doorstep price from GET /api/doorstep/price */
(function () {
  function bind(root) {
    if (!root || root.dataset.bound === '1') return;
    const input = root.querySelector('[data-doorstep-km]');
    const out = root.querySelector('[data-doorstep-result]');
    const hint = root.querySelector('[data-doorstep-hint]');
    if (!input || !out || !window.Seekho) return;
    root.dataset.bound = '1';

    const { api, formatPrice } = Seekho;

    api('/doorstep/config').then(({ data }) => {
      if (hint && data) {
        hint.textContent = `Up to ${data.base_km} km: ${formatPrice(data.base_price)}. Then extra per km, capped at ${formatPrice(data.max_price)} (max ${data.max_km} km).`;
      }
      if (input && data && data.max_km) {
        input.setAttribute('max', String(data.max_km));
      }
    }).catch(() => { /* keep generic hint */ });

    let timer;
    const run = () => {
      const km = input.value.trim();
      if (!km) {
        out.textContent = '';
        out.hidden = true;
        return;
      }
        api(`/doorstep/price?km=${encodeURIComponent(km)}`, { retries: 0 }).then((res) => {
        const price = res.data?.price ?? res.price;
        out.hidden = false;
        out.classList.remove('doorstep-price__result--err');
        out.textContent = `Estimated doorstep price: ${formatPrice(price)}`;
      }).catch((err) => {
        out.hidden = false;
        out.classList.add('doorstep-price__result--err');
        out.textContent = err.message || 'Unable to calculate price.';
      });
    };

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(run, 280);
    });
  }

  window.bindDoorstepKmWidget = bind;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-doorstep-widget]').forEach(bind);
  });
})();
