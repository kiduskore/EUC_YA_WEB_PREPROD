const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

const newHelmetCode = `
// Security headers
app.use(helmet({
  xFrameOptions: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      frameAncestors: null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
`;

serverContent = serverContent.replace(/\/\/ Security headers[\s\S]*?crossOriginEmbedderPolicy: false,\n\}\)\);/m, newHelmetCode.trim());
fs.writeFileSync(serverTsPath, serverContent);
console.log("Frame patched");
