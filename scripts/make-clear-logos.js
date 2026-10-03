const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function isChecker(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = (r + g + b) / 3;
  if (max >= 248 && sat < 18) return false; // keep white stroke
  if (sat >= 26) return false; // keep brand colors
  if (sat < 40 && lum >= 85 && lum <= 240) return true;
  return false;
}

async function process(srcJpg, outBase, maxSide) {
  const { data, info } = await sharp(srcJpg)
    .ensureAlpha()
    .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isChecker(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    visited[idx] = 1;
    q.push(idx);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  for (let qi = 0; qi < q.length; qi++) {
    const idx = q[qi];
    const x = idx % w;
    const y = (idx - x) / w;
    const i = idx * 4;
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!isChecker(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
        let t = 0;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1]
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
            t += 1;
            continue;
          }
          if (data[(ny * w + nx) * 4 + 3] < 8) t += 1;
        }
        if (t >= 3) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        }
      }
    }
  }
  const buf = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();
  const pngPath = `${outBase}.png`;
  const webpPath = `${outBase}.webp`;
  fs.writeFileSync(pngPath, buf);
  await sharp(buf).webp({ quality: 95, alphaQuality: 100 }).toFile(webpPath);
  const m = await sharp(pngPath).metadata();
  const chk = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  console.log(path.basename(pngPath), `${m.width}x${m.height}`, 'alpha', m.hasAlpha, 'cornerA', chk.data[3]);
}

(async () => {
  const dir = path.join('public', 'images', 'brand');
  await process(path.join(dir, 'seekho-wordmark.jpg'), path.join(dir, 'seekho-wordmark-clear'), 1280);
  await process(path.join(dir, 'seekho-master.jpg'), path.join(dir, 'seekho-master-clear'), 1024);
  await sharp(path.join(dir, 'seekho-master-clear.png'))
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(dir, 'favicon-32.png'));
  await sharp(path.join(dir, 'seekho-master-clear.png'))
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(dir, 'favicon-16.png'));
  await sharp(path.join(dir, 'seekho-master-clear.png'))
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(dir, 'apple-touch-icon.png'));
  for (const name of ['seekho-wordmark', 'seekho-master']) {
    fs.copyFileSync(path.join(dir, `${name}-clear.png`), path.join(dir, `${name}.png`));
    fs.copyFileSync(path.join(dir, `${name}-clear.webp`), path.join(dir, `${name}.webp`));
  }
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
