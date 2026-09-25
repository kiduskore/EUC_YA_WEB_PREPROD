const fs = require('fs');
const path = require('path');

// 1. Add meta tag to header.ejs
const headerPath = path.join(__dirname, 'views/partials/header.ejs');
let headerContent = fs.readFileSync(headerPath, 'utf8');
headerContent = headerContent.replace(
  /<meta name="viewport"[^>]*>/,
  '$&\n    <meta name="csrf-token" content="<%= typeof csrf_token !== \'undefined\' ? csrf_token : \'\' %>">'
);
fs.writeFileSync(headerPath, headerContent);

// 2. Add header to fetch in footer.ejs
const footerPath = path.join(__dirname, 'views/partials/footer.ejs');
let footerContent = fs.readFileSync(footerPath, 'utf8');

const getCsrf = `const csrfMeta = document.querySelector('meta[name="csrf-token"]');
                const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';`;

footerContent = footerContent.replace(
  "const interest = interestEl ? interestEl.value : '';",
  "const interest = interestEl ? interestEl.value : '';\n                " + getCsrf
);
footerContent = footerContent.replace(
  "headers: { 'Content-Type': 'application/json' },",
  "headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },"
);
footerContent = footerContent.replace(
  "headers: { 'Content-Type': 'application/json' },",
  "headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },"
);
fs.writeFileSync(footerPath, footerContent);

console.log("Public CSRF patched");
