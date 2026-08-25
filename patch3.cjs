const fs = require('fs');
let content = fs.readFileSync('views/dashboard.ejs', 'utf-8');

// Replace dark opaque styles with transparent/glass ones
content = content.replace(/bg-slate-800\/50/g, 'bg-white/5');
content = content.replace(/bg-slate-800\/30/g, 'bg-white/5');
content = content.replace(/bg-slate-800/g, 'bg-white/10');
content = content.replace(/hover:bg-slate-800/g, 'hover:bg-white/20');
content = content.replace(/text-slate-400/g, 'text-slate-300');

fs.writeFileSync('views/dashboard.ejs', content);
console.log('Patched inline slate colors');
