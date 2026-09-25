const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

const authMiddleware = `
// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  next();
};

const requireSiteAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  const user = store.users.find(u => u.id === req.session.userId);
  if (!user || user.role_id !== 1) { // 1 = Site Admin
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Forbidden: Requires Site Admin role' });
    }
    return res.redirect('/dashboard');
  }
  next();
};
`;

serverContent = serverContent.replace("// ==========================================\n// 3. DASHBOARD ROUTE\n// ==========================================", authMiddleware + "\n// ==========================================\n// 3. DASHBOARD ROUTE\n// ==========================================");

// Patch dashboard route
serverContent = serverContent.replace(
`app.get('/dashboard', (req: Request, res: Response) => {
  // If not authenticated, provide active admin session for seamless experience
  const userId = req.session.userId || 1;`,
`app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const userId = req.session.userId;`
);

// Patch API routes to use requireAuth
const apiRoutesToPatch = ['/api/stats', '/api/members', '/api/pods', '/api/pipeline', '/api/weekly-plans', '/api/prayer', '/api/resources', '/api/invites'];
apiRoutesToPatch.forEach(route => {
  // patch GET
  serverContent = serverContent.replace(new RegExp(`app\\.get\\('${route}'`, 'g'), `app.get('${route}', requireAuth`);
  // patch POST
  serverContent = serverContent.replace(new RegExp(`app\\.post\\('${route}'`, 'g'), `app.post('${route}', requireAuth`);
  // patch PUT
  serverContent = serverContent.replace(new RegExp(`app\\.put\\('${route}`, 'g'), `app.put('${route}`);
  serverContent = serverContent.replace(new RegExp(`app\\.put\\('${route}'`, 'g'), `app.put('${route}', requireAuth`); // sometimes has param
  
  // patch DELETE
  serverContent = serverContent.replace(new RegExp(`app\\.delete\\('${route}`, 'g'), `app.delete('${route}`);
});

serverContent = serverContent.replace(/app\.put\('\/api\/(members|pods|prayer|invites|resources|pipeline|weekly-plans)\/:id'/g, "app.put('/api/$1/:id', requireAuth");
serverContent = serverContent.replace(/app\.delete\('\/api\/(members|pods|prayer|invites|resources|pipeline|weekly-plans)\/:id'/g, "app.delete('/api/$1/:id', requireAuth");

fs.writeFileSync(serverTsPath, serverContent);
console.log("Auth patched");
