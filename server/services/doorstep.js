const db = require('./db');

/** Seed row written only when the doorstep_pricing tab is empty. */
const DOORSTEP_SEED = {
  id: 'default',
  base_km: 3,
  base_price: 4500,
  max_km: 10,
  max_price: 8000,
  per_km_extra: 500,
  pricing_mode: 'linear_ceil',
  out_of_range_message: 'Doorstep service is available up to 10 km'
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeConfig(row) {
  const src = { ...DOORSTEP_SEED, ...(row || {}) };
  const base_km = toNumber(src.base_km);
  const base_price = toNumber(src.base_price);
  const max_km = toNumber(src.max_km);
  const max_price = toNumber(src.max_price);
  let per_km_extra = toNumber(src.per_km_extra);
  const span = (max_km != null && base_km != null) ? max_km - base_km : 0;
  if (per_km_extra == null && span > 0 && max_price != null && base_price != null) {
    per_km_extra = (max_price - base_price) / span;
  }
  return {
    id: src.id || 'default',
    base_km,
    base_price,
    max_km,
    max_price,
    per_km_extra,
    pricing_mode: src.pricing_mode || 'linear_ceil',
    out_of_range_message: String(src.out_of_range_message || '').trim() || DOORSTEP_SEED.out_of_range_message
  };
}

/**
 * @param {number} km
 * @param {ReturnType<typeof normalizeConfig>} config
 */
function calculateDoorstepPrice(km, config) {
  const kmNum = Number(km);
  if (!Number.isFinite(kmNum) || kmNum <= 0) {
    return { ok: false, status: 400, message: 'Enter a valid distance greater than 0 km' };
  }
  const { base_km, base_price, max_km, max_price, per_km_extra } = config;
  if ([base_km, base_price, max_km, max_price, per_km_extra].some((v) => v == null)) {
    return { ok: false, status: 503, message: 'Doorstep pricing is not configured.' };
  }
  if (kmNum > max_km) {
    return { ok: false, status: 400, message: config.out_of_range_message };
  }
  let price;
  if (kmNum <= base_km) {
    price = base_price;
  } else {
    const extraKm = Math.ceil(kmNum - base_km);
    price = Math.min(max_price, base_price + extraKm * per_km_extra);
  }
  price = Math.round(Number(price) * 100) / 100;
  return { ok: true, km: kmNum, price, currency: 'INR' };
}

async function getDoorstepConfig() {
  if (!(db.allowRuntimeSeed && !db.allowRuntimeSeed()) && typeof db.ensureSheetTab === 'function') {
    await db.ensureSheetTab('doorstep_pricing');
  }
  let rows = await db.getAll('doorstep_pricing');
  if (!rows.length && !(db.allowRuntimeSeed && !db.allowRuntimeSeed())) {
    const created = await db.create('doorstep_pricing', { ...DOORSTEP_SEED, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return normalizeConfig(created);
  }
  return normalizeConfig(rows[0]);
}

async function saveDoorstepConfig(payload) {
  const current = await getDoorstepConfig();
  const next = normalizeConfig({ ...current, ...payload, id: current.id });
  if (next.base_km == null || next.base_km <= 0) {
    return { ok: false, message: 'Base kilometres must be greater than 0' };
  }
  if (next.max_km == null || next.max_km <= next.base_km) {
    return { ok: false, message: 'Maximum kilometres must be greater than base kilometres' };
  }
  if (next.base_price == null || next.base_price < 0) {
    return { ok: false, message: 'Base price must be 0 or greater' };
  }
  if (next.max_price == null || next.max_price < next.base_price) {
    return { ok: false, message: 'Maximum price must be at least the base price' };
  }
  if (next.per_km_extra == null || next.per_km_extra < 0) {
    return { ok: false, message: 'Extra price per km must be 0 or greater' };
  }
  const row = {
    id: current.id,
    base_km: next.base_km,
    base_price: next.base_price,
    max_km: next.max_km,
    max_price: next.max_price,
    per_km_extra: next.per_km_extra,
    pricing_mode: next.pricing_mode,
    out_of_range_message: next.out_of_range_message,
    updated_at: new Date().toISOString()
  };
  const existing = await db.getById('doorstep_pricing', current.id);
  let saved;
  if (existing) {
    saved = await db.update('doorstep_pricing', current.id, row);
  } else {
    saved = await db.create('doorstep_pricing', { ...row, created_at: new Date().toISOString() });
  }
  return { ok: true, data: normalizeConfig(saved) };
}

module.exports = {
  DOORSTEP_SEED,
  normalizeConfig,
  calculateDoorstepPrice,
  getDoorstepConfig,
  saveDoorstepConfig
};
