const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html')).map(f => 'public/' + f);

// Clean, simple SVG logo - just IUM text, small, white on dark navbar
// No glass box, no separate "IMDADUL MADARIS" - just the IUM logo text
const simpleLogo = `<a href="index.html" style="text-decoration: none; display: flex; align-items: center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 36" style="height: 36px; width: auto;">
        <text x="4" y="26" font-family="Impact, Georgia, serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="4">IUM</text>
    </svg>
</a>`;

// Old premium logo regex (the one we inserted)
const oldLogoRegex = /<a href="index\.html" style="text-decoration: none; display: flex; align-items: center; background:.*?<\/svg>\s*<\/a>/gs;

let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    if (content.match(oldLogoRegex)) {
        content = content.replace(oldLogoRegex, simpleLogo);
        fs.writeFileSync(file, content);
        console.log('Updated: ' + file);
        changed++;
    }
}

// Also fix admin-panel.html - it has a different structure with SVG inside div
const adminFile = fs.readFileSync('public/admin-panel.html', 'utf8');
if (adminFile.includes('IUM</text>') && adminFile.includes('| Admin Panel')) {
    const fixed = adminFile.replace(
        /<div style="display: flex; align-items: center; gap: 12px;">[\s\S]*?<\/svg>\s*<h1 style="font-size: 1\.3rem; margin-top: 4px;">| Admin Panel<\/h1>/,
        `<div style="display: flex; align-items: center; gap: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 36" style="height: 36px; width: auto;">
                    <text x="4" y="26" font-family="Impact, Georgia, serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="4">IUM</text>
                </svg>
                <h1 style="font-size: 1.3rem; margin-top: 4px;">| Admin Panel</h1>`
    );
    if (fixed !== adminFile) {
        fs.writeFileSync('public/admin-panel.html', fixed);
        console.log('Updated: public/admin-panel.html');
        changed++;
    }
}

console.log('Total changed:', changed);
