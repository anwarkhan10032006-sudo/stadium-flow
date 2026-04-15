const fs = require('fs');
const files = [
  'e:/test_project/js/core/stadiumManager.js',
  'e:/test_project/js/ui/renderer.js'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  // replace \` with `
  text = text.replace(/\\`/g, '`');
  // replace \$ with $
  text = text.replace(/\\\$/g, '$');
  fs.writeFileSync(f, text);
});
console.log('Done.');
