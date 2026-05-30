const fs=require('fs'); 
['admin-askmufti.html','blog.html','book.html','donation-page.html','madrasa-list.html','madrasa.html'].forEach(f=>{
    let c=fs.readFileSync('public/'+f,'utf8'); 
    let m=c.match(/<div class="navbar">([\s\S]*?)<\/div>|<div class="navbar ">([\s\S]*?)<\/div>|<nav([\s\S]*?)<\/nav>/i); 
    if(m) console.log('==', f, '==\n', m[0].substring(0, 300));
});
