const fs = require('fs');
const html = fs.readFileSync('views/partials/chatbot.ejs', 'utf8');

let divCount = 0;
let tags = [];
const regex = /<\/?div[^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  if (match[0].startsWith('</')) {
    divCount--;
    tags.push('</div' + divCount);
  } else {
    tags.push('<div' + divCount);
    divCount++;
  }
}
console.log("Final div count:", divCount);
console.log(tags.join(', '));
