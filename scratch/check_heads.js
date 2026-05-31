const fs = require('fs');
const c = fs.readFileSync('public/book.html', 'utf8');
const m1 = c.match(/<head/gi);
const m2 = c.match(/<\/head>/gi);
console.log('book.html <head> count:', m1 ? m1.length : 0);
console.log('book.html </head> count:', m2 ? m2.length : 0);

const c2 = fs.readFileSync('public/madrasa.html', 'utf8');
const m3 = c2.match(/<head/gi);
const m4 = c2.match(/<\/head>/gi);
console.log('madrasa.html <head> count:', m3 ? m3.length : 0);
console.log('madrasa.html </head> count:', m4 ? m4.length : 0);
