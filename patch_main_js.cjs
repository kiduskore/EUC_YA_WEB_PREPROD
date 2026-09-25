const fs = require('fs');
let code = fs.readFileSync('static/js/dashboard/main.js', 'utf-8');

code = code.replace(
    "{ id: 'training', label: 'Training Guide',",
    "{ id: 'training', label: 'Vision & Strategy',"
);

fs.writeFileSync('static/js/dashboard/main.js', code);
