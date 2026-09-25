const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'views/landing.ejs');
let content = fs.readFileSync(file, 'utf8');

// Get Directions
content = content.replace(
  /<a href="\/join" class="text-blue-600([^>]+)>\s*(<%= typeof t !== 'undefined' \? t\('steps\.step1\.link'\) : 'Get Directions' %>)\s*<span>→<\/span>\s*<\/a>/,
  '<a href="https://maps.google.com/?q=12604+New+Hampshire+Ave,+Silver+Spring,+MD+20904" target="_blank" class="text-blue-600$1>\n                        $2 <span>→</span>\n                    </a>'
);

// Find a Group
content = content.replace(
  /<a href="\/join" class="text-purple-600([^>]+)>\s*(<%= typeof t !== 'undefined' \? t\('steps\.step2\.link'\) : 'Find a Group' %>)\s*<span>→<\/span>\s*<\/a>/,
  '<a href="/community" class="text-purple-600$1>\n                        $2 <span>→</span>\n                    </a>'
);

// Start Serving
content = content.replace(
  /<a href="\/join" class="text-emerald-600([^>]+)>\s*(<%= typeof t !== 'undefined' \? t\('steps\.step3\.link'\) : 'Start Serving' %>)\s*<span>→<\/span>\s*<\/a>/,
  '<a href="/serving" class="text-emerald-600$1>\n                        $2 <span>→</span>\n                    </a>'
);

fs.writeFileSync(file, content);
console.log("Landing links patched");
