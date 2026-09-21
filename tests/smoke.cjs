const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
for (const file of ['index.html','assets/style.css','assets/app.js','assets/mark.svg']) {
  if (!fs.existsSync(path.join(root,file))) throw new Error(`Missing ${file}`);
}
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const css = fs.readFileSync(path.join(root,'assets/style.css'),'utf8');
for (const marker of ['math','450','650','层叠成钥']) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker}`);
}
if (!css.includes('Cambria Math')) throw new Error('Mathematical font is not configured.');
console.log('Static structure is valid.');
