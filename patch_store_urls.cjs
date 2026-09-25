const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/data/store.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "'https://discipleship.org/wp-content/uploads/2018/01/Master-Plan-of-Evangelism.pdf'",
  "'https://discipleship.org/resources/'"
);
content = content.replace(
  "file_url: '#',",
  "file_url: 'https://www.desiringgod.org/articles/how-to-lead-a-small-group',"
);

fs.writeFileSync(file, content);
console.log("store URLs patched");
