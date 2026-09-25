const fs = require('fs');
let html = fs.readFileSync('views/dashboard.ejs', 'utf-8');

const newTrainingContent = `
        <div v-show="currentView === 'training' && !loading" class="space-y-8 pb-10">
            
            <div class="glass bg-cardDark p-8 rounded-3xl border-t-4 border-t-accent shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                <div class="mb-8 border-b border-white/10 pb-6">
                    <span class="text-accent font-bold tracking-wider uppercase text-xs mb-2 block">Vision & Strategy 2026-2027</span>
                    <h2 class="text-3xl font-black text-white mb-2">Growing Together in the Word, Prayer & Fellowship</h2>
                    <p class="text-slate-300">The Core Leadership Manual</p>
                </div>
                
                <div class="space-y-12 text-slate-300 leading-relaxed text-sm md:text-base">
                    
                    <section class="space-y-4">
                        <h3 class="text-2xl font-bold text-white text-accent">Our Vision</h3>
                        <p><strong>We Are Building a Spiritual Family.</strong></p>
                        <p>Our goal is not simply to create a larger Bible study. Our goal is to create a community where people:</p>
                        <div class="bg-black/30 p-4 rounded-xl border border-white/10 font-medium text-center text-white">
                            Know God &rarr; Know His Word &rarr; Grow spiritually &rarr; Build relationships &rarr; Serve &rarr; Make disciples
                        </div>
                        <p><strong>Our foundation:</strong> Word &bull; Prayer &bull; Worship &bull; Fellowship &bull; Discipleship</p>
                    </section>

                    <section class="space-y-4">
                        <h3 class="text-2xl font-bold text-white text-accent">The 7 Core Members</h3>
                        <p>The 7 core members are the foundation of our growing community. Our responsibility is not to control everything, but to serve, protect, and strengthen the vision God has given us.</p>
                        <p><strong>Our Core Responsibilities:</strong></p>
                        <div class="bg-white/5 p-4 rounded-xl font-medium text-white mb-4">
                            Pray &rarr; Lead &rarr; Disciple &rarr; Train &rarr; Encourage &rarr; Multiply
                        </div>
                        
                        <p class="font-bold text-white mt-6 border-b border-white/10 pb-2">As a Core Team, We Commit To:</p>
                        <ul class="space-y-4 mt-4">
                            <li><strong>🙏 Pray together:</strong> We don't make decisions only through discussion—we seek God together.</li>
                            <li><strong>❤️ Stay connected:</strong> We intentionally check on one another and make sure no core member becomes disconnected.</li>
                            <li><strong>🗣️ Have honest conversations:</strong> We create a safe environment where we can respectfully disagree, address concerns, and speak truth in love.</li>
                            <li><strong>🚫 Avoid gossip:</strong> We don't talk negatively about members, leaders, or one another behind their backs.</li>
                            <li><strong>👀 Know our surroundings:</strong> We pay attention to who is struggling, who is new, where there may be conflict, and where people need support.</li>
                            <li><strong>🔒 Protect confidentiality:</strong> What is shared in the core-team meeting stays within the core team. Confidentiality means trust, not hiding things that concern safety.</li>
                            <li><strong>🤝 Build trust:</strong> We protect one another's reputation and create a culture where people feel safe to speak honestly.</li>
                            <li><strong>🍽️ Have fellowship outside Bible study:</strong> We should eat together, laugh together, pray together, and build genuine friendship.</li>
                        </ul>
                    </section>

                    <section class="space-y-4">
                        <h3 class="text-2xl font-bold text-white text-accent">Our Leadership Philosophy</h3>
                        <div class="bg-blue-900/20 border-l-4 border-l-blue-500 p-6 rounded-r-xl my-6">
                            <p class="text-xl font-bold text-white mb-2">WE DON'T BUILD FOLLOWERS OF US.</p>
                            <p class="text-xl font-bold text-white mb-4">WE BUILD FOLLOWERS OF JESUS.</p>
                            <p class="text-blue-200">Every leader should ask: <em>Am I helping this person know Jesus better?</em></p>
                        </div>
                        <p>Our leadership should be based on:</p>
                        <ul class="grid grid-cols-2 gap-4 mt-2 mb-6">
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Humility</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Servanthood</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Prayer</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Biblical character</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Accountability</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Love</li>
                            <li class="flex items-center gap-2"><svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Faithfulness</li>
                        </ul>
                        
                        <p><strong>The Role of the 7 Core Members:</strong> We walk spiritually with people. We don't just organize programs. We should learn to recognize:</p>
                        <ul class="list-disc pl-6 space-y-1 mt-2 mb-4">
                            <li>Where someone is spiritually</li>
                            <li>What gifts God has given them</li>
                            <li>What they are passionate about</li>
                            <li>Where they need growth</li>
                            <li>What God may be calling them to</li>
                        </ul>
                        <p>Our responsibility is not to decide someone's calling, but to walk with them. We don't need everyone to become a leader. We need everyone to become a disciple.</p>
                    </section>

                    <section class="space-y-4">
                        <h3 class="text-2xl font-bold text-white text-accent">How We Grow</h3>
                        <div class="bg-black/30 p-6 rounded-xl border border-white/10 space-y-6 my-6">
                            <div class="flex items-start gap-4">
                                <div class="w-8 h-8 rounded-full bg-accent text-black font-bold flex items-center justify-center shrink-0">1</div>
                                <div>
                                    <p class="font-bold text-white">Someone comes for the first time.</p>
                                    <p class="text-sm">They experience fellowship. They feel welcomed, seen, and connected.</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-8 h-8 rounded-full bg-accent text-black font-bold flex items-center justify-center shrink-0">2</div>
                                <div>
                                    <p class="font-bold text-white">They begin studying the Word.</p>
                                    <p class="text-sm">They grow in their knowledge of Jesus and Scripture.</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-8 h-8 rounded-full bg-accent text-black font-bold flex items-center justify-center shrink-0">3</div>
                                <div>
                                    <p class="font-bold text-white">They become connected to a tribe.</p>
                                    <p class="text-sm">They develop relationships and a spiritual support system.</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-8 h-8 rounded-full bg-accent text-black font-bold flex items-center justify-center shrink-0">4</div>
                                <div>
                                    <p class="font-bold text-white">They become disciples.</p>
                                    <p class="text-sm">They grow in prayer, faith, character, obedience, and their relationship with Christ.</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-4">
                                <div class="w-8 h-8 rounded-full bg-accent text-black font-bold flex items-center justify-center shrink-0">5</div>
                                <div>
                                    <p class="font-bold text-white">They serve & multiply.</p>
                                    <p class="text-sm">They discover their calling, serve according to their gifts, and help someone else grow.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section class="space-y-4">
                        <h3 class="text-2xl font-bold text-white text-accent">Our Non-Negotiables</h3>
                        <p>No matter how big we become, we will never lose:</p>
                        <ul class="grid grid-cols-2 gap-4 mt-2">
                            <li>🙏 Prayer</li>
                            <li>📖 The Word</li>
                            <li>❤️ Fellowship</li>
                            <li>🤝 Unity</li>
                            <li>🔥 Spiritual hunger</li>
                            <li>🫶 Love for one another</li>
                            <li>🙌 Worship</li>
                        </ul>
                        <p class="mt-6 text-white font-medium bg-red-900/30 p-4 rounded-lg border border-red-500/20 text-center">
                            Structure can change. Programs can change. Numbers can change. But our foundation cannot change.
                        </p>
                    </section>

                </div>
            </div>
        </div>
`;

// Replace the old training view with the new one
const startStr = `<div v-show="currentView === 'training' && !loading" class="space-y-8 pb-10">`;
const endStr = `</main>`;

const startIndex = html.indexOf(startStr);
const endIndex = html.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    html = html.substring(0, startIndex) + newTrainingContent + html.substring(endIndex);
    fs.writeFileSync('views/dashboard.ejs', html);
    console.log('Successfully patched dashboard.ejs');
} else {
    console.log('Could not find injection points in dashboard.ejs');
}
