const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'views/dashboard.ejs');
let content = fs.readFileSync(file, 'utf8');

// Add meta tag
content = content.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="csrf-token" content="<%= typeof csrf_token !== \'undefined\' ? csrf_token : \'\' %>">'
);
fs.writeFileSync(file, content);

// Update apiClient.js to read from meta tag
const apiFile = path.join(__dirname, 'static/js/dashboard/apiClient.js');
let apiContent = fs.readFileSync(apiFile, 'utf8');
apiContent = apiContent.replace(
  /const csrfCookie = document.cookie.split\('; '\).find\(row => row.startsWith\('csrf_token='\)\);\n\s*const csrfToken = csrfCookie \? csrfCookie.split\('='\)[1] : '';/,
  `const meta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = meta ? meta.getAttribute('content') : '';`
);
fs.writeFileSync(apiFile, apiContent);

console.log("Meta CSRF patched");
