import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSidebarStore from '../../../services/sidebarStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import AboutIcon from '../../../components/AboutIcon';

const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

const FAQS = [
  { q: 'How is my learning disability type determined?', a: 'A short adaptive screening quiz analyses your responses, and our AI classifier combines that with a rule-based check to identify a likely LD type (dyslexia, dysgraphia, dyscalculia, mixed, or none). You can retake the screening every 90 days.' },
  { q: 'Can I change my subscription plan?', a: 'Yes — open User Profile → Payment and pick Advanced or Pro under Subscription Plan. Changes apply immediately.' },
  { q: 'How do I contact my teacher?', a: 'Use the Messages tab from your dashboard to chat directly with your assigned teacher.' },
  { q: 'How do certificates and badges work?', a: 'Badges are unlocked automatically as you complete modules, levels, and practice streaks. Check the Certification page to see your progress toward each one.' },
  { q: 'Is my data private?', a: 'Yes. Your learning data is used only to personalise your practice and is handled under India’s DPDP Act 2023. You can request a data export or deletion any time from this page.' },
];

const HelpSupportPage = () => {
  const navigate = useNavigate();
  const { collapsed } = useSidebarStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submitMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Please describe your issue first'); return; }
    setSending(true);

    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const newMsg = {
        id: `msg-${Date.now()}`,
        studentName: user.name || 'Riya',
        studentEmail: user.email || 'riya123@gmail.com',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        status: 'unread',
        topic: 'General Inquiry',
      };
      const existing = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
      localStorage.setItem('admin_support_messages', JSON.stringify([newMsg, ...existing]));

      fetch('/api/ld/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ body: message.trim() }),
      }).catch(() => { /* ignore */ });
    } catch { /* ignore */ }

    setTimeout(() => {
      toast.success('Message sent! Our support team will get back to you soon.');
      setMessage('');
      setSending(false);
    }, 500);
  };

  // Live Chat — quick-reply FAQ chips, with a trailing "Other" option for anything not listed.
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: "Hi! I'm your live chat assistant 🤖 Pick a question below, or type your own." },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages]);

  const askFaq = (f) => {
    setChatMessages((m) => [...m, { from: 'user', text: f.q }, { from: 'bot', text: f.a }]);
  };

  const askOther = () => {
    setChatMessages((m) => [...m, { from: 'user', text: 'Other' }, { from: 'bot', text: "No problem — type your question below and I'll pass it on to our support team." }]);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const newMsg = {
        id: `chat-${Date.now()}`,
        studentName: user.name || 'Riya',
        studentEmail: user.email || 'riya123@gmail.com',
        message: text,
        timestamp: new Date().toISOString(),
        status: 'unread',
        topic: 'Live Chat',
      };
      const existing = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
      localStorage.setItem('admin_support_messages', JSON.stringify([newMsg, ...existing]));

      fetch('/api/ld/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ body: text }),
      }).catch(() => { /* ignore */ });
    } catch { /* ignore */ }

    setChatMessages((m) => [...m, { from: 'user', text }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((m) => [...m, { from: 'bot', text: "Thanks! I've noted your question — our support team will follow up by email shortly." }]);
    }, 500);
  };

  return (
    <div className="sp-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        <div className="sp-content sp-flexrow" style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 32, display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ alignSelf: 'flex-start', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(79,70,229,0.25)', marginBottom: 16 }}
          >
              ← Back
          </button>
          <h2 style={{ flexShrink: 0, fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center' }}>
            🆘 Help &amp; Support
            <AboutIcon
              title="About Help & Support"
              description="Find answers to common questions or reach out to us for assistance."
              items={['Browse frequently asked questions', 'Contact us via email or phone', 'Chat with our support team live', 'Report issues or send feedback']}
            />
          </h2>
          <p style={{ flexShrink: 0, fontSize: 12, color: '#94a3b8', margin: '0 0 20px' }}>Answers to common questions, or reach out to us directly.</p>

          {/* ═══ TWO CONTAINERS: Contact info + form vs. Live Chat ═══ */}
          <div className="sp-grid-2 sp-flexrow" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>

          {/* ═══ LEFT ═══ */}
          <div className="sp-hide-scrollbar" style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Contact card */}
          <div className="sp-flex-stack" style={{ ...card, marginBottom: 20, display: 'flex', gap: 12 }}>
            {[
              { icon: '✉️', label: 'Email', value: 'support@ldsupport.in' },
              { icon: '📞', label: 'Phone', value: '+91 1800 123 4567' },
              { icon: '💬', label: 'Live Chat', value: 'Mon–Sat, 9am–6pm' },
            ].map((c) => (
              <div key={c.label} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: '#f8fafc' }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</p>
                <p style={{ fontSize: 12, color: '#334155', margin: '2px 0 0', fontWeight: 600 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>Still need help?</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>Send us a message and we'll get back to you.</p>
            <form onSubmit={submitMessage}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question…"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <button
                type="submit"
                disabled={sending}
                style={{ marginTop: 10, background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>

          </div>

          {/* ═══ RIGHT: Live Chat ═══ */}
          <div style={{ ...card, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: 0 }}>💬 Live Chat</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Ask us anything, or pick a quick question below.</p>
            </div>

            {/* Message thread */}
            <div className="sp-hide-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '85%', padding: '9px 13px', borderRadius: 14, fontSize: 12.5, lineHeight: 1.5,
                      background: m.from === 'bot' ? '#f1f5f9' : '#4f46e5',
                      color: m.from === 'bot' ? '#334155' : '#fff',
                      borderBottomLeftRadius: m.from === 'bot' ? 4 : 14,
                      borderBottomRightRadius: m.from === 'bot' ? 14 : 4,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick-reply FAQ chips, ending with "Other" */}
            <div style={{ flexShrink: 0, maxHeight: 120, overflowY: 'auto', padding: '10px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FAQS.map((f) => (
                <button
                  key={f.q}
                  onClick={() => askFaq(f)}
                  style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', background: '#eef2ff', border: '1px solid #e0e7ff', borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}
                >
                  {f.q}
                </button>
              ))}
              <button
                onClick={askOther}
                style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}
              >
                Other
              </button>
            </div>

            {/* Free-text input */}
            <form onSubmit={sendChatMessage} style={{ flexShrink: 0, padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your question…"
                style={{ flex: 1, minWidth: 0, padding: '9px 12px', fontSize: 13, border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                style={{ flexShrink: 0, background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
              >
                Send
              </button>
            </form>
          </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSupportPage;
