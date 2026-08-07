import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

const SUB_BADGE = {
  Active: 'bg-emerald-50 text-emerald-600',
  Free: 'bg-slate-100 text-slate-500',
  Expired: 'bg-red-50 text-red-500',
};

const AdminChats = () => {
  const [chats, setChats] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDetail, setChatDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchChats = async () => {
    setLoading(true);
    let list = [];
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const resp = await fetch(`/api/admin/chats${params}`, { headers }).catch(() => null);
      if (resp && resp.ok) {
        const data = await resp.json();
        list = data.chats || [];
      }
    } catch { /* ignore */ }

    try {
      const rawCustomMsgs = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
      const customMsgs = rawCustomMsgs.map(m => {
        if (!m.studentName || m.studentName === 'Administrator' || m.studentName === 'Admin User' || m.studentName === 'Admin' || m.studentName === 'Riya') {
          return { ...m, studentName: 'saranya', studentEmail: 'saranya@gmail.com' };
        }
        return m;
      });
      const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');

      if (customMsgs.length > 0) {
        const chatsByStudent = new Map();

        // Process customMsgs chronologically (oldest first so newest ends up as lastMessage)
        const sortedMsgs = [...customMsgs].reverse();

        sortedMsgs.forEach((m, idx) => {
          let studentName = m.studentName;
          if (!studentName || studentName === 'Administrator' || studentName === 'Admin User' || studentName === 'Admin' || studentName === 'Riya') {
            studentName = 'saranya';
          }
          let studentEmail = m.studentEmail;
          if (!studentEmail || studentEmail.includes('admin') || studentEmail.includes('riya')) {
            studentEmail = 'saranya@gmail.com';
          }

          const key = studentEmail.toLowerCase();
          const time = m.timestamp || new Date().toISOString();
          const msgObj = {
            id: m.id || `m-${Date.now()}-${idx}`,
            sender: 'student',
            from: 'student',
            text: m.message,
            time: time,
          };

          if (!chatsByStudent.has(key)) {
            chatsByStudent.set(key, {
              id: `chat-${key}`,
              studentName: studentName,
              studentEmail: studentEmail,
              lastMessage: m.message,
              updatedAt: time,
              unread: m.status === 'unread' ? 1 : 0,
              status: 'open',
              plan: 'Free Tier',
              messages: [msgObj],
            });
          } else {
            const existingChat = chatsByStudent.get(key);
            existingChat.studentName = studentName;
            existingChat.messages.push(msgObj);
            existingChat.lastMessage = m.message;
            existingChat.updatedAt = time;
            if (m.status === 'unread') existingChat.unread += 1;
          }
        });

        // Merge saved admin replies into student chat threads
        const savedReplies = JSON.parse(localStorage.getItem('admin_support_replies') || '[]');
        savedReplies.forEach((r, idx) => {
          let rEmail = (r.studentEmail || 'saranya@gmail.com').toLowerCase();
          if (rEmail.includes('admin')) rEmail = 'saranya@gmail.com';
          const rTime = r.time || r.timestamp || new Date().toISOString();
          const replyObj = {
            id: r.id || `rep-${rTime}-${idx}`,
            sender: 'admin',
            from: 'admin',
            text: r.text,
            time: rTime,
          };

          const chat = chatsByStudent.get(rEmail);
          if (chat) {
            chat.messages.push(replyObj);
            chat.lastMessage = r.text;
            chat.updatedAt = rTime;
          } else {
            chatsByStudent.set(rEmail, {
              id: `chat-${rEmail}`,
              studentName: r.studentName || 'saranya',
              studentEmail: rEmail,
              lastMessage: r.text,
              updatedAt: rTime,
              unread: 0,
              status: 'open',
              plan: 'Free Tier',
              messages: [replyObj],
            });
          }
        });

        // Sort messages chronologically in each thread so student messages and admin replies interleave correctly
        chatsByStudent.forEach(chat => {
          chat.messages.sort((a, b) => new Date(a.time) - new Date(b.time));
        });

        const existingIds = new Set(list.map(c => c.id));
        chatsByStudent.forEach((groupedChat) => {
          if (!existingIds.has(groupedChat.id)) {
            list.unshift(groupedChat);
            existingIds.add(groupedChat.id);
          }
        });
      }

      if (list.length === 0 && customStudents.length > 0) {
        customStudents.forEach(st => {
          list.push({
            id: `chat-${st.id}`,
            studentName: st.name || 'Student',
            studentEmail: st.email,
            lastMessage: 'Hi! I have a question about my practice level.',
            updatedAt: new Date().toISOString(),
            unread: 1,
            status: 'open',
            plan: st.subscription || 'Free Tier',
            messages: [
              { id: `m-${Date.now()}`, sender: 'student', text: 'Hi! I have a question about my practice level.', time: new Date().toISOString() }
            ]
          });
        });
      }
    } catch { /* ignore */ }

    setChats(list);
    setUnreadTotal(list.filter(c => c.unread > 0).length);
    setLoading(false);
    if (list.length > 0 && !selectedChat) {
      setSelectedChat(list[0].id);
      setChatDetail(list[0]);
    }
  };

  const fetchChatDetail = async (chatId) => {
    setDetailLoading(true);
    setSelectedChat(chatId);
    const chatFromState = chats.find(c => c.id === chatId);
    try {
      const resp = await fetch(`/api/admin/chats/${chatId}`, { headers }).catch(() => null);
      if (resp && resp.ok) {
        const data = await resp.json();
        setChatDetail(data);
      } else if (chatFromState) {
        setChatDetail(chatFromState);
      }
    } catch {
      if (chatFromState) setChatDetail(chatFromState);
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedChat) return;
    setSending(true);
    const timeIso = new Date().toISOString();
    const newMsg = { id: `m-${Date.now()}`, sender: 'admin', from: 'admin', text: reply.trim(), time: timeIso };

    try {
      await fetch(`/api/admin/chats/${selectedChat}/reply`, {
        method: 'POST', headers, body: JSON.stringify({ text: reply.trim() }),
      }).catch(() => null);

      setChatDetail(prev => ({ ...prev, messages: [...(prev?.messages || []), newMsg] }));
      setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, lastMessage: reply.trim(), unread: 0 } : c));

      // Persist reply to localStorage for Student Portal Live Chat
      try {
        const savedReplies = JSON.parse(localStorage.getItem('admin_support_replies') || '[]');
        const studentEmail = chatDetail?.studentEmail || 'saranya@gmail.com';
        localStorage.setItem('admin_support_replies', JSON.stringify([
          ...savedReplies,
          {
            id: `rep-${Date.now()}`,
            chatId: selectedChat,
            studentEmail: studentEmail,
            studentName: chatDetail?.studentName || 'saranya',
            text: reply.trim(),
            time: timeIso,
            sender: 'admin',
            from: 'admin'
          }
        ]));
      } catch { /* ignore */ }

      setReply('');
      toast.success('Reply sent!');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const resolveChat = async () => {
    if (!window.confirm('Mark this conversation as resolved?')) return;
    await fetch(`/api/admin/chats/${selectedChat}/resolve`, { method: 'PATCH', headers });
    toast.success('Conversation resolved');
    setChatDetail(prev => ({ ...prev, status: 'resolved' }));
    setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, status: 'resolved', unread: 0 } : c));
    setUnreadTotal(prev => {
      const chat = chats.find(c => c.id === selectedChat);
      return Math.max(0, prev - (chat?.unread || 0));
    });
  };

  const reopenChat = async () => {
    await fetch(`/api/admin/chats/${selectedChat}/reopen`, { method: 'PATCH', headers });
    toast.success('Conversation reopened');
    setChatDetail(prev => ({ ...prev, status: 'open' }));
    setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, status: 'open' } : c));
  };

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatDetail?.messages]);

  const filteredChats = statusFilter === 'all' ? chats : chats.filter(c => c.status === statusFilter);

  const formatTime = (iso) => {
    if (!iso) return '';
    if (typeof iso === 'string' && /^\d{1,2}:\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = typeof iso === 'string' ? iso.slice(0, 10) : '';
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (dateStr === today) return timeStr;
    return `${dateStr} ${timeStr}`;
  };

  return (
    <Layout>
      <div className="flex h-full flex-col lg:flex-row">
        {/* Conversation List */}
        <div className={`w-full lg:w-80 border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-card)] flex-shrink-0 ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* List Header */}
          <div className="px-4 py-4 border-b border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-[var(--text-main)]">Support Inbox</h3>
              {unreadTotal > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadTotal}</span>
              )}
            </div>
            <div className="flex gap-1">
              {['all', 'open', 'resolved'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold capitalize transition ${
                    statusFilter === f ? 'bg-purple-600 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] text-xs py-12">No conversations</p>
            ) : (
              filteredChats.map(chat => (
                <button key={chat.id} onClick={() => fetchChatDetail(chat.id)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all ${
                    selectedChat === chat.id ? 'bg-[var(--bg-main)] border-l-2 border-l-purple-500' : ''
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[var(--text-main)] truncate">{chat.studentName}</span>
                    <div className="flex items-center gap-1.5">
                      {chat.unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{chat.unread}</span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${chat.status === 'open' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{chat.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[var(--text-muted)]">{chat.ldType}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{formatTime(chat.lastAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Thread */}
        <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm font-bold">Select a conversation</p>
                <p className="text-xs mt-1">Choose from the list to view messages</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chatDetail ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedChat(null); setChatDetail(null); }} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm font-bold mr-2">
                    ← Back
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {chatDetail.studentName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{chatDetail.studentName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)]">{chatDetail.ldType}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${SUB_BADGE[chatDetail.subscription]}`}>{chatDetail.subscription}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${chatDetail.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {chatDetail.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {chatDetail.status === 'open' ? (
                    <button onClick={resolveChat} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">
                      ✓ Resolve
                    </button>
                  ) : (
                    <button onClick={reopenChat} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
                      ↩ Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[var(--bg-main)]">
                {chatDetail.messages?.map(msg => {
                  const isAdmin = msg.sender === 'admin' || msg.from === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isAdmin
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[9px] mt-1 ${isAdmin ? 'text-purple-200' : 'text-[var(--text-muted)]'}`}>
                          {formatTime(msg.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex-shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 transition"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default AdminChats;
