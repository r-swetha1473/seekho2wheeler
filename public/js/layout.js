/* Shared header + footer injection */
(function () {
  const home = '/';
  const p = (file) => `/pages/${file}`;

  const headerHTML = `
  <header class="site-header">
    <div class="header__inner">
      <a class="logo" href="${home}" aria-label="Seekho Two Wheeler Academy Home">
        <div class="logo__mark"><i class="fa-solid fa-motorcycle"></i></div>
        <div class="logo__text">SEEKHO TWO WHEELER<span>ACADEMY · KOLKATA</span></div>
      </a>
      <nav class="nav" id="mainNav" aria-label="Primary">
        <a href="${home}">Home</a>
        <a href="${p('about.html')}">About Us</a>
        <div class="nav__dropdown">
          <a href="${p('courses.html')}">Courses <i class="fa-solid fa-chevron-down" style="font-size:0.65rem"></i></a>
          <div class="nav__dropdown-menu">
            <a href="${p('courses.html')}#scooty">Scooty Training</a>
            <a href="${p('courses.html')}#bike">Bike Training</a>
            <a href="${p('courses.html')}#ladies">Ladies Training</a>
            <a href="${p('courses.html')}#ev">Electric Vehicle</a>
            <a href="${p('courses.html')}#road">Road Practice</a>
            <a href="${p('courses.html')}#rto">RTO Practice</a>
          </div>
        </div>
        <a href="${p('branches.html')}">Branches</a>
        <a href="${p('gallery.html')}">Gallery</a>
        <a href="${p('blog.html')}">Blog</a>
        <a href="${p('reviews.html')}">Reviews</a>
        <a href="${p('contact.html')}">Contact</a>
      </nav>
      <div class="header__actions">
        <a href="${p('booking.html')}" class="btn btn--primary header__cta"><i class="fa-solid fa-calendar-check"></i> <span>Register & Book</span></a>
        <button class="nav-toggle" aria-label="Open menu" type="button"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
  </header>`;

  const footerHTML = `
  <section class="final-cta">
    <div class="container final-cta__inner">
      <div class="final-cta__icon"><i class="fa-solid fa-calendar-check"></i></div>
      <h2>Ready To Start Your Riding Journey?</h2>
      <p>Join thousands of confident riders trained at Seekho Two Wheeler Academy.</p>
      <a href="${p('booking.html')}" class="btn btn--dark btn--lg">Register & Book Now</a>
      <div class="final-cta__trust">
        <span><i class="fa-solid fa-check"></i> Easy Registration</span>
        <span><i class="fa-solid fa-bolt"></i> Quick Booking</span>
        <span><i class="fa-solid fa-shield-halved"></i> Instant Confirmation</span>
      </div>
    </div>
  </section>
  <footer class="site-footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <a class="logo" href="${home}">
          <div class="logo__mark"><i class="fa-solid fa-motorcycle"></i></div>
          <div class="logo__text">SEEKHO TWO WHEELER<span>ACADEMY</span></div>
        </a>
        <p class="footer__tagline">Empowering Independence Through Safe Riding since 2018.</p>
        <div class="socials" aria-label="Social links">
          <a href="#" data-social="facebook" aria-label="Facebook" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" data-social="instagram" aria-label="Instagram" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" data-social="youtube" aria-label="YouTube" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>
          <a href="https://wa.me/919748481630" data-whatsapp aria-label="WhatsApp" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
        <ul class="footer__compact-contact" aria-label="Contact">
          <li><a href="tel:9748481630"><i class="fa-solid fa-phone"></i> 9748481630</a></li>
          <li><a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a></li>
        </ul>
      </div>

      <div class="footer__accordion" data-footer-accordion>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false">Quick Links <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="${home}">Home</a>
            <a href="${p('about.html')}">About Us</a>
            <a href="${p('gallery.html')}">Gallery</a>
            <a href="${p('blog.html')}">Blog</a>
            <a href="${p('reviews.html')}">Reviews</a>
            <a href="${p('faq.html')}">FAQ</a>
            <a href="${p('contact.html')}">Contact</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false">Courses <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="${p('courses.html')}#scooty">Scooty Training</a>
            <a href="${p('courses.html')}#bike">Bike Training</a>
            <a href="${p('courses.html')}#ladies">Ladies Training</a>
            <a href="${p('courses.html')}#ev">Electric Vehicle</a>
            <a href="${p('courses.html')}#road">Road Practice</a>
            <a href="${p('courses.html')}#rto">RTO Practice</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false">Branches <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="${p('branches.html')}#tollygunge">Tollygunge</a>
            <a href="${p('branches.html')}#newtown">New Town</a>
            <a href="${p('branches.html')}#barasat">Barasat</a>
            <a href="${p('branches.html')}#sodepur">Sodepur</a>
            <a href="${p('branches.html')}">All Branches</a>
          </div>
        </div>
        <div class="footer__acc">
          <button type="button" class="footer__acc-btn" aria-expanded="false">Contact <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          <div class="footer__acc-panel" hidden>
            <a href="tel:9748481630">9748481630</a>
            <a href="tel:7980108587">7980108587</a>
            <a href="tel:7980110273">7980110273</a>
            <a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener">WhatsApp Us</a>
            <a href="https://maps.google.com/?q=Seekho+Two+Wheeler+Academy+Kolkata" target="_blank" rel="noopener">Google Maps</a>
            <span>Mon – Sun: 7:00 AM – 7:00 PM</span>
          </div>
        </div>
      </div>

      <!-- Desktop columns (hidden on mobile via CSS) -->
      <div class="footer__col footer__col--desktop">
        <h4>Quick Links</h4>
        <a href="${home}">Home</a>
        <a href="${p('about.html')}">About Us</a>
        <a href="${p('gallery.html')}">Gallery</a>
        <a href="${p('blog.html')}">Blog</a>
        <a href="${p('reviews.html')}">Reviews</a>
        <a href="${p('faq.html')}">FAQ</a>
        <a href="${p('contact.html')}">Contact</a>
      </div>
      <div class="footer__col footer__col--desktop">
        <h4>Courses</h4>
        <a href="${p('courses.html')}#scooty">Scooty Training</a>
        <a href="${p('courses.html')}#bike">Bike Training</a>
        <a href="${p('courses.html')}#ladies">Ladies Training</a>
        <a href="${p('courses.html')}#ev">Electric Vehicle</a>
        <a href="${p('courses.html')}#road">Road Practice</a>
        <a href="${p('courses.html')}#rto">RTO Practice</a>
      </div>
      <div class="footer__col footer__col--desktop">
        <h4>Branches</h4>
        <a href="${p('branches.html')}#tollygunge">Tollygunge</a>
        <a href="${p('branches.html')}#newtown">New Town</a>
        <a href="${p('branches.html')}#barasat">Barasat</a>
        <a href="${p('branches.html')}#sodepur">Sodepur</a>
        <a href="${p('branches.html')}"><i class="fa-solid fa-map-location-dot"></i> All Branches</a>
      </div>
      <div class="footer__col footer__contact footer__col--desktop">
        <h4>Contact</h4>
        <ul>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:9748481630">9748481630</a></li>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:7980108587">7980108587</a></li>
          <li><i class="fa-solid fa-phone"></i> <a href="tel:7980110273">7980110273</a></li>
          <li><i class="fa-brands fa-whatsapp"></i> <a href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener">WhatsApp Us</a></li>
          <li><i class="fa-solid fa-location-dot"></i> <a href="https://maps.google.com/?q=Seekho+Two+Wheeler+Academy+Kolkata" target="_blank" rel="noopener">Google Maps</a></li>
          <li><i class="fa-solid fa-clock"></i> <span>Mon – Sun: 7:00 AM – 7:00 PM</span></li>
        </ul>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© ${new Date().getFullYear()} Seekho Two Wheeler Academy. All rights reserved.</span>
      <span><a href="${p('privacy.html')}">Privacy</a> · <a href="${p('terms.html')}">Terms</a></span>
    </div>
  </footer>

  <nav class="sticky-cta" aria-label="Quick booking actions">
    <a class="sticky-cta__btn sticky-cta__btn--call" href="tel:9748481630"><i class="fa-solid fa-phone"></i><span>Call</span></a>
    <a class="sticky-cta__btn sticky-cta__btn--wa" href="https://wa.me/919748481630" data-whatsapp target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></a>
    <a class="sticky-cta__btn sticky-cta__btn--book" href="${p('booking.html')}"><i class="fa-solid fa-calendar-check"></i><span>Book Slot</span></a>
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
    const headerMount = document.getElementById('site-header-mount');
    const footerMount = document.getElementById('site-footer-mount');
    if (headerMount) headerMount.innerHTML = headerHTML;
    if (footerMount) {
      footerMount.innerHTML = footerHTML;
      initFooterAccordion(footerMount);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
