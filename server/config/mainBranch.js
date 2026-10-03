/**
 * Main Branch identity — single source of truth.
 * Used for LocalBusiness JSON-LD, Maps link/embed, contact, footer.
 * Only Tollygunge (Phase 3) shares this Place ID; do not invent other branch Place IDs.
 */
const MAIN_BRANCH = {
  name: 'Kolkata Scooty Bike Training Centre',
  alternateName: 'Seekho Two Wheeler Academy',
  placeId: 'ChIJTW1jJIZxAjoR5lZey5JaXcY',
  streetAddress: '1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary',
  addressLocality: 'Kolkata',
  addressRegion: 'West Bengal',
  postalCode: '700041',
  addressCountry: 'IN',
  formattedAddress:
    '1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary, Kolkata, West Bengal 700041, India',
  phones: ['9748481630', '7980108587'],
  openingHours: 'Mo-Su 07:00-19:00'
};

const OFFICIAL_SOCIAL = {
  facebookUrl: 'https://www.facebook.com/kolkatascootybiketraining',
  instagramUrl: 'https://www.instagram.com/scooty_bike_training_centre',
  youtubeUrl: 'https://youtube.com/@kolkatascootybiketrainingcentr'
};

function mapsSearchUrl(branch = MAIN_BRANCH) {
  const q = encodeURIComponent(branch.name);
  const pid = encodeURIComponent(branch.placeId);
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${pid}`;
}

/**
 * Official place-mode embed when GOOGLE_MAPS_EMBED_KEY is set;
 * otherwise keyless embed from name + address.
 */
function mapsEmbedUrl(branch = MAIN_BRANCH) {
  const key = String(process.env.GOOGLE_MAPS_EMBED_KEY || '').trim();
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=place_id:${encodeURIComponent(branch.placeId)}`;
  }
  const q = encodeURIComponent(`${branch.name}, ${branch.formattedAddress}`);
  return `https://maps.google.com/maps?q=${q}&output=embed`;
}

function postalAddress(branch = MAIN_BRANCH) {
  return {
    '@type': 'PostalAddress',
    streetAddress: branch.streetAddress,
    addressLocality: branch.addressLocality,
    addressRegion: branch.addressRegion,
    postalCode: branch.postalCode,
    addressCountry: branch.addressCountry
  };
}

function localBusinessJsonLd(overrides = {}) {
  const branch = MAIN_BRANCH;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: branch.name,
    alternateName: branch.alternateName,
    description:
      overrides.description ||
      'Empowering Independence Through Safe Riding. Premium scooty and bike training across Kolkata.',
    url: overrides.url || process.env.BASE_URL || 'https://seekho2wheeler.vercel.app',
    telephone: branch.phones.map((p) => `+91${p}`),
    address: postalAddress(branch),
    hasMap: mapsSearchUrl(branch),
    openingHours: branch.openingHours,
    priceRange: '₹₹',
    sameAs: [
      OFFICIAL_SOCIAL.facebookUrl,
      OFFICIAL_SOCIAL.instagramUrl,
      OFFICIAL_SOCIAL.youtubeUrl
    ],
    ...overrides
  };
}

function publicMainBranchPayload() {
  return {
    name: MAIN_BRANCH.name,
    alternateName: MAIN_BRANCH.alternateName,
    placeId: MAIN_BRANCH.placeId,
    formattedAddress: MAIN_BRANCH.formattedAddress,
    address: postalAddress(MAIN_BRANCH),
    mapsUrl: mapsSearchUrl(MAIN_BRANCH),
    embedUrl: mapsEmbedUrl(MAIN_BRANCH),
    phones: [...MAIN_BRANCH.phones]
  };
}

/** True when a stored social URL is empty or a generic placeholder. */
function isPlaceholderSocial(url, network) {
  const u = String(url || '').trim().toLowerCase();
  if (!u || u === '#' || u === 'https://' || u === 'http://') return true;
  try {
    const host = new URL(u).hostname.replace(/^www\./, '');
    const path = new URL(u).pathname.replace(/\/+$/, '');
    if (network === 'facebook') {
      return host === 'facebook.com' && (!path || path === '/');
    }
    if (network === 'instagram') {
      return host === 'instagram.com' && (!path || path === '/');
    }
    if (network === 'youtube') {
      return host === 'youtube.com' && (!path || path === '/');
    }
  } catch {
    return true;
  }
  return false;
}

function resolveSocial(settings = {}) {
  return {
    facebookUrl: isPlaceholderSocial(settings.facebookUrl, 'facebook')
      ? OFFICIAL_SOCIAL.facebookUrl
      : String(settings.facebookUrl).trim(),
    instagramUrl: isPlaceholderSocial(settings.instagramUrl, 'instagram')
      ? OFFICIAL_SOCIAL.instagramUrl
      : String(settings.instagramUrl).trim(),
    youtubeUrl: isPlaceholderSocial(settings.youtubeUrl, 'youtube')
      ? OFFICIAL_SOCIAL.youtubeUrl
      : String(settings.youtubeUrl).trim()
  };
}

module.exports = {
  MAIN_BRANCH,
  OFFICIAL_SOCIAL,
  mapsSearchUrl,
  mapsEmbedUrl,
  postalAddress,
  localBusinessJsonLd,
  publicMainBranchPayload,
  isPlaceholderSocial,
  resolveSocial
};
