const fs = require('fs');
let content = fs.readFileSync('src/data/store.ts', 'utf-8');

const regex = /\s*\{\s*id: this\.nextIds\.resources\+\+,\s*title: 'Praying the Bible',[\s\S]*?\},/;
content = content.replace(regex, '');

fs.writeFileSync('src/data/store.ts', content);
