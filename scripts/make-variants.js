const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Rebuild optimized WebP variants at exact aspect ratios
 */
async function main() {
  const gallery = path.join('public', 'images', 'gallery');
  const files = fs.readdirSync(gallery).filter((f) => f.endsWith('.webp')).sort();

  const specs = {
    banners: { w: 1920, h: 1080 },      // 16:9
    courses: { w: 1200, h: 900 },       // 4:3
    branches: { w: 1200, h: 900 },      // 4:3
    blogs: { w: 1200, h: 630 },         // ~1.91:1 OG
    testimonials: { w: 800, h: 800 },   // 1:1
    gallery: { w: 1200, h: 1200 },      // 1:1 square masters for grid
    thumbs: { w: 640, h: 480 }          // 4:3
  };

  // Keep original gallery sources untouched in /gallery-src if needed;
  // regenerate square gallery from current files first via temp
  const srcDir = path.join('public', 'images', '_src');
  fs.mkdirSync(srcDir, { recursive: true });

  for (const file of files) {
    const srcPath = path.join(gallery, file);
    const backup = path.join(srcDir, file);
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(srcPath, backup);
    }
  }

  const sources = fs.readdirSync(srcDir).filter((f) => f.endsWith('.webp')).sort();

  for (const [folder, size] of Object.entries(specs)) {
    const dir = path.join('public', 'images', folder);
    fs.mkdirSync(dir, { recursive: true });
    for (const file of sources) {
      await sharp(path.join(srcDir, file))
        .rotate()
        .resize(size.w, size.h, { fit: 'cover', position: 'attention' })
        .webp({ quality: 82 })
        .toFile(path.join(dir, file));
    }
    console.log(`✓ ${folder} ${size.w}x${size.h} × ${sources.length}`);
  }

  // Face-safe contain variants for testimonials (letterboxed)
  const faceDir = path.join('public', 'images', 'testimonials-safe');
  fs.mkdirSync(faceDir, { recursive: true });
  for (const file of sources) {
    await sharp(path.join(srcDir, file))
      .rotate()
      .resize(800, 800, {
        fit: 'contain',
        background: { r: 248, g: 248, b: 248, alpha: 1 }
      })
      .webp({ quality: 82 })
      .toFile(path.join(faceDir, file));
  }
  console.log('✓ testimonials-safe (contain)');

  // Placeholder
  const ph = path.join('public', 'images', 'placeholder.webp');
  await sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: { r: 34, g: 34, b: 34 }
    }
  })
    .composite([{
      input: Buffer.from(
        `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
          <rect width="1200" height="900" fill="#222"/>
          <text x="600" y="440" fill="#F5B700" font-size="48" font-family="Arial,sans-serif" text-anchor="middle" font-weight="700">SEEKHO</text>
          <text x="600" y="500" fill="#ffffff" font-size="28" font-family="Arial,sans-serif" text-anchor="middle">Two Wheeler Academy</text>
        </svg>`
      ),
      top: 0,
      left: 0
    }])
    .webp({ quality: 80 })
    .toFile(ph);
  console.log('✓ placeholder.webp');
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
