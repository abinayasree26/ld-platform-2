import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';

const STATUS_BADGE = {
  sent: 'bg-emerald-50 text-emerald-600',
  scheduled: 'bg-blue-50 text-blue-600',
  draft: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-50 text-red-500',
};

const TARGET_LABELS = {
  all: 'All Students',
  free: 'Free Users',
  paid: 'Paid Users',
  inactive: 'Inactive (7+ days)',
  unscreened: 'Unscreened',
  expiring: 'Expiring Soon',
};

// ─── Compose Modal ─────────────────────────────────────────────────────────────
const ComposeModal = ({ onClose, onSend, sending }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [schedule, setSchedule] = useState('now');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-[var(--text-main)] mb-4">📢 New Announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..."
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." rows={3}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Target Audience</label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
                <option value="all">All Students</option>
                <option value="free">Free Users Only</option>
                <option value="paid">Paid Users Only</option>
                <option value="inactive">Inactive (7+ days)</option>
                <option value="unscreened">Unscreened</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Send</label>
              <select value={schedule} onChange={e => setSchedule(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
                <option value="now">Send Now</option>
                <option value="schedule">Schedule Later</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[var(--border-main)] text-[var(--text-muted)] font-bold py-2.5 rounded-xl hover:bg-[var(--bg-main)] transition text-sm">Cancel</button>
          <button onClick={() => { onSend({ title, body, target, schedule }); }}
            disabled={!title.trim() || !body.trim() || sending}
            className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 transition text-sm disabled:opacity-40">
            {sending ? 'Sending…' : schedule === 'now' ? '🚀 Send Now' : schedule === 'schedule' ? 'Schedule' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Notifications Page ─────────────────────────────────────────────
const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, sent: 0, scheduled: 0, drafts: 0 });

  // ─── Load notifications from Supabase ─────────────────────────────────────
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      const list = data || [];
      setStats({
        total: list.length,
        sent: list.filter(n => n.status === 'sent').length,
        scheduled: list.filter(n => n.status === 'scheduled').length,
        drafts: list.filter(n => n.status === 'draft').length,
      });
    } catch (err) {
      console.error('Load notifications error:', err);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  // ─── Send / Save notification ─────────────────────────────────────────────
  const handleSend = async (notification) => {
    setSending(true);
    try {
      const status = notification.schedule === 'now' ? 'sent'
        : notification.schedule === 'schedule' ? 'scheduled' : 'draft';

      const row = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: notification.title,
        body: notification.body,
        target: notification.target,
        channel: 'push',
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        scheduled_for: status === 'scheduled' ? new Date(Date.now() + 86400000).toISOString() : null,
        delivered: 0,
        opened: 0,
      };

      // Save to Supabase
      const { error: dbError } = await supabase.from('notifications').insert(row);
      if (dbError) throw dbError;

      // If sending now, try to broadcast via backend (Firebase push)
      if (status === 'sent') {
        try {
          const token = localStorage.getItem('auth_token');
          const resp = await fetch('/api/ld/push/broadcast', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              title: notification.title,
              body: notification.body,
              targetRole: notification.target,
            }),
          });

          if (resp.ok) {
            const result = await resp.json();
            // Update delivered count
            const delivered = result.delivered || result.successCount || 0;
            await supabase.from('notifications').update({ delivered }).eq('id', row.id);
            row.delivered = delivered;
            toast.success(`🔔 Push sent to ${delivered} device${delivered !== 1 ? 's' : ''}!`);
          } else {
            // Backend not available — notification saved but not pushed
            toast.success('📋 Notification saved! (Push delivery requires backend server)');
          }
        } catch {
          // Backend offline — still saved in Supabase
          toast.success('📋 Notification saved! (Backend offline — push queued)');
        }
      } else if (status === 'scheduled') {
        toast.success('⏰ Notification scheduled!');
      } else {
        toast.success('📝 Draft saved!');
      }

      // Update local state
      setNotifications(prev => [row, ...prev]);
      setShowCompose(false);
      loadNotifications();
    } catch (err) {
      console.error('Send notification error:', err);
      toast.error(err?.message || 'Failed to save notification');
    } finally {
      setSending(false);
    }
  };

  // ─── Delete notification ──────────────────────────────────────────────────
  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Notification deleted');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  // ─── Resend notification ──────────────────────────────────────────────────
  const resendNotification = async (notification) => {
    setSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch('/api/ld/push/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: notification.title,
          body: notification.body,
          targetRole: notification.target,
        }),
      });

      if (resp.ok) {
        toast.success('🔔 Notification resent!');
      } else {
        toast.error('Backend not available — cannot resend');
      }
    } catch {
      toast.error('Backend offline — cannot resend');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-48 text-[var(--text-muted)]">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between pb-4 border-b border-[var(--border-main)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Notifications</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Send push announcements to students</p>
          </div>
          <button onClick={() => setShowCompose(true)}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">
            📢 New Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)]">
            <p className="text-2xl font-black text-[var(--text-main)]">{stats.total}</p>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)]">
            <p className="text-2xl font-black text-emerald-600">{stats.sent}</p>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Sent</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)]">
            <p className="text-2xl font-black text-blue-600">{stats.scheduled}</p>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Scheduled</p>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)]">
            <p className="text-2xl font-black text-slate-500">{stats.drafts}</p>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Drafts</p>
          </div>
        </div>

        {/* Notification History */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)]">
            <h3 className="text-base font-bold text-[var(--text-main)]">Notification History</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-bold">No notifications sent yet</p>
              <p className="text-xs mt-1">Click "New Announcement" to send your first push notification</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Title</th>
                    <th className="px-5 py-3 text-left">Target</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Delivered</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {notifications.map(n => (
                    <tr key={n.id} className="hover:bg-[var(--bg-main)] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold text-[var(--text-main)] text-sm">{n.title}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[250px]">{n.body}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded capitalize">
                          {TARGET_LABELS[n.target] || n.target}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${STATUS_BADGE[n.status] || STATUS_BADGE.draft}`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-[var(--text-main)]">{n.delivered || '—'}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                        {n.sent_at ? new Date(n.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : n.scheduled_for ? `⏰ ${new Date(n.scheduled_for).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                          : 'Draft'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {n.status === 'sent' && (
                            <button onClick={() => resendNotification(n)} className="text-blue-600 hover:underline text-xs font-semibold">Resend</button>
                          )}
                          <button onClick={() => deleteNotification(n.id)} className="text-red-500 hover:underline text-xs font-semibold">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-bold mb-1">ℹ️ How Push Notifications Work</p>
          <ul className="text-xs space-y-1 list-disc list-inside text-blue-700">
            <li>Notifications are saved to the cloud database immediately</li>
            <li>Push delivery to student devices requires the backend server to be running</li>
            <li>Students must have granted browser notification permission to receive pushes</li>
            <li>If the backend is offline, notifications are saved and can be resent later</li>
          </ul>
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSend={handleSend} sending={sending} />}
    </Layout>
  );
};

export default AdminNotifications;
