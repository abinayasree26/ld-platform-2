const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { query } = require('../config/database');
const redis    = require('../config/redis');
const env      = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  loginSchema,
  adminCredentialsSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');
const { requestOtp, verifyOtp } = require('../services/otpService');
const { sendPasswordResetEmail } = require('../services/email.service');

const sign = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: options.expiresIn || env.jwt.expiresIn });

// Email + password login (teachers, school admins)
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user?.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ id: user.id, role: user.role, schoolId: user.school_id });
    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
});

// Admin login (username + password with bcrypt support)
router.post('/credentials', validate(adminCredentialsSchema), async (req, res) => {
  const { username, password } = req.body;
  if (username !== env.admin.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Support hashed password comparison or fallback to direct comparison
  let isMatch = false;
  if (env.admin.passwordHash) {
    isMatch = await bcrypt.compare(password, env.admin.passwordHash);
  } else {
    isMatch = (password === env.admin.password);
  }

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = sign({ id: 'admin', role: 'super_admin', schoolId: null }, { expiresIn: '12h' });
  res.json({ token, user: { id: 'admin', role: 'super_admin', name: 'Administrator' } });
});

// Register (create teacher account)
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone, role, class_grade, age } = req.body;
    const userRole = ['student', 'teacher', 'parent'].includes(role) ? role : 'teacher';

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const userId = uuid();
    const { rows } = await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, phone, role, school_id, created_at`,
      [userId, name.trim(), email.toLowerCase().trim(), phone || null, hash, userRole]
    );
    const user = rows[0];

    // For students, create the student profile row so grade/age drive
    // grade-aware AI questions and the rest of the LD flow.
    if (userRole === 'student') {
      await query(
        `INSERT INTO students (user_id, class_grade, age, current_level)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id) DO UPDATE SET class_grade = EXCLUDED.class_grade, age = EXCLUDED.age`,
        [userId, class_grade || null, age || null]
      ).catch((e) => console.warn('[register] student row insert failed:', e.message));
    }

    const token = sign({ id: user.id, role: user.role, schoolId: user.school_id });
    res.status(201).json({ token, user });
  } catch (err) { next(err); }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const { rows } = await query(
      `SELECT rt.*, u.role, u.school_id FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.revoked = FALSE`,
      [refreshToken]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const row   = rows[0];
    const token = sign({ id: row.user_id, role: row.role, schoolId: row.school_id });
    res.json({ token });
  } catch (err) { next(err); }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const decoded = jwt.decode(req.token);
    const ttl     = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
    if (ttl > 0) await redis.setex(`bl:${req.token}`, ttl, '1').catch(() => {});
  } catch { /* ignore */ }
  res.json({ ok: true });
});

// Me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, phone, role, school_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

// Request a one-time login code (email or phone) — FR-01
router.post('/otp/request', validate(otpRequestSchema), async (req, res, next) => {
  try {
    const { identifier } = req.body;

    const result = await requestOtp(identifier);
    if (!result.ok) return res.status(400).json({ error: result.error });

    res.json({ ok: true, ...(result.devCode ? { devCode: result.devCode } : {}) });
  } catch (err) { next(err); }
});

// Verify a one-time login code and issue a JWT — FR-01
router.post('/otp/verify', validate(otpVerifySchema), async (req, res, next) => {
  try {
    const { identifier, code } = req.body;

    const result = await verifyOtp(identifier, code);
    if (!result.ok) return res.status(400).json({ error: result.error });

    const user = result.user;
    const token = sign({ id: user.id, role: user.role, schoolId: user.school_id });
    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
});

// Request password reset email
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    let user = { name: 'User', email: cleanEmail };
    if (!env.demoMode) {
      const { rows } = await query('SELECT id, name, email FROM users WHERE email = $1', [cleanEmail]);
      if (rows.length) user = rows[0];
    }

    const resetToken = jwt.sign({ email: cleanEmail, type: 'pwd_reset' }, env.jwt.secret, { expiresIn: '15m' });
    await sendPasswordResetEmail(cleanEmail, user.name, resetToken);

    res.json({
      ok: true,
      message: 'Password reset link sent to your email address.',
      ...(env.demoMode ? { devResetToken: resetToken } : {}),
    });
  } catch (err) { next(err); }
});

// Reset password with token
router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, env.jwt.secret);

    if (decoded.type !== 'pwd_reset') {
      return res.status(400).json({ error: 'Invalid reset token type' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    if (!env.demoMode) {
      await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, decoded.email]);
    }

    res.json({ ok: true, message: 'Password updated successfully! You can now log in.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }
    next(err);
  }
});

// Demo login
router.post('/demo', async (req, res, next) => {
  try {
    const { role = 'teacher' } = req.body;
    const allowed = ['teacher', 'student', 'parent', 'school_admin'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid demo role' });

    const { rows } = await query(
      `SELECT id, name, email, role, school_id FROM users
       WHERE role = $1 AND name ILIKE '%demo%' LIMIT 1`,
      [role]
    );
    if (!rows.length) return res.status(404).json({ error: `No demo ${role} account found` });

    const token = sign({ id: rows[0].id, role: rows[0].role, schoolId: rows[0].school_id });
    res.json({ token, user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
