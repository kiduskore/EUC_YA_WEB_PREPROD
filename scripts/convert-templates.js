import fs from 'fs';
import path from 'path';

const templatesDir = path.resolve('templates');
const viewsDir = path.resolve('views');

if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir, { recursive: true });
}

const files = fs.readdirSync(templatesDir);

for (const file of files) {
  if (!file.endsWith('.html')) continue;
  if (file === 'base.html') continue; // Handled separately by partials

  const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
  let newContent = content;

  if (file === 'dashboard.html') {
    newContent = newContent
      .replace(/\{\{\s*user_permissions\s*\|\s*tojson\s*\|\s*safe\s*\}\}/g, '<%- JSON.stringify(user_permissions || []) %>')
      .replace(/\{\{\s*user_email\s*\}\}/g, '<%- user_email || "" %>')
      .replace(/\{\{\s*user_role\s*\}\}/g, '<%- user_role || "" %>')
      .replace(/\{%\s*raw\s*%\}/g, '')
      .replace(/\{%\s*endraw\s*%\}/g, '');
  } else {
    // Replace extends/block
    newContent = newContent
      .replace(/\{%\s*extends\s*['"]base\.html['"]\s*%\}\s*\{%\s*block\s*content\s*%\}/g, "<%- include('partials/header') %>")
      .replace(/\{%\s*endblock\s*%\}/g, "<%- include('partials/footer') %>")
      .replace(/\{%\s*if\s*error\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, "<% if (typeof error !== 'undefined' && error) { %>$1<% } %>")
      .replace(/\{\{\s*error\s*\}\}/g, '<%= error %>');
  }

  const outName = file.replace(/\.html$/, '.ejs');
  fs.writeFileSync(path.join(viewsDir, outName), newContent, 'utf-8');
  console.log(`Converted ${file} -> views/${outName}`);
}
console.log('Template conversion complete!');
