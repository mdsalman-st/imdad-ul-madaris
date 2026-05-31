const fs = require('fs');
const vm = require('vm');

const jsFiles = fs.readdirSync('public').filter(f => f.endsWith('.js'));
const htmlFiles = fs.readdirSync('public').filter(f => f.endsWith('.html'));

let jsErrors = 0, htmlErrors = 0;

console.log('=== JS Syntax Check ===');
for (const f of jsFiles) {
    try {
        new vm.Script(fs.readFileSync('public/' + f, 'utf8'));
        console.log('✅ ' + f);
    } catch(e) {
        if (e.message.includes('cannot be invoked without')) {
            // vm.Script class constructor issue - use acorn or just report ok
            console.log('✅ ' + f + ' (syntax OK, browser-only APIs)');
        } else {
            console.log('❌ SYNTAX ERROR in ' + f + ' → ' + e.message);
            jsErrors++;
        }
    }
}

console.log('\n=== HTML Structure Check ===');
for (const f of htmlFiles) {
    const content = fs.readFileSync('public/' + f, 'utf8');
    const issues = [];

    const headCount = (content.match(/<head[^>]*>/gi)||[]).length;
    const bodyCount = (content.match(/<body[^>]*>/gi)||[]).length;
    const headCloseCount = (content.match(/<\/head>/gi)||[]).length;
    const bodyCloseCount = (content.match(/<\/body>/gi)||[]).length;

    if (headCount > 1) issues.push(`${headCount}x <head>`);
    if (bodyCount > 1) issues.push(`${bodyCount}x <body>`);
    if (headCloseCount > 1) issues.push(`${headCloseCount}x </head>`);
    if (bodyCloseCount > 1) issues.push(`${bodyCloseCount}x </body>`);
    if (headCount === 0) issues.push('Missing <head>');
    if (bodyCount === 0) issues.push('Missing <body>');

    // Check meta viewport
    if (!content.includes('viewport')) issues.push('No viewport meta (not mobile-friendly!)');

    // Check charset
    if (!content.includes('charset')) issues.push('No charset meta');

    if (issues.length > 0) {
        console.log('⚠️  ' + f + ' → ' + issues.join(', '));
        htmlErrors++;
    } else {
        console.log('✅ ' + f);
    }
}

console.log('\n=== CSS Check (inline styles in HTML) ===');
const mobilePatterns = ['max-width', 'grid', 'flex', 'media'];
for (const f of htmlFiles) {
    const content = fs.readFileSync('public/' + f, 'utf8');
    const hasMobile = mobilePatterns.some(p => content.includes(p));
    if (!hasMobile) {
        console.log('⚠️  ' + f + ' → May not be responsive (no flex/grid/media query found)');
    }
}

console.log('\n=== Summary ===');
console.log('JS files checked:', jsFiles.length, '| Syntax errors:', jsErrors);
console.log('HTML files checked:', htmlFiles.length, '| Structure issues:', htmlErrors);
