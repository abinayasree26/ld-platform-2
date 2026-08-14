import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';

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
  const [messages, setMessages] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef(null);

  // ─── Load all chat threads from Supabase ────────────────────────────────────
  const fetchChats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_chats')
        .select('*')
        .order('updated_at', { ascending: false });

      let list = data || [];

      // Combine with local custom messages fallback
      try {
        const localMsgs = JSON.parse(localStorage.getItem('admin_support_messages') || '[]');
        if (localMsgs.length > 0) {
          const existingChatIds = new Set(list.map(c => c.id));
          const existingEmails = new Set(list.map(c => (c.student_email || '').toLowerCase()));

          localMsgs.forEach(m => {
            const cleanEmail = (m.studentEmail || 'student@gmail.com').toLowerCase();
            const chatId = `chat_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
            if (!existingChatIds.has(chatId) && !existingEmails.has(cleanEmail)) {
              existingChatIds.add(chatId);
              existingEmails.add(cleanEmail);
              list.push({
                id: chatId,
                student_name: m.studentName || 'Student',
                student_email: cleanEmail,
                ld_type: 'Dyslexia',
                severity: 'Moderate',
                status: 'open',
                unread: 1,
                updated_at: m.timestamp || new Date().toISOString(),
              });
            }
          });
        }
      } catch { /* ignore */ }

      setChats(list);
      setUnreadTotal(list.filter(c => c.unread > 0).length);

      // Auto-select first chat
      if (list.length > 0 && !selectedChat) {
        setSelectedChat(list[0].id);
        loadMessages(list[0].id);
        setChatDetail(list[0]);
      }
    } catch (err) {
      console.error('Fetch chats error:', err);
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
    }
  };

  // ─── Load messages for a specific chat ──────────────────────────────────────
  const loadMessages = async (chatId) => {
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase.from('support_chats').update({ unread: 0 }).eq('id', chatId);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Select a chat thread ───────────────────────────────────────────────────
  const selectChat = (chat) => {
    setSelectedChat(chat.id);
    setChatDetail(chat);
    loadMessages(chat.id);
  };

  // ─── Send admin reply ───────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!reply.trim() || !selectedChat) return;
    setSending(true);
    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newMsg = {
        id: msgId,
        chat_id: selectedChat,
        sender: 'admin',
        text: reply.trim(),
      };

      const { error } = await supabase.from('support_messages').insert(newMsg);
      if (error) throw error;

      // Update chat thread
      await supabase.from('support_chats').update({
        last_message: reply.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedChat);

      // Update local state
      setMessages(prev => [...prev, { ...newMsg, created_at: new Date().toISOString() }]);
      setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, last_message: reply.trim(), updated_at: new Date().toISOString() } : c));
      setReply('');
      toast.success('Reply sent!');
    } catch (err) {
      console.error('Send reply error:', err);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // ─── Resolve / Reopen chat ──────────────────────────────────────────────────
  const resolveChat = async () => {
    if (!window.confirm('Mark this conversation as resolved?')) return;
    try {
      await supabase.from('support_chats').update({ status: 'resolved', unread: 0 }).eq('id', selectedChat);
      toast.success('Conversation resolved');
      setChatDetail(prev => ({ ...prev, status: 'resolved' }));
      setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, status: 'resolved', unread: 0 } : c));
    } catch { toast.error('Failed to resolve'); }
  };

  const reopenChat = async () => {
    try {
      await supabase.from('support_chats').update({ status: 'open' }).eq('id', selectedChat);
      toast.success('Conversation reopened');
      setChatDetail(prev => ({ ...prev, status: 'open' }));
      setChats(prev => prev.map(c => c.id === selectedChat ? { ...c, status: 'open' } : c));
    } catch { toast.error('Failed to reopen'); }
  };

  // ─── Delete chat ────────────────────────────────────────────────────────────
  const deleteChat = async (chatId) => {
    if (!window.confirm('Delete this conversation permanently?')) return;
    try {
      // Delete messages first (foreign key)
      await supabase.from('support_messages').delete().eq('chat_id', chatId);
      await supabase.from('support_chats').delete().eq('id', chatId);
      toast.success('Chat deleted');
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (selectedChat === chatId) { setSelectedChat(null); setChatDetail(null); setMessages([]); }
      setUnreadTotal(prev => Math.max(0, prev - 1));
    } catch { toast.error('Delete failed'); }
  };

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filteredChats = (statusFilter === 'all' ? chats : chats.filter(c => c.status === statusFilter))
    .filter(c => c.last_message && c.last_message.trim() !== '');

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = iso.slice(0, 10);
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (dateStr === today) return timeStr;
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${timeStr}`;
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
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-xs text-[var(--text-muted)] font-bold">No conversations</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Student messages will appear here</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <button key={chat.id} onClick={() => selectChat(chat)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all ${
                    selectedChat === chat.id ? 'bg-[var(--bg-main)] border-l-2 border-l-purple-500' : ''
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[var(--text-main)] truncate">{chat.student_name}</span>
                    <div className="flex items-center gap-1.5">
                      {chat.unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{chat.unread}</span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${chat.status === 'open' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{chat.last_message || 'No messages yet'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[var(--text-muted)]">{chat.student_email}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{formatTime(chat.updated_at)}</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                      className="text-[9px] text-red-400 hover:text-red-600 font-bold">🗑 Delete</button>
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
                    {chatDetail.student_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{chatDetail.student_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)]">{chatDetail.student_email}</span>
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
                  <button onClick={() => deleteChat(selectedChat)}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition">
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[var(--bg-main)]">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)]">
                    <p className="text-3xl mb-2">🗨️</p>
                    <p className="text-xs font-bold">No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isAdmin
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[9px] mt-1 ${isAdmin ? 'text-purple-200' : 'text-[var(--text-muted)]'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
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
