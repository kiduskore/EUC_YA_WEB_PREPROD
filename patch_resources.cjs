const fs = require('fs');
let content = fs.readFileSync('views/partials/footer.ejs', 'utf-8');

const oldRender = `
                    // Render all resources (removed slice(0,6) to fix missing 7th item)
                    container.innerHTML = data.map(r => \`
                        <div class="macos-card p-6 rounded-2xl flex flex-col h-full border border-gray-200 dark:border-white/10 hover:border-accent/50 transition-colors">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-white mb-2">\${escapeHTML(r.category)}</span>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">\${escapeHTML(r.title)}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">\${escapeHTML(r.description) || 'Discipleship resource'}</p>
                            <a href="\${escapeHTML(r.file_url)}" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-accent dark:text-white hover:text-gray-900 dark:text-white transition-colors flex items-center gap-1">
                                Open Resource →
                            </a>
                        </div>
                    \`).join('');`;

const newRender = `
                    // Render all resources (removed slice(0,6) to fix missing 7th item)
                    container.innerHTML = data.map(r => \`
                        <div class="macos-card p-8 rounded-3xl flex flex-col h-full bg-white dark:bg-studio-900 border border-zinc-200/80 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            <div class="relative z-10 flex flex-col h-full">
                                <span class="inline-block px-3 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg mb-6 w-max border border-zinc-200/50 dark:border-white/5">\${escapeHTML(r.category)}</span>
                                <h3 class="text-xl font-bold text-studio-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">\${escapeHTML(r.title)}</h3>
                                <p class="text-zinc-600 dark:text-zinc-400 text-sm mb-8 flex-1 leading-relaxed">\${escapeHTML(r.description) || 'Discipleship resource'}</p>
                                <a href="\${escapeHTML(r.file_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-bold text-studio-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-auto touch-manipulation group/link">
                                    Open Resource <span class="transform group-hover/link:translate-x-1 transition-transform">→</span>
                                </a>
                            </div>
                        </div>
                    \`).join('');`;

content = content.replace(oldRender, newRender);
fs.writeFileSync('views/partials/footer.ejs', content);
