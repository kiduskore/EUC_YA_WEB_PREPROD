const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(`app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found: ' + req.path });
  }
  if (req.accepts('html')) {
    res.redirect('/');
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});`, `app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found: ' + req.path });
  }
  if (req.path.startsWith('/static/')) {
    return res.status(404).send('Not found');
  }
  if (req.accepts('html')) {
    res.redirect('/');
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});`);

fs.writeFileSync('server.ts', content);
console.log("Patched 404 handler for static files in server.ts");
