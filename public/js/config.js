/* Global frontend config — override via Vercel env injected at build if needed.
   Empty API_BASE_URL = same-origin /api (correct for Vercel once API is deployed). */
window.SEEKHO_CONFIG = window.SEEKHO_CONFIG || {
  API_BASE_URL: '',
  SITE_URL: typeof location !== 'undefined' ? location.origin : 'https://seekho2wheeler.vercel.app'
};
