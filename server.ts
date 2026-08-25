import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { store } from './src/data/store';
import { i18nMiddleware, isSupportedLanguage, SupportedLanguage, getLanguageInfo, SUPPORTED_LANGUAGES, translations } from './src/i18n';

const app = express();
// In AI Studio container, reverse proxy targets port 3000. On Railway / external hosts, respect process.env.PORT.
const PORT = process.env.APPLET_ID ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

app.set('trust proxy', true);

// Configure Nodemailer transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.SMTP_SERVER || 'smtp.ionos.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

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

// Localization i18n middleware
app.use(i18nMiddleware);

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

// Language Switching Endpoints
app.get('/set-language/:lang', (req: Request, res: Response) => {
  const targetLang = req.params.lang?.toLowerCase();
  if (isSupportedLanguage(targetLang)) {
    res.cookie('lang', targetLang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax' });
    if (req.session) {
      (req.session as any).lang = targetLang;
    }
  }
  let redirectUrl = (req.query.returnTo as string) || req.headers.referer || '/';
  if (isSupportedLanguage(targetLang)) {
    try {
      const parsed = new URL(redirectUrl, 'http://localhost');
      parsed.searchParams.set('lang', targetLang);
      redirectUrl = redirectUrl.startsWith('http') ? parsed.toString() : (parsed.pathname + parsed.search + parsed.hash);
    } catch (e) {
      redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + 'lang=' + targetLang;
    }
  }
  res.redirect(redirectUrl);
});

app.post('/api/set-language', (req: Request, res: Response) => {
  const targetLang = (req.body.lang || req.query.lang || '').toString().toLowerCase();
  if (isSupportedLanguage(targetLang)) {
    res.cookie('lang', targetLang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: 'lax' });
    if (req.session) {
      (req.session as any).lang = targetLang;
    }
    return res.json({ success: true, lang: targetLang, langInfo: getLanguageInfo(targetLang) });
  }
  return res.status(400).json({ error: 'Unsupported language', supported: Object.keys(SUPPORTED_LANGUAGES) });
});

app.get('/api/languages', (req: Request, res: Response) => {
  res.json({
    current: res.locals.currentLang,
    supported: Object.values(SUPPORTED_LANGUAGES),
  });
});

app.get('/api/translations/:lang?', (req: Request, res: Response) => {
  const lang = (req.params.lang || res.locals.lang || 'en').toLowerCase();
  const validLang = isSupportedLanguage(lang) ? (lang as SupportedLanguage) : 'en';
  res.json({
    lang: validLang,
    translations: translations[validLang] || translations.en
  });
});

// ==========================================
// 1. PUBLIC DISCIPLESHIP & LANDING PAGES
// ==========================================
app.get('/v2', (req: Request, res: Response) => { res.render('preview-v2'); });

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
  const success = req.query.reset === 'success' ? 'Password reset successfully! You can now sign in with your new password.' : null;
  res.render('login', { error: null, success });
});

app.post('/login', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.', success: null });
  }

  const user = store.users.find((u) => u.email.toLowerCase() === email && u.is_active);

  if (user) {
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (isMatch) {
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userRole = user.role_id === 1 ? 'admin' : 'leader';
      return res.redirect('/dashboard');
    }
  }

  return res.render('login', { error: 'Invalid email or password.', success: null });
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
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
        const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || req.get('host') || '';
        const cleanHost = rawHost.split(',')[0].trim();
        
        let baseUrl = '';
        if (process.env.APP_URL) {
          baseUrl = process.env.APP_URL.replace(/\/$/, '');
        } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
          baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
        } else if (cleanHost) {
          const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : (cleanHost.includes('localhost') ? 'http' : 'https'));
          baseUrl = `${proto}://${cleanHost}`;
        } else {
          baseUrl = 'https://ais-pre-tu57w3dlqy2wim2vpmrzen-809481612520.us-east1.run.app';
        }

        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        const transporter = getTransporter();
        const mailResult = await transporter.sendMail({
          from: `"EUC Young Adults" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Password Reset Request - EUC Young Adults',
          text: `You requested a password reset for EUC Young Adults. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 2 hours.\nIf you did not request this, please ignore this email.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #0075ff; margin-bottom: 15px;">Password Reset Request</h2>
              <p style="color: #333; font-size: 15px; line-height: 1.5;">You requested to reset your password for the EUC Young Adults Portal.</p>
              <p style="margin: 25px 0;">
                <a href="${resetLink}" style="background-color: #0075ff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </p>
              <p style="color: #666; font-size: 13px;">Or copy and paste this link in your browser:</p>
              <p style="color: #0075ff; font-size: 13px; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This link will expire in 2 hours. If you did not request a password reset, you can safely ignore this email.</p>
            </div>
          `
        });
        
        console.log(`[SMTP] Reset email sent to ${email}. Response:`, mailResult.response);
        return res.render('forgot_password', { 
          success: `A password reset link has been successfully sent to ${email}. Please check your inbox (and spam folder).`, 
          resetLink: null 
        });
      } catch (err: any) {
        console.error('[SMTP Error] Failed to send email:', err);
        const resetLink = `/reset-password?token=${token}`;
        return res.render('forgot_password', { 
          error: `Failed to send email: ${err.message || 'Please check SMTP settings'}`,
          success: 'A fallback reset link has been generated below.',
          resetLink
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
    return res.render('forgot_password', { 
      error: `No registered account found with email "${email}". Please verify the email address or register first at /setup.`, 
      resetLink: null 
    });
  }
});

app.get(['/reset-password', '/reset_password', '/auth/reset-password'], (req: Request, res: Response) => {
  const token = ((req.query.token as string) || '').trim();
  if (!token) {
    return res.redirect('/forgot-password');
  }
  res.render('reset_password', { token, error: null });
});

app.post(['/reset-password', '/reset_password', '/auth/reset-password'], (req: Request, res: Response) => {
  const token = ((req.body.token as string) || (req.query.token as string) || '').trim();
  const newPassword = (req.body.new_password || '').trim();
  const confirmPassword = (req.body.confirm_password || '').trim();

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
    return res.redirect('/login?reset=success');
  } else {
    return res.render('reset_password', { token, error: 'Invalid or expired reset token. Please request a new reset link at /forgot-password.' });
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
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const userId = req.session.userId;
  const user = store.users.find((u) => u.id === userId);
  
  if (!user) {
    req.session.destroy(() => {});
    return res.redirect('/login');
  }

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

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const publicApiRoutes = ['/health', '/languages', '/translations', '/bible-verse', '/set-language'];
  
  // Allow public routes
  if (publicApiRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Require auth for all other API routes
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
});

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

// Diagnostic endpoint for SMTP
app.get('/debug-smtp', async (req: Request, res: Response) => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    res.json({
      success: true,
      message: 'SMTP connection successful!',
      config: {
        host: process.env.SMTP_SERVER || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER ? 'Set (Hidden)' : 'Not Set',
        pass: process.env.SMTP_PASS ? 'Set (Hidden)' : 'Not Set'
      }
    });
  } catch (error: any) {
    console.error('SMTP Diagnostic Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });
  }
});

// Fallback 404 handler
app.use((req: Request, res: Response) => {
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
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EUC Young Adults Management Server running on port ${PORT}`);
});
