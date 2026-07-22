/* Homepage — framed images with consistent aspect ratios */
(async function () {
  const { api, qs, qsa, formatPrice, formatDate, stars, openLightbox, initFaq, toast, safeImg } = Seekho;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function skeletonCards(n, height = 320) {
    return Array.from({ length: n }, () => `<div class="skeleton media-skeleton" style="height:${height}px"></div>`).join('');
  }

  async function renderBanners() {
    const wrap = qs('#heroSlides');
    if (!wrap) return;
    try {
      const { data } = await api('/banners');
      const slides = data.length ? data : [{
        title: 'Learn Scooty & Bike Riding With Confidence',
        subtitle: 'Empowering independence through safe riding.',
        ctaText: 'Start Learning',
        ctaLink: '/pages/booking.html',
        image: '/images/banners/seekho-01.webp'
      }];

      wrap.innerHTML = slides.map((b, idx) => `
        <div class="swiper-slide">
          <div class="hero__slide">
            <div class="hero__media media-frame media-frame--banner">
              ${safeImg(b.image, b.title, { w: 1920, h: 1080, className: 'img-cover', priority: idx === 0 })}
            </div>
            <div class="hero__overlay"></div>
            <div class="hero__content">
              <div class="hero__brand">Seekho Two Wheeler Academy</div>
              <h1 class="hero__title">${escapeHtml(b.title)}</h1>
              <p class="hero__subtitle">${escapeHtml(b.subtitle || '')}</p>
              <div class="hero__actions">
                <a href="${b.ctaLink || '/pages/booking.html'}" class="btn btn--primary btn--lg">${escapeHtml(b.ctaText || 'Book Training')}</a>
                <a href="/pages/reviews.html" class="btn btn--outline-white btn--lg">Watch Real Feedback</a>
              </div>
            </div>
          </div>
        </div>`).join('');

      new Swiper('.hero-swiper', {
        loop: slides.length > 1,
        autoplay: slides.length > 1 ? { delay: 5500, disableOnInteraction: false } : false,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        pagination: { el: '.hero .swiper-pagination', clickable: true },
        navigation: { nextEl: '.hero .swiper-button-next', prevEl: '.hero .swiper-button-prev' }
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function renderCourses() {
    const wrap = qs('#courseCards');
    if (!wrap) return;
    wrap.innerHTML = skeletonCards(6, 420);
    try {
      const { data } = await api('/pricing');
      wrap.className = 'course-grid';
      wrap.innerHTML = data.map((c, i) => `
        <article class="course-card" data-aos="fade-up" data-aos-delay="${i * 60}">
          <div class="course-card__media media-frame media-frame--43">
            ${safeImg(c.image || `/images/courses/seekho-0${(i % 7) + 1}.webp`, c.courseName, { w: 1200, h: 900 })}
          </div>
          <div class="course-card__body">
            <h3 class="course-card__title">${escapeHtml(c.courseName)}</h3>
            <p class="course-card__desc">${escapeHtml(c.description || '')}</p>
            <div class="course-card__meta">
              <span class="course-card__price">${formatPrice(c.price)}</span>
              <span class="course-card__duration"><i class="fa-regular fa-clock"></i> ${escapeHtml(c.duration || 'Flexible')}</span>
            </div>
            <a href="/pages/booking.html?course=${encodeURIComponent(c.courseName)}" class="btn btn--primary btn--block">Book Now</a>
          </div>
        </article>`).join('');
    } catch {
      wrap.innerHTML = '<p class="empty-state">Unable to load courses.</p>';
    }
  }

  async function renderGallery() {
    const grid = qs('#galleryGrid');
    if (!grid) return;
    grid.innerHTML = skeletonCards(6, 220);
    let items = [];
    try {
      items = (await api('/gallery')).data;
    } catch {
      grid.innerHTML = '<p class="empty-state">Gallery unavailable.</p>';
      return;
    }

    function paint(filter = 'all') {
      const list = filter === 'all' ? items : items.filter((g) => g.category === filter);
      grid.className = 'gallery-masonry';
      grid.innerHTML = list.map((g, i) => `
        <div class="gallery-item ${i % 5 === 0 ? 'gallery-item--tall' : ''} media-frame" data-src="${g.image}" data-alt="${escapeHtml(g.title || g.category)}">
          ${safeImg(g.image, g.title || g.category, { w: 1200, h: 1200 })}
          <div class="gallery-item__overlay"><span>${escapeHtml(g.category)}</span><i class="fa-solid fa-expand"></i></div>
        </div>`).join('') || '<p class="empty-state">No images in this category.</p>';
    }

    paint();
    grid.onclick = (e) => {
      const item = e.target.closest('.gallery-item');
      if (item) openLightbox(item.dataset.src, item.dataset.alt);
    };

    qsa('.gallery-filters .filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        qsa('.gallery-filters .filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        paint(btn.dataset.filter);
      });
    });
  }

  function branchCard(b, i = 0) {
    return `
      <article class="branch-card" data-aos="fade-up" data-aos-delay="${i * 50}">
        <div class="branch-card__media media-frame media-frame--43">
          ${safeImg(b.image, b.name, { w: 1200, h: 900 })}
        </div>
        <div class="branch-card__body">
          <h3 class="branch-card__name">${escapeHtml(b.name)}</h3>
          <p class="branch-card__addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(b.address)}</p>
          <a class="branch-card__phone" href="tel:${b.phone}"><i class="fa-solid fa-phone"></i> ${escapeHtml(b.phone)}</a>
          <div class="branch-card__actions">
            <a href="${b.mapsLink || '#'}" target="_blank" rel="noopener" class="btn btn--outline btn--sm"><i class="fa-solid fa-map"></i> Map</a>
            <a href="/pages/booking.html?branch=${encodeURIComponent(b.name)}" class="btn btn--primary btn--sm">Book Training</a>
          </div>
        </div>
      </article>`;
  }

  async function renderBranches() {
    const grid = qs('#branchGrid');
    if (!grid) return;
    grid.innerHTML = skeletonCards(4, 360);
    let allBranches = [];
    try {
      allBranches = (await api('/branches')).data;
      grid.innerHTML = allBranches.map((b, i) => branchCard(b, i)).join('');
    } catch {
      grid.innerHTML = '<p class="empty-state">Branches unavailable.</p>';
      return;
    }

    const branchSearch = qs('#branchSearch');
    if (branchSearch) {
      branchSearch.addEventListener('input', () => {
        const q = branchSearch.value.toLowerCase().trim();
        const filtered = !q ? allBranches : allBranches.filter((b) =>
          `${b.name} ${b.area} ${b.address}`.toLowerCase().includes(q)
        );
        grid.innerHTML = filtered.map((b, i) => branchCard(b, i)).join('')
          || '<p class="empty-state">No branches match your search.</p>';
      });
    }
  }

  async function renderBlogs() {
    const grid = qs('#blogGrid');
    if (!grid) return;
    grid.innerHTML = skeletonCards(3, 300);
    try {
      const { data } = await api('/blogs?limit=3');
      grid.innerHTML = data.map((b, i) => `
        <article class="blog-card" data-aos="fade-up" data-aos-delay="${i * 60}">
          <a href="/blog/${b.slug}">
            <div class="blog-card__media media-frame media-frame--blog">
              ${safeImg(b.featuredImage, b.title, { w: 1200, h: 630 })}
            </div>
            <div class="blog-card__body">
              <div class="blog-card__date">${formatDate(b.publishedAt || b.createdAt)}</div>
              <h3 class="blog-card__title">${escapeHtml(b.title)}</h3>
              <p class="blog-card__excerpt">${escapeHtml(b.metaDescription || '').slice(0, 110)}...</p>
            </div>
          </a>
        </article>`).join('');
    } catch {
      grid.innerHTML = '<p class="empty-state">Blogs unavailable.</p>';
    }
  }

  async function renderTestimonials() {
    const grid = qs('#testimonialGrid');
    if (!grid) return;
    grid.innerHTML = skeletonCards(3, 360);
    try {
      const { data } = await api('/testimonials');
      grid.innerHTML = data.slice(0, 3).map((t, i) => `
        <article class="testimonial-card" data-aos="fade-up" data-aos-delay="${i * 70}">
          <div class="testimonial-card__media media-frame media-frame--square media-frame--contain">
            ${safeImg(t.photo, t.name, { w: 800, h: 800, className: 'img-contain' })}
            ${t.type === 'video' || t.videoUrl ? '<div class="testimonial-card__play"><i class="fa-solid fa-circle-play"></i></div>' : ''}
          </div>
          <div class="testimonial-card__body">
            <div class="rating-badge__stars" style="color:var(--primary);margin-bottom:0.4rem">${stars(t.rating)}</div>
            <h3 class="testimonial-card__headline">${escapeHtml(t.headline || 'Student Story')}</h3>
            <p class="testimonial-card__text">"${escapeHtml(t.review)}"</p>
            <div class="testimonial-card__author">— ${escapeHtml(t.name)}</div>
          </div>
        </article>`).join('');
    } catch {
      grid.innerHTML = '<p class="empty-state">Reviews unavailable.</p>';
    }
  }

  async function renderFaqs() {
    const list = qs('#faqList');
    if (!list) return;
    try {
      const { data } = await api('/faqs');
      list.innerHTML = data.map((f) => `
        <div class="faq-item">
          <button class="faq-item__q" type="button">${escapeHtml(f.question)} <i class="fa-solid fa-chevron-down"></i></button>
          <div class="faq-item__a">${escapeHtml(f.answer)}</div>
        </div>`).join('');
      initFaq(list);
    } catch {
      list.innerHTML = '<p class="empty-state">FAQs unavailable.</p>';
    }
  }

  function renderSocial() {
    const grid = qs('#socialGrid');
    if (!grid) return;
    const s = window.SEEKHO_SETTINGS || {};
    grid.innerHTML = `
      <a class="social-card" href="${s.facebookUrl || '#'}" target="_blank" rel="noopener" data-social="facebook">
        <div><div class="social-card__platform fb"><i class="fa-brands fa-facebook"></i> Facebook</div>
        <p>See latest student stories and updates from our Facebook page.</p></div>
        <span class="btn btn--sm btn--outline">View Posts</span>
      </a>
      <a class="social-card" href="${s.instagramUrl || '#'}" target="_blank" rel="noopener" data-social="instagram">
        <div><div class="social-card__platform ig"><i class="fa-brands fa-instagram"></i> Instagram</div>
        <p>Follow reels and training moments from Seekho riders across Kolkata.</p></div>
        <span class="btn btn--sm btn--outline">View Reels</span>
      </a>
      <a class="social-card" href="${s.youtubeUrl || '#'}" target="_blank" rel="noopener" data-social="youtube">
        <div><div class="social-card__platform yt"><i class="fa-brands fa-youtube"></i> YouTube</div>
        <p>Watch real student feedback and training tips on our YouTube channel.</p></div>
        <span class="btn btn--sm btn--outline">Watch Videos</span>
      </a>`;
  }

  const contactForm = qs('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!Seekho.validateForm(contactForm)) {
        toast('Please fill all required fields correctly.', 'warning');
        return;
      }
      const body = Object.fromEntries(new FormData(contactForm).entries());
      const btn = contactForm.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        const res = await api('/enquiries', { method: 'POST', body });
        Seekho.dialog({ title: 'Enquiry Sent', message: res.message, type: 'success' });
        contactForm.reset();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  await Promise.all([
    renderBanners(),
    renderCourses(),
    renderGallery(),
    renderBranches(),
    renderBlogs(),
    renderTestimonials(),
    renderFaqs()
  ]);
  renderSocial();
  if (window.AOS) AOS.refresh();
})();
