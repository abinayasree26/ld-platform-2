const router   = require('express').Router();
const crypto   = require('crypto');
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const env      = require('../../config/env');

// Create Razorpay payment order
router.post('/order', requireAuth, async (req, res, next) => {
  try {
    const { amount, currency = 'INR', planType = 'pro' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const keyId = env.razorpay.keyId || 'rzp_test_demoKey123';
    const keySecret = env.razorpay.keySecret || 'demoSecretKey123';

    let orderId;
    if (env.razorpay.keyId && env.razorpay.keySecret) {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await rzp.orders.create({
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt: `receipt_${uuid().slice(0, 8)}`,
        notes: { planType, userId: req.user.id }
      });
      orderId = order.id;
    } else {
      // Demo / Test Mode order ID fallback
      orderId = `order_demo_${uuid().slice(0, 12)}`;
    }

    if (!env.demoMode) {
      await query(
        `INSERT INTO payment_orders (id, user_id, razorpay_order_id, amount, currency, status)
         VALUES ($1,$2,$3,$4,$5,'created')`,
        [uuid(), req.user.id, orderId, amount, currency]
      ).catch(() => {});
    }

    res.json({
      orderId,
      amount: Math.round(amount * 100),
      currency,
      keyId,
      demoMode: !env.razorpay.keyId,
    });
  } catch (err) { next(err); }
});

// Verify payment signature
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    // In production with real keys, verify HMAC SHA256 signature
    if (env.razorpay.keySecret && !razorpay_order_id.startsWith('order_demo_')) {
      const expected = crypto
        .createHmac('sha256', env.razorpay.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expected !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }
    }

    if (!env.demoMode) {
      await query(
        `UPDATE payment_orders SET status='paid', razorpay_payment_id=$1 WHERE razorpay_order_id=$2`,
        [razorpay_payment_id, razorpay_order_id]
      ).catch(() => {});
    }

    res.json({ ok: true, message: 'Payment verified successfully!' });
  } catch (err) { next(err); }
});

// Razorpay Webhook listener
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const webhookSecret = env.razorpay.webhookSecret;

    if (webhookSecret && sig) {
      const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (expectedSig !== sig) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body;
    console.log(`[Razorpay Webhook] Event received: ${event}`);

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const orderId = payload.payment.entity.order_id;
      if (!env.demoMode) {
        await query(
          `UPDATE payment_orders SET status='paid' WHERE razorpay_order_id=$1`,
          [orderId]
        ).catch(() => {});
      }
    }

    res.json({ ok: true, received: true });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
