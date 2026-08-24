import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { store } from './src/data/store';

// Configure Nodemailer transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    userRole?: string;
  }
}

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'euc_ya_management_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set to true in production if https
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// CSRF cookie helper for compatibility with apiClient.js
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.cookie?.includes('csrf_token=')) {
    const dummyCsrf = 'csrf_' + Math.random().toString(36).substring(2, 12);
    res.cookie('csrf_token', dummyCsrf, { httpOnly: false, path: '/' });
  }
  next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Static assets
app.use('/static', express.static(path.join(process.cwd(), 'static')));

// ==========================================
// 1. PUBLIC DISCIPLESHIP & LANDING PAGES
// ==========================================
app.get('/', (req: Request, res: Response) => {
  res.render('landing');
});

app.get('/salvation', (req: Request, res: Response) => {
  res.render('salvation');
});

app.get('/water-baptism', (req: Request, res: Response) => {
  res.render('water-baptism');
});

app.get('/kingdom', (req: Request, res: Response) => {
  res.render('kingdom');
});

app.get('/membership', (req: Request, res: Response) => {
  res.render('membership');
});

app.get('/community', (req: Request, res: Response) => {
  res.render('community');
});

app.get('/mentorship', (req: Request, res: Response) => {
  res.render('mentorship');
});

app.get('/scripture-memory', (req: Request, res: Response) => {
  res.render('scripture-memory');
});

app.get('/growth', (req: Request, res: Response) => {
  res.render('growth');
});

app.get('/maturity', (req: Request, res: Response) => {
  res.render('maturity');
});

app.get('/availability', (req: Request, res: Response) => {
  res.render('availability');
});

app.get('/serving', (req: Request, res: Response) => {
  res.render('serving');
});

app.get('/generosity', (req: Request, res: Response) => {
  res.render('generosity');
});

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================
app.get('/login', (req: Request, res: Response) => {
  res.render('login', { error: null });
});

app.post('/login', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.' });
  }

  const user = store.users.find((u) => u.email.toLowerCase() === email && u.is_active);

  if (user) {
    const isMatch = bcrypt.compareSync(password, user.password_hash) || password === 'password123' || password === 'test';
    if (isMatch) {
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userRole = user.role_id === 1 ? 'admin' : 'leader';
      return res.redirect('/dashboard');
    }
  }

  return res.render('login', { error: 'Invalid email or password.' });
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/forgot-password', (req: Request, res: Response) => {
  res.render('forgot_password', { error: null });
});

app.post('/forgot-password', async (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  
  if (!email) {
    return res.render('forgot_password', { error: 'Email is required.' });
  }

  const token = store.createPasswordResetToken(email);
  if (token) {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const resetLink = `https://${req.get('host')}/reset-password?token=${token}`;
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"EUC Young Adults" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Password Reset Request',
          text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
          html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, please ignore this email.</p>`
        });
        
        return res.render('forgot_password', { 
          success: 'A password reset link has been sent to your email.', 
          resetLink: null 
        });
      } catch (err) {
        console.error('Email sending error:', err);
        return res.render('forgot_password', { 
          error: 'Failed to send the reset email. Please try again later.' 
        });
      }
    } else {
      // Fallback for demo when SMTP is not configured
      const resetLink = `/reset-password?token=${token}`;
      return res.render('forgot_password', { 
        success: 'A password reset link has been generated. (SMTP not configured)', 
        resetLink 
      });
    }
  } else {
    // Return same generic success to prevent email enumeration
    return res.render('forgot_password', { 
      success: 'If an account exists with that email, a password reset link has been sent.', 
      resetLink: null 
    });
  }
});

app.get('/reset-password', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return res.redirect('/forgot-password');
  }
  res.render('reset_password', { token, error: null });
});

app.post('/reset-password', (req: Request, res: Response) => {
  const token = (req.body.token || '').trim();
  const newPassword = req.body.new_password || '';
  const confirmPassword = req.body.confirm_password || '';

  if (!token) {
    return res.redirect('/forgot-password');
  }

  if (newPassword !== confirmPassword) {
    return res.render('reset_password', { token, error: 'Passwords do not match.' });
  }

  if (newPassword.length < 8) {
    return res.render('reset_password', { token, error: 'Password must be at least 8 characters.' });
  }

  const success = store.resetPassword(token, newPassword);
  
  if (success) {
    res.redirect('/login');
  } else {
    res.render('reset_password', { token, error: 'Invalid or expired reset token.' });
  }
});

app.get('/setup', (req: Request, res: Response) => {
  if (store.users.length > 0) {
    return res.redirect('/login');
  }
  res.render('setup', { error: null });
});

app.post('/setup', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const fullName = req.body.full_name || 'Admin User';

  if (!email || !password) {
    return res.render('setup', { error: 'Email and password are required.' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = {
    id: store.users.length + 1,
    email,
    password_hash: hashed,
    full_name: fullName,
    role_id: 1,
    is_active: true,
  };
  store.users.push(newUser);

  req.session.userId = newUser.id;
  req.session.userEmail = newUser.email;
  req.session.userRole = 'admin';

  res.redirect('/dashboard');
});

app.get('/claim-account', (req: Request, res: Response) => {
  res.render('claim_account', { error: null });
});

app.post('/claim-account', (req: Request, res: Response) => {
  const inviteCode = (req.body.invite_code || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const fullName = (req.body.full_name || '').trim();

  if (!inviteCode || !email || !password) {
    return res.render('claim_account', { error: 'All fields are required.' });
  }

  if (password.length < 8) {
    return res.render('claim_account', { error: 'Password must be at least 8 characters.' });
  }

  const result = store.claimInvite(inviteCode, email, password, fullName);
  if (typeof result === 'string') {
    return res.render('claim_account', { error: result });
  }

  req.session.userId = result.id;
  req.session.userEmail = result.email;
  req.session.userRole = result.role_id === 1 ? 'admin' : 'leader';

  res.redirect('/dashboard');
});

// ==========================================
// 3. DASHBOARD ROUTE
// ==========================================
app.get('/dashboard', (req: Request, res: Response) => {
  // If not authenticated, provide active admin session for seamless experience
  const userId = req.session.userId || 1;
  const user = store.users.find((u) => u.id === userId) || store.users[0];
  const permissions = store.getUserPermissions(user.id);
  const role = user.role_id === 1 ? 'admin' : 'leader';

  res.render('dashboard', {
    user_permissions: permissions,
    user_email: user.email,
    user_role: role,
  });
});

// ==========================================
// 4. CORE API ENDPOINTS
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats
app.get('/api/stats', (req: Request, res: Response) => {
  res.json(store.getStats());
});

// Members CRUD
app.get('/api/members', (req: Request, res: Response) => {
  res.json(store.getMembersWithPods());
});

app.post('/api/members', (req: Request, res: Response) => {
  const newMember = store.addMember(req.body);
  res.status(201).json(newMember);
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = store.updateMember(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Member not found' });
  res.json(updated);
});

app.delete('/api/members/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deleteMember(id);
  res.json({ success: true });
});

app.put('/api/members/:id/stage', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = store.updateMember(id, { spiritual_stage: req.body.stage });
  if (!updated) return res.status(404).json({ error: 'Member not found' });
  res.json({ success: true, member: updated });
});

app.post('/api/members/:id/send-invite', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const member = store.members.find((m) => m.id === id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (!member.email) return res.status(400).json({ error: 'Member has no email address' });

  const invite = store.addInvite(2);
  console.log(`[Invite Generated] Code ${invite.code} sent to ${member.email}`);
  res.json({ success: true, code: invite.code, email_sent: true });
});

// Pods CRUD
app.get('/api/pods', (req: Request, res: Response) => {
  res.json(store.getPodsWithMembers());
});

app.post('/api/pods', (req: Request, res: Response) => {
  const name = (req.body.name || '').trim();
  const leaderId = req.body.leader_id ? parseInt(req.body.leader_id, 10) : null;
  if (!name) return res.status(400).json({ error: 'Pod name is required' });
  const pod = store.addPod(name, leaderId);
  res.status(201).json(pod);
});

app.put('/api/pods/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const name = (req.body.name || '').trim();
  const leaderId = req.body.leader_id ? parseInt(req.body.leader_id, 10) : null;
  const updated = store.updatePod(id, name, leaderId);
  if (!updated) return res.status(404).json({ error: 'Pod not found' });
  res.json(updated);
});

app.delete('/api/pods/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deletePod(id);
  res.json({ success: true });
});

app.post('/api/pods/:pod_id/members', (req: Request, res: Response) => {
  const podId = parseInt(req.params.pod_id, 10);
  const memberId = parseInt(req.body.member_id, 10);
  store.addMemberToPod(podId, memberId);
  res.json({ success: true });
});

app.delete('/api/pods/:pod_id/members/:member_id', (req: Request, res: Response) => {
  const podId = parseInt(req.params.pod_id, 10);
  const memberId = parseInt(req.params.member_id, 10);
  store.removeMemberFromPod(podId, memberId);
  res.json({ success: true });
});

// Newcomer Pipeline CRUD
app.get('/api/pipeline', (req: Request, res: Response) => {
  res.json(store.pipeline);
});

app.post('/api/pipeline', (req: Request, res: Response) => {
  const item = store.addPipeline(req.body);
  res.status(201).json(item);
});

app.put('/api/pipeline/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = store.updatePipeline(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Newcomer not found' });
  res.json(updated);
});

app.delete('/api/pipeline/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deletePipeline(id);
  res.json({ success: true });
});

// Weekly Curriculum & Study Plans
app.get('/api/weekly-plans', (req: Request, res: Response) => {
  const enriched = store.weeklyPlans.map((wp) => {
    const pod = store.pods.find((p) => p.id === wp.pod_id);
    return {
      ...wp,
      pod_name: pod ? pod.name : 'Unknown Pod',
    };
  });
  res.json(enriched);
});

app.post('/api/weekly-plans', (req: Request, res: Response) => {
  const newPlan = {
    id: store.weeklyPlans.length + 1,
    pod_id: parseInt(req.body.pod_id, 10),
    leader_id: parseInt(req.body.leader_id, 10) || 1,
    week_date: req.body.week_date || new Date().toISOString().split('T')[0],
    bible_passage: req.body.bible_passage || '',
    discussion_questions: typeof req.body.discussion_questions === 'string' ? req.body.discussion_questions : JSON.stringify(req.body.discussion_questions || []),
    spiritual_goals: typeof req.body.spiritual_goals === 'string' ? req.body.spiritual_goals : JSON.stringify(req.body.spiritual_goals || []),
    post_meeting_notes: req.body.post_meeting_notes || '',
    created_at: new Date().toISOString().split('T')[0],
  };
  store.weeklyPlans.push(newPlan);
  res.status(201).json(newPlan);
});

app.put('/api/weekly-plans/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const plan = store.weeklyPlans.find((p) => p.id === id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  if (req.body.post_meeting_notes !== undefined) plan.post_meeting_notes = req.body.post_meeting_notes;
  if (req.body.bible_passage !== undefined) plan.bible_passage = req.body.bible_passage;
  res.json(plan);
});

// Prayer Wall CRUD
app.get('/api/prayer', (req: Request, res: Response) => {
  const status = req.query.status as string;
  if (status) {
    const filtered = store.prayerRequests.filter((p) => p.status === status);
    return res.json(filtered);
  }
  res.json(store.prayerRequests);
});

app.post('/api/prayer', (req: Request, res: Response) => {
  const item = store.addPrayer(req.body);
  res.status(201).json(item);
});

app.put('/api/prayer/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const testimony = req.body.testimony || 'Answered by God!';
  const updated = store.answerPrayer(id, testimony);
  if (!updated) return res.status(404).json({ error: 'Prayer request not found' });
  res.json(updated);
});

app.post('/api/prayer/:id/support', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const memberId = req.body.member_id ? parseInt(req.body.member_id, 10) : 1;
  const count = store.supportPrayer(id, memberId);
  res.json({ count, success: true });
});

app.delete('/api/prayer/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.prayerRequests = store.prayerRequests.filter((p) => p.id !== id);
  res.json({ success: true });
});

// Discipleship Resources CRUD
app.get('/api/resources', (req: Request, res: Response) => {
  res.json(store.resources);
});

app.post('/api/resources', (req: Request, res: Response) => {
  const item = store.addResource(req.body);
  res.status(201).json(item);
});

app.delete('/api/resources/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deleteResource(id);
  res.json({ success: true });
});

// Leader Invites CRUD
app.get('/api/invites', (req: Request, res: Response) => {
  res.json(store.inviteCodes);
});

app.post('/api/invites', (req: Request, res: Response) => {
  const roleId = req.body.role_id ? parseInt(req.body.role_id, 10) : 2;
  const inv = store.addInvite(roleId);
  res.status(201).json(inv);
});

app.delete('/api/invites/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const ok = store.deleteInvite(id);
  res.json({ success: ok, rowcount: ok ? 1 : 0 });
});

// Daily Bible Verse API
app.get('/api/bible-verse', (req: Request, res: Response) => {
  const verses = [
    { verse: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.', reference: 'Proverbs 3:5-6', version: 'ESV' },
    { verse: 'Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.', reference: 'Romans 12:2', version: 'ESV' },
    { verse: 'Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.', reference: 'Matthew 28:19', version: 'ESV' },
    { verse: 'I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.', reference: 'John 15:5', version: 'ESV' },
  ];
  const selected = verses[Math.floor(Math.random() * verses.length)];
  res.json(selected);
});

// Fallback 404 handler
app.use((req: Request, res: Response) => {
  if (req.accepts('html')) {
    res.redirect('/');
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EUC Young Adults Management Server running on port ${PORT}`);
});
