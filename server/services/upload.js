const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const UPLOAD_ROOT = path.join(__dirname, '../../public/uploads');

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
  const dest = path.join(UPLOAD_ROOT, folder, filename);

  await sharp(file.buffer)
    .resize(preset.width, preset.height, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true
    })
    .webp({ quality: 82 })
    .toFile(dest);

  return `/uploads/${folder}/${filename}`;
}

async function deleteUpload(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  const full = path.join(__dirname, '../../public', urlPath);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}

module.exports = {
  upload,
  processAndSave,
  deleteUpload,
  FOLDERS,
  SIZE_PRESETS
};
