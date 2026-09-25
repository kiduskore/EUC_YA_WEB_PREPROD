const fs = require('fs');
const path = require('path');
const serverTsPath = path.join(__dirname, 'server.ts');
let serverContent = fs.readFileSync(serverTsPath, 'utf8');

const joinRoute = `
app.get('/join', (req: Request, res: Response) => {
  res.render('join');
});
`;
serverContent = serverContent.replace("app.get('/salvation',", joinRoute + "\napp.get('/salvation',");
fs.writeFileSync(serverTsPath, serverContent);
console.log("Added /join route");
