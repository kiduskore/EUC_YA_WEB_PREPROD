const fs = require('fs');
let file = fs.readFileSync('views/partials/chatbot.ejs', 'utf8');

// The closing tag on line 95 is currently `</script>` but should be `</style>`
// I will replace `    }\n</script>\n\n<script>` with `    }\n</style>\n\n<script>`
file = file.replace("    }\n</script>\n<script>", "    }\n</style>\n<script>");

// Wait, let's just use string replacement carefully
file = file.replace(/}\s*<\/script>\s*<script>/g, "}\n</style>\n<script>");

fs.writeFileSync('views/partials/chatbot.ejs', file);
