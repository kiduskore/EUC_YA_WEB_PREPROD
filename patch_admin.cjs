const fs = require('fs');
const path = require('path');
const storePath = path.join(__dirname, 'src/data/store.ts');
let content = fs.readFileSync(storePath, 'utf8');

const upgradeLogic = `
        const keku = rawStore.users.find(u => u.email.toLowerCase() === 'keku121@gmail.com');
        if (keku) {
            keku.role_id = 1; // Force site admin
        }
`;

content = content.replace("if (!rawStore.users.some(u => u.email.toLowerCase() === 'keku121@gmail.com')) {", upgradeLogic + "\n        if (!rawStore.users.some(u => u.email.toLowerCase() === 'keku121@gmail.com')) {");

fs.writeFileSync(storePath, content);
console.log("Admin role forced");
