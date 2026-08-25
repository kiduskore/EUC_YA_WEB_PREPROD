const fs = require('fs');
let content = fs.readFileSync('views/partials/footer.ejs', 'utf-8');

// The JS dynamically renders resources into #public-resources
// I will change the rendered card to have flex-1 min-w-[300px]
const oldRender = 'class="macos-card p-8 rounded-3xl flex flex-col h-full bg-white dark:bg-studio-900 border border-zinc-200/80 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"';
const newRender = 'class="macos-card p-8 rounded-3xl flex flex-col h-full bg-white dark:bg-studio-900 border border-zinc-200/80 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex-1 basis-[300px]"';

content = content.replace(oldRender, newRender);
fs.writeFileSync('views/partials/footer.ejs', content);
