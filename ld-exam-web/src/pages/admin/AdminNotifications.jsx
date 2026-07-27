import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  sent: 'bg-emerald-50 text-emerald-600',
  scheduled: 'bg-blue-50 text-blue-600',
  draft: 'bg-slate-100 text-slate-500',
};

const ComposeModal = ({ onClose, onSend }) => {
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
            disabled={!title.trim() || !body.trim()}
            className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 transition text-sm disabled:opacity-40">
            {schedule === 'now' ? 'Send Now' : schedule === 'schedule' ? 'Schedule' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminNotifications = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/admin/notifications', { headers })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (notification) => {
    await fetch('/api/admin/notifications/send', { method: 'POST', headers, body: JSON.stringify(notification) });
    toast.success(notification.schedule === 'now' ? 'Notification sent!' : notification.schedule === 'schedule' ? 'Notification scheduled!' : 'Draft saved!');
    const newNotification = {
      id: `n-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      target: notification.target,
      channel: 'push',
      status: notification.schedule === 'now' ? 'sent' : notification.schedule === 'schedule' ? 'scheduled' : 'draft',
      sentAt: notification.schedule === 'now' ? new Date().toISOString() : null,
      scheduledFor: notification.schedule === 'schedule' ? new Date(Date.now() + 86400000).toISOString() : null,
      delivered: notification.schedule === 'now' ? Math.floor(Math.random() * 50 + 100) : 0,
      opened: notification.schedule === 'now' ? Math.floor(Math.random() * 30 + 50) : 0,
    };
    setData(prev => ({ ...prev, notifications: [newNotification, ...(prev?.notifications || [])] }));
    setShowCompose(false);
  };

  const toggleTrigger = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';
    if (!window.confirm(`Are you sure you want to ${action} this trigger?`)) return;
    await fetch(`/api/admin/notifications/triggers/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }) });
    setData(prev => ({
      ...prev,
      automatedTriggers: prev.automatedTriggers.map(t => t.id === id ? { ...t, status: newStatus } : t),
    }));
    toast.success(`Trigger ${newStatus === 'active' ? 'activated' : 'paused'}`);
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
            <p className="text-[var(--text-muted)] text-sm mt-1">Send announcements and manage automated triggers</p>
          </div>
          <button onClick={() => setShowCompose(true)}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">
            📢 New Announcement
          </button>
        </div>

        {/* Sent Notifications */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)]">
            <h3 className="text-base font-bold text-[var(--text-main)]">Notification History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Target</th>
                  <th className="px-5 py-3 text-left">Channel</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Delivered</th>
                  <th className="px-5 py-3 text-left">Opened</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {data?.notifications?.map(n => (
                  <tr key={n.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-[var(--text-main)] text-sm">{n.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[250px]">{n.body}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded capitalize">{n.target.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs capitalize">{n.channel}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${STATUS_BADGE[n.status]}`}>{n.status}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[var(--text-main)]">{n.delivered || '—'}</td>
                    <td className="px-5 py-3 font-bold text-emerald-600">{n.opened || '—'}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                      {n.sentAt ? new Date(n.sentAt).toLocaleDateString() : n.scheduledFor ? `Scheduled: ${new Date(n.scheduledFor).toLocaleDateString()}` : 'Draft'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Automated Triggers */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)]">
            <h3 className="text-base font-bold text-[var(--text-main)]">⚡ Automated Triggers</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">These notifications are sent automatically based on student behavior</p>
          </div>
          <div className="divide-y divide-[var(--border-main)]">
            {data?.automatedTriggers?.map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-main)] transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-[var(--text-main)]">{t.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    <span className="font-bold">Trigger:</span> {t.trigger} → <span className="italic">"{t.message}"</span>
                  </p>
                  {t.sent7d > 0 && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Sent {t.sent7d} times in last 7 days</p>}
                </div>
                <button onClick={() => toggleTrigger(t.id, t.status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    t.status === 'active'
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}>
                  {t.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSend={handleSend} />}
    </Layout>
  );
};

export default AdminNotifications;
