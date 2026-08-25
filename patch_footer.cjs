const fs = require('fs');
let content = fs.readFileSync('views/partials/footer.ejs', 'utf-8');

// Replace the entire footer tag
const newFooter = `
<!-- Footer -->
    <footer class="bg-white dark:bg-studio-950 pt-20 pb-12 border-t border-zinc-200 dark:border-white/10 mt-auto relative z-10 overflow-hidden">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <!-- Col 1: Brand & Mission -->
                <div class="md:col-span-2">
                    <div class="flex items-center gap-3 mb-6">
                        <span class="w-8 h-8 rounded-xl bg-studio-900 dark:bg-white text-white dark:text-studio-900 flex items-center justify-center font-black text-sm shadow-sm">
                            E
                        </span>
                        <h2 class="text-xl font-bold tracking-tight text-studio-900 dark:text-white">
                            <%= typeof t !== 'undefined' ? t('footer.title') : 'EUCMD Young Adults' %>
                        </h2>
                    </div>
                    <p class="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md text-sm leading-relaxed">
                        <%= typeof t !== 'undefined' ? t('footer.motto') : 'Raising up a generation of disciples who make disciples.' %>
                    </p>
                    <a href="https://www.instagram.com/eucmdyoungadult/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-studio-800 text-sm font-semibold text-studio-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-studio-700 transition-all touch-manipulation">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        <%= typeof t !== 'undefined' ? t('footer.followInstagram') : 'Instagram @eucmdyoungadult' %>
                    </a>
                </div>

                <!-- Col 2: Quick Links -->
                <div>
                    <h3 class="font-bold text-studio-900 dark:text-white mb-6 text-xs uppercase tracking-[0.1em]">
                        <%= typeof t !== 'undefined' ? t('footer.quickLinks') : 'Quick Links' %>
                    </h3>
                    <ul class="space-y-4 text-sm font-medium">
                        <li><a href="https://eucmaryland.org/" target="_blank" rel="noopener noreferrer" class="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><%= typeof t !== 'undefined' ? t('footer.mainChurch') : 'Emmanuel United Church of MD' %> <span class="text-[10px] opacity-50">↗</span></a></li>
                        <li><a href="/dashboard<%= typeof langQuery !== 'undefined' ? langQuery : '' %>" class="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><%= typeof t !== 'undefined' ? t('footer.leaderAccess') : 'Leader Dashboard Access' %></a></li>
                        <li><a href="/<%= typeof langQuery !== 'undefined' ? langQuery : '' %>#resources" class="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><%= typeof t !== 'undefined' ? t('resources.title') : 'Discipleship Resources' %></a></li>
                        <li><a href="/<%= typeof langQuery !== 'undefined' ? langQuery : '' %>#contact" class="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><%= typeof t !== 'undefined' ? t('contact.title') : 'Connect With Us' %></a></li>
                    </ul>
                </div>

                <!-- Col 3: Language -->
                <div>
                    <h3 class="font-bold text-studio-900 dark:text-white mb-6 text-xs uppercase tracking-[0.1em] flex items-center gap-2">
                        <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                        <%= typeof t !== 'undefined' ? t('nav.selectLanguage') : 'Language' %>
                    </h3>
                    <div class="mb-4">
                        <%- include('language-switcher', { variant: 'dropdown' }) %>
                    </div>
                    <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[200px]">
                        <%= typeof t !== 'undefined' ? t('footer.languageNotice') : 'Available in English, አማርኛ, ትግርኛ, and Afaan Oromoo.' %>
                    </p>
                </div>
            </div>

            <div class="mt-16 pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <p class="text-zinc-500 dark:text-zinc-500 text-xs font-medium">
                    &copy; <span id="year"></span> <%= typeof t !== 'undefined' ? t('footer.allRightsReserved') : 'Emmanuel United Church MD Young Adults. All rights reserved.' %>
                </p>
            </div>
        </div>
    </footer>
`;

const startIndex = content.indexOf('<footer');
const endIndex = content.indexOf('</footer>') + 9;
const oldFooter = content.substring(startIndex, endIndex);

content = content.replace(oldFooter, newFooter);
fs.writeFileSync('views/partials/footer.ejs', content);
