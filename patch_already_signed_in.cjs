const fs = require('fs');
const path = require('path');

const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

// Update /login GET
serverContent = serverContent.replace(
  "app.get('/login', (req: Request, res: Response) => {",
  "app.get('/login', (req: Request, res: Response) => {\n  if (req.session && req.session.userId) return res.render('login', { error: null, success: null, alreadySignedIn: true });"
);

// Update /claim-account GET
serverContent = serverContent.replace(
  "app.get('/claim-account', (req: Request, res: Response) => {",
  "app.get('/claim-account', (req: Request, res: Response) => {\n  if (req.session && req.session.userId) return res.render('claim_account', { error: null, alreadySignedIn: true });"
);

fs.writeFileSync(serverTsPath, serverContent);

// Update views/login.ejs
const loginPath = path.join(__dirname, 'views/login.ejs');
let loginContent = fs.readFileSync(loginPath, 'utf8');
loginContent = loginContent.replace(
  '<form method="POST"',
  '<% if (typeof alreadySignedIn !== "undefined" && alreadySignedIn) { %>\n            <div class="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-6 rounded-xl text-center mb-6">\n                <p class="font-bold mb-4">You are already signed in.</p>\n                <a href="/dashboard" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Go to Dashboard</a>\n            </div>\n            <% } else { %>\n            <form method="POST"'
);
loginContent = loginContent.replace(
  '</form>',
  '</form>\n            <% } %>'
);
fs.writeFileSync(loginPath, loginContent);

// Update views/claim_account.ejs
const claimPath = path.join(__dirname, 'views/claim_account.ejs');
let claimContent = fs.readFileSync(claimPath, 'utf8');
claimContent = claimContent.replace(
  '<form method="POST"',
  '<% if (typeof alreadySignedIn !== "undefined" && alreadySignedIn) { %>\n            <div class="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-6 rounded-xl text-center mb-6">\n                <p class="font-bold mb-4">You are already signed in.</p>\n                <a href="/dashboard" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Go to Dashboard</a>\n            </div>\n            <% } else { %>\n            <form method="POST"'
);
claimContent = claimContent.replace(
  '</form>',
  '</form>\n            <% } %>'
);
fs.writeFileSync(claimPath, claimContent);

console.log("Already signed in patched");
