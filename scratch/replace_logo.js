const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html')).map(f => 'public/' + f);

const newLogo = `<a href="index.html" style="text-decoration: none; display: flex; align-items: center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150" style="height: 45px; width: auto; max-width: 150px;">
        <text x="50%" y="55%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="80" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="8">IUM</text>
        <text x="50%" y="85%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#fbbf24" text-anchor="middle" dominant-baseline="middle" letter-spacing="5">IMDADUL MADARIS</text>
    </svg>
</a>`;

let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Standard
    content = content.replace(/<a href="index\.html" class="logo">🕌 Imdad ul Madaris<\/a>/g, newLogo);
    
    // 2. index.html
    content = content.replace(/<div class="logo">IUM<\/div>/g, newLogo);

    // 3. madrasa-dashboard.html
    content = content.replace(/<a href="index\.html" class="text-white font-bold text-lg">Imdad ul Madaris<\/a>/g, newLogo);

    // 4. admin-panel.html
    // admin-panel uses: <h1>🛡️ Imdad ul Madaris | Admin Panel</h1>
    // Let's modify admin-panel manually since it's slightly different.
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
        changed++;
    }
}
console.log('Total files changed:', changed);
