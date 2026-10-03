/* Live doorstep price — config fetched once; price calculated in-browser (no per-keystroke API). */
(function () {
  const CACHE_KEY = 'seekho_doorstep_config_v1';
  const CACHE_TTL_MS = 10 * 60 * 1000;

  const DEFAULTS = {
    base_km: 3,
    base_price: 4500,
    max_km: 10,
    max_price: 8000,
    per_km_extra: 500,
    pricing_mode: 'linear_ceil',
    out_of_range_message: 'Doorstep service is available up to 10 km'
  };

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.ts) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* ignore quota */ }
  }

  function normalize(cfg) {
    const src = { ...DEFAULTS, ...(cfg || {}) };
    const n = (v, fb) => {
      const x = Number(v);
      return Number.isFinite(x) ? x : fb;
    };
    return {
      base_km: n(src.base_km, DEFAULTS.base_km),
      base_price: n(src.base_price, DEFAULTS.base_price),
      max_km: n(src.max_km, DEFAULTS.max_km),
      max_price: n(src.max_price, DEFAULTS.max_price),
      per_km_extra: n(src.per_km_extra, DEFAULTS.per_km_extra),
      out_of_range_message: String(src.out_of_range_message || DEFAULTS.out_of_range_message)
    };
  }

  /** Same rule as server/services/doorstep.js */
  function calculate(km, config) {
    const kmNum = Number(km);
    if (!Number.isFinite(kmNum) || kmNum <= 0) {
      return { ok: false, message: 'Enter a valid distance greater than 0 km' };
    }
    const { base_km, base_price, max_km, max_price, per_km_extra, out_of_range_message } = config;
    if (kmNum > max_km) {
      return { ok: false, message: out_of_range_message };
    }
    let price;
    if (kmNum <= base_km) {
      price = base_price;
    } else {
      const extraKm = Math.ceil(kmNum - base_km);
      price = Math.min(max_price, base_price + extraKm * per_km_extra);
    }
    price = Math.round(Number(price) * 100) / 100;
    return { ok: true, km: kmNum, price };
  }

  async function loadConfig() {
    const cached = readCache();
    if (cached) return normalize(cached);

    if (window.Seekho && typeof Seekho.api === 'function') {
      try {
        const res = await Seekho.api('/doorstep/config', { retries: 0 });
        const data = normalize(res.data || res);
        writeCache(data);
        return data;
      } catch {
        /* fall through to defaults */
      }
    }
    return normalize(DEFAULTS);
  }

  function bind(root) {
    if (!root || root.dataset.bound === '1') return;
    const input = root.querySelector('[data-doorstep-km]');
    const out = root.querySelector('[data-doorstep-result]');
    const hint = root.querySelector('[data-doorstep-hint]');
    if (!input || !out) return;
    root.dataset.bound = '1';

    let config = normalize(DEFAULTS);
    let ready = false;

    const formatPrice = (window.Seekho && Seekho.formatPrice)
      ? Seekho.formatPrice
      : (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

    const paintHint = () => {
      if (!hint) return;
      hint.textContent = `Up to ${config.base_km} km: ${formatPrice(config.base_price)}. Then extra per km, capped at ${formatPrice(config.max_price)} (max ${config.max_km} km).`;
      input.setAttribute('max', String(config.max_km));
    };

    const run = () => {
      const km = input.value.trim();
      if (!km) {
        out.textContent = '';
        out.hidden = true;
        return;
      }
      const result = calculate(km, config);
      out.hidden = false;
      if (!result.ok) {
        out.classList.add('doorstep-price__result--err');
        out.textContent = result.message;
        return;
      }
      out.classList.remove('doorstep-price__result--err');
      out.textContent = `Estimated doorstep price: ${formatPrice(result.price)}`;
    };

    paintHint();
    loadConfig().then((cfg) => {
      config = cfg;
      ready = true;
      paintHint();
      if (input.value.trim()) run();
    });

    input.addEventListener('input', () => {
      if (!ready) paintHint();
      run();
    });
  }

  window.bindDoorstepKmWidget = bind;
  window.SeekhoDoorstepCalc = { calculate, DEFAULTS, normalize };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-doorstep-widget]').forEach(bind);
  });
})();
