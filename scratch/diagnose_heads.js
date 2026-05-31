const fs = require('fs');

// Fix: In both book.html and madrasa.html, there is a stray <link rel="icon"> tag
// which sits OUTSIDE the </style> closing tag but BEFORE </head>.
// This causes the SVG text inside the href to be parsed as a new <head> tag.
// Fix: Simply remove the \n between </style> and the <link> tag (but keep the link intact),
// or more accurately: move the <link rel="icon"> inside the </style> block area.

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    
    // The issue: There's a <link rel="icon" ...> tag after </style> that has
    // an SVG emoji href containing <text> which the HTML parser sees as a new <head>
    // We just need to ensure the link tag is properly inside the <head> block.
    // The actual fix: the link tag is already before </head>, but the SVG inside
    // the href attribute contains '<head' text in 'font-size="90">' - 
    // Actually the scanner counts <head> including those inside href attributes.
    
    // Let's verify by checking if <head> appears only in attributes
    const headMatches = [];
    let i = 0;
    while (i < content.length) {
        const idx = content.indexOf('<head', i);
        if (idx === -1) break;
        // Check if this is inside an attribute (preceded by a quote character nearby)
        const before = content.substring(Math.max(0, idx - 100), idx);
        const inAttr = before.includes('href="') && !before.includes('"', before.lastIndexOf('href="') + 6);
        headMatches.push({ idx, inAttr, snippet: content.substring(idx, idx + 30) });
        i = idx + 5;
    }
    
    console.log('\n' + path + ':');
    headMatches.forEach((m, i) => console.log(`  <head> #${i+1} at pos ${m.idx}: "${m.snippet.substring(0,30)}" | inAttr: ${m.inAttr}`));
}

fixFile('public/book.html');
fixFile('public/madrasa.html');
