const fs = require('fs');
let content = fs.readFileSync('views/landing.ejs', 'utf-8');

content = content.replace(
    'id="public-resources" class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 gsap-stagger-container"',
    'id="public-resources" class="flex flex-wrap gap-6 lg:gap-8 gsap-stagger-container"'
);

fs.writeFileSync('views/landing.ejs', content);
