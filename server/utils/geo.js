/**
 * Optional GMB / map URLs and coordinates. Empty is valid — never invent values.
 */

function parseHttpsUrl(raw, label = 'URL') {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { ok: true, value: '' };
  }
  const u = String(raw).trim();
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'https:') {
      return { ok: false, message: `${label} must use https` };
    }
    return { ok: true, value: u };
  } catch {
    return { ok: false, message: `${label} must be a valid https URL` };
  }
}

function parseMapEmbedUrl(raw) {
  const parsed = parseHttpsUrl(raw, 'Map embed URL');
  if (!parsed.ok || !parsed.value) return parsed;
  const host = new URL(parsed.value).hostname.toLowerCase();
  const allowed =
    host === 'google.com' ||
    host === 'www.google.com' ||
    host === 'maps.google.com' ||
    host.endsWith('.google.com') ||
    host === 'google.co.in' ||
    host.endsWith('.google.co.in');
  if (!allowed) {
    return { ok: false, message: 'Map embed URL must be a Google Maps https link' };
  }
  return parsed;
}

function parseLatLng(latRaw, lngRaw) {
  const latEmpty = latRaw === undefined || latRaw === null || String(latRaw).trim() === '';
  const lngEmpty = lngRaw === undefined || lngRaw === null || String(lngRaw).trim() === '';
  if (latEmpty && lngEmpty) return { ok: true, latitude: '', longitude: '' };
  if (latEmpty || lngEmpty) {
    return { ok: false, message: 'Latitude and longitude must both be set, or both left empty' };
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, message: 'Latitude must be between −90 and 90' };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, message: 'Longitude must be between −180 and 180' };
  }
  return { ok: true, latitude: lat, longitude: lng };
}

function applyLocationFields(payload, { includeEmbed = false } = {}) {
  if (payload.gmb_url !== undefined) {
    const gmb = parseHttpsUrl(payload.gmb_url, 'Google Business Profile URL');
    if (!gmb.ok) return gmb;
    payload.gmb_url = gmb.value;
  }
  if (includeEmbed && payload.map_embed_url !== undefined) {
    const embed = parseMapEmbedUrl(payload.map_embed_url);
    if (!embed.ok) return embed;
    payload.map_embed_url = embed.value;
  }
  if (payload.mapsLink !== undefined) {
    const maps = parseHttpsUrl(payload.mapsLink, 'Google Maps link');
    if (!maps.ok) return maps;
    payload.mapsLink = maps.value;
  }
  if (payload.latitude !== undefined || payload.longitude !== undefined) {
    const coords = parseLatLng(payload.latitude, payload.longitude);
    if (!coords.ok) return coords;
    payload.latitude = coords.latitude;
    payload.longitude = coords.longitude;
  }
  return { ok: true };
}

module.exports = {
  parseHttpsUrl,
  parseMapEmbedUrl,
  parseLatLng,
  applyLocationFields
};
