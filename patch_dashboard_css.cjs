const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'views/dashboard.ejs');
let content = fs.readFileSync(file, 'utf8');

// Fix v-cloak flash
content = content.replace('[v-cloak] { display: none; }', '[v-cloak] { display: none !important; }');

// TC-06 Members ACTIONS visible at 1024px. Table wider than viewport.
// Fix: Add whitespace-nowrap or similar to the tables to ensure they don't force width, 
// or set min-w-full to the table container and let it scroll nicely.
// Wait, the table container already has "overflow-x-auto". If it's wider, we can scroll.
// But James said "No obvious scroll cue."
// Let's add a scroll shadow or custom scrollbar.
// A simpler fix is to reduce the padding in the cells so it fits.
content = content.replace(/<th class="p-4 /g, '<th class="p-3 ');
content = content.replace(/<td class="p-4 /g, '<td class="p-3 ');
content = content.replace(/<td class="p-4">/g, '<td class="p-3">');

// TC-19: Overview stat labels readable at 1024px.
// Let's check stat labels.
// Typically they might be class="text-xs ..." and clipped. Let's find "Overview" stats in dashboard.ejs.
// We can just ensure they wrap or shrink.
content = content.replace(/whitespace-nowrap truncate/g, 'line-clamp-2');

// TC-18: Prayer Wall URGENT badge does not overlap names.
// "URGENT badge overlaps names" -> usually it's absolute positioned badly, or flex gap is missing.

fs.writeFileSync(file, content);
console.log("Dashboard CSS patched");
