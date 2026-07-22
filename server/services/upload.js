/**
 * Media uploads → Cloudinary (primary).
 * Google Sheets stores only the returned HTTPS URL string — never binary.
 *
 * Env:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_FOLDER=seekho   (optional prefix)
 *
 * Local fallback to disk only when Cloudinary is not configured (dev).
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const config = require('../config');

const IS_VERCEL = Boolean(process.env.VERCEL);
const UPLOAD_ROOT = IS_VERCEL
  ? path.join('/tmp', 'seekho-uploads')
  : path.join(__dirname, '../../public/uploads');

const FOLDERS = {
  banners: 'banners',
  gallery: 'gallery',
  blogs: 'blogs',
  branches: 'branches',
  testimonials: 'testimonials',
  trainers: 'trainers',
  general: 'general'
};

const SIZE_PRESETS = {
  banners: { width: 1920, height: 1080 },
  gallery: { width: 1200, height: 1200 },
  blogs: { width: 1200, height: 630 },
  branches: { width: 1200, height: 900 },
  testimonials: { width: 800, height: 800 },
  trainers: { width: 800, height: 800 },
  general: { width: 1200, height: 900 }
};

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function getCloudinary() {
  if (!cloudinaryConfigured()) return null;
  const { v2: cloudinary } = require('cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  return cloudinary;
}

function folderPrefix(category) {
  const root = (process.env.CLOUDINARY_FOLDER || 'seekho').replace(/\/$/, '');
  const folder = FOLDERS[category] || FOLDERS.general;
  return `${root}/${folder}`;
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxSize },
  fileFilter(req, file, cb) {
    if (config.uploads.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WebP, and GIF images are allowed'));
    }
  }
});

async function optimizeBuffer(file, category) {
  const preset = SIZE_PRESETS[category] || SIZE_PRESETS.general;
  try {
    const sharp = require('sharp');
    return await sharp(file.buffer)
      .rotate()
      .resize(preset.width, preset.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (err) {
    console.warn('[upload] sharp optimize failed, using original buffer:', err.message);
    return file.buffer;
  }
}

function uploadBufferToCloudinary(buffer, category) {
  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return Promise.reject(new Error('Cloudinary is not configured'));
  }

  const preset = SIZE_PRESETS[category] || SIZE_PRESETS.general;
  const publicId = uuidv4();
  const folder = folderPrefix(category);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        overwrite: false,
        transformation: [
          {
            width: preset.width,
            height: preset.height,
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        ]
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

async function saveLocalFallback(buffer, category) {
  const folder = FOLDERS[category] || FOLDERS.general;
  const destDir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const filename = `${uuidv4()}.webp`;
  const dest = path.join(destDir, filename);
  fs.writeFileSync(dest, buffer);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Process multer file → Cloudinary URL (or local /uploads path in dev fallback).
 * Returns a string URL suitable for Google Sheets storage.
 */
async function processAndSave(file, category = 'general') {
  if (!file || !file.buffer) {
    throw new Error('No image file received');
  }
  if (file.size > config.uploads.maxSize) {
    throw new Error('Image must be 5MB or smaller');
  }

  const buffer = await optimizeBuffer(file, category);

  if (cloudinaryConfigured()) {
    const result = await uploadBufferToCloudinary(buffer, category);
    // Secure HTTPS URL only — never binary — stored in Sheets
    return result.secure_url;
  }

  if (IS_VERCEL) {
    throw new Error(
      'Cloudinary is required on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }

  console.warn('[upload] Cloudinary not configured — saving to local disk (dev only)');
  return saveLocalFallback(buffer, category);
}

/** Extract Cloudinary public_id from a delivery URL. */
function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return null;

  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // .../image/upload[/transformations]/v123/]folder/id.ext
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx < 0) return null;
    let rest = parts.slice(uploadIdx + 1);
    // drop transformation segments (contain , or start with letters like c_fill) until version or folder
    while (rest.length && !/^v\d+$/.test(rest[0]) && /[,_]/.test(rest[0])) {
      rest = rest.slice(1);
    }
    if (rest.length && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
    if (!rest.length) return null;
    const joined = rest.join('/');
    return joined.replace(/\.[a-zA-Z0-9]+$/, '');
  } catch {
    return null;
  }
}

/**
 * Delete media from Cloudinary (or local /uploads legacy path).
 * Safe no-op for static /images/ seed assets.
 */
async function deleteUpload(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return;

  // Never delete static seed assets
  if (urlPath.startsWith('/images/')) return;

  const publicId = extractCloudinaryPublicId(urlPath);
  if (publicId) {
    const cloudinary = getCloudinary();
    if (!cloudinary) {
      console.warn('[upload] Cannot delete Cloudinary asset — credentials missing:', publicId);
      return;
    }
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
      console.warn('[upload] Cloudinary delete failed:', err.message);
    }
    return;
  }

  if (urlPath.startsWith('/uploads/')) {
    const full = path.join(UPLOAD_ROOT, urlPath.replace(/^\/uploads\//, ''));
    if (fs.existsSync(full)) {
      try {
        fs.unlinkSync(full);
      } catch (err) {
        console.warn('[upload] local delete failed:', err.message);
      }
    }
  }
}

/**
 * Build a responsive Cloudinary URL with width transform.
 * Non-Cloudinary URLs are returned unchanged.
 */
function responsiveUrl(src, width) {
  if (!src || typeof src !== 'string') return src || '';
  if (!src.includes('res.cloudinary.com')) return src;
  const marker = '/upload/';
  const idx = src.indexOf(marker);
  if (idx < 0) return src;
  const insert = `f_auto,q_auto,c_limit,w_${Math.round(width)}/`;
  // Avoid double-inserting if already transformed simply — still safe to prepend
  return `${src.slice(0, idx + marker.length)}${insert}${src.slice(idx + marker.length)}`;
}

module.exports = {
  upload,
  processAndSave,
  deleteUpload,
  cloudinaryConfigured,
  extractCloudinaryPublicId,
  responsiveUrl,
  FOLDERS,
  SIZE_PRESETS,
  UPLOAD_ROOT
};
