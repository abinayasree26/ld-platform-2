const crypto = require('crypto');
const { query } = require('../config/database');
const { sendEmail } = require('./email.service');
const env = require('../config/env');

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const normalize = (identifier) => identifier.trim().toLowerCase();
const isEmail = (identifier) => identifier.includes('@');

// Generate and deliver a one-time login code for an existing user (FR-01)
async function requestOtp(identifier) {
  const id = normalize(identifier);

  const { rows: users } = await query('SELECT id FROM users WHERE email = $1 OR phone = $1', [id]);
  if (!users.length) return { ok: false, error: 'No account found with that email or phone number' };

  const { rows: recent } = await query(
    `SELECT created_at FROM otp_codes WHERE identifier = $1 ORDER BY created_at DESC LIMIT 1`,
    [id]
  );
  if (recent.length) {
    const secondsSince = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)}s before requesting another code` };
    }
  }

  const code = String(crypto.randomInt(100000, 999999));

  await query(
    `INSERT INTO otp_codes (id, identifier, code_hash, expires_at)
     VALUES (uuid_generate_v4(), $1, $2, NOW() + INTERVAL '${OTP_TTL_MINUTES} minutes')`,
    [id, hashCode(code)]
  );

  if (isEmail(id) && env.smtp.user) {
    await sendEmail(id, 'Your LD Schools login code', `<p>Your login code is <b>${code}</b>. It expires in ${OTP_TTL_MINUTES} minutes.</p>`);
  } else {
    console.log(`[OTP] Login code for ${id}: ${code} (expires in ${OTP_TTL_MINUTES}m)`);
  }

  // In non-production, return the code directly so the UI can show it
  // (no SMTP/SMS provider configured yet for dev environments).
  return { ok: true, devCode: env.nodeEnv !== 'production' ? code : undefined };
}

// Verify a one-time code and return the matching user (FR-01)
async function verifyOtp(identifier, code) {
  const id = normalize(identifier);

  const { rows } = await query(
    `SELECT * FROM otp_codes WHERE identifier = $1 AND consumed = false ORDER BY created_at DESC LIMIT 1`,
    [id]
  );
  if (!rows.length) return { ok: false, error: 'No code requested. Please request a new code.' };

  const otp = rows[0];
  if (new Date(otp.expires_at) < new Date()) return { ok: false, error: 'Code expired. Please request a new one.' };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many attempts. Please request a new code.' };

  if (hashCode(String(code)) !== otp.code_hash) {
    await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
    return { ok: false, error: 'Invalid code' };
  }

  await query('UPDATE otp_codes SET consumed = true WHERE id = $1', [otp.id]);

  const { rows: users } = await query('SELECT * FROM users WHERE email = $1 OR phone = $1', [id]);
  if (!users.length) return { ok: false, error: 'Account not found' };

  return { ok: true, user: users[0] };
}

module.exports = { requestOtp, verifyOtp };
