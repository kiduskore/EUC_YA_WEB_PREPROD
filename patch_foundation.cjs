const fs = require('fs');
let content = fs.readFileSync('views/landing.ejs', 'utf-8');

content = content.replace(
    'class="macos-card p-10 flex flex-col justify-between group gsap-stagger-item dark:bg-studio-800 border-zinc-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden"',
    'class="macos-card p-8 flex flex-col justify-between group gsap-stagger-item dark:bg-studio-800 border-zinc-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden"'
);

content = content.replace(
    '<div class="flex items-center justify-between mb-8">\n                            <h3 class="text-3xl font-black tracking-tight text-studio-900 dark:text-white"><%= typeof t !== \'undefined\' ? t(\'pillars.foundation.title\') : \'Foundation\' %></h3>\n                            <span class="text-4xl font-black text-zinc-100 dark:text-zinc-800/80 group-hover:text-blue-500/20 transition-colors">01</span>\n                        </div>\n                        <p class="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-md leading-relaxed">',
    '<div class="flex items-center justify-between mb-6">\n                            <h3 class="text-2xl font-bold tracking-tight text-studio-900 dark:text-white"><%= typeof t !== \'undefined\' ? t(\'pillars.foundation.title\') : \'Foundation\' %></h3>\n                            <span class="text-3xl font-black text-zinc-100 dark:text-zinc-800/80 group-hover:text-blue-500/20 transition-colors">01</span>\n                        </div>\n                        <p class="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">'
);

content = content.replace(
    '<div class="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-100 dark:border-white/10 pt-8 mt-auto">',
    '<div class="relative z-10 flex flex-col space-y-3 border-t border-zinc-100 dark:border-white/10 pt-6 mt-auto">'
);

content = content.replace(
    '<a href="/salvation<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-bold text-studio-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 touch-manipulation">\n                            <%= typeof t !== \'undefined\' ? t(\'nav.foundation.salvation\') : \'Salvation\' %> <span class="opacity-0 group-hover/link:opacity-100 transform -translate-x-2 group-hover/link:translate-x-0 transition-all">→</span>\n                        </a>',
    '<a href="/salvation<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-semibold text-zinc-900 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-2 touch-manipulation"><span class="text-blue-500/50 group-hover/link:text-blue-500 transition-colors">→</span> <%= typeof t !== \'undefined\' ? t(\'nav.foundation.salvation\') : \'Salvation\' %></a>'
);
content = content.replace(
    '<a href="/water-baptism<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-bold text-studio-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 touch-manipulation">\n                            <%= typeof t !== \'undefined\' ? t(\'nav.foundation.waterBaptism\') : \'Water Baptism\' %> <span class="opacity-0 group-hover/link:opacity-100 transform -translate-x-2 group-hover/link:translate-x-0 transition-all">→</span>\n                        </a>',
    '<a href="/water-baptism<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-semibold text-zinc-900 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-2 touch-manipulation"><span class="text-blue-500/50 group-hover/link:text-blue-500 transition-colors">→</span> <%= typeof t !== \'undefined\' ? t(\'nav.foundation.waterBaptism\') : \'Water Baptism\' %></a>'
);
content = content.replace(
    '<a href="/kingdom<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-bold text-studio-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 touch-manipulation">\n                            <%= typeof t !== \'undefined\' ? t(\'nav.foundation.kingdom\') : \'Kingdom\' %> <span class="opacity-0 group-hover/link:opacity-100 transform -translate-x-2 group-hover/link:translate-x-0 transition-all">→</span>\n                        </a>',
    '<a href="/kingdom<%= typeof langQuery !== \'undefined\' ? langQuery : \'\' %>" class="group/link text-sm font-semibold text-zinc-900 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-2 touch-manipulation"><span class="text-blue-500/50 group-hover/link:text-blue-500 transition-colors">→</span> <%= typeof t !== \'undefined\' ? t(\'nav.foundation.kingdom\') : \'Kingdom\' %></a>'
);

// Also remove md:col-span-2 lg:col-span-1 from Mission
content = content.replace(
    'class="macos-card p-8 flex flex-col justify-between group gsap-stagger-item dark:bg-studio-800 border-zinc-200 dark:border-white/5 hover:border-amber-500/30 hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1"',
    'class="macos-card p-8 flex flex-col justify-between group gsap-stagger-item dark:bg-studio-800 border-zinc-200 dark:border-white/5 hover:border-amber-500/30 hover:shadow-xl transition-all duration-300"'
);

fs.writeFileSync('views/landing.ejs', content);
