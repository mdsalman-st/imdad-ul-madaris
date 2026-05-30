const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const faviconTag = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕌</text></svg>">\n</head>`;

let updated = 0;
files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('rel="icon"')) {
    content = content.replace('</head>', faviconTag);
    fs.writeFileSync(filePath, content);
    updated++;
  }
});

console.log(`Added favicon to ${updated} files.`);
