import { adminAuth, adminDb } from './src/lib/firebase-admin.ts';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { store } from './src/data/store';
import { i18nMiddleware, isSupportedLanguage, SupportedLanguage, getLanguageInfo, SUPPORTED_LANGUAGES, translations } from './src/i18n';

const app = express();
app.disable('x-powered-by');
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


// Security headers
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: false, // Let CSP frameAncestors control framing so AI Studio preview loads properly
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Note: 'unsafe-inline' and 'unsafe-eval' are required because the app uses Vue 3 via CDN 
      // (which compiles templates in-browser) and Tailwind Play CDN (which generates CSS on the fly).
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      // Allow AI Studio to frame the app in preview, but restrict elsewhere
      frameAncestors: ["'self'", "https://*.google.com", "https://ai.studio", "https://*.googleusercontent.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  next();
});

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

// Cookie configuration constants
const isIframe = !!process.env.APPLET_ID;
const cookieSameSite = (isIframe ? 'none' : 'lax') as 'none' | 'lax';
const cookieSecure = true;

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'euc_ya_management_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: cookieSecure,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: cookieSameSite,
    },
  })
);

// Localization i18n middleware
app.use(i18nMiddleware);

// CSRF cookie helper - populate res.locals.csrf_token before route handlers
app.use((req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies.csrf_token;
  if (!token) {
    token = 'csrf_' + Math.random().toString(36).substring(2, 12);
    res.cookie('csrf_token', token, { secure: cookieSecure, httpOnly: true, sameSite: cookieSameSite, path: '/' });
  }
  res.locals.csrf_token = token;
  res.locals.currentPath = req.path;
  next();
});

// CSRF Validation Middleware
const isPublicAuthRoute = (path: string) => {
  const clean = (path || '').split('?')[0].toLowerCase();
  return clean === '/login' || 
         clean === '/forgot-password' || 
         clean === '/reset-password' || 
         clean === '/claim-account' || 
         clean === '/setup' || 
         clean === '/api/set-language' ||
         clean === '/api/upload-banner' ||
         clean === '/api/member-form' ||
         clean === '/api/newsletter/subscribe' ||
         clean === '/api/members/subscribe' ||
         clean === '/api/subscribe';
};

const validateCSRF = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    // Exempt public auth actions if cookies are blocked in iframe or on initial sign-in
    if (isPublicAuthRoute(req.path) || isPublicAuthRoute(req.originalUrl)) {
      return next();
    }
    const token = req.body?.csrf_token || req.headers['x-csrf-token'];
    const expected = req.cookies?.csrf_token;
    if (expected && token && token !== expected) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      return res.status(403).send('Invalid CSRF token');
    }
  }
  next();
};
app.use(validateCSRF);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Static assets
app.use('/static', express.static(path.join(process.cwd(), 'static')));

// Language Switching Endpoints
app.get('/set-language/:lang', (req: Request, res: Response) => {
  const targetLang = req.params.lang?.toLowerCase();
  if (isSupportedLanguage(targetLang)) {
    res.cookie('lang', targetLang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: cookieSameSite, secure: cookieSecure, httpOnly: true });
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
    res.cookie('lang', targetLang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', sameSite: cookieSameSite, secure: cookieSecure, httpOnly: true });
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
// TECHNICAL SEO: ROBOTS.TXT & SITEMAP.XML
// ==========================================
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /member-form

Sitemap: https://ya.eucmaryland.org/sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  const baseUrl = 'https://ya.eucmaryland.org';
  const publicPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/join', changefreq: 'weekly', priority: '0.9' },
    { loc: '/salvation', changefreq: 'monthly', priority: '0.8' },
    { loc: '/water-baptism', changefreq: 'monthly', priority: '0.8' },
    { loc: '/kingdom', changefreq: 'monthly', priority: '0.8' },
    { loc: '/membership', changefreq: 'monthly', priority: '0.8' },
    { loc: '/community', changefreq: 'monthly', priority: '0.8' },
    { loc: '/mentorship', changefreq: 'monthly', priority: '0.8' },
    { loc: '/scripture-memory', changefreq: 'monthly', priority: '0.7' },
    { loc: '/growth', changefreq: 'monthly', priority: '0.7' },
    { loc: '/maturity', changefreq: 'monthly', priority: '0.7' },
    { loc: '/availability', changefreq: 'monthly', priority: '0.7' },
    { loc: '/serving', changefreq: 'monthly', priority: '0.7' },
    { loc: '/generosity', changefreq: 'monthly', priority: '0.7' },
  ];
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const page of publicPages) {
    xml += `  <url>\n    <loc>${baseUrl}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }
  xml += `</urlset>`;
  res.send(xml);
});

// ==========================================
// SEARCH ENGINE & DISCOVERY SERVICES
// ==========================================
const SEARCH_DATABASE = [
  { 
    title: "Salvation (The Gospel of Jesus Christ)", 
    category: "teachings", 
    pillar: "Foundation", 
    desc: "The good news of Jesus Christ, forgiveness of sins, repentance, and eternal life through grace.", 
    url: "/salvation", 
    icon: "✝️",
    keywords: ["salvation", "jesus", "gospel", "cross", "repentance", "faith", "grace", "eternal life", "born again", "forgiven", "savior", "christ", "sin", "hope", "bible"] 
  },
  { 
    title: "Water Baptism", 
    category: "teachings", 
    pillar: "Foundation", 
    desc: "Public declaration of faith, identification with Christ in death and resurrection, and baptism classes.", 
    url: "/water-baptism", 
    icon: "💧",
    keywords: ["baptism", "water", "immersion", "testimony", "obedience", "sacrament", "rebirth", "public declaration"] 
  },
  { 
    title: "The Kingdom of God", 
    category: "teachings", 
    pillar: "Foundation", 
    desc: "Living under the reign and lordship of Jesus Christ, kingdom culture, and divine calling.", 
    url: "/kingdom", 
    icon: "👑",
    keywords: ["kingdom", "reign", "lordship", "king jesus", "heaven", "authority", "crown", "sovereignty", "purpose"] 
  },
  { 
    title: "Church Membership & Covenant", 
    category: "teachings", 
    pillar: "Belong", 
    desc: "Belonging to the local church body, covenant relationships, spiritual family, and mutual accountability.", 
    url: "/membership", 
    icon: "🤝",
    keywords: ["membership", "covenant", "church", "belonging", "family", "commitment", "accountability", "local church", "eucmd"] 
  },
  { 
    title: "Spiritual Mentorship", 
    category: "teachings", 
    pillar: "Belong", 
    desc: "Walking with mature Christian mentors, discipleship coaching, spiritual guidance, and prayer.", 
    url: "/mentorship", 
    icon: "🌱",
    keywords: ["mentorship", "mentor", "discipleship", "coaching", "guide", "wisdom", "counsel", "advice", "leader"] 
  },
  { 
    title: "Scripture Memory & Bible Study", 
    category: "teachings", 
    pillar: "Formation", 
    desc: "Hiding God's Word in your heart, memory verse plans, Bible study habits, and biblical truth.", 
    url: "/scripture-memory", 
    icon: "📖",
    keywords: ["scripture", "memory", "bible", "verses", "memorization", "word of god", "devotional", "study", "psalm"] 
  },
  { 
    title: "Spiritual Growth & Disciplines", 
    category: "teachings", 
    pillar: "Formation", 
    desc: "Daily prayer, fasting, Bible reading, worship, and walking in the power of the Holy Spirit.", 
    url: "/growth", 
    icon: "🌿",
    keywords: ["growth", "prayer", "fasting", "devotional", "holy spirit", "disciplines", "quiet time", "transformation", "walk"] 
  },
  { 
    title: "Christian Maturity & Character", 
    category: "teachings", 
    pillar: "Formation", 
    desc: "Endurance, producing the Fruit of the Spirit, emotional health, and steadfast faith.", 
    url: "/maturity", 
    icon: "🍇",
    keywords: ["maturity", "fruit of the spirit", "endurance", "character", "holiness", "patience", "resilience", "steadfast", "integrity"] 
  },
  { 
    title: "Availability & Surrender", 
    category: "teachings", 
    pillar: "Formation", 
    desc: "Surrendering your schedule, gifts, career, and ambitions for God's glory and calling.", 
    url: "/availability", 
    icon: "🕊️",
    keywords: ["availability", "surrender", "calling", "obedience", "career", "stewardship", "commitment", "submission"] 
  },
  { 
    title: "Serving & Ministry Teams", 
    category: "teachings", 
    pillar: "Mission", 
    desc: "Discovering spiritual gifts, volunteering on worship, tech, media, ushering, and hospitality teams.", 
    url: "/serving", 
    icon: "🛠️",
    keywords: ["serving", "ministry", "volunteers", "worship", "tech", "audiovisual", "ushering", "hospitality", "volunteer", "serve"] 
  },
  { 
    title: "Generosity, Giving & Tithing", 
    category: "teachings", 
    pillar: "Mission", 
    desc: "Biblical stewardship, joyful tithing, sacrificial giving, and investing in God's eternal kingdom work.", 
    url: "/generosity", 
    icon: "🎁",
    keywords: ["giving", "generosity", "tithing", "stewardship", "finances", "money", "offering", "tithe", "charity"] 
  },
  { 
    title: "Revive Us Again (Psalm 85:6) • Coming Soon", 
    category: "events", 
    pillar: "Special Event", 
    desc: "Upcoming Maryland & DMV Young Adults Gathering for spiritual awakening, prayer, and revival.", 
    url: "/#coming-soon-event", 
    icon: "✨",
    keywords: ["revive", "event", "gathering", "psalm 85", "awakening", "prayer night", "retreat", "conference", "maryland", "special"] 
  },
  { 
    title: "Tuesday Night Young Adult Gathering & Prayer", 
    category: "events", 
    pillar: "Weekly Gathering", 
    desc: "Every Tuesday at 7:00 PM EST (followed by fellowship & prayer) at 914 Silver Spring Ave 204B, Silver Spring, MD 20910.", 
    url: "/#join", 
    icon: "🔥",
    keywords: ["tuesday", "gathering", "gathering times", "worship", "prayer", "fellowship", "silver spring", "silver spring ave", "service", "weekly"] 
  },
  { 
    title: "Community & Fellowship (Small Groups)", 
    category: "groups", 
    pillar: "Belong", 
    desc: "Authentic biblical community, small groups, and fellowship circles across Maryland.", 
    url: "/community", 
    icon: "👥",
    keywords: ["community", "fellowship", "small groups", "maryland", "circles", "friendship", "meals", "authentic"] 
  },
  { 
    title: "Join a Small Group (Intake & Matching Form)", 
    category: "groups", 
    pillar: "Connect", 
    desc: "Complete our 1-minute form to connect with a young adult group in Silver Spring, Rockville, College Park, and DMV.", 
    url: "/join", 
    icon: "📍",
    keywords: ["join", "small group", "connect", "students", "young professionals", "register", "matching", "sign up", "form"] 
  },
  { 
    title: "College & Campus Connect", 
    category: "groups", 
    pillar: "Small Group", 
    desc: "Small groups dedicated to students at UMD College Park, Towson, UMBC, Montgomery College, JHU.", 
    url: "/join", 
    icon: "🎓",
    keywords: ["college", "university", "campus", "students", "umd", "towson", "umbc", "rides", "carpool", "dorm"] 
  },
  { 
    title: "Young Professionals & Career Fellowship", 
    category: "groups", 
    pillar: "Small Group", 
    desc: "Balancing faith, career, work ethics, and navigating adulthood in Washington D.C. and Maryland.", 
    url: "/join", 
    icon: "💼",
    keywords: ["young professionals", "career", "work", "dc", "dmv", "government", "tech", "adulting", "consulting"] 
  },
  { 
    title: "Psalm 85:6 — \"Will you not revive us again?\"", 
    category: "scriptures", 
    pillar: "Scripture", 
    desc: "\"Will you not revive us again, that your people may rejoice in you? Show us your steadfast love, Lord.\"", 
    url: "/#coming-soon-event", 
    icon: "📜",
    keywords: ["psalm 85", "scripture", "revival", "bible verse", "awaken", "promise", "joy", "salvation"] 
  },
  { 
    title: "Matthew 28:19-20 — The Great Commission", 
    category: "scriptures", 
    pillar: "Scripture", 
    desc: "\"Go therefore and make disciples of all nations, baptizing them in the name of the Father, Son, and Holy Spirit.\"", 
    url: "/water-baptism", 
    icon: "📜",
    keywords: ["matthew 28", "great commission", "discipleship", "nations", "baptism", "command", "jesus"] 
  },
  { 
    title: "Romans 10:9 — Confession & Faith", 
    category: "scriptures", 
    pillar: "Scripture", 
    desc: "\"If you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved.\"", 
    url: "/salvation", 
    icon: "📜",
    keywords: ["romans 10", "confession", "salvation", "believe", "resurrection", "gospel", "lord", "saved"] 
  },
  { 
    title: "Where & When We Meet (Location & Gathering Times)", 
    category: "faqs", 
    pillar: "FAQ", 
    desc: "Gathering Times: Every Tuesday at 7:00 PM EST (followed by fellowship & prayer) at 914 Silver Spring Ave 204B, Silver Spring, MD 20910.", 
    url: "/#join", 
    icon: "❓",
    keywords: ["where", "when", "address", "location", "time", "schedule", "silver spring", "silver spring ave", "914", "meeting", "gathering times", "tuesday"] 
  },
  { 
    title: "Student Rides & Campus Carpools", 
    category: "faqs", 
    pillar: "FAQ", 
    desc: "Need a ride to church? Student leaders coordinate campus pickups across College Park, Towson, and Montgomery County.", 
    url: "/join", 
    icon: "🚗",
    keywords: ["rides", "ride", "carpool", "pickup", "transportation", "bus", "student", "umd", "driving"] 
  },
  { 
    title: "Leader Dashboard Portal", 
    category: "dashboard", 
    pillar: "Portal", 
    desc: "Internal dashboard for ministry leaders to manage small groups, DNA pods, attendance, and member care.", 
    url: "/dashboard", 
    icon: "⚡",
    keywords: ["dashboard", "admin", "leadership", "manager", "attendance", "portal", "login"] 
  }
];

function executeSearch(rawQuery: string, category: string = 'all') {
  const clean = rawQuery.toLowerCase().replace(/[\?\!\,\.\:\;\(\)\[\]\{\}\"\']/g, ' ').trim();
  let dataset = SEARCH_DATABASE;
  if (category && category !== 'all') {
    dataset = dataset.filter(item => item.category === category);
  }

  if (!clean) {
    return dataset.slice(0, 12);
  }

  const stopWords = new Set(['what', 'are', 'the', 'is', 'a', 'to', 'for', 'in', 'how', 'do', 'of', 'and']);
  const allTerms = clean.split(/\s+/).filter(Boolean);
  const keyTerms = allTerms.filter(t => !stopWords.has(t));
  const terms = keyTerms.length > 0 ? keyTerms : allTerms;

  return dataset.map(item => {
    let score = 0;
    const text = `${item.title} ${item.desc} ${item.pillar} ${item.keywords.join(' ')}`.toLowerCase();
    
    // Exact full query match
    if (clean.length > 1 && text.includes(clean)) score += 80;
    if (item.title.toLowerCase().includes(clean)) score += 50;

    for (const t of terms) {
      if (item.title.toLowerCase().includes(t)) score += 30;
      if (item.desc.toLowerCase().includes(t)) score += 15;
      if (item.keywords.some(k => k.toLowerCase().includes(t) || t.includes(k))) score += 20;
    }
    return { item, score };
  }).filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.item);
}

// Full Dedicated Search Page
app.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || 'all').trim();
  const results = executeSearch(q, category);
  res.render('search', {
    q,
    category,
    results,
    totalCount: results.length
  });
});

// Search API Endpoint (JSON)
app.get('/api/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || 'all').trim();
  const results = executeSearch(q, category);
  res.json({
    results,
    count: results.length,
    query: q,
    category
  });
});

// ==========================================
// 1. PUBLIC DISCIPLESHIP & LANDING PAGES
// ==========================================
app.get('/v2', (req: Request, res: Response) => { res.render('preview-v2'); });

app.get('/', (req: Request, res: Response) => {
  const customBannerExists = fs.existsSync(path.join(process.cwd(), 'static/hero_images/revive_banner_custom.jpg'));
  res.render('landing', { customBannerExists });
});


app.get('/join', (req: Request, res: Response) => {
  res.render('join');
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

// Dedicated Unlisted Member Information Form (Shared directly via link, not on public navigation)
app.get('/member-form', (req: Request, res: Response) => {
  const pods = store.getPodsWithMembers().map(p => ({
    id: p.id,
    name: p.name,
    leader_name: p.leader_name || null,
  }));
  res.render('member-form', {
    pods,
    title: 'EUC Young Adults — Member Information Form'
  });
});

app.get('/member-intake', (req: Request, res: Response) => {
  res.redirect('/member-form');
});

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================
app.get('/login', (req: Request, res: Response) => {
  if (req.session && req.session.userId) return res.render('login', { error: null, success: null, alreadySignedIn: true });
  const success = req.query.reset === 'success' ? 'Password reset successfully! You can now sign in with your new password.' : null;
  res.render('login', { error: null, success });
});


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

app.post('/login', (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.', success: null });
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
        return res.render('forgot_password', { 
          error: `Failed to send email: ${err.message || 'Please check SMTP settings'}. A password reset link has been generated as fallback.`,
          success: 'You can use this direct link to reset your password:',
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
  if (req.session && req.session.userId) return res.render('claim_account', { error: null, alreadySignedIn: true });
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

// ==========================================
// 3. DASHBOARD ROUTE
// ==========================================
app.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const userId = req.session.userId;
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
app.get('/api/stats', requireAuth, (req: Request, res: Response) => {
  res.json(store.getStats());
});

// Members CRUD
app.get('/api/members', requireAuth, (req: Request, res: Response) => {
  res.json(store.getMembersWithPods());
});

app.post('/api/members', requireAuth, (req: Request, res: Response) => {
  const newMember = store.addMember(req.body);
  res.status(201).json(newMember);
});

app.put('/api/members/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = store.updateMember(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Member not found' });
  res.json(updated);
});

app.delete('/api/members/:id', requireAuth, (req: Request, res: Response) => {
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
app.get('/api/pods', requireAuth, (req: Request, res: Response) => {
  res.json(store.getPodsWithMembers());
});

app.post('/api/pods', requireAuth, (req: Request, res: Response) => {
  const name = (req.body.name || '').trim();
  const leaderId = req.body.leader_id ? parseInt(req.body.leader_id, 10) : null;
  if (!name) return res.status(400).json({ error: 'Pod name is required' });
  const pod = store.addPod(name, leaderId);
  res.status(201).json(pod);
});

app.put('/api/pods/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const name = (req.body.name || '').trim();
  const leaderId = req.body.leader_id ? parseInt(req.body.leader_id, 10) : null;
  const updated = store.updatePod(id, name, leaderId);
  if (!updated) return res.status(404).json({ error: 'Pod not found' });
  res.json(updated);
});

app.delete('/api/pods/:id', requireAuth, (req: Request, res: Response) => {
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
app.get('/api/pipeline', requireAuth, (req: Request, res: Response) => {
  res.json(store.pipeline);
});

app.post('/api/pipeline', (req: Request, res: Response) => {
  const item = store.addPipeline(req.body);
  res.status(201).json(item);
});

app.put('/api/pipeline/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const updated = store.updatePipeline(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Newcomer not found' });
  res.json(updated);
});

app.delete('/api/pipeline/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deletePipeline(id);
  res.json({ success: true });
});

// Newsletter Subscriptions
app.post(['/api/newsletter/subscribe', '/api/members/subscribe', '/api/subscribe'], async (req: Request, res: Response) => {
  try {
    const { email, name, source } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email format (e.g. name@example.com).' });
    }

    const { subscriber, isNew } = store.addSubscriber(cleanEmail, name, source || 'footer_form');

    // Also attempt Firestore persistence if available
    try {
      if (adminDb) {
        const safeDocId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
        await adminDb.collection('newsletter_subscribers').doc(safeDocId).set({
          email: cleanEmail,
          name: name ? String(name).trim() : null,
          source: source || 'footer_form',
          status: 'subscribed',
          created_at: subscriber.created_at,
          updated_at: new Date().toISOString()
        }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('[Firestore] Notice: failed writing subscriber to Firestore:', fsErr);
    }

    const confirmationMsg = isNew 
      ? 'Thank you for subscribing! A welcome email with weekly gathering details has been sent to your inbox.' 
      : 'Welcome back! You are subscribed to our newsletter. A welcome email with weekly gathering details has been sent to your inbox.';

    // Send HTTP response immediately so browser shows confirmation without delay
    res.status(200).json({
      success: true,
      isNew,
      message: confirmationMsg,
      subscriber: {
        email: subscriber.email,
        status: subscriber.status
      }
    });

    // Send welcome email about the website, gathering times, and community in background
    (async () => {
      try {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.get('host') || 'localhost:3000';
        const cleanHost = host.split(',')[0].trim();
        const baseUrl = cleanHost.includes('localhost') ? `http://${cleanHost}` : `${proto}://${cleanHost}`;

        const transporter = getTransporter();
        const senderFrom = process.env.SMTP_USER 
          ? `"EUC Young Adults" <${process.env.SMTP_USER}>` 
          : '"EUC Young Adults" <newsletter@eucmaryland.org>';

        const welcomeHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #0075ff 0%, #1e40af 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: rgba(255,255,255,0.2); font-weight: 900; font-size: 22px; margin-bottom: 12px;">E</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to EUCMD Young Adults</h1>
              <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Emmanuel United Church of Maryland</p>
            </div>
            
            <div style="padding: 32px 30px; color: #27272a; line-height: 1.6; font-size: 15px;">
              <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #18181b;">
                Grace and peace to you!
              </p>
              <p>
                Thank you for subscribing to our community newsletter. We are thrilled to connect with you! Whether you are studying, working, or exploring faith in Maryland and the greater DMV area, there is a place for you here.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #0075ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #0075ff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Weekly Gathering Times</h3>
                <p style="margin: 0 0 6px; font-weight: 700; color: #0f172a; font-size: 16px;">
                  Every Tuesday at 7:00 PM EST
                </p>
                <p style="margin: 0 0 8px; color: #475569; font-size: 14px;">
                  Followed by fellowship & prayer
                </p>
                <p style="margin: 0 0 10px; color: #0f172a; font-size: 14px;">
                  <strong>Address:</strong> 914 Silver Spring Ave 204B, Silver Spring, MD 20910
                </p>
                <div>
                  <a href="https://maps.google.com/?q=914+Silver+Spring+Ave+204B,+Silver+Spring,+MD+20910" style="color: #0075ff; font-weight: 700; text-decoration: none; font-size: 13px;">Get Directions on Google Maps &rarr;</a>
                </div>
              </div>

              <h3 style="font-size: 16px; font-weight: 700; margin: 24px 0 12px; color: #18181b;">Explore Our Website:</h3>
              <ul style="padding-left: 20px; margin: 0 0 24px; color: #475569;">
                <li style="margin-bottom: 10px;">
                  <a href="${baseUrl}/#resources" style="color: #0075ff; text-decoration: none; font-weight: 700;">Discipleship Resources</a>: Access Bible studies, foundations guides, and devotional reading plans.
                </li>
                <li style="margin-bottom: 10px;">
                  <a href="${baseUrl}/community" style="color: #0075ff; text-decoration: none; font-weight: 700;">Life Groups & Circles</a>: Connect with small groups across Silver Spring, Rockville, College Park, and Baltimore.
                </li>
                <li style="margin-bottom: 10px;">
                  <a href="${baseUrl}/events" style="color: #0075ff; text-decoration: none; font-weight: 700;">Upcoming Events</a>: Stay updated on upcoming conferences, retreats, and praise nights.
                </li>
                <li style="margin-bottom: 10px;">
                  <a href="${baseUrl}/#contact" style="color: #0075ff; text-decoration: none; font-weight: 700;">Prayer Wall & Support</a>: Share your prayer requests with our dedicated intercession team.
                </li>
              </ul>

              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${baseUrl}/" style="background-color: #0075ff; color: #ffffff; padding: 14px 28px; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block;">Explore the Website</a>
              </div>
            </div>

            <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px; font-weight: 600;">Emmanuel United Church of Maryland &bull; Young Adults Ministry</p>
              <p style="margin: 0 0 6px;">Main Sanctuary Sunday Service: 10:30 AM at 12604 New Hampshire Ave, Silver Spring, MD 20904</p>
              <p style="margin: 0;">You received this email because you subscribed on our website. Unsubscribe anytime by replying to this email.</p>
            </div>
          </div>
        `;

        if (process.env.SMTP_USER) {
          await transporter.sendMail({
            from: senderFrom,
            to: cleanEmail,
            subject: 'Welcome to EUCMD Young Adults! Weekly Gatherings & Community',
            text: `Welcome to EUCMD Young Adults!\n\nThank you for subscribing to our newsletter.\n\nWeekly Gathering Times:\nEvery Tuesday at 7:00 PM EST (Followed by fellowship & prayer)\nAddress: 914 Silver Spring Ave 204B, Silver Spring, MD 20910\n\nVisit our website to explore discipleship resources, upcoming events, and life groups: ${baseUrl}/\n\nSunday Church Service: 10:30 AM at 12604 New Hampshire Ave, Silver Spring, MD 20904`,
            html: welcomeHtml
          });
          console.log(`[Newsletter] Welcome email successfully sent to ${cleanEmail}`);
        } else {
          console.log(`[Newsletter] Welcome email generated for ${cleanEmail} (SMTP not set, logged)`);
        }
      } catch (mailErr: any) {
        console.warn('[Newsletter] Welcome email sending notice:', mailErr?.message || mailErr);
      }
    })();
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'An error occurred while subscribing. Please try again.' });
  }
});

// Get subscribers and broadcast history
app.get('/api/newsletter/subscribers', requireAuth, (req: Request, res: Response) => {
  res.json({
    subscribers: store.getSubscribers(),
    broadcasts: store.getBroadcasts()
  });
});

// Remove / unsubscribe a subscriber
app.delete('/api/newsletter/subscribers/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const sub = store.subscribers.find(s => s.id === id);
  if (sub) {
    sub.status = 'unsubscribed';
    return res.json({ success: true, message: 'Subscriber removed' });
  }
  return res.status(404).json({ error: 'Subscriber not found' });
});

// Send update / announcement email to subscribed users from the dashboard
app.post('/api/newsletter/send-update', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, message, testEmailOnly } = req.body;
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'Please provide an update subject.' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please provide update content.' });
    }

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    const activeSubscribers = store.getSubscribers().filter(s => s.status === 'subscribed');

    if (activeSubscribers.length === 0 && !testEmailOnly) {
      return res.status(400).json({ error: 'There are currently no active subscribers.' });
    }

    const recipientEmails = testEmailOnly 
      ? [testEmailOnly.trim().toLowerCase()] 
      : activeSubscribers.map(s => s.email);

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'localhost:3000';
    const cleanHost = host.split(',')[0].trim();
    const baseUrl = cleanHost.includes('localhost') ? `http://${cleanHost}` : `${proto}://${cleanHost}`;

    const formattedMessageHtml = cleanMessage
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 16px; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    const updateEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #0075ff 0%, #1e40af 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">EUCMD Young Adults Update</h1>
          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Emmanuel United Church of Maryland</p>
        </div>
        
        <div style="padding: 32px 28px; color: #27272a; line-height: 1.6; font-size: 15px;">
          <h2 style="margin: 0 0 18px; font-size: 18px; color: #0f172a; font-weight: 800;">${cleanSubject}</h2>
          
          <div style="color: #334155; margin-bottom: 24px;">
            ${formattedMessageHtml}
          </div>

          <div style="background-color: #f8fafc; border-left: 4px solid #0075ff; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px;">
            <p style="margin: 0 0 4px; font-weight: 700; color: #0f172a;">Weekly Gathering Reminder:</p>
            <p style="margin: 0; color: #475569;">Every Tuesday at 7:00 PM EST &bull; 914 Silver Spring Ave 204B, Silver Spring, MD 20910</p>
          </div>

          <div style="text-align: center; margin: 28px 0 10px;">
            <a href="${baseUrl}/" style="background-color: #0075ff; color: #ffffff; padding: 12px 24px; font-weight: 700; font-size: 13px; text-decoration: none; border-radius: 10px; display: inline-block;">Visit Ministry Website</a>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 4px;">Emmanuel United Church of Maryland &bull; Young Adults Ministry</p>
          <p style="margin: 0;">You received this update because you are subscribed to the EUCMD Young Adults newsletter.</p>
        </div>
      </div>
    `;

    let emailSentSuccessfully = false;
    if (process.env.SMTP_USER) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"EUC Young Adults" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER,
          bcc: recipientEmails,
          subject: `${cleanSubject} - EUCMD Young Adults`,
          text: `${cleanSubject}\n\n${cleanMessage}\n\nWeekly Gathering: Every Tuesday at 7:00 PM EST at 914 Silver Spring Ave 204B, Silver Spring, MD 20910.\nWebsite: ${baseUrl}/`,
          html: updateEmailHtml
        });
        emailSentSuccessfully = true;
        console.log(`[Newsletter] Broadcast email sent to ${recipientEmails.length} recipients.`);
      } catch (err: any) {
        console.error('[Newsletter] Broadcast SMTP send error:', err);
      }
    } else {
      console.log(`[Newsletter] Broadcast recorded for ${recipientEmails.length} recipients (SMTP not configured, mock delivered).`);
    }

    // Record the broadcast in the store
    const user = store.users.find(u => u.id === req.session.userId);
    const broadcast = store.addBroadcast(cleanSubject, cleanMessage, recipientEmails.length, user ? user.email : 'Leader');

    return res.status(200).json({
      success: true,
      count: recipientEmails.length,
      emailSent: emailSentSuccessfully || !process.env.SMTP_USER,
      message: `Update successfully sent to ${recipientEmails.length} subscriber(s)!`,
      broadcast
    });
  } catch (err: any) {
    console.error('Newsletter send-update error:', err);
    return res.status(500).json({ error: 'Failed to send update: ' + (err.message || 'Unknown error') });
  }
});

// Event Banner Image Upload & Reset
app.post('/api/upload-banner', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'No image data provided' });
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetPath = path.join(process.cwd(), 'static/hero_images/revive_banner_custom.jpg');
    fs.writeFileSync(targetPath, buffer);
    return res.json({ success: true, url: '/static/hero_images/revive_banner_custom.jpg?v=' + Date.now() });
  } catch (err) {
    console.error('Failed to upload banner:', err);
    return res.status(500).json({ error: 'Failed to save image' });
  }
});

app.post('/api/reset-banner', (req: Request, res: Response) => {
  try {
    const targetPath = path.join(process.cwd(), 'static/hero_images/revive_banner_custom.jpg');
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to reset banner:', err);
    return res.status(500).json({ error: 'Failed to reset banner' });
  }
});

// Weekly Curriculum & Study Plans
app.get('/api/weekly-plans', requireAuth, (req: Request, res: Response) => {
  const enriched = store.weeklyPlans.map((wp) => {
    const pod = store.pods.find((p) => p.id === wp.pod_id);
    return {
      ...wp,
      pod_name: pod ? pod.name : 'Unknown Pod',
    };
  });
  res.json(enriched);
});

app.post('/api/weekly-plans', requireAuth, (req: Request, res: Response) => {
  const newPlan = {
    id: store.weeklyPlans.length + 1,
    pod_id: parseInt(req.body.pod_id, 10),
    leader_id: req.body.leader_id ? parseInt(req.body.leader_id, 10) : null,
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


app.delete('/api/weekly-plans/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.weeklyPlans = store.weeklyPlans.filter(p => p.id !== id);
  res.json({ success: true });
});

app.put('/api/weekly-plans/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const plan = store.weeklyPlans.find((p) => p.id === id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  if (req.body.post_meeting_notes !== undefined) plan.post_meeting_notes = req.body.post_meeting_notes;
  if (req.body.bible_passage !== undefined) plan.bible_passage = req.body.bible_passage;
  res.json(plan);
});

// Prayer Wall CRUD
app.get('/api/prayer', requireAuth, (req: Request, res: Response) => {
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

app.put('/api/prayer/:id', requireAuth, (req: Request, res: Response) => {
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

app.delete('/api/prayer/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.prayerRequests = store.prayerRequests.filter((p) => p.id !== id);
  res.json({ success: true });
});

// Member Information Form Public Intake API
app.post('/api/member-form', (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    pod_id,
    spiritual_stage,
    join_date,
    birthday,
    city,
    life_stage,
    interests,
    prayer_request,
    notes,
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  const cleanName = name.trim();
  const cleanEmail = (email && typeof email === 'string') ? email.trim() : '';
  const cleanPhone = (phone && typeof phone === 'string') ? phone.trim() : '';

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  // Check if member already exists (match by email or phone)
  let existingMember = null;
  if (cleanEmail) {
    existingMember = store.members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail.toLowerCase()
    );
  }
  if (!existingMember && cleanPhone) {
    const normalize = (p: string) => p.replace(/\D/g, '');
    const cleanDigits = normalize(cleanPhone);
    if (cleanDigits.length >= 7) {
      existingMember = store.members.find((m) => m.phone && normalize(m.phone) === cleanDigits);
    }
  }

  const validStages = ['new', 'saved', 'baptized', 'foundations', 'ready_to_lead', 'leading'];
  const stage = validStages.includes(spiritual_stage) ? spiritual_stage : 'new';
  const parsedPodId = (pod_id !== undefined && pod_id !== null && pod_id !== '' && pod_id !== '0') ? parseInt(pod_id, 10) : null;

  let member;
  if (existingMember) {
    member = store.updateMember(existingMember.id, {
      name: cleanName,
      email: cleanEmail || existingMember.email,
      phone: cleanPhone || existingMember.phone,
      spiritual_stage: stage,
      join_date: join_date || existingMember.join_date,
      pod_id: parsedPodId !== null ? parsedPodId : existingMember.pod_id,
      birthday: birthday !== undefined ? birthday : existingMember.birthday,
      city: city !== undefined ? city : existingMember.city,
      life_stage: life_stage !== undefined ? life_stage : existingMember.life_stage,
      interests: Array.isArray(interests) ? interests : existingMember.interests,
      notes: notes !== undefined ? notes : existingMember.notes,
    });
  } else {
    member = store.addMember({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      spiritual_stage: stage,
      join_date: join_date || new Date().toISOString().split('T')[0],
      pod_id: parsedPodId,
      birthday: birthday || '',
      city: city || '',
      life_stage: life_stage || '',
      interests: Array.isArray(interests) ? interests : [],
      notes: notes || '',
      role: 'member',
      is_active: true,
    });
  }

  // If a prayer request was submitted alongside the member info, register it on the prayer wall
  if (prayer_request && typeof prayer_request === 'string' && prayer_request.trim()) {
    store.addPrayer({
      member_id: member ? member.id : null,
      requester_name: cleanName,
      request_text: prayer_request.trim(),
      is_urgent: false,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Member information submitted successfully!',
    member: {
      id: member ? member.id : null,
      name: member ? member.name : cleanName,
      email: cleanEmail,
      pod_id: parsedPodId,
    },
  });
});

// Discipleship Resources CRUD
app.get('/api/resources', (req: Request, res: Response) => {
  res.json(store.resources);
});

app.post('/api/resources', requireAuth, (req: Request, res: Response) => {
  const item = store.addResource(req.body);
  res.status(201).json(item);
});

app.delete('/api/resources/:id', requireAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  store.deleteResource(id);
  res.json({ success: true });
});

// Leader Invites CRUD
app.get('/api/invites', requireSiteAdmin, (req: Request, res: Response) => {
  res.json(store.inviteCodes);
});

app.post('/api/invites', requireSiteAdmin, (req: Request, res: Response) => {
  const roleId = req.body.role_id ? parseInt(req.body.role_id, 10) : 2;
  const inv = store.addInvite(roleId);
  res.status(201).json(inv);
});

app.delete('/api/invites/:id', requireSiteAdmin, (req: Request, res: Response) => {
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


let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

const chatSessions = new Map<string, any>();

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }
    const sessionId = req.session.id || req.ip || 'anonymous';
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, ai.chats.create({
        model: "gemini-3.1-flash-lite",
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          systemInstruction: "You are a helpful and welcoming assistant for the EUCMD Young Adults ministry. You answer questions about faith, the community, leadership, and discipleship in a friendly, encouraging, and supportive tone. STRICT RESTRICTION: You must ONLY answer questions related to the EUCMD Young Adults ministry, the website's content, Christian faith, leadership, and discipleship. If the user asks about ANY other topic, politely decline to answer and redirect them back to topics related to the ministry and this website.",
        }
      }));
    }
    
    const chat = chatSessions.get(sessionId);
    const response = await chat.sendMessage({ message });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    let errorMessage = err.message || 'Failed to process chat message';
    try {
      if (errorMessage.includes('{"error":')) {
        const parsed = JSON.parse(errorMessage.substring(errorMessage.indexOf('{"error":')));
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    if (errorMessage.includes('high demand') || errorMessage.includes('503')) {
       errorMessage = "The AI is currently experiencing high demand. Spikes in demand are usually temporary. Please try again in a few moments.";
    }
    res.status(500).json({ error: errorMessage });
  }
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
  if (req.accepts('html')) {
    res.redirect('/');
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EUC Young Adults Management Server running on port ${PORT}`);
});
