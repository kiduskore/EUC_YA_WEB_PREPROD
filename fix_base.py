with open('templates/base.html', 'r') as f:
    content = f.read()

target = """                if (res.ok) {
                    const data = await res.json();
                    const container = document.getElementById('public-resources');
                    if (data.length === 0) {
                        container.innerHTML = '<div class="text-center py-12 text-gray-900/5 dark:text-white/50 dark:text-white/50 col-span-3">More resources coming soon!</div>';
                        return;
                    }
                    
                    container.innerHTML = data.slice(0, 6).map(r => `
                        <div class="macos-card p-6 rounded-2xl flex flex-col h-full border border-gray-200 dark:border-white/10 hover:border-accent/50 transition-colors">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-white mb-2">${r.category}</span>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${r.title}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">${r.description || 'Discipleship resource'}</p>
                            <a href="${r.file_url}" target="_blank" class="text-sm font-semibold text-accent dark:text-white hover:text-gray-900 dark:text-white transition-colors flex items-center gap-1">
                                Open Resource →
                            </a>
                        </div>
                    `).join('');
                }"""

replacement = """                if (res.ok) {
                    const data = await res.json();
                    const container = document.getElementById('public-resources');
                    if (data.length === 0) {
                        container.innerHTML = '<div class="text-center py-12 text-gray-900/5 dark:text-white/50 dark:text-white/50 col-span-3">More resources coming soon!</div>';
                        return;
                    }
                    
                    const escapeHTML = (str) => {
                        if (!str) return '';
                        return str.replace(/[&<>'"]/g, 
                            tag => ({
                                '&': '&amp;',
                                '<': '&lt;',
                                '>': '&gt;',
                                "'": '&#39;',
                                '"': '&quot;'
                            }[tag])
                        );
                    };

                    // Render all resources (removed slice(0,6) to fix missing 7th item)
                    container.innerHTML = data.map(r => `
                        <div class="macos-card p-6 rounded-2xl flex flex-col h-full border border-gray-200 dark:border-white/10 hover:border-accent/50 transition-colors">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-white mb-2">${escapeHTML(r.category)}</span>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${escapeHTML(r.title)}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">${escapeHTML(r.description) || 'Discipleship resource'}</p>
                            <a href="${escapeHTML(r.file_url)}" target="_blank" class="text-sm font-semibold text-accent dark:text-white hover:text-gray-900 dark:text-white transition-colors flex items-center gap-1">
                                Open Resource →
                            </a>
                        </div>
                    `).join('');
                }"""

content = content.replace(target, replacement)
with open('templates/base.html', 'w') as f:
    f.write(content)
