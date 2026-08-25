const fs = require('fs');
const path = require('path');
const viewsDir = path.join(__dirname, 'views');
const enTsPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.ts');

const missingKeys = {};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /t\('([^']+)'/gs;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const key = match[1];
                missingKeys[key] = true;
            }
        }
    }
}

processDir(viewsDir);

let enTsContent = fs.readFileSync(enTsPath, 'utf8');
let missingCount = 0;
for (const key of Object.keys(missingKeys)) {
    if (!enTsContent.includes(`'${key}':`)) {
        console.log(`Missing in en.ts: ${key}`);
        missingCount++;
    }
}
console.log(`Total missing: ${missingCount}`);
