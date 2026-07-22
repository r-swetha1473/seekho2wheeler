/* Booking wizard — 5 steps: course, branch, date, time, submit */
(function () {
  const { api, qs, qsa, toast, dialog, validateForm, formatPrice } = Seekho;

  const state = {
    step: 1,
    course: null,
    branch: null,
    date: '',
    timeSlot: ''
  };

  let courses = [];
  let branches = [];
  let slots = [];

  const panels = qsa('.wizard__panel');
  const stepEls = qsa('.wizard__step');
  const courseGrid = qs('#courseOptions');
  const branchGrid = qs('#branchOptions');
  const slotGrid = qs('#slotOptions');
  const dateInput = qs('#bookingDate');
  const summaryEl = qs('#bookingSummary');
  const form = qs('#bookingForm');

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function goToStep(n) {
    if (n < 1 || n > 5) return;
    state.step = n;
    panels.forEach((p) => p.classList.toggle('active', Number(p.dataset.step) === n));
    stepEls.forEach((s) => {
      const num = Number(s.dataset.step);
      s.classList.toggle('active', num === n);
      s.classList.toggle('done', num < n);
    });
    if (n === 5) renderSummary();
  }

  function selectOption(grid, card, onSelect) {
    qsa('.option-card', grid).forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    onSelect(card.dataset);
  }

  function renderCourses() {
    if (!courseGrid) return;
    courseGrid.innerHTML = courses.map((c) => `
      <div class="option-card" data-id="${escapeHtml(c.id)}" data-name="${escapeHtml(c.courseName)}" data-price="${c.price}">
        <strong>${escapeHtml(c.courseName)}</strong>
        <small>${formatPrice(c.price)}</small>
      </div>`).join('');

    courseGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card) return;
      selectOption(courseGrid, card, (data) => {
        state.course = { id: data.id, name: data.name, price: data.price };
      });
    });

    const params = new URLSearchParams(location.search);
    const preselect = params.get('course');
    if (preselect) {
      const match = courses.find((c) => c.courseName.toLowerCase() === preselect.toLowerCase());
      if (match) {
        const card = courseGrid.querySelector(`[data-id="${match.id}"]`);
        if (card) {
          selectOption(courseGrid, card, (data) => {
            state.course = { id: data.id, name: data.name, price: data.price };
          });
        }
      }
    }
  }

  function renderBranches() {
    if (!branchGrid) return;
    branchGrid.innerHTML = branches.map((b) => `
      <div class="option-card" data-id="${escapeHtml(b.id)}" data-name="${escapeHtml(b.name)}">
        <strong>${escapeHtml(b.name)}</strong>
        <small>${escapeHtml(b.area || b.address)}</small>
      </div>`).join('');

    branchGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card) return;
      selectOption(branchGrid, card, (data) => {
        state.branch = { id: data.id, name: data.name };
      });
    });
  }

  function renderSlots() {
    if (!slotGrid) return;
    slotGrid.innerHTML = slots.map((s) => `
      <button type="button" class="slot-btn" data-slot="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');

    slotGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.slot-btn');
      if (!btn) return;
      qsa('.slot-btn', slotGrid).forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.timeSlot = btn.dataset.slot;
    });
  }

  function renderSummary() {
    if (!summaryEl) return;
    summaryEl.innerHTML = `
      <div class="contact-info" style="margin-bottom:1.25rem">
        <div class="contact-info__item">
          <i class="fa-solid fa-graduation-cap"></i>
          <div><strong>Course</strong><p>${escapeHtml(state.course?.name || '—')}</p></div>
        </div>
        <div class="contact-info__item">
          <i class="fa-solid fa-location-dot"></i>
          <div><strong>Branch</strong><p>${escapeHtml(state.branch?.name || '—')}</p></div>
        </div>
        <div class="contact-info__item">
          <i class="fa-solid fa-calendar"></i>
          <div><strong>Date</strong><p>${escapeHtml(state.date || '—')}</p></div>
        </div>
        <div class="contact-info__item">
          <i class="fa-solid fa-clock"></i>
          <div><strong>Time Slot</strong><p>${escapeHtml(state.timeSlot || '—')}</p></div>
        </div>
      </div>`;
  }

  function validateStep(n) {
    if (n === 1 && !state.course) {
      toast('Please select a course.', 'warning');
      return false;
    }
    if (n === 2 && !state.branch) {
      toast('Please select a branch.', 'warning');
      return false;
    }
    if (n === 3) {
      state.date = dateInput?.value || '';
      if (!state.date) {
        toast('Please choose a date.', 'warning');
        return false;
      }
      const chosen = new Date(state.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        toast('Please select a future date.', 'warning');
        return false;
      }
    }
    if (n === 4 && !state.timeSlot) {
      toast('Please select a time slot.', 'warning');
      return false;
    }
    return true;
  }

  qs('#wizardNext')?.addEventListener('click', () => {
    if (!validateStep(state.step)) return;
    goToStep(state.step + 1);
    updateNav();
  });

  qs('#wizardPrev')?.addEventListener('click', () => {
    goToStep(state.step - 1);
    updateNav();
  });

  function updateNav() {
    const prev = qs('#wizardPrev');
    const next = qs('#wizardNext');
    if (prev) prev.style.visibility = state.step > 1 ? 'visible' : 'hidden';
    if (next) next.style.display = state.step >= 5 ? 'none' : 'inline-flex';
  }

  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
        toast('Please complete all booking steps.', 'warning');
        return;
      }
      if (!validateForm(form)) {
        toast('Please fill all required contact details correctly.', 'warning');
        return;
      }
      const fd = new FormData(form);
      const body = {
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email') || '',
        courseId: state.course.id,
        courseName: state.course.name,
        branchId: state.branch.id,
        branchName: state.branch.name,
        date: state.date,
        timeSlot: state.timeSlot,
        message: fd.get('message') || ''
      };
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        const res = await api('/bookings', { method: 'POST', body });
        dialog({
          title: 'Booking Confirmed!',
          message: res.message,
          type: 'success',
          onConfirm: () => { location.href = '/'; }
        });
        form.reset();
        state.course = null;
        state.branch = null;
        state.date = '';
        state.timeSlot = '';
        goToStep(1);
        updateNav();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  async function init() {
    try {
      const [pricingRes, branchRes, slotsRes] = await Promise.all([
        api('/pricing'),
        api('/branches'),
        api('/bookings/slots')
      ]);
      courses = pricingRes.data;
      branches = branchRes.data;
      slots = slotsRes.data;
      renderCourses();
      renderBranches();
      renderSlots();
    } catch (err) {
      toast('Unable to load booking options. Please refresh.', 'error');
    }
  }

  goToStep(1);
  updateNav();
  init();
})();
