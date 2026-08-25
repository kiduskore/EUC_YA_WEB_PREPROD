const fs = require('fs');
const glob = require('glob'); // Not available? I'll just use fs.readdirSync

const files = fs.readdirSync('./views').filter(f => f.endsWith('.ejs'));

files.forEach(file => {
    let content = fs.readFileSync(`./views/${file}`, 'utf-8');
    
    // 1. Replace the entire <section id="join"> ... </section> block
    const joinRegex = /<!-- Join Us Section -->[\s\S]*?(?=<%- include\('partials\/footer'\) %>)/;
    if (joinRegex.test(content)) {
        content = content.replace(joinRegex, "<!-- Join Us Section -->\n    <%- include('partials/join-section') %>\n");
    }

    // 2. Add pt-20 to the <header> tag in subpages
    // Currently: <header class="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
    if (content.includes('<header class="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">')) {
        content = content.replace(
            '<header class="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">',
            '<header class="relative w-full h-[50vh] min-h-[400px] pt-20 flex items-center justify-center overflow-hidden">'
        );
    }
    
    // Some might have it without exact match. Let's just do a regex for that header specifically.
    const headerRegex = /<header class="relative w-full h-\[50vh\] min-h-\[400px\]([^>]*? flex items-center justify-center overflow-hidden)">/;
    if (headerRegex.test(content)) {
       content = content.replace(headerRegex, '<header class="relative w-full h-[50vh] min-h-[400px] pt-20$1">');
    }

    fs.writeFileSync(`./views/${file}`, content);
    console.log(`Updated ${file}`);
});
