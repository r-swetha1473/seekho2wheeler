import {
  api, toast, confirm, openModal, closeModal,
  escapeHtml, formatDate, statusBadge, setupImagePreview, imagePreview,
  prepareImageFiles, renderUploadProgress, clearUploadProgress,
  iconBtn, addBtn
} from '../admin.js';

let blogs = [];

export default async function render(container) {
  container.innerHTML = '<div class="loading"><div class="loading__spinner"></div> Loading blogs…</div>';
  await loadBlogs(container);
}

async function loadBlogs(container) {
  try {
    const { data } = await api('/admin/blogs');
    blogs = data;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-header__title">Blogs</h2>
          <p class="page-header__subtitle">Create and manage blog posts</p>
        </div>
        ${addBtn('New Post', 'addBlogBtn')}
      </div>

      <div class="card">
        <div class="card__body" style="padding:0;">
          ${blogs.length ? blogTable() : emptyState()}
        </div>
      </div>
    `;

    document.getElementById('addBlogBtn')?.addEventListener('click', () => showForm(null, container));
    bindEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__title">Error</div><p class="empty-state__text">${escapeHtml(err.message)}</p></div>`;
  }
}

function emptyState() {
  return `<div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__title">No blog posts</div><p class="empty-state__text">Write your first article to engage riders.</p></div>`;
}

function blogTable() {
  return `
    <div class="table-wrap table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Published</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${blogs.map((b) => `
            <tr data-id="${escapeHtml(b.id)}">
              <td>${b.featuredImage ? `<img class="data-table__thumb" src="${escapeHtml(b.featuredImage)}" alt="" onerror="this.src='/images/placeholder.webp'">` : '—'}</td>
              <td><strong>${escapeHtml(b.title)}</strong></td>
              <td><code style="font-size:0.8rem;">${escapeHtml(b.slug)}</code></td>
              <td>${statusBadge(b.status || 'draft')}</td>
              <td>${formatDate(b.publishedAt || b.scheduledAt || b.createdAt)}</td>
              <td>
                <div class="table-actions">
                  ${iconBtn('edit', 'Edit')}
                  ${iconBtn('delete', 'Delete')}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindEvents(container) {
  container.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const blog = blogs.find((b) => b.id === id);

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => showForm(blog, container));
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirm('Delete this blog post?');
      if (!ok) return;
      try {
        await api(`/admin/blogs/${id}`, { method: 'DELETE' });
        toast('Blog deleted', 'success');
        await loadBlogs(container);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function showForm(blog, container) {
  const isEdit = !!blog;
  const scheduledVal = blog?.scheduledAt ? blog.scheduledAt.slice(0, 16) : '';

  openModal({
    title: isEdit ? 'Edit Blog Post' : 'New Blog Post',
    size: 'lg',
    body: `
      <form id="blogForm">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label>Title <span class="required">*</span></label>
            <input class="form-control" name="title" required value="${escapeHtml(blog?.title || '')}">
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input class="form-control" name="slug" value="${escapeHtml(blog?.slug || '')}" placeholder="auto-generated from title">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" name="status" id="blogStatus">
              <option value="published"${blog?.status === 'published' || !blog ? ' selected' : ''}>Published</option>
              <option value="draft"${blog?.status === 'draft' ? ' selected' : ''}>Draft</option>
              <option value="scheduled"${blog?.status === 'scheduled' ? ' selected' : ''}>Scheduled</option>
            </select>
          </div>
          <div class="form-group" id="scheduleGroup" style="${blog?.status === 'scheduled' ? '' : 'display:none'}">
            <label>Schedule Date</label>
            <input class="form-control" type="datetime-local" name="scheduledAt" value="${scheduledVal}">
          </div>
          <div class="form-group form-group--full">
            <label>Meta Title</label>
            <input class="form-control" name="metaTitle" value="${escapeHtml(blog?.metaTitle || '')}">
          </div>
          <div class="form-group form-group--full">
            <label>Meta Description</label>
            <textarea class="form-control" name="metaDescription" rows="2">${escapeHtml(blog?.metaDescription || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Content <span class="required">*</span></label>
            <textarea class="form-control form-control--lg" name="content" required rows="10">${escapeHtml(blog?.content || '')}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label>Featured Image</label>
            <input class="form-control" type="file" name="featuredImage" accept="image/jpeg,image/png,image/webp,image/gif">
            <p class="form-hint">Max 5MB · compressed · Cloudinary URL in Sheets</p>
            <div id="blogPreview">${blog?.featuredImage ? imagePreview(blog.featuredImage) : ''}</div>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn--outline" id="cancelBlog">Cancel</button>
      <button class="btn btn--primary" id="saveBlog">${isEdit ? 'Update' : 'Publish'}</button>
    `
  });

  document.getElementById('blogStatus').addEventListener('change', (e) => {
    document.getElementById('scheduleGroup').style.display = e.target.value === 'scheduled' ? '' : 'none';
  });

  setupImagePreview(document.querySelector('#blogForm input[name="featuredImage"]'), document.getElementById('blogPreview'));
  document.getElementById('cancelBlog').addEventListener('click', closeModal);

  document.getElementById('saveBlog').addEventListener('click', async () => {
    const form = document.getElementById('blogForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    if (form.status.value !== 'scheduled') fd.delete('scheduledAt');
    else if (fd.get('scheduledAt')) {
      fd.set('scheduledAt', new Date(fd.get('scheduledAt')).toISOString());
    }

    const btn = document.getElementById('saveBlog');
    btn.disabled = true;
    const progressEl = document.getElementById('uploadProgressSlot') || document.getElementById('blogPreview');

    try {
      const fileInput = form.querySelector('[name="featuredImage"]');
      if (fileInput?.files?.[0]) {
        const [compressed] = await prepareImageFiles(fileInput.files, { maxWidth: 1200, maxHeight: 630 });
        fd.set('featuredImage', compressed, compressed.name);
      }

      const opts = {
        method: isEdit ? 'PUT' : 'POST',
        formData: fd,
        onProgress: (pct) => renderUploadProgress(progressEl, pct)
      };
      if (isEdit) {
        await api(`/admin/blogs/${blog.id}`, opts);
        toast('Blog updated', 'success');
      } else {
        await api('/admin/blogs', opts);
        toast('Blog created', 'success');
      }
      clearUploadProgress(progressEl);
      closeModal();
      await loadBlogs(container);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
