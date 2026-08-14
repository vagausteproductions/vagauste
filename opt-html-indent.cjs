/* re-indent <picture> blocks to nest properly under their parent */
const fs = require('fs');
const HTML_PATH = 'C:/Users/Awami/projects/vagauste-v2/index.html';
let html = fs.readFileSync(HTML_PATH, 'utf8');

let fixed = 0;
html = html.replace(
  /([ \t]*)<picture>\n  <source type="image\/avif" srcset="([^"]+)">\n  <source type="image\/webp" srcset="([^"]+)">\n<img([^\n]*)>\n<\/picture>/g,
  (m, ind, avif, webp, imgRest) => {
    fixed++;
    return (
      ind + '<picture>\n' +
      ind + '  <source type="image/avif" srcset="' + avif + '">\n' +
      ind + '  <source type="image/webp" srcset="' + webp + '">\n' +
      ind + '  <img' + imgRest + '>\n' +
      ind + '</picture>'
    );
  }
);

fs.writeFileSync(HTML_PATH, html);
console.log('re-indented', fixed, 'picture blocks');
