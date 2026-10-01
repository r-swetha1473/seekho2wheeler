/* FAQ page */
(function () {
  const { api, qs, initFaq, sanitizeHtml, formatTitle, stripHtml } = Seekho;

  const list = qs('#faqList');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function init() {
    if (!list) return;
    try {
      const { data } = await api('/faqs');
      list.innerHTML = data.map((f) => `
        <div class="faq-item">
          <button class="faq-item__q" type="button">${formatTitle(f.question, f.title_bold)} <i class="fa-solid fa-chevron-down"></i></button>
          <div class="faq-item__a rich-html">${sanitizeHtml(f.answer)}</div>
        </div>`).join('');
      initFaq(list);

      const ld = document.getElementById('faqJsonLd');
      if (ld && data.length) {
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.map((f) => ({
            '@type': 'Question',
            name: stripHtml(f.question),
            acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) }
          }))
        });
      }
    } catch {
      list.innerHTML = '<p class="empty-state">Unable to load FAQs.</p>';
    }
  }

  init();
})();
