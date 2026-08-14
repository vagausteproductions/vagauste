/* Vagauste media pipeline — index.html: hero <video> sources + <picture> wrapping */
const fs = require('fs');

const HTML_PATH = 'C:/Users/Awami/projects/vagauste-v2/index.html';

const TWINS = new Set([
  'work-01', 'work-02', 'work-03', 'work-04', 'work-05', 'work-06',
  'studio', 'hero',
  'crew/crew-01', 'crew/crew-02', 'crew/crew-03', 'crew/crew-04'
]);

let html = fs.readFileSync(HTML_PATH, 'utf8');

/* ---- (1) hero <video>: preload=metadata + 3 <source> children (AV1, HEVC, h264) ---- */
const oldVideo = /<video class="hero__film" src="assets\/img\/hero-mist-graded\.mp4" autoplay muted loop playsinline preload="auto" poster="assets\/img\/hero\.jpg" aria-hidden="true"><\/video>/;
const newVideo =
  '<video class="hero__film" autoplay muted loop playsinline preload="metadata" poster="assets/img/hero.jpg" aria-hidden="true">\n' +
  '      <source src="assets/img/hero-mist-av1.mp4" type=\'video/mp4; codecs="av01.0.08M.08"\'>\n' +
  '      <source src="assets/img/hero-mist-hevc.mp4" type=\'video/mp4; codecs="hvc1.1.6.L120.B0"\'>\n' +
  '      <source src="assets/img/hero-mist-graded.mp4" type="video/mp4">\n' +
  '    </video>';
if (!oldVideo.test(html)) throw new Error('hero video tag pattern not found');
html = html.replace(oldVideo, newVideo);

/* ---- (2) wrap every <img> with an AVIF/WebP twin in <picture> ---- */
let wrapped = 0;
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const m = tag.match(/src="([^"]+)"/);
  if (!m) return tag;
  const mm = m[1].match(/^assets\/img\/(.+?)\.jpg$/i);
  if (!mm || !TWINS.has(mm[1])) return tag;
  const indent = (tag.match(/^\s*/) || [''])[0];
  const key = mm[1];
  wrapped++;
  return (
    indent + '<picture>\n' +
    indent + '  <source type="image/avif" srcset="assets/img/' + key + '.avif">\n' +
    indent + '  <source type="image/webp" srcset="assets/img/' + key + '.webp">\n' +
    tag + '\n' +
    indent + '</picture>'
  );
});

fs.writeFileSync(HTML_PATH, html);
console.log('hero video tag replaced, <picture> wrapped:', wrapped, 'img tags');
