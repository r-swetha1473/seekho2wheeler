/* Blog detail — reusable article template (Phase 6) */
(function () {
  const { api, qs, formatDate, toast, sanitizeHtml, formatTitle, safeImg } = Seekho;

  const slug = location.pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  const article = qs('#blogArticle');
  const loading = qs('#blogLoading');
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function absoluteUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${Seekho.siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  }

  function updateMeta(blog) {
    document.title = blog.metaTitle || blog.title;
    const desc = blog.metaDescription || blog.shortDescription || '';
    const url = `${Seekho.siteUrl()}/blog/${blog.slug}`;
    const image = absoluteUrl(blog.featuredImage);
    const setMeta = (sel, val) => {
      const el = document.querySelector(sel);
      if (el && val) el.setAttribute('content', val);
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', blog.metaTitle || blog.title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[name="twitter:title"]', blog.metaTitle || blog.title);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[name="twitter:image"]', image);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    const crumb = document.getElementById('blogCrumbTitle');
    if (crumb) crumb.textContent = blog.title;

    const ld = document.getElementById('blogJsonLd');
    if (ld) {
      const graph = [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blog.title,
          description: desc,
          image: image || undefined,
          datePublished: blog.publishedAt || blog.createdAt,
          dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
          author: { '@type': 'Organization', name: 'Seekho Two Wheeler Academy' },
          publisher: {
            '@type': 'Organization',
            name: 'Seekho Two Wheeler Academy',
            logo: {
              '@type': 'ImageObject',
              url: `${Seekho.siteUrl()}/images/brand/seekho-master.webp`
            }
          },
          mainEntityOfPage: url
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${Seekho.siteUrl()}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${Seekho.siteUrl()}/pages/blog.html` },
            { '@type': 'ListItem', position: 3, name: blog.title, item: url }
          ]
        }
      ];
      ld.textContent = JSON.stringify(graph);
    }
  }

  function sectionAccordion(sections) {
    if (!sections || !sections.length) return '';
    return `
      <div class="article-accordion" data-aos="fade-up">
        ${sections
          .map(
            (s, i) => `
          <details class="article-accordion__item"${i === 0 ? ' open' : ''}>
            <summary class="article-accordion__summary">
              <span class="article-accordion__num" aria-hidden="true">${i + 1}</span>
              <span class="article-accordion__title">${escapeHtml(s.title)}</span>
              <i class="fa-solid fa-chevron-down article-accordion__icon" aria-hidden="true"></i>
            </summary>
            <div class="article-accordion__body">
              <p>${escapeHtml(s.body)}</p>
            </div>
          </details>`
          )
          .join('')}
      </div>`;
  }

  function branchAccordion(branches) {
    if (!branches || !branches.length) return '';
    return `
      <div class="article-branches" data-aos="fade-up">
        <h2 class="article-block__heading">Seven Training Centres</h2>
        <div class="article-accordion article-accordion--branches">
          ${branches
            .map((b, i) => {
              const reach = (b.howToReach || []).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
              const training = (b.trainingAvailable || [])
                .map((t) => `<li>${escapeHtml(t)}</li>`)
                .join('');
              const phones = (b.phones || []).map((p) => escapeHtml(p)).join(' · ');
              return `
            <details class="article-accordion__item"${i === 0 ? ' open' : ''}>
              <summary class="article-accordion__summary">
                <span class="article-accordion__num" aria-hidden="true">${i + 1}</span>
                <span class="article-accordion__title">${escapeHtml(b.name)}${b.isMainBranch ? ' <span class="article-pill">Main Branch</span>' : ''}</span>
                <i class="fa-solid fa-chevron-down article-accordion__icon" aria-hidden="true"></i>
              </summary>
              <div class="article-accordion__body article-branch">
                <p class="article-branch__meta">
                  ${b.establishedLabel ? `<span>${escapeHtml(b.establishedLabel)}</span>` : ''}
                  ${b.landmark ? `<span>Landmark: ${escapeHtml(b.landmark)}</span>` : ''}
                </p>
                <p><strong>Address:</strong> ${escapeHtml(b.address)}</p>
                ${reach ? `<div><strong>How to reach</strong><ul>${reach}</ul></div>` : ''}
                ${training ? `<div><strong>Training available</strong><ul>${training}</ul></div>` : ''}
                ${phones ? `<p><strong>Phone:</strong> ${phones}</p>` : ''}
                <div class="article-branch__actions">
                  ${b.mapsLink ? `<a class="btn btn--outline btn--sm" href="${escapeHtml(b.mapsLink)}" target="_blank" rel="noopener noreferrer">Open Maps</a>` : ''}
                  <a class="btn btn--primary btn--sm" href="${escapeHtml(b.href)}">Branch details</a>
                </div>
                ${
                  b.embedUrl
                    ? `<div class="article-branch__map"><iframe title="Map — ${escapeHtml(b.name)}" src="${escapeHtml(b.embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
                    : ''
                }
                <div class="article-branch__gallery" data-gallery-category="${escapeHtml(b.galleryCategory || '')}">
                  <p class="article-branch__gallery-label">Gallery: ${escapeHtml(b.galleryCategory || 'Branch')}</p>
                  <div class="article-gallery-grid" data-branch-gallery></div>
                </div>
              </div>
            </details>`;
            })
            .join('')}
        </div>
      </div>`;
  }

  function takeawaysBlock(items) {
    if (!items || !items.length) return '';
    return `
      <section class="article-takeaways" data-aos="fade-up">
        <h2 class="article-block__heading">Key Takeaways</h2>
        <ul class="article-takeaways__list">
          ${items.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </section>`;
  }

  function ctaBlock(cta) {
    const heading = (cta && cta.heading) || 'Ready to start your riding journey?';
    const label = (cta && cta.label) || 'Book Training Now';
    const href = (cta && cta.href) || '/pages/booking.html';
    return `
      <div class="blog-detail__cta" data-aos="fade-up">
        <p>${escapeHtml(heading)}</p>
        <a href="${escapeHtml(href)}" class="btn btn--primary">${escapeHtml(label)}</a>
      </div>`;
  }

  async function loadGallery(container, category) {
    if (!container) return;
    if (!category) {
      container.innerHTML = '<p class="empty-state">No gallery category linked.</p>';
      return;
    }
    try {
      const { data } = await api(`/gallery?category=${encodeURIComponent(category)}`);
      if (!data || !data.length) {
        container.innerHTML = '<p class="empty-state">No photos in this gallery yet.</p>';
        return;
      }
      container.innerHTML = data
        .slice(0, 8)
        .map(
          (g) => `
        <figure class="article-gallery-card">
          ${safeImg(g.image, g.title || category, { w: 600, h: 600 })}
        </figure>`
        )
        .join('');
    } catch {
      container.innerHTML = '<p class="empty-state">Gallery unavailable.</p>';
    }
  }

  function bindAccordionMotion(root) {
    if (prefersReduced || !root) return;
    root.querySelectorAll('details.article-accordion__item').forEach((el) => {
      el.addEventListener('toggle', () => {
        // native <details> stays readable without JS; class aids CSS motion only
        el.classList.toggle('is-open', el.open);
      });
      if (el.open) el.classList.add('is-open');
    });
  }

  async function init() {
    if (!slug) {
      location.href = '/pages/blog.html';
      return;
    }
    try {
      const { data: blog } = await api(`/blogs/${encodeURIComponent(slug)}`);
      updateMeta(blog);
      if (loading) loading.remove();

      const hasStructured = (blog.sections && blog.sections.length) || blog.articleType === 'branches';
      const introHtml = blog.intro
        ? `<div class="blog-detail__intro" data-aos="fade-up"><p>${escapeHtml(blog.intro)}</p></div>`
        : '';
      const structuredBody = hasStructured
        ? `
          ${introHtml}
          ${sectionAccordion(blog.sections)}
          ${blog.articleType === 'branches' ? branchAccordion(blog.branches || []) : ''}
          ${takeawaysBlock(blog.takeaways)}
        `
        : `<div class="blog-detail__content rich-html">${sanitizeHtml(blog.content)}</div>
           ${takeawaysBlock(blog.takeaways)}`;

      if (article) {
        article.innerHTML = `
          <div class="blog-detail__cover media-frame media-frame--blog" data-aos="fade-up">
            ${safeImg(blog.featuredImage, blog.title, { w: 1200, h: 630, priority: true })}
          </div>
          <div class="blog-detail__meta" data-aos="fade-up">
            ${blog.category ? `<span class="blog-detail__category">${escapeHtml(blog.category)}</span>` : ''}
            <time datetime="${blog.publishedAt || blog.createdAt}">${formatDate(blog.publishedAt || blog.createdAt)}</time>
            <span>· Seekho Two Wheeler Academy</span>
          </div>
          <h1 class="blog-detail__title" data-aos="fade-up">${formatTitle(blog.title, blog.title_bold)}</h1>
          ${structuredBody}
          <section class="article-gallery" data-aos="fade-up">
            <h2 class="article-block__heading">Related Gallery</h2>
            <p class="article-gallery__sub">${blog.galleryCategory ? escapeHtml(blog.galleryCategory) : 'Training moments'}</p>
            <div class="article-gallery-grid" id="articleGalleryGrid"></div>
          </section>
          ${ctaBlock(blog.cta)}`;
        article.hidden = false;

        bindAccordionMotion(article);
        await loadGallery(qs('#articleGalleryGrid'), blog.galleryCategory);

        const branchGalleries = article.querySelectorAll('[data-branch-gallery]');
        for (const el of branchGalleries) {
          const cat = el.closest('[data-gallery-category]')?.getAttribute('data-gallery-category');
          await loadGallery(el, cat);
        }
      }
      if (window.AOS) AOS.refresh();
    } catch {
      if (loading) loading.textContent = 'Article not found.';
      toast('Blog post not found.', 'error');
      setTimeout(() => {
        location.href = '/pages/blog.html';
      }, 2000);
    }
  }

  init();
})();
