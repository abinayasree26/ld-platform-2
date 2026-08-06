import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import { PLANS } from '../../../data/subscriptionPlans';
import LevelAvatar from '../../../components/LevelAvatar';
import { currentAvatarLevel } from '../../../data/avatarSystem';
import AboutIcon from '../../../components/AboutIcon';

const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

const planFeatureList = (plan) => {
  const { practiceCategories, maxTestLevel, certification, recommendations } = plan.limits;
  const catCount = practiceCategories === 'all' ? 4 : practiceCategories.length;
  return [
    `${catCount}/4 Practice categories`,
    `Level tests up to Level ${maxTestLevel}`,
    `${certification ? '✓' : '✕'} Certification badges`,
    `${recommendations ? '✓' : '✕'} Personalised recommendations`,
  ];
};

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, setDemoAuth } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const fullName = user?.name || 'Demo Student';
  const email = user?.email || 'demo.student@ldsupport.in';
  const phone = user?.phone || '+91 98765 43210';
  const studentClass = user?.class || 'Class 5 - A';
  const school = user?.school || 'Sunrise Public School';
  const board = user?.board || 'CBSE';
  const subscription = user?.subscription || 'advanced';
  const avatarLevel = currentAvatarLevel(user);

  const tab = pathname.endsWith('/payment') ? 'payment' : 'profile';
  const initialForm = { name: fullName, email, phone, class: studentClass, school, board };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);

  const savedCard = user?.payment || null;
  const paymentSectionRef = useRef(null);
  // Payment Details stays hidden until the student picks a plan (or already has a saved method).
  const [planPicked, setPlanPicked] = useState(false);
  const showPaymentSection = planPicked || !!savedCard;
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(savedCard?.method || 'card');
  const [paymentForm, setPaymentForm] = useState({
    cardName: savedCard?.cardName || fullName,
    cardNumber: '',
    expiry: savedCard?.expiry || '',
    cvv: '',
    upiId: savedCard?.method === 'upi' ? savedCard.upiId : '',
  });

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const persist = (updates) => {
    const token = localStorage.getItem('auth_token') || 'demo-token';
    setDemoAuth({ ...user, ...updates }, token);
  };

  const startEditing = () => {
    setForm(initialForm);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveProfile = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    persist(form);
    setEditing(false);
    toast.success('Profile updated');
  };

  const setPlan = (plan) => {
    if (plan !== subscription) {
      persist({ subscription: plan });
      toast.success(`Switched to the ${plan} plan`);
    }
    // Reveal the payment section and take the student straight into it to finish checkout.
    setPlanPicked(true);
    startEditingPayment();
    setTimeout(() => paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const setPaymentField = (key) => (e) => {
    let val = e.target.value;
    if (key === 'cardNumber') val = val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (key === 'expiry') val = val.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
    if (key === 'cvv') val = val.replace(/\D/g, '').slice(0, 3);
    setPaymentForm((f) => ({ ...f, [key]: val }));
  };

  const startEditingPayment = () => {
    setPaymentMethod(savedCard?.method || 'card');
    setPaymentForm({
      cardName: savedCard?.cardName || fullName,
      cardNumber: '',
      expiry: savedCard?.expiry || '',
      cvv: '',
      upiId: savedCard?.method === 'upi' ? savedCard.upiId : '',
    });
    setEditingPayment(true);
  };

  const savePayment = () => {
    if (paymentMethod === 'upi') {
      if (!/^[\w.\-]{2,}@[a-zA-Z][\w]{2,}$/.test(paymentForm.upiId.trim())) {
        toast.error('Enter a valid UPI ID, e.g. yourname@okhdfcbank');
        return;
      }
      persist({ payment: { method: 'upi', upiId: paymentForm.upiId.trim() } });
      setEditingPayment(false);
      toast.success('UPI Pay linked');
      return;
    }

    const digits = paymentForm.cardNumber.replace(/\s/g, '');
    if (!paymentForm.cardName.trim() || digits.length !== 16 || !/^\d{2}\/\d{2}$/.test(paymentForm.expiry) || paymentForm.cvv.length !== 3) {
      toast.error('Enter a valid card name, 16-digit number, MM/YY expiry, and 3-digit CVV');
      return;
    }
    // Demo only — never persist a full card number or CVV, just what's needed to display a masked summary.
    persist({ payment: { method: 'card', cardName: paymentForm.cardName.trim(), last4: digits.slice(-4), expiry: paymentForm.expiry } });
    setEditingPayment(false);
    toast.success('Payment method saved');
  };

  const removePayment = () => {
    persist({ payment: null });
    toast.success('Payment method removed');
  };

  const fields = [
    { icon: '✉️', key: 'email', label: 'Email', value: email, type: 'email' },
    { icon: '📞', key: 'phone', label: 'Phone Number', value: phone, type: 'tel' },
    { icon: '🏫', key: 'class', label: 'Class', value: studentClass, type: 'text' },
    { icon: '🏛️', key: 'school', label: 'School Name', value: school, type: 'text' },
    { icon: '📘', key: 'board', label: 'Board of Schooling', value: board, type: 'text' },
  ];

  return (
    <div className="sp-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 32, maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ alignSelf: 'flex-start', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(79,70,229,0.25)', marginBottom: 16 }}
          >
              ← Back
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 20px', display: 'flex', alignItems: 'center' }}>
            {tab === 'payment' ? '💳 Payment' : '👤 User Information'}
            <AboutIcon
              title={tab === 'payment' ? 'About Payment' : 'About Profile'}
              description={tab === 'payment'
                ? 'Manage your subscription plan and payment details.'
                : 'View and update your personal information and account settings.'}
              items={tab === 'payment' ? ['View current plan', 'Upgrade or change plan', 'Manage payment methods'] : ['View your profile info', 'Update name and details', 'See your subscription status', 'Manage your avatar']}
            />
          </h2>

          {/* Identity card */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <LevelAvatar level={avatarLevel} size={64} />
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>{fullName}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{studentClass} · Level {avatarLevel} Avatar</p>
            </div>
          </div>

          {tab === 'payment' ? (
            <>
          {/* Subscription */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>Subscription Plan</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>Choose the plan tier for this account — each tier unlocks more of the app.</p>
            <div className="sp-flex-stack" style={{ display: 'flex', gap: 12 }}>
              {PLANS.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setPlan(plan.key)}
                  style={{
                    flex: 1, textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: subscription === plan.key ? `2px solid ${plan.color}` : '2px solid #e2e8f0',
                    background: subscription === plan.key ? '#eef2ff' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: subscription === plan.key ? plan.color : '#334155', margin: 0 }}>
                      {plan.label} {subscription === plan.key && '✓'}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: 0 }}>₹{plan.price}<span style={{ fontSize: 10, fontWeight: 500 }}>/mo</span></p>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 10px' }}>{plan.tagline}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {planFeatureList(plan).map((f) => (
                      <li key={f} style={{ fontSize: 10.5, color: '#64748b' }}>{f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details — hidden until a plan is picked (or one is already saved) */}
          {showPaymentSection && (
          <div ref={paymentSectionRef} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: 0 }}>Payment Details</h3>
              {savedCard && !editingPayment && (
                <button
                  onClick={startEditingPayment}
                  style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                >
                  ✏️ Update
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Demo mode — no real charges are made. Card details are never stored in full.</p>

            {editingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Method selector */}
                <div className="sp-flex-stack" style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      border: paymentMethod === 'card' ? '2px solid #4f46e5' : '2px solid #e2e8f0',
                      background: paymentMethod === 'card' ? '#eef2ff' : '#fff',
                      color: paymentMethod === 'card' ? '#4338ca' : '#64748b',
                    }}
                  >
                    💳 Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      border: paymentMethod === 'upi' ? '2px solid #0f766e' : '2px solid #e2e8f0',
                      background: paymentMethod === 'upi' ? '#eef2ff' : '#fff',
                      color: paymentMethod === 'upi' ? '#0f766e' : '#64748b',
                    }}
                  >
                    📲 UPI Pay
                  </button>
                </div>

                {paymentMethod === 'upi' ? (
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>UPI ID</label>
                    <input
                      value={paymentForm.upiId}
                      onChange={setPaymentField('upiId')}
                      placeholder="yourname@okhdfcbank"
                      style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>You'll get a payment request on your UPI app to approve.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cardholder Name</label>
                      <input
                        value={paymentForm.cardName}
                        onChange={setPaymentField('cardName')}
                        placeholder="Name on card"
                        style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Card Number</label>
                      <input
                        value={paymentForm.cardNumber}
                        onChange={setPaymentField('cardNumber')}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Expiry (MM/YY)</label>
                        <input
                          value={paymentForm.expiry}
                          onChange={setPaymentField('expiry')}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>CVV</label>
                        <input
                          value={paymentForm.cvv}
                          onChange={setPaymentField('cvv')}
                          placeholder="123"
                          inputMode="numeric"
                          type="password"
                          style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={savePayment}
                    style={{ background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    {paymentMethod === 'upi' ? 'Link UPI Pay' : 'Save Card'}
                  </button>
                  <button
                    onClick={() => setEditingPayment(false)}
                    style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : savedCard ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                <span style={{ fontSize: 26 }}>{savedCard.method === 'upi' ? '📲' : '💳'}</span>
                <div style={{ flex: 1 }}>
                  {savedCard.method === 'upi' ? (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f766e', margin: 0 }}>UPI Pay</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{savedCard.upiId}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: 1 }}>•••• •••• •••• {savedCard.last4}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{savedCard.cardName} · Expires {savedCard.expiry}</p>
                    </>
                  )}
                </div>
                <button
                  onClick={removePayment}
                  style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={startEditingPayment}
                style={{ width: '100%', textAlign: 'center', padding: '18px 0', borderRadius: 12, border: '2px dashed #e2e8f0', background: '#f8fafc', color: '#4f46e5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                ＋ Add Payment Method
              </button>
            )}
          </div>
          )}
            </>
          ) : (
          <>
          {/* Contact + class details */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: 0 }}>Basic Information</h3>
              {!editing && (
                <button
                  onClick={startEditing}
                  style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
                  <input
                    value={form.name}
                    onChange={setField('name')}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {fields.map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={setField(f.key)}
                      style={{ width: '100%', marginTop: 4, padding: '9px 12px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={saveProfile}
                    style={{ background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {fields.map((f) => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{f.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</p>
                      <p style={{ fontSize: 14, color: '#334155', margin: '2px 0 0', fontWeight: 500 }}>{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
            {/* Payment Link */}
            <button
              onClick={() => navigate('/student/profile/payment')}
              style={{
                ...card, display: 'flex', alignItems: 'center', gap: 14, padding: 18,
                cursor: 'pointer', border: '2px solid #e2e8f0', textAlign: 'left',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: 28, width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💳</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Payment & Subscription</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Manage your plan and payment method</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#94a3b8' }}>→</span>
            </button>

            {/* Help & Support Link */}
            <button
              onClick={() => navigate('/student/help')}
              style={{
                ...card, display: 'flex', alignItems: 'center', gap: 14, padding: 18,
                cursor: 'pointer', border: '2px solid #e2e8f0', textAlign: 'left',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#16a34a'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: 28, width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🆘</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Help & Support</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>FAQs, live chat, and contact us</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#94a3b8' }}>→</span>
            </button>
          </div>
          </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
