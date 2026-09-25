const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'views/partials/footer.ejs');
let content = fs.readFileSync(file, 'utf8');

// Rewrite innerHTML loop to createElement
const newFetchResources = `
        async function fetchPublicResources() {
            try {
                const res = await fetch('/api/resources');
                if (res.ok) {
                    const data = await res.json();
                    const container = document.getElementById('public-resources');
                    if (!container) return;
                    
                    container.innerHTML = ''; // clear old loading state
                    
                    if (data.length === 0) {
                        const empty = document.createElement('div');
                        empty.className = 'text-center py-12 text-gray-900/50 dark:text-white/60 col-span-3';
                        empty.textContent = 'More resources coming soon!';
                        container.appendChild(empty);
                        return;
                    }

                    data.forEach(r => {
                        const card = document.createElement('div');
                        card.className = 'macos-card p-8 rounded-3xl flex flex-col h-full bg-white dark:bg-studio-900 border border-zinc-200/80 dark:border-white/5 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex-1 basis-[300px]';
                        
                        const bg = document.createElement('div');
                        bg.className = 'absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none';
                        card.appendChild(bg);

                        const inner = document.createElement('div');
                        inner.className = 'relative z-10 flex flex-col h-full';

                        const cat = document.createElement('span');
                        cat.className = 'inline-block px-3 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg mb-6 w-max border border-zinc-200/50 dark:border-white/5';
                        cat.textContent = r.category;
                        inner.appendChild(cat);

                        const title = document.createElement('h3');
                        title.className = 'text-xl font-bold text-studio-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors';
                        title.textContent = r.title;
                        inner.appendChild(title);

                        const desc = document.createElement('p');
                        desc.className = 'text-zinc-600 dark:text-zinc-400 text-sm mb-8 flex-1 leading-relaxed';
                        desc.textContent = r.description || 'Discipleship resource';
                        inner.appendChild(desc);

                        const link = document.createElement('a');
                        link.href = r.file_url;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.className = 'inline-flex items-center gap-2 text-sm font-bold text-studio-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-auto touch-manipulation group/link';
                        
                        const linkText = document.createTextNode('Open Resource ');
                        const arrow = document.createElement('span');
                        arrow.className = 'transform group-hover/link:translate-x-1 transition-transform';
                        arrow.textContent = '→';
                        
                        link.appendChild(linkText);
                        link.appendChild(arrow);
                        inner.appendChild(link);

                        card.appendChild(inner);
                        container.appendChild(card);
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
`;

content = content.replace(/async function fetchPublicResources\(\) \{[\s\S]*?document\.addEventListener\('DOMContentLoaded', fetchPublicResources\);/, newFetchResources.trim() + "\n\n        document.addEventListener('DOMContentLoaded', fetchPublicResources);");

// Rewrite form submit logic for Prayer
const newSubmit = `
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('contact-submit');
                const successMsg = document.getElementById('contact-success');
                const originalText = btn.textContent;
                btn.textContent = 'Sending...';
                btn.disabled = true;

                const name = document.getElementById('contact-name').value;
                const email = document.getElementById('contact-email').value;
                const phone = document.getElementById('contact-phone').value;
                const notes = document.getElementById('contact-notes').value;
                const interestEl = document.getElementById('contact-interest');
                const interest = interestEl ? interestEl.value : '';

                try {
                    if (interest === 'prayer') {
                        await fetch('/api/prayer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                requestor_name: name,
                                content: notes || 'Prayer request from website'
                            })
                        });
                    } else {
                        await fetch('/api/pipeline', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, email, phone, notes, interest })
                        });
                    }
                    
                    contactForm.reset();
                    successMsg.classList.remove('hidden');
                    setTimeout(() => successMsg.classList.add('hidden'), 5000);
                } catch (err) {
                    console.error("Failed to submit form:", err);
                    alert("Something went wrong. Please try again.");
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }
`;

content = content.replace(/const contactForm = document\.getElementById\('contact-form'\);[\s\S]*?\}\);[\s\n]*\}/, newSubmit.trim());

fs.writeFileSync(file, content);
console.log("Footer fixed");
