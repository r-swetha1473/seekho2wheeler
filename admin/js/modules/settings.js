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
                  <label class="form-check" style="margin-top:0.45rem;"><input type="checkbox" name="tagline_bold" ${settings.tagline_bold ? 'checked' : ''}> Bold tagline</label>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input class="form-control" type="email" name="email" value="${escapeHtml(settings.email || '')}">
                </div>
                <div class="form-group">
                  <label>Address</label>
                  <input class="form-control" name="address" value="${escapeHtml(settings.address || '')}">
                </div>
                <div class="form-group form-group--full">
                  <label>Google Business Profile URL</label>
                  <input class="form-control" name="gmb_url" type="url" value="${escapeHtml(settings.gmb_url || '')}" placeholder="https://…">
                  <p class="form-hint">Leave empty until the client provides the official GMB / Google Maps listing URL. Do not guess.</p>
                </div>
                <div class="form-group">
                  <label>Latitude</label>
                  <input class="form-control" name="latitude" type="number" step="any" min="-90" max="90" value="${escapeHtml(settings.latitude === 0 || settings.latitude ? String(settings.latitude) : '')}" placeholder="—">
                </div>
                <div class="form-group">
                  <label>Longitude</label>
                  <input class="form-control" name="longitude" type="number" step="any" min="-180" max="180" value="${escapeHtml(settings.longitude === 0 || settings.longitude ? String(settings.longitude) : '')}" placeholder="—">
                  <p class="form-hint">Leave both coordinates empty until the client provides them. Range: lat −90…90, lng −180…180.</p>
                </div>
                <div class="form-group form-group--full">
                  <label>Map embed URL (optional)</label>
                  <input class="form-control" name="map_embed_url" type="url" value="${escapeHtml(settings.map_embed_url || '')}" placeholder="https://www.google.com/maps/embed?…">
                  <p class="form-hint">Paste the Google Maps iframe <strong>src</strong> only (https). Optional if latitude and longitude are set.</p>
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
                <div class="form-group">
                  <label>Header button text</label>
                  <input class="form-control" name="header_cta_text" value="${escapeHtml(settings.header_cta_text || '')}">
                </div>
                <div class="form-group">
                  <label>Header button link</label>
                  <input class="form-control" name="header_cta_link" value="${escapeHtml(settings.header_cta_link || '')}" placeholder="/pages/booking.html">
                </div>
                <div class="form-group form-group--full">
                  <label>Logo second line</label>
                  <input class="form-control" name="logo_subline" value="${escapeHtml(settings.logo_subline || '')}">
                </div>
                <div class="form-group form-group--full">
                  <label>Footer CTA heading</label>
                  <input class="form-control" name="footer_cta_title" value="${escapeHtml(settings.footer_cta_title || '')}">
                </div>
                <div class="form-group form-group--full">
                  <label>Footer CTA text</label>
                  <input class="form-control" name="footer_cta_text" value="${escapeHtml(settings.footer_cta_text || '')}">
                </div>
                <div class="form-group">
                  <label>Footer CTA button</label>
                  <input class="form-control" name="footer_cta_button" value="${escapeHtml(settings.footer_cta_button || '')}">
                </div>
                <div class="form-group form-group--full">
                  <label>Copyright line (after year)</label>
                  <input class="form-control" name="copyright_text" value="${escapeHtml(settings.copyright_text || '')}">
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
      tagline_bold: form.querySelector('[name="tagline_bold"]').checked,
      email: form.email.value,
      address: form.address.value,
      gmb_url: form.gmb_url.value.trim(),
      latitude: form.latitude.value.trim(),
      longitude: form.longitude.value.trim(),
      map_embed_url: form.map_embed_url.value.trim(),
      workingHours: form.workingHours.value,
      foundedYear: form.foundedYear.value,
      trainedCandidates: form.trainedCandidates.value,
      reviewCount: Number(form.reviewCount.value || 0),
      header_cta_text: form.header_cta_text.value.trim(),
      header_cta_link: form.header_cta_link.value.trim(),
      logo_subline: form.logo_subline.value.trim(),
      footer_cta_title: form.footer_cta_title.value.trim(),
      footer_cta_text: form.footer_cta_text.value.trim(),
      footer_cta_button: form.footer_cta_button.value.trim(),
      copyright_text: form.copyright_text.value.trim()
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
