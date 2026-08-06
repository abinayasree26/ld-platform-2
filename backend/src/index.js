require('./config/env');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const errorHandler  = require('./middleware/errorHandler');
const env           = require('./config/env');

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.cors.origins, credentials: true }));
const { xssSanitizer } = require('./middleware/xss.middleware');

app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));
app.use(xssSanitizer);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const isDev = env.nodeEnv === 'development' || env.demoMode;
const apiLimiter  = rateLimit({
  windowMs: 60_000,
  max: isDev ? 5000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.demoMode || isDev,
  message: { error: 'Too many requests. Please try again in a minute.' },
});
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: isDev ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.demoMode || isDev,
  message: { error: 'Too many login attempts. Please wait a minute and try again.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/ping', (_req, res) => res.json({ ok: true, ts: new Date().toISOString(), demo: env.demoMode }));
app.get('/health', (_req, res) => res.json({ status: 'ok', demo: env.demoMode }));

// ══════════════════════════════════════════════════════════════════════════════
// DEMO MODE — mount demo routers that return mock data (no DB needed)
// ══════════════════════════════════════════════════════════════════════════════
if (env.demoMode) {
  const { demoAuth, demoScreening, demoPractice, demoTests, demoAnalytics, demoSchools, demoAdmin } = require('./middleware/demoMode');
  const { requireAuth } = require('./middleware/auth');

  // Auth routes (demo — accepts any credentials)
  app.use('/api/auth', demoAuth);

  // Screening (demo data)
  app.use('/api/screening', requireAuth, demoScreening);

  // Practice engine (demo data)
  app.use('/api/practice', requireAuth, demoPractice);

  // Also mount at /api/ld/* paths for compatibility
  app.use('/api/ld/screening', requireAuth, demoScreening);
  app.use('/api/ld/practice', requireAuth, demoPractice);

  // Tests (demo data)
  app.use('/api/tests', requireAuth, demoTests);
  app.use('/api/ld/tests', requireAuth, demoTests);

  // LD Chatbot (works in both demo and production — uses llama.cpp directly)
  app.use('/api/ld/chat', requireAuth, require('./routes/ld/chat'));

  app.use('/api/ld/notifications', requireAuth, require('./routes/ld/notifications'));
  app.use('/api/ld/push', requireAuth, require('./routes/ld/push'));

  // STT — Offline speech-to-text via local Whisper.cpp
  app.use('/api/ld/stt', requireAuth, require('./routes/ld/stt'));

  // LD Analytics (demo mode — returns demo data same shape as production)
  app.use('/api/ld/analytics', requireAuth, demoAnalytics);

  // Analytics (demo data)
  app.use('/api/analytics', requireAuth, demoAnalytics);

  // Schools (demo data)
  app.use('/api/schools', requireAuth, demoSchools);

  // Admin management (demo data)
  app.use('/api/admin', requireAuth, demoAdmin);

  // Payments router (Razorpay order & verify)
  app.use('/api/payments', require('./routes/shared/payments'));

  // Catch-all for other /api/ld/* routes
  app.use('/api/ld', requireAuth, (req, res) => {
    res.json({ demo: true, message: `Demo endpoint: ${req.method} ${req.originalUrl}`, data: {} });
  });

  // Catch-all for school routes
  app.use('/api/school', requireAuth, (req, res) => {
    res.json({ demo: true, message: `Demo endpoint: ${req.method} ${req.originalUrl}`, data: [] });
  });

  // Catch-all for any other API route
  app.use('/api', (req, res) => {
    res.json({ demo: true, message: `Demo mode — ${req.method} ${req.originalUrl} not implemented`, data: {} });
  });

} else {
  // ══════════════════════════════════════════════════════════════════════════════
  // PRODUCTION MODE — real database routes
  // ══════════════════════════════════════════════════════════════════════════════
  const runMigrations = require('./db/migrate');

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/api/auth',       require('./routes/auth'));
  app.use('/api/schools',    require('./routes/shared/schools'));
  app.use('/api/students',   require('./routes/shared/students'));
  app.use('/api/analytics',  require('./routes/shared/analytics'));
  app.use('/api/payments',   require('./routes/shared/payments'));
  app.use('/api/admin',      require('./routes/shared/admin'));
  app.use('/api/reports',    require('./routes/shared/reports'));

  // LD Platform — Screening Quiz (new comprehensive routes)
  app.use('/api/screening',  require('./middleware/auth').requireAuth, require('./routes/screening'));

  // LD Platform — Adaptive Practice Engine (mounted alongside /api/ld/practice)
  app.use('/api/practice',   require('./routes/practice'));

  // School ERP
  app.use('/api/school/attendance',     require('./routes/school/attendance'));
  app.use('/api/school/fees',           require('./routes/school/fees'));
  app.use('/api/school/staff',          require('./routes/school/staff'));
  app.use('/api/school/timetable',      require('./routes/school/timetable'));
  app.use('/api/school/admissions',     require('./routes/school/admissions'));
  app.use('/api/school/examinations',   require('./routes/school/examinations'));
  app.use('/api/school/communications', require('./routes/school/communications'));

  // School ERP — Expanded (Chalo ERP Blueprint)
  app.use('/api/school/masters/academic',      require('./routes/school/masters/academic'));
  app.use('/api/school/masters/demographics',  require('./routes/school/masters/demographics'));
  app.use('/api/school/masters/time-config',   require('./routes/school/masters/time-config'));
  app.use('/api/school/branches',              require('./routes/school/branches'));
  app.use('/api/school/roles',                 require('./routes/school/roles'));
  app.use('/api/school/users',                 require('./routes/school/users'));
  app.use('/api/school/holidays',              require('./routes/school/holidays'));
  app.use('/api/school/events',                require('./routes/school/events'));
  app.use('/api/school/fee-collections',       require('./routes/school/fee-collections'));
  app.use('/api/school/fee-concessions',       require('./routes/school/fee-concessions'));
  app.use('/api/school/fee-refunds',           require('./routes/school/fee-refunds'));
  app.use('/api/school/day-closure',           require('./routes/school/day-closure'));
  app.use('/api/school/payments-online',       require('./routes/school/payments-online'));
  app.use('/api/school/transport',             require('./routes/school/transport'));
  app.use('/api/school/visitors',              require('./routes/school/visitors'));
  app.use('/api/school/approvals',             require('./routes/school/approvals'));

  // LD Platform
  app.use('/api/ld/screening',         require('./routes/ld/screening'));
  app.use('/api/ld/practice',          require('./routes/ld/practice'));
  app.use('/api/ld/tests',             require('./routes/ld/tests'));
  app.use('/api/ld/recommendations',   require('./routes/ld/recommendations'));
  app.use('/api/ld/messages',          require('./routes/ld/messages'));
  app.use('/api/ld/tts',               require('./routes/ld/tts'));
  app.use('/api/ld/chat',              require('./routes/ld/chat'));
  app.use('/api/ld/analytics',         require('./routes/ld/analytics'));
  app.use('/api/ld/notifications',     require('./routes/ld/notifications'));
  app.use('/api/ld/push',              require('./routes/ld/push'));
  app.use('/api/ld/stt',               require('./routes/ld/stt'));

  // Run migrations on startup — UNLESS explicitly skipped.
  // Set SKIP_MIGRATIONS=true when connecting to a SHARED / production DB that is
  // managed by a different migration system, so this backend never alters that
  // schema (prevents crashes/conflicts on the team's Proxmox database).
  async function runStartupMigrations() {
    if (String(process.env.SKIP_MIGRATIONS).toLowerCase() === 'true') {
      console.log('[App] SKIP_MIGRATIONS=true — not running migrations (shared/managed DB).');
      return;
    }
    try {
      console.log('[App] Running migrations…');
      await runMigrations();
      console.log('[App] Migrations done.');
    } catch (err) {
      console.error('[App] Migration failed:', err.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('  ⚠️  [App] DB server unreachable — server will continue running (fallback mode active)');
      }
    }
  }
  runStartupMigrations();
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start HTTP & WebSocket Server ──────────────────────────────────────────────
const http = require('http');
const { initSocketService } = require('./services/socket.service');

const server = http.createServer(app);
initSocketService(server);

server.listen(env.port, () => {
  console.log(`[App] API & WebSockets running on port ${env.port} (${env.nodeEnv}${env.demoMode ? ' — DEMO MODE' : ''})`);
});
