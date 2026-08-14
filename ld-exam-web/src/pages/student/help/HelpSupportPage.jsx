import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSidebarStore from '../../../services/sidebarStore';
import useAuthStore from '../../../services/authStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import AboutIcon from '../../../components/AboutIcon';
import { supabase } from '../../../services/supabaseClient';

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
  const { user: authUser } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const getStudentInfo = () => {
    const studentData = JSON.parse(localStorage.getItem('student_user_data') || 'null');
    const authData = JSON.parse(localStorage.getItem('user_data') || 'null');
    const user = (authUser && authUser.role === 'student')
      ? authUser
      : (studentData || (authData?.role === 'student' ? authData : null));

    let name = user?.name || studentData?.name;
    if (!name || name === 'Administrator' || name === 'Admin User' || name === 'Admin') {
      const fallbackEmail = user?.email || studentData?.email;
      name = fallbackEmail ? fallbackEmail.split('@')[0] : 'Student';
    }

    let email = user?.email || studentData?.email;
    if (!email || email.includes('admin')) {
      email = `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    }

    return { name, email };
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Please describe your issue first'); return; }
    setSending(true);

    try {
      const studentInfo = getStudentInfo();
      const textMsg = message.trim();
      const cleanEmail = (studentInfo.email || 'student@gmail.com').toLowerCase();
      const chatId = `chat_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      const newMsg = {
        id: `msg-${Date.now()}`,
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        message: textMsg,
        timestamp: new Date().toISOString(),
        status: 'unread',
        topic: 'General Inquiry',
      };
      const existing = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
      localStorage.setItem('admin_support_messages', JSON.stringify([newMsg, ...existing]));

      // ─── Upsert to Supabase Cloud DB support_chats & support_messages ───
      try {
        const { data: existingChat } = await supabase.from('support_chats').select('*').eq('id', chatId).single();
        const unreadCount = (existingChat?.unread || 0) + 1;

        await supabase.from('support_chats').upsert({
          id: chatId,
          student_name: studentInfo.name || 'Student',
          student_email: cleanEmail,
          status: 'open',
          last_message: textMsg,
          unread: unreadCount,
          updated_at: new Date().toISOString(),
        });

        await supabase.from('support_messages').insert({
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          chat_id: chatId,
          sender: 'student',
          text: textMsg,
          created_at: new Date().toISOString(),
        });
      } catch { /* ignore supa fallback */ }

      fetch('/api/ld/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ body: textMsg }),
      }).catch(() => { /* ignore */ });
    } catch { /* ignore */ }

    setTimeout(() => {
      toast.success('Message sent! Our support team will get back to you soon.');
      setMessage('');
      setSending(false);
    }, 500);
  };

  // Live Chat — quick-reply FAQ chips, with a trailing "Other" option for anything not listed.
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const loadChatHistory = async () => {
    const studentInfo = getStudentInfo();
    const emailKey = (studentInfo.email || '').toLowerCase();
    const nameKey = (studentInfo.name || '').toLowerCase();

    // 1. Get sent messages strictly for this specific student from admin_support_messages
    const allSent = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
    const studentSent = allSent.filter(m =>
      (m.studentEmail && m.studentEmail.toLowerCase() === emailKey) ||
      (m.studentName && m.studentName.toLowerCase() === nameKey)
    );

    // 2. Get admin replies strictly for this specific student from admin_support_replies
    const allReplies = JSON.parse(localStorage.getItem('admin_support_replies') || '[]');
    const studentReplies = allReplies.filter(r =>
      (r.studentEmail && r.studentEmail.toLowerCase() === emailKey) ||
      (r.studentName && r.studentName.toLowerCase() === nameKey) ||
      r.chatId === `chat-${emailKey}`
    );

    // 3. Combine into unified list sorted by timestamp
    const items = [
      ...studentSent.map(s => ({
        id: s.id,
        from: 'user',
        text: s.message,
        timestamp: s.timestamp || '2026-01-01T00:00:00.000Z'
      })),
      ...studentReplies.map(r => ({
        id: r.id || `rep-${r.time}`,
        from: 'admin',
        text: r.text,
        timestamp: r.time || r.timestamp || '2026-01-01T00:00:00.000Z'
      }))
    ];

    // 3b. Also fetch messages from Supabase support_messages
    try {
      const chatId = `chat_${emailKey.replace(/[^a-z0-9]/g, '_')}`;
      const { data: supaMessages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (supaMessages && supaMessages.length > 0) {
        supaMessages.forEach(m => {
          const exists = items.some(i => i.id === m.id);
          if (!exists) {
            items.push({
              id: m.id,
              from: m.sender === 'admin' ? 'admin' : 'user',
              text: m.text,
              timestamp: m.created_at || new Date().toISOString(),
            });
          }
        });
      }
    } catch { /* ignore */ }

    items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const initialGreeting = {
      id: 'bot-welcome',
      from: 'bot',
      text: "Hi! I'm your live chat assistant 🤖 Pick a question below, or type your own.",
      timestamp: '2020-01-01T00:00:00.000Z'
    };

    setChatMessages([initialGreeting, ...items]);
  };

  useEffect(() => {
    loadChatHistory();
    const interval = setInterval(loadChatHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages]);

  const askFaq = (f) => {
    sendChatMessageText(f.q);
  };

  const askOther = () => {
    sendChatMessageText('Other');
  };

  const sendChatMessageText = (text) => {
    if (!text) return;
    try {
      const studentInfo = getStudentInfo();
      const cleanEmail = (studentInfo.email || 'student@gmail.com').toLowerCase();
      const chatId = `chat_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      const newMsg = {
        id: `chat-${Date.now()}`,
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        message: text,
        timestamp: new Date().toISOString(),
        status: 'unread',
        topic: 'Live Chat',
      };
      const existing = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
      localStorage.setItem('admin_support_messages', JSON.stringify([newMsg, ...existing]));

      // ─── Also save to Supabase support_chats & support_messages ───
      (async () => {
        try {
          const { data: existingChat } = await supabase.from('support_chats').select('*').eq('id', chatId).single();
          const unreadCount = (existingChat?.unread || 0) + 1;

          await supabase.from('support_chats').upsert({
            id: chatId,
            student_name: studentInfo.name || 'Student',
            student_email: cleanEmail,
            status: 'open',
            last_message: text,
            unread: unreadCount,
            updated_at: new Date().toISOString(),
          });

          await supabase.from('support_messages').insert({
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            chat_id: chatId,
            sender: 'student',
            text: text,
          });
        } catch { /* ignore supabase fallback */ }
      })();

      fetch('/api/ld/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ body: text }),
      }).catch(() => { /* ignore */ });
    } catch { /* ignore */ }

    loadChatHistory();
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    sendChatMessageText(text);
    setChatInput('');
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

          {/* ═══ TWO CONTAINERS: Contact info vs. Live Chat ═══ */}
          <div className="sp-grid-2 sp-flexrow" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>

          {/* ═══ LEFT: Support Channels & Guidance ═══ */}
          <div className="sp-hide-scrollbar" style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact card */}
          <div className="sp-flex-stack" style={{ ...card, display: 'flex', gap: 12 }}>
            {[
              { icon: '✉️', label: 'Email', value: 'support@ldsupport.in' },
              { icon: '📞', label: 'Phone', value: '+91 1800 123 4567' },
              { icon: '💬', label: 'Live Chat', value: 'Mon–Sat, 9am–6pm' },
            ].map((c) => (
              <div key={c.label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: '#f8fafc' }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</p>
                <p style={{ fontSize: 12, color: '#334155', margin: '2px 0 0', fontWeight: 600 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Support Info Card */}
          <div style={card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>ℹ️</span> Support Center Guidance
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: '0 0 14px' }}>
              Our dedicated support team is available to assist students with screening assessments, practice modules, and platform inquiries.
            </p>
            <div style={{ background: '#eef2ff', padding: 14, borderRadius: 12, border: '1px solid #e0e7ff' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚡</span> Real-Time Live Assistance
              </p>
              <p style={{ fontSize: 11.5, color: '#4338ca', margin: 0, lineHeight: 1.5 }}>
                Use the <strong>Live Chat</strong> window on the right to chat directly with our support administrators in real-time.
              </p>
            </div>
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
              {chatMessages.map((m, i) => {
                const isLeft = m.from === 'bot' || m.from === 'admin';
                const isAdmin = m.from === 'admin';
                return (
                  <div key={m.id || i} style={{ display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: '85%', padding: '9px 13px', borderRadius: 14, fontSize: 12.5, lineHeight: 1.5,
                        background: m.from === 'bot' ? '#f1f5f9' : isAdmin ? '#2563eb' : '#4f46e5',
                        color: m.from === 'bot' ? '#334155' : '#fff',
                        borderBottomLeftRadius: isLeft ? 4 : 14,
                        borderBottomRightRadius: isLeft ? 14 : 4,
                      }}
                    >
                      {isAdmin && <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9, marginBottom: 2 }}>👨‍💼 Admin Support</div>}
                      {m.text}
                    </div>
                  </div>
                );
              })}
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
