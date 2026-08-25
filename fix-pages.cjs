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
            // Look for t('some.key') : 'Default Text'
            const regex = /t\('([^']+)'\)\s*:\s*['"](.*?)['"]/gs;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const key = match[1];
                let value = match[2];
                // remove escaped quotes
                value = value.replace(/\\'/g, "'");
                missingKeys[key] = value;
            }
        }
    }
}

processDir(viewsDir);

let enTsContent = fs.readFileSync(enTsPath, 'utf8');
const addedKeys = [];
for (const [key, value] of Object.entries(missingKeys)) {
    if (!enTsContent.includes(`'${key}':`)) {
        console.log(`Missing key: ${key}`);
        addedKeys.push({ key, value });
    }
}

if (addedKeys.length > 0) {
    // Let's insert them before the last bracket
    const lines = enTsContent.split('\n');
    const lastBraceIndex = lines.findIndex(line => line.trim() === '};');
    
    if (lastBraceIndex !== -1) {
        const insertLines = addedKeys.map(k => `  '${k.key}': '${k.value.replace(/'/g, "\\'")}',`);
        lines.splice(lastBraceIndex, 0, ...insertLines);
        fs.writeFileSync(enTsPath, lines.join('\n'));
        console.log('en.ts updated successfully.');
    }
}
