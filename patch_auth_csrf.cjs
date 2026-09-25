const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

// 1. Fix logout
const logoutCode = `app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});`;
serverContent = serverContent.replace(/app\.get\('\/logout', \(req: Request, res: Response\) => \{[\s\S]*?\}\);/, logoutCode);

// 2. Validate CSRF on POST
const csrfMiddleware = `
// CSRF Validation Middleware
const validateCSRF = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const token = req.body.csrf_token || req.headers['x-csrf-token'];
    const expected = req.cookies.csrf_token;
    if (!token || token !== expected) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      return res.status(403).send('Invalid CSRF token');
    }
  }
  next();
};
app.use(validateCSRF);
`;
// Insert after body parsing
serverContent = serverContent.replace("// CSRF cookie helper", csrfMiddleware + "\n// CSRF cookie helper");

// 3. Make csrf_token cookie accessible to JS by removing httpOnly
serverContent = serverContent.replace(
  "res.cookie('csrf_token', dummyCsrf, { httpOnly: true,",
  "res.cookie('csrf_token', dummyCsrf, { httpOnly: false,"
);

// 4. Session cookie sameSite
serverContent = serverContent.replace(
  "maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days",
  "maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days\n      sameSite: 'lax',"
);

// 5. Expose CSRF to locals so EJS can render it
serverContent = serverContent.replace(
  "const dummyCsrf = 'csrf_' + Math.random().toString(36).substring(2, 12);",
  "const dummyCsrf = 'csrf_' + Math.random().toString(36).substring(2, 12);\n    res.locals.csrf_token = dummyCsrf;"
);
serverContent = serverContent.replace(
  "if (!req.headers.cookie?.includes('csrf_token=')) {",
  "res.locals.csrf_token = req.cookies.csrf_token;\n  if (!req.headers.cookie?.includes('csrf_token=')) {"
);

fs.writeFileSync(serverTsPath, serverContent);
console.log("Auth and CSRF patched");
