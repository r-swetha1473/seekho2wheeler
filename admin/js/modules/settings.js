import { api, toast, escapeHtml } from '../admin.js';

let currentSettings = null;

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading settings…</div>';

  try {
    const { data: settings } = await api('/admin/settings');
    currentSettings = settings;
    const phones = Array.isArray(settings.phones) ? settings.phones.join(', ') : (settings.phones || '');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Settings</h2>
          <p class="page-header__subtitle">Site configuration and account security</p>
        </div>
      </div>

      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="site">Site Settings</button>
        <button class="settings-tab" data-tab="social">Social & Contact</button>
        <button class="settings-tab" data-tab="password">Change Password</button>
      </div>

      <div class="settings-panel active" id="panel-site">
        <div class="card">
          <div class="card__header"><h3 class="card__title">General</h3></div>
          <div class="card__body">
            <form id="siteForm">
              <div class="form-grid">
                <div class="form-group">
                  <label>Site Name</label>
                  <input class="form-control" name="siteName" value="${escapeHtml(settings.siteName || '')}">
                </div>
                <div class="form-group">
                  <label>Tagline</label>
                  <input class="form-control" name="tagline" value="${escapeHtml(settings.tagline || '')}">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input class="form-control" type="email" name="email" value="${escapeHtml(settings.email || '')}">
                </div>
                <div class="form-group">
                  <label>Address</label>
                  <input class="form-control" name="address" value="${escapeHtml(settings.address || '')}">
                </div>
                <div class="form-group">
                  <label>Working Hours</label>
                  <input class="form-control" name="workingHours" value="${escapeHtml(settings.workingHours || '')}">
                </div>
                <div class="form-group">
                  <label>Founded Year</label>
                  <input class="form-control" name="foundedYear" value="${escapeHtml(settings.foundedYear || '')}">
                </div>
                <div class="form-group">
                  <label>Trained Candidates</label>
                  <input class="form-control" name="trainedCandidates" value="${escapeHtml(settings.trainedCandidates || '')}">
                </div>
                <div class="form-group">
                  <label>Review Count</label>
                  <input class="form-control" type="number" name="reviewCount" value="${settings.reviewCount ?? ''}">
                </div>
              </div>
              <button type="submit" class="btn btn--primary" style="margin-top:1rem;">Save Site Settings</button>
            </form>
          </div>
        </div>
      </div>

      <div class="settings-panel" id="panel-social">
        <div class="card">
          <div class="card__header"><h3 class="card__title">Social Media & Ratings</h3></div>
          <div class="card__body">
            <form id="socialForm">
              <div class="form-grid">
                <div class="form-group form-group--full">
                  <label>Facebook URL</label>
                  <input class="form-control" name="facebookUrl" value="${escapeHtml(settings.facebookUrl || '')}" placeholder="https://facebook.com/...">
                </div>
                <div class="form-group form-group--full">
                  <label>Instagram URL</label>
                  <input class="form-control" name="instagramUrl" value="${escapeHtml(settings.instagramUrl || '')}" placeholder="https://instagram.com/...">
                </div>
                <div class="form-group form-group--full">
                  <label>YouTube URL</label>
                  <input class="form-control" name="youtubeUrl" value="${escapeHtml(settings.youtubeUrl || '')}" placeholder="https://youtube.com/...">
                </div>
                <div class="form-group">
                  <label>Phone Numbers</label>
                  <input class="form-control" name="phones" value="${escapeHtml(phones)}" placeholder="9748481630, 7980108587">
                  <p class="form-hint">Comma-separated phone numbers</p>
                </div>
                <div class="form-group">
                  <label>WhatsApp Number</label>
                  <input class="form-control" name="whatsapp" value="${escapeHtml(settings.whatsapp || '')}">
                </div>
                <div class="form-group">
                  <label>Google Rating</label>
                  <input class="form-control" type="number" step="0.1" min="0" max="5" name="googleRating" value="${settings.googleRating ?? ''}">
                </div>
                <div class="form-group">
                  <label>Facebook Rating</label>
                  <input class="form-control" type="number" step="0.1" min="0" max="5" name="facebookRating" value="${settings.facebookRating ?? ''}">
                </div>
              </div>
              <button type="submit" class="btn btn--primary" style="margin-top:1rem;">Save Social Settings</button>
            </form>
          </div>
        </div>
      </div>

      <div class="settings-panel" id="panel-password">
        <div class="card">
          <div class="card__header"><h3 class="card__title">Change Password</h3></div>
          <div class="card__body">
            <form id="passwordForm" style="max-width:480px;">
              <div class="form-group">
                <label>Current Password <span class="required">*</span></label>
                <input class="form-control" type="password" name="currentPassword" required autocomplete="current-password">
              </div>
              <div class="form-group">
                <label>New Password <span class="required">*</span></label>
                <input class="form-control" type="password" name="newPassword" required minlength="8" autocomplete="new-password">
                <p class="form-hint">Minimum 8 characters</p>
              </div>
              <div class="form-group">
                <label>Confirm New Password <span class="required">*</span></label>
                <input class="form-control" type="password" name="confirmPassword" required minlength="8" autocomplete="new-password">
              </div>
              <button type="submit" class="btn btn--dark">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    `;

    bindTabs(container);
    bindForms(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function bindTabs(container) {
  container.querySelectorAll('.settings-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.settings-tab').forEach((t) => t.classList.remove('active'));
      container.querySelectorAll('.settings-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

function buildPayload(overrides) {
  const payload = { ...currentSettings, ...overrides };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  return payload;
}

function bindForms(container) {
  document.getElementById('siteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = buildPayload({
      siteName: form.siteName.value,
      tagline: form.tagline.value,
      email: form.email.value,
      address: form.address.value,
      workingHours: form.workingHours.value,
      foundedYear: form.foundedYear.value,
      trainedCandidates: form.trainedCandidates.value,
      reviewCount: Number(form.reviewCount.value || 0)
    });

    try {
      const { data } = await api('/admin/settings', { method: 'PUT', json: payload });
      currentSettings = data;
      toast('Site settings saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('socialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const phonesRaw = form.phones.value.trim();
    const phonesArr = phonesRaw ? phonesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const payload = buildPayload({
      facebookUrl: form.facebookUrl.value,
      instagramUrl: form.instagramUrl.value,
      youtubeUrl: form.youtubeUrl.value,
      phones: phonesArr,
      whatsapp: form.whatsapp.value,
      googleRating: Number(form.googleRating.value || 0),
      facebookRating: Number(form.facebookRating.value || 0)
    });

    try {
      const { data } = await api('/admin/settings', { method: 'PUT', json: payload });
      currentSettings = data;
      toast('Social settings saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.newPassword.value !== form.confirmPassword.value) {
      toast('New passwords do not match', 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
      await api('/auth/change-password', {
        method: 'POST',
        json: {
          currentPassword: form.currentPassword.value,
          newPassword: form.newPassword.value
        }
      });
      toast('Password updated successfully', 'success');
      form.reset();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
