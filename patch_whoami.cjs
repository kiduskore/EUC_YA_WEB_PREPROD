const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'views/dashboard.ejs');
let content = fs.readFileSync(file, 'utf8');

const whoAmICode = `
            <div class="flex items-center gap-4">
                <div class="hidden md:flex flex-col items-end mr-2">
                    <span class="text-sm font-bold text-white">{{ userEmail }}</span>
                    <span class="text-[10px] uppercase tracking-wider font-semibold text-blue-400">{{ userRole === 'admin' ? 'Site Manager' : 'Basic Manager' }}</span>
                </div>
                <div class="relative">
`;

content = content.replace('<div class="flex items-center gap-4">\n                <div class="relative">', whoAmICode);

fs.writeFileSync(file, content);
console.log("Who am I patched");
