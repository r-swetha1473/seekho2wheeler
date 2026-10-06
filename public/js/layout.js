/* Shared header + footer injection — Seekho customer chrome */
(function () {
  const home = '/';
  const p = (file) => `/pages/${file}`;

  // Transparent brand assets (new filenames bust stale immutable browser cache)
  const WORDMARK = '/images/brand/seekho-wordmark-clear.png';
  const WORDMARK_FALLBACK = '/images/brand/seekho-wordmark-clear.webp';
  const MARK = '/images/brand/seekho-master-clear.png';
  const MARK_FALLBACK = '/images/brand/seekho-master-clear.webp';

  function brandLogo(opts) {
    const extra = opts.className || '';
    const label = opts.label || 'Seekho 2 Wheeler Home';
    return `
      <a class="logo logo--brand ${extra}" href="${home}" aria-label="${label}">
        <img class="logo__img logo__img--mark" src="${MARK}" alt="" width="48" height="48" decoding="async"
          onerror="this.onerror=null;this.src='${MARK_FALLBACK}'">
        <img class="logo__img logo__img--wordmark" src="${WORDMARK}" alt="Seekho 2 Wheeler" width="220" height="55" decoding="async"
          onerror="this.onerror=null;this.src='${WORDMARK_FALLBACK}'">
      </a>`;
  }

  function ensureCustomerTheme() {
    document.documentElement.classList.add('customer-site');
    if (document.body) document.body.classList.add('customer-site');
    else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('customer-site'));

    if (!document.querySelector('link[data-customer-theme]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/customer-theme.css';
      link.setAttribute('data-customer-theme', '1');
      document.head.appendChild(link);
    }

    const icons = [
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/brand/favicon-32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/images/brand/favicon-16.png' },
      { rel: 'apple-touch-icon', href: '/images/brand/apple-touch-icon.png' },
      { rel: 'shortcut icon', href: '/images/brand/favicon-32.png' }
    ];
    icons.forEach((spec) => {
      const sel = `link[rel="${spec.rel}"]${spec.sizes ? `[sizes="${spec.sizes}"]` : ''}`;
      if (document.querySelector(sel)) return;
      const el = document.createElement('link');
      Object.entries(spec).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    });
  }

  const headerHTML = `
  <header class="site-header">
    <div class="header__inner">
      ${brandLogo({ label: 'Seekho 2 Wheeler Home' })}
      <nav class="nav" id="mainNav" aria-label="Primary">
        <a href="${home}" data-copy="layout.nav_home" data-copy-field="title">Home</a>
        <a href="${p('about.html')}" data-copy="layout.nav_about" data-copy-field="title">About Us</a>
        <div class="nav__dropdown">
          <a href="${p('courses.html')}"><span data-copy="layout.nav_courses" data-copy-field="title">Courses</span> <i class="fa-solid fa-chevron-down" style="font-size:0.65rem"></i></a>
          <div class="nav__dropdown-menu">
            <a href="${p('courses.html')}#scooty" data-copy="layout.nav_scooty" data-copy-field="title">Scooty Training</a>
            <a href="${p('courses.html')}#bike" data-copy="layout.nav_bike" data-copy-field="title">Bike Training</a>
            <a href="/women-training" data-copy="layout.nav_ladies" data-copy-field="title">Ladies Training</a>
            <a href="${p('courses.html')}#ev" data-copy="layout.nav_ev" data-copy-field="title">Electric Vehicle</a>
            <a href="${p('courses.html')}#road" data-copy="layout.nav_road" data-copy-field="title">Road Practice</a>
            <a href="${p('courses.html')}#rto" data-copy="layout.nav_rto" data-copy-field="title">RTO Practice</a>
          </div>
        </div>
        <a href="${p('branches.html')}" data-copy="layout.nav_branches" data-copy-field="title">Branches</a>
        <a href="${p('gallery.html')}" data-copy="layout.nav_gallery" data-copy-field="title">Gallery</a>
        <a href="${p('blog.html')}" data-copy="layout.nav_blog" data-copy-field="title">Blog</a>
        <a href="${p('reviews.html')}" data-copy="layout.nav_reviews" data-copy-field="title">Reviews</a>
        <a href="${p('contact.html')}" data-copy="layout.nav_contact" data-copy-field="title">Contact</a>
      </nav>
      <div class="header__actions">
        <a href="${p('booking.html')}" class="btn btn--primary header__cta" data-href-setting="header_cta_link"><i class="fa-solid fa-calendar-check"></i> <span data-setting="header_cta_text">Register & Book</span></a>
        <button class="nav-toggle" aria-label="Open menu" type="button"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
  </header>`;

  const footerHTML = `
  <section class="final-cta">
    <div class="container final-cta__inner">
      <div class="final-cta__icon"><i class="fa-solid fa-calendar-check"></i></div>
      <h2 data-setting="footer_cta_title">Ready To Start Your Riding Journey?</h2>
      <p data-setting="footer_cta_text">Join thousands of confident riders trained at Seekho Two Wheeler Academy.</p>
      <a href="${p('booking.html')}" class="btn btn--primary btn--lg" data-href-setting="header_cta_link"><span data-setting="footer_cta_button">Register & Book Now</span></a>
      <div class="final-cta__trust">
        <span><i class="fa-solid fa-check"></i> <span data-copy="layout.footer_trust" data-copy-field="title">Easy Registration</span></span>
        <span><i class="fa-solid fa-bolt"></i> <span data-copy="layout.footer_trust" data-copy-field="subtitle">Quick Booking</span></span>
        <span><i class="fa-solid fa-shield-halved"></i> <span data-copy="layout.footer_trust" data-copy-field="body_html">Instant Confirmation</span></span>
      </div>
    </div>
  </section>
  <footer class="site-footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        ${brandLogo({ label: 'Seekho 2 Wheeler Home', className: 'logo--footer' })}
        <p class="footer__tagline" data-setting="tagline">Empowering Independence Through Safe Riding since 2018.</p>
        <div class="socials" aria-label="Social links">
          <a href="https://www.facebook.com/kolkatascootybiketraining" data-social="facebook" aria-label="Facebook" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/scooty_bike_training_centre" data-social="instagram" aria-label="Instagram" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://youtube.com/@kolkatascootybiketrainingcentr" data-social="youtube" aria-label="YouTube" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>
          <a href="https://wa.me/919748481630" data-whatsapp aria-label="WhatsApp" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
        <p class="footer__address" data-main-branch-address>1, 78, Banerjee Para Rd, Haridevpur, Paschim Putiary, Kolkata, West Bengal 700041, India</p>
        <ul class="footer__compact-contact" aria-label="Contact">
          <li data-footer-phones-list></li>
          <li><a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> <span data-copy="layout.link_whatsapp" data-copy-field="title">WhatsApp</span></a></li>
        </ul>
      </div>

      <div class="footer__accordion" data-footer-accordion>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false"><span data-copy="layout.col_quick" data-copy-field="title">Quick Links</span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="${home}">Home</a>
            <a href="${p('about.html')}">About Us</a>
            <a href="/p/our-mission" target="_blank" rel="noopener">Our Mission</a>
            <a href="${p('gallery.html')}">Gallery</a>
            <a href="${p('blog.html')}">Blog</a>
            <a href="${p('reviews.html')}">Reviews</a>
            <a href="${p('faq.html')}">FAQ</a>
            <a href="${p('contact.html')}">Contact</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false"><span data-copy="layout.col_courses" data-copy-field="title">Courses</span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="${p('courses.html')}#scooty" data-copy="layout.nav_scooty" data-copy-field="title">Scooty Training</a>
            <a href="${p('courses.html')}#bike" data-copy="layout.nav_bike" data-copy-field="title">Bike Training</a>
            <a href="/women-training" data-copy="layout.nav_ladies" data-copy-field="title">Ladies Training</a>
            <a href="${p('courses.html')}#ev" data-copy="layout.nav_ev" data-copy-field="title">Electric Vehicle</a>
            <a href="${p('courses.html')}#road" data-copy="layout.nav_road" data-copy-field="title">Road Practice</a>
            <a href="${p('courses.html')}#rto" data-copy="layout.nav_rto" data-copy-field="title">RTO Practice</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false"><span data-copy="layout.col_branches" data-copy-field="title">Branches</span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <div data-footer-branches>
            <a href="/locations/tollygunge">Tollygunge</a>
            <a href="/locations/barasat">Barasat</a>
            <a href="/locations/new-town">New Town</a>
            <a href="/locations/sodepur">Sodepur</a>
            <a href="/locations/rabindra-sarobar">Rabindra Sarobar</a>
            <a href="/locations/howrah">Howrah</a>
            <a href="/locations/patuli">Patuli</a>
            </div>
            <a href="${p('branches.html')}">All Branches</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false"><span data-copy="layout.col_contact" data-copy-field="title">Contact</span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <div data-footer-phones class="phones-inline">
            <a href="tel:9748481630">9748481630</a> <span class="phone-sep" aria-hidden="true">·</span> <a href="tel:7980108587">7980108587</a>
            </div>
            <a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener" data-copy="layout.link_whatsapp" data-copy-field="title">WhatsApp Us</a>
            <a href="/pages/branches.html" data-gmb-link rel="noopener" data-copy="layout.link_maps" data-copy-field="title">Google Maps</a>
            <span data-setting="workingHours">Mon – Sun: 7:00 AM – 7:00 PM</span>
          </div>
        </div>
      </div>

      <!-- Desktop columns (hidden on mobile via CSS) -->
      <div class="footer__col footer__col--desktop">
        <h4 data-copy="layout.col_quick" data-copy-field="title">Quick Links</h4>
        <a href="${home}">Home</a>
        <a href="${p('about.html')}">About Us</a>
        <a href="/p/our-mission" target="_blank" rel="noopener">Our Mission</a>
        <a href="${p('gallery.html')}">Gallery</a>
        <a href="${p('blog.html')}">Blog</a>
        <a href="${p('reviews.html')}">Reviews</a>
        <a href="${p('faq.html')}">FAQ</a>
        <a href="${p('contact.html')}">Contact</a>
      </div>
      <div class="footer__col footer__col--desktop">
        <h4 data-copy="layout.col_courses" data-copy-field="title">Courses</h4>
        <a href="${p('courses.html')}#scooty" data-copy="layout.nav_scooty" data-copy-field="title">Scooty Training</a>
        <a href="${p('courses.html')}#bike" data-copy="layout.nav_bike" data-copy-field="title">Bike Training</a>
        <a href="/women-training" data-copy="layout.nav_ladies" data-copy-field="title">Ladies Training</a>
        <a href="${p('courses.html')}#ev" data-copy="layout.nav_ev" data-copy-field="title">Electric Vehicle</a>
        <a href="${p('courses.html')}#road" data-copy="layout.nav_road" data-copy-field="title">Road Practice</a>
        <a href="${p('courses.html')}#rto" data-copy="layout.nav_rto" data-copy-field="title">RTO Practice</a>
      </div>
      <div class="footer__col footer__col--desktop">
        <h4 data-copy="layout.col_branches" data-copy-field="title">Branches</h4>
        <div data-footer-branches>
        <a href="/locations/tollygunge">Tollygunge</a>
        <a href="/locations/barasat">Barasat</a>
        <a href="/locations/new-town">New Town</a>
        <a href="/locations/sodepur">Sodepur</a>
        <a href="/locations/rabindra-sarobar">Rabindra Sarobar</a>
        <a href="/locations/howrah">Howrah</a>
        <a href="/locations/patuli">Patuli</a>
        </div>
        <a href="${p('branches.html')}"><i class="fa-solid fa-map-location-dot"></i> All Branches</a>
      </div>
      <div class="footer__col footer__contact footer__col--desktop">
        <h4 data-copy="layout.col_contact" data-copy-field="title">Contact</h4>
        <ul>
          <li data-footer-phones-list></li>
          <li><i class="fa-brands fa-whatsapp"></i> <a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener" data-copy="layout.link_whatsapp" data-copy-field="title">WhatsApp Us</a></li>
          <li><i class="fa-solid fa-location-dot"></i> <a href="/pages/branches.html" data-gmb-link rel="noopener" data-copy="layout.link_maps" data-copy-field="title">Google Maps</a></li>
          <li><i class="fa-solid fa-clock"></i> <span data-setting="workingHours">Mon – Sun: 7:00 AM – 7:00 PM</span></li>
        </ul>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© ${new Date().getFullYear()} <span data-setting="copyright_text">Seekho Two Wheeler Academy. All rights reserved.</span></span>
      <span><a href="${p('privacy.html')}" data-copy="layout.link_privacy" data-copy-field="title">Privacy</a> · <a href="${p('terms.html')}" data-copy="layout.link_terms" data-copy-field="title">Terms</a></span>
    </div>
  </footer>

  <nav class="sticky-cta" aria-label="Quick booking actions">
    <a class="sticky-cta__btn sticky-cta__btn--call" href="tel:9748481630" data-call-primary><i class="fa-solid fa-phone"></i><span data-copy="layout.sticky_call" data-copy-field="title">Call</span></a>
    <a class="sticky-cta__btn sticky-cta__btn--wa" href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i><span data-copy="layout.sticky_wa" data-copy-field="title">WhatsApp</span></a>
    <a class="sticky-cta__btn sticky-cta__btn--book" href="${p('booking.html')}" data-href-setting="header_cta_link"><i class="fa-solid fa-calendar-check"></i><span data-copy="layout.sticky_book" data-copy-field="title">Book Slot</span></a>
  </nav>

  <a class="float-whatsapp" href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
  <button class="float-top" type="button" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>`;

  function initFooterAccordion(root) {
    const wrap = root.querySelector('[data-footer-accordion]');
    if (!wrap) return;
    wrap.querySelectorAll('.footer__acc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.nextElementSibling;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        wrap.querySelectorAll('.footer__acc-btn').forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          b.parentElement.classList.remove('is-open');
          if (b.nextElementSibling) b.nextElementSibling.hidden = true;
        });
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          btn.parentElement.classList.add('is-open');
          if (panel) panel.hidden = false;
        }
      });
    });
  }

  function inject() {
    ensureCustomerTheme();
    const headerMount = document.getElementById('site-header-mount');
    const footerMount = document.getElementById('site-footer-mount');
    if (headerMount) headerMount.innerHTML = headerHTML;
    if (footerMount) {
      footerMount.innerHTML = footerHTML;
      initFooterAccordion(footerMount);
    }
    if (!document.querySelector('script[src="/js/chatbot.js"]')) {
      const sc = document.createElement('script');
      sc.src = '/js/chatbot.js';
      sc.defer = true;
      document.body.appendChild(sc);
    }
    hydrateCms();
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function menuAttrs(item) {
    const blank = item.openNewTab || item.isExternal;
    return blank ? ' target="_blank" rel="noopener"' : '';
  }

  function renderNav(header, dropdown) {
    return header.map((item) => {
      if (item.pageType === 'dropdown') {
        const links = dropdown.map((child) => `<a href="${esc(child.href)}"${menuAttrs(child)}>${esc(child.label)}</a>`).join('');
        return `<div class="nav__dropdown">
          <a href="${esc(item.href)}"${menuAttrs(item)}><span>${esc(item.label)}</span> <i class="fa-solid fa-chevron-down" style="font-size:0.65rem"></i></a>
          ${links ? `<div class="nav__dropdown-menu">${links}</div>` : ''}
        </div>`;
      }
      return `<a href="${esc(item.href)}"${menuAttrs(item)}>${esc(item.label)}</a>`;
    }).join('');
  }

  async function hydrateCms() {
    try {
      const res = await fetch('/api/frontend-menus', { cache: 'no-store' });
      const json = await res.json();
      const rows = json && json.success ? json.data || [] : [];
      const header = rows.filter((row) => row.menuGroup === 'header' && row.active !== false);
      const dropdown = rows.filter((row) => row.menuGroup === 'courses-dropdown' && row.active !== false);
      const nav = document.getElementById('mainNav');
      if (nav && header.length) nav.innerHTML = renderNav(header, dropdown);
    } catch { /* keep the built-in menu */ }

    try {
      const res = await fetch('/api/locations', { cache: 'no-store' });
      const json = await res.json();
      const rows = json && json.success ? json.data || [] : [];
      if (!rows.length) return;
      const html = rows.map((row) => `<a href="/locations/${esc(row.slug)}">${esc(row.name)}</a>`).join('');
      document.querySelectorAll('[data-footer-branches]').forEach((node) => {
        node.innerHTML = html;
      });
    } catch { /* keep the built-in branch links */ }
  }

  ensureCustomerTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
