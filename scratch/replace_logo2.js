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

    // Pattern for `<a class="logo" href="index.html"><div class="logo-icon">IUM</div><div class="logo-text">Imdad ul Madaris</div></a>`
    content = content.replace(/<a href="index\.html" class="logo">\s*<div class="logo-icon">IUM<\/div>\s*<div class="logo-text">Imdad ul Madaris<\/div>\s*<\/a>/g, newLogo);

    // Pattern for `<div class="logo-icon">IUM</div>` (when not wrapped in the a above)
    content = content.replace(/<div class="logo-icon">IUM<\/div>/g, newLogo);

    // Pattern for `<div class="nav-logo">IUM</div>`
    content = content.replace(/<div class="nav-logo">IUM<\/div>/g, newLogo);

    // Pattern for `auth.html` heading:
    content = content.replace(/<h2 class="text-xl font-bold text-gray-900 tracking-tight">Imdad ul Madaris<\/h2>/g, `<h2 class="text-xl font-bold text-gray-900 tracking-tight" style="display:flex; justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150" style="height: 45px; width: auto;">
        <text x="50%" y="55%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="80" fill="#0a5c2e" text-anchor="middle" dominant-baseline="middle" letter-spacing="8">IUM</text>
        <text x="50%" y="85%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#64748b" text-anchor="middle" dominant-baseline="middle" letter-spacing="5">IMDADUL MADARIS</text>
    </svg></h2>`);

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
        changed++;
    }
}
console.log('Total files changed:', changed);
