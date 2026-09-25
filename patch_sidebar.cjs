const fs = require('fs');
let html = fs.readFileSync('views/dashboard.ejs', 'utf-8');

html = html.replace(
    '<span class="font-bold text-sm text-white block">Training Guide</span>',
    '<span class="font-bold text-sm text-white block">Vision & Strategy</span>'
);
html = html.replace(
    '<span class="text-[10px] text-slate-300 block mt-1">CUC Leadership Framework</span>',
    '<span class="text-[10px] text-slate-300 block mt-1">Core Leadership Manual</span>'
);

fs.writeFileSync('views/dashboard.ejs', html);
