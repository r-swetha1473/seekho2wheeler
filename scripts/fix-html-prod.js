const fs = require('fs');
const path = require('path');

function walk(d, acc = []) {
  if (!fs.existsSync(d)) return acc;
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = [...walk('public'), ...walk('admin')];
let n = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (html.includes('/js/app.js') && !html.includes('/js/config.js')) {
    html = html.replace(
      '<script src="/js/app.js"></script>',
      '<script src="/js/config.js"></script>\n  <script src="/js/app.js"></script>'
    );
    changed = true;
  }
  if (html.includes('http://localhost:3000')) {
    html = html.replace(/http:\/\/localhost:3000/g, 'https://seekho2wheeler.vercel.app');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, html);
    n += 1;
    console.log('updated', file);
  }
}
console.log('done', n);
