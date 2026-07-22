const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
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

Object.values(FOLDERS).forEach((folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

const SIZE_PRESETS = {
  banners: { width: 1920, height: 1080 },
  gallery: { width: 1200, height: 1200 },
  blogs: { width: 1200, height: 630 },
  branches: { width: 1200, height: 900 },
  testimonials: { width: 800, height: 800 },
  trainers: { width: 800, height: 800 },
  general: { width: 1200, height: 900 }
};

async function processAndSave(file, category = 'general') {
  const folder = FOLDERS[category] || FOLDERS.general;
  const preset = SIZE_PRESETS[category] || SIZE_PRESETS.general;
  const filename = `${uuidv4()}.webp`;
  const destDir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, filename);

  try {
    const sharp = require('sharp');
    await sharp(file.buffer)
      .resize(preset.width, preset.height, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toFile(dest);
  } catch (err) {
    console.warn('[upload] sharp failed, saving raw buffer:', err.message);
    fs.writeFileSync(dest, file.buffer);
  }

  return `/uploads/${folder}/${filename}`;
}

async function deleteUpload(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  const full = path.join(UPLOAD_ROOT, urlPath.replace(/^\/uploads\//, ''));
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

module.exports = {
  upload,
  processAndSave,
  deleteUpload,
  FOLDERS,
  SIZE_PRESETS,
  UPLOAD_ROOT
};
