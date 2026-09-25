const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

// 1. Update helmet configuration
const newHelmet = `app.use(helmet({
  xFrameOptions: {
    action: 'sameorigin'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Note: 'unsafe-inline' and 'unsafe-eval' are required because the app uses Vue 3 via CDN 
      // (which compiles templates in-browser) and Tailwind Play CDN (which generates CSS on the fly).
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      // Allow AI Studio to frame the app in preview, but restrict elsewhere
      frameAncestors: process.env.APPLET_ID ? ["'self'", "https://*.google.com", "https://ai.studio"] : ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  next();
});`;

serverContent = serverContent.replace(/app\.use\(helmet\(\{[\s\S]*?\}\)\);/, newHelmet);

fs.writeFileSync(serverTsPath, serverContent);
console.log("Security patched");
