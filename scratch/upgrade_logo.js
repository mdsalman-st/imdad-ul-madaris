const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html')).map(f => 'public/' + f);

// Old SVG that I previously inserted
const oldSvgRegex = /<a href="index\.html" style="text-decoration: none; display: flex; align-items: center;">[\s\S]*?<\/a>/g;
const adminPanelRegex = /<div style="display: flex; align-items: center; gap: 12px;">[\s\S]*?<h1/g;

const premiumLogo = `<a href="index.html" style="text-decoration: none; display: flex; align-items: center; background: rgba(255,255,255,0.08); padding: 6px 16px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 15px rgba(0,0,0,0.15); backdrop-filter: blur(10px); transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 40" style="height: 32px; width: auto;">
        <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fbbf24" />
                <stop offset="50%" stop-color="#fef08a" />
                <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <!-- IUM Text -->
        <text x="0" y="55%" font-family="Impact, system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" dominant-baseline="middle" letter-spacing="3">IUM</text>
        
        <!-- Divider -->
        <line x1="68" y1="8" x2="68" y2="32" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
        
        <!-- IMDADUL MADARIS Text -->
        <text x="82" y="55%" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="url(#goldGrad)" dominant-baseline="middle" letter-spacing="2" filter="url(#glow)">IMDADUL MADARIS</text>
    </svg>
</a>`;

let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace standard occurrences
    content = content.replace(oldSvgRegex, premiumLogo);

    // Replace admin-panel specific occurrence
    if (file.includes('admin-panel.html')) {
        content = content.replace(/<div style="display: flex; align-items: center; gap: 12px;">\s*<svg[\s\S]*?<\/svg>\s*<h1/g, `<div style="display: flex; align-items: center; gap: 12px;">\n                ${premiumLogo}\n                <h1`);
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
        changed++;
    }
}
console.log('Total files changed:', changed);
