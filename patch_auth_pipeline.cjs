const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

serverContent = serverContent.replace("app.post('/api/pipeline', requireAuth,", "app.post('/api/pipeline',");

fs.writeFileSync(serverTsPath, serverContent);
console.log("Unprotected POST /api/pipeline");
