/**
 * Optional helper: convert images in a folder to WebP.
 * Usage: node scripts/optimize-images.js ./path/to/folder
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, '../public/images'));
  if (!fs.existsSync(dir)) {
    console.log('Folder not found:', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|gif)$/i.test(f));
  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(/\.(jpe?g|png|gif)$/i, '.webp'));
    await sharp(input).webp({ quality: 82 }).toFile(output);
    console.log('✓', path.basename(output));
  }
  console.log(`Done. Optimized ${files.length} image(s).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
