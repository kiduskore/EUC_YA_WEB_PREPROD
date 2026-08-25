const fs = require('fs');
let content = fs.readFileSync('views/dashboard.ejs', 'utf-8');

// Add backdrop-blur to sidebar
content = content.replace(
    'class="w-72 bg-cardDark md:bg-transparent',
    'class="w-72 bg-cardDark md:bg-transparent backdrop-blur-2xl'
);

// Make current active item use glass styles
content = content.replace(
    /bg-slate-800 text-white text-white shadow-sm border border-slate-700/g,
    'glass shadow-sm border border-white/20 text-white'
);

content = content.replace(
    /hover:bg-slate-800\/50/g,
    'hover:bg-white/10'
);

content = content.replace(
    /bg-brandDark\/50/g,
    'bg-white/5'
);

content = content.replace(
    /border-slate-800/g,
    'border-white/10'
);

content = content.replace(
    /border-slate-700/g,
    'border-white/20'
);

content = content.replace(
    /bg-slate-700/g,
    'bg-white/20'
);

fs.writeFileSync('views/dashboard.ejs', content);
console.log('Patched sidebar and borders');
