const fs = require('fs');
let content = fs.readFileSync('views/landing.ejs', 'utf-8');

const oldMissionLinks = `
                    <div class="flex flex-col sm:flex-row gap-4 pt-6 mt-auto border-t border-zinc-100 dark:border-white/10">
                        <a href="/serving<%= typeof langQuery !== 'undefined' ? langQuery : '' %>" class="w-full min-h-[44px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-xl hover:bg-amber-500 hover:text-white active:bg-amber-600 transition-all text-sm font-bold touch-manipulation active:scale-[0.98]"><%= typeof t !== 'undefined' ? t('nav.mission.serving') : 'Serving' %></a>
                        <a href="/generosity<%= typeof langQuery !== 'undefined' ? langQuery : '' %>" class="w-full min-h-[44px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-xl hover:bg-amber-500 hover:text-white active:bg-amber-600 transition-all text-sm font-bold touch-manipulation active:scale-[0.98]"><%= typeof t !== 'undefined' ? t('nav.mission.generosity') : 'Generosity' %></a>
                    </div>
`;
const newMissionLinks = `
                    <div class="flex flex-col space-y-3 pt-6 mt-auto border-t border-zinc-100 dark:border-white/10">
                        <a href="/serving<%= typeof langQuery !== 'undefined' ? langQuery : '' %>" class="group/link text-sm font-semibold text-zinc-900 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-2 touch-manipulation"><span class="text-amber-500/50 group-hover/link:text-amber-500 transition-colors">→</span> <%= typeof t !== 'undefined' ? t('nav.mission.serving') : 'Serving' %></a>
                        <a href="/generosity<%= typeof langQuery !== 'undefined' ? langQuery : '' %>" class="group/link text-sm font-semibold text-zinc-900 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-2 touch-manipulation"><span class="text-amber-500/50 group-hover/link:text-amber-500 transition-colors">→</span> <%= typeof t !== 'undefined' ? t('nav.mission.generosity') : 'Generosity' %></a>
                    </div>
`;
content = content.replace(oldMissionLinks.trim(), newMissionLinks.trim());
fs.writeFileSync('views/landing.ejs', content);
