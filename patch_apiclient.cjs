const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'static/js/dashboard/apiClient.js');
let content = fs.readFileSync(file, 'utf8');

// We want to extract CSRF logic OUTSIDE of the if (options.body) check.
const newLogic = `
        options.cache = options.cache || 'no-store'; // Prevent aggressive iOS Safari caching
        
        // Always attach CSRF for non-GET methods if available
        const meta = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = meta ? meta.getAttribute('content') : '';
        
        options.headers = options.headers || {};
        if (csrfToken) {
            options.headers['X-CSRF-Token'] = csrfToken;
        }

        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
            options.headers['Content-Type'] = 'application/json';
        }
`;

content = content.replace(/options\.cache = options\.cache[\s\S]*?(?=\/\/ Hard cache-buster)/, newLogic);
fs.writeFileSync(file, content);
console.log("apiClient.js patched");
