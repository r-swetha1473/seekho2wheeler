/* Contact page — enquiry form */
(function () {
  const { api, qs, toast, dialog, validateForm } = Seekho;

  const form = qs('#contactForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) {
      toast('Please fill all required fields correctly.', 'warning');
      return;
    }
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      const res = await api('/enquiries', { method: 'POST', body });
      dialog({ title: 'Enquiry Sent', message: res.message, type: 'success' });
      form.reset();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
})();
