const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importAdmin = `import { adminAuth } from './src/lib/firebase-admin.ts';\n`;
if (!code.includes('firebase-admin')) {
    code = importAdmin + code;
}

const authRoute = `
// Google Sign-In endpoint
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing ID Token' });
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    
    // Check if user exists by email
    const user = store.getUserByEmail(email);
    
    if (user) {
      if (!user.is_active) {
         return res.status(403).json({ error: 'Account disabled.' });
      }
      
      // Update Firebase UID if it was missing (linking the account)
      if (user.uid !== decodedToken.uid) {
         user.uid = decodedToken.uid;
         // Note: in-memory store will trigger a save to Cloud SQL
      }
      
      req.session.userId = user.id;
      req.session.roleId = user.role_id;
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'No account found with this Google email. Please claim an account with an invite code first.' });
    }
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});
`;

if (!code.includes('/auth/google')) {
    // Insert before the generic login route
    code = code.replace("app.post('/login',", authRoute + "\napp.post('/login',");
}

fs.writeFileSync('server.ts', code);
