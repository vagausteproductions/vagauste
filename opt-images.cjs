/* Vagauste media pipeline — AVIF + WebP twins via sharp */
const sharp = require(require('child_process').execSync('npm root -g').toString().trim() + '/sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/Awami/projects/vagauste-v2/assets/img';
const FILES = [
  'work-01.jpg', 'work-02.jpg', 'work-03.jpg', 'work-04.jpg', 'work-05.jpg', 'work-06.jpg',
  'studio.jpg', 'hero.jpg',
  'crew/crew-01.jpg', 'crew/crew-02.jpg', 'crew/crew-03.jpg', 'crew/crew-04.jpg'
];

function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }

(async () => {
  for (const f of FILES) {
    const src = path.join(BASE, f);
    const meta = await sharp(src).metadata();
    const width = meta.width;
    const outW = Math.min(width, 1600);
    const avif = f.replace(/\.jpg$/i, '.avif');
    const webp = f.replace(/\.jpg$/i, '.webp');
    const before = fs.statSync(src).size;

    const pipeline = sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true });
    await pipeline.clone().avif({ quality: 45 }).toFile(path.join(BASE, avif));
    await pipeline.clone().webp({ quality: 70 }).toFile(path.join(BASE, webp));

    const a = fs.statSync(path.join(BASE, avif)).size;
    const w = fs.statSync(path.join(BASE, webp)).size;
    console.log(
      f.padEnd(18), 'srcW=' + String(width).padStart(4), '->' + String(outW).padStart(4),
      '| jpg ' + kb(before).padStart(9),
      '| avif ' + kb(a).padStart(9) + ' (' + (before / a).toFixed(1) + 'x)',
      '| webp ' + kb(w).padStart(9) + ' (' + (before / w).toFixed(1) + 'x)'
    );
  }
  console.log('DONE');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
