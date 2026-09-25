const fs = require('fs');
const path = require('path');

const isProdCode = `process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.APPLET_ID`;

// 1. Patch src/i18n/index.ts
const i18nPath = path.join(__dirname, 'src', 'i18n', 'index.ts');
let i18nContent = fs.readFileSync(i18nPath, 'utf8');
i18nContent = i18nContent.replace(/res\.cookie\('lang', lang, \{ maxAge: 365 \* 24 \* 60 \* 60 \* 1000, path: '\/', sameSite: 'lax' \}\);/g, 
  `res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' || !!process.env.APPLET_ID || !!process.env.RAILWAY_ENVIRONMENT, httpOnly: true });`);
fs.writeFileSync(i18nPath, i18nContent);

// 2. Patch server.ts
const serverPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');
serverContent = serverContent.replace(/res\.cookie\('csrf_token', dummyCsrf, \{ httpOnly: false, path: '\/' \}\);/g, 
  `res.cookie('csrf_token', dummyCsrf, { httpOnly: true, secure: ${isProdCode}, sameSite: 'lax', path: '/' });`);
serverContent = serverContent.replace(/res\.cookie\('lang', targetLang, \{ maxAge: 365 \* 24 \* 60 \* 60 \* 1000, path: '\/', sameSite: 'lax' \}\);/g, 
  `res.cookie('lang', targetLang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax', secure: ${isProdCode}, httpOnly: true });`);
fs.writeFileSync(serverPath, serverContent);

console.log("cookies patched");
