const fs = require('fs');

const files = fs.readdirSync('public').filter(f => f.endsWith('.js'));
const errors = [];

for (const f of files) {
    try {
        require('vm').Script(fs.readFileSync('public/' + f, 'utf8'));
    } catch(e) {
        errors.push({ file: f, error: e.message });
    }
}

if (errors.length === 0) {
    console.log('✅ All JS files: No syntax errors found!');
} else {
    errors.forEach(e => console.log('❌ ' + e.file + ' → ' + e.error));
}
