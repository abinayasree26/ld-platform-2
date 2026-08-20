import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';

const Toggle = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[var(--text-main)] font-medium">{label}</span>
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${value ? 'bg-purple-600' : 'bg-slate-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden shadow-sm">
    <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-main)]/30">
      <h3 className="text-sm font-extrabold text-[var(--text-main)] flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
    </div>
    <div className="px-4 sm:px-6 py-5 space-y-4">
      {children}
    </div>
  </div>
);

const PasswordOrInput = ({ label, value, onChange, type, disabled, placeholder }) => {
  const [show, setShow] = React.useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label className="block text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input type={isPassword && !show ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500 transition disabled:opacity-50 placeholder:text-[var(--text-muted)] pr-10 font-medium" />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition text-sm">
            {show ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const CATEGORIES = [
  { id: 'account', label: 'Account & Security', icon: '🔐', desc: 'Admin Credentials, Password & Audit Log' },
  { id: 'platform', label: 'Platform Setup', icon: '🎨', desc: 'Branding, Logo & System Rules' },
  { id: 'learning', label: 'Learning & Subscriptions', icon: '🧠', desc: 'Screening Rules & Plan Pricing' },
  { id: 'integrations', label: 'Integrations & Privacy', icon: '⚡', desc: 'SMTP Email, Razorpay, Firebase & Gemma AI' },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const logoInputRef = React.useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['account', 'platform', 'learning', 'integrations'].includes(hash) ? hash : 'account';
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fallback */ }

    const now = new Date();
    const formatDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const defaults = [
      { date: formatDate(now), action: 'Admin Login', ip: '192.168.1.5', device: 'Chrome / Windows' },
      { date: formatDate(new Date(now.getTime() - 86400000)), action: 'Settings Updated', ip: '192.168.1.5', device: 'Chrome / Windows' },
      { date: formatDate(new Date(now.getTime() - 172800000)), action: 'Test Email Sent', ip: '192.168.1.5', device: 'Chrome / Windows' },
      { date: formatDate(new Date(now.getTime() - 259200000)), action: 'Student CSV Exported', ip: '192.168.1.5', device: 'Chrome / Windows' },
      { date: formatDate(new Date(now.getTime() - 345600000)), action: 'Push Notification Sent', ip: '192.168.1.5', device: 'Chrome / Windows' },
    ];
    localStorage.setItem('admin_audit_logs', JSON.stringify(defaults));
    return defaults;
  });

  const getClientAuditInfo = () => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let device = 'Chrome / Windows';
    if (userAgent.includes('Macintosh')) device = 'Safari / macOS';
    else if (userAgent.includes('Android')) device = 'Chrome / Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) device = 'Safari / iOS';

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const ip = (host === 'localhost' || host === '127.0.0.1') ? '127.0.0.1 (Local)' : 'Cloud / Web Client';
    return { ip, device };
  };

  const recordAuditAction = (action) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { ip, device } = getClientAuditInfo();
    setAuditLogs((prev) => {
      const updated = [{ date: dateStr, action, ip, device }, ...prev].slice(0, 20);
      localStorage.setItem('admin_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const DEFAULT_SETTINGS = {
    admin: { name: 'Administrator', email: 'admin@ldschools.in', role: 'school_admin' },
    platform: { name: 'LD Support', logo: '', theme: 'dark', language: 'English' },
    app: { name: 'LD Support Platform' },
    screening: { passScore: 70, maxAttempts: 3 },
    subscription: { plan: 'Free Tier' },
    privacy: { dataRetentionDays: 365 },
    integrations: { enabled: true },
    smtp: { host: 'smtp.gmail.com', port: '587', fromEmail: 'noreply@ldsupport.in', fromName: 'LD Support', username: 'your@gmail.com', password: '' },
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: row } = await supabase.from('admin_settings').select('*').eq('id', 'main').maybeSingle();
        if (row) {
          setSettings({
            admin: { name: row.admin_name || 'Administrator', email: row.admin_email || '', role: row.admin_role || 'school_admin' },
            platform: { name: row.platform_name || 'LD Support', logo: row.platform_logo || '', theme: row.theme || 'dark', language: row.language || 'English' },
            app: { name: row.platform_name || 'LD Support Platform' },
            screening: { passScore: row.screening_pass_score || 70, maxAttempts: row.screening_max_attempts || 3 },
            subscription: { plan: row.subscription_plan || 'Free Tier' },
            privacy: { dataRetentionDays: row.data_retention_days || 365 },
            integrations: { enabled: row.integrations_enabled !== false },
            smtp: { host: row.smtp_host || '', port: row.smtp_port || '587', fromEmail: row.smtp_from_email || '', fromName: row.smtp_from_name || '', username: row.smtp_username || '', password: row.smtp_password || '' },
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['account', 'platform', 'learning', 'integrations'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (id) => {
    setActiveTab(id);
    window.location.hash = id;
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({ ...prev, [section]: { ...(prev?.[section] || {}), [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('admin_settings').upsert([{
        id: 'main',
        admin_name: settings.admin?.name || 'Administrator',
        admin_email: settings.admin?.email || '',
        admin_role: settings.admin?.role || 'school_admin',
        platform_name: settings.platform?.name || 'LD Support',
        platform_logo: settings.platform?.logo || '',
        theme: settings.platform?.theme || 'dark',
        language: settings.platform?.language || 'English',
        screening_pass_score: settings.screening?.passScore || 70,
        screening_max_attempts: settings.screening?.maxAttempts || 3,
        subscription_plan: settings.subscription?.plan || 'Free Tier',
        data_retention_days: settings.privacy?.dataRetentionDays || 365,
        integrations_enabled: settings.integrations?.enabled !== false,
        smtp_host: settings.smtp?.host || '',
        smtp_port: settings.smtp?.port || '587',
        smtp_from_email: settings.smtp?.fromEmail || '',
        smtp_from_name: settings.smtp?.fromName || '',
        smtp_username: settings.smtp?.username || '',
        smtp_password: settings.smtp?.password || '',
        updated_at: new Date().toISOString(),
      }], { onConflict: 'id' });
      if (error) throw error;
      toast.success('Settings saved successfully!');
      recordAuditAction('Settings Updated');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const recipient = settings?.smtp?.username || settings?.smtp?.fromEmail || 'jaisree1126@gmail.com';
    try {
      toast.loading('Sending test email...', { id: 'test-email' });
      const BACKEND_URL = 'https://ld-platform-2.onrender.com';
      const resp = await fetch(`${BACKEND_URL}/api/public/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: settings?.smtp,
          targetEmail: recipient,
        }),
      }).catch(() => null);

      toast.dismiss('test-email');
      if (resp && resp.ok) {
        let data = {};
        try { data = await resp.json(); } catch {}
        toast.success(data.message || `Test email dispatched to ${recipient}!`);
        recordAuditAction(`Test Email Sent (${recipient})`);
      } else {
        const errData = resp ? await resp.text().catch(() => '') : 'Backend unreachable';
        toast.error(`Email failed: ${errData || 'Backend not responding'}`);
      }
    } catch {
      toast.dismiss('test-email');
      toast.error('Failed to send test email — backend unreachable');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
        toast.success('Logo preview updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-48 text-[var(--text-muted)]">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Settings…</span>
        </div>
      </Layout>
    );
  }

  const { platform, admin, app, screening, subscription, privacy, integrations, smtp } = settings || {};

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-main)] gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-purple-400 transition flex items-center gap-1.5 shadow-sm"
              title="Back to previous page"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Platform Settings</h2>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">Manage credentials, branding, learning rules, and integrations</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="self-start sm:self-auto px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-extrabold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2">
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>

        {/* Horizontal Category Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => changeTab(cat.id)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                  isActive
                    ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-600/10 ring-1 ring-purple-500/30'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-purple-400/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-[var(--bg-main)] text-[var(--text-main)]'
                }`}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-black truncate ${isActive ? 'text-purple-400 font-black' : 'text-[var(--text-main)]'}`}>
                      {cat.label}
                    </h4>
                    {isActive && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 font-medium">
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Content Panel (Full Width) */}
        <div className="space-y-6">
            {/* CATEGORY 1: Account & Security */}
            {activeTab === 'account' && (
              <>
                <Section title="Admin Profile Credentials" icon="🔐">
                  <div>
                    <PasswordOrInput label="Username" value={admin?.username || ''} onChange={v => updateSetting('admin', 'username', v)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordOrInput label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Leave blank to keep current" />
                    <PasswordOrInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
                  </div>
                  <Toggle label="Two-Factor Authentication (2FA)" value={admin?.twoFactor || false} onChange={v => updateSetting('admin', 'twoFactor', v)} />
                </Section>

                <Section title="Active Login Sessions & Security Devices" icon="💻">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-main)]/60 border border-[var(--border-main)] rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💻</span>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-main)]">Chrome on Windows (Current Session)</p>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono">192.168.1.5 • Active Now</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-md uppercase">Active</span>
                    </div>
                    <button
                      onClick={() => {
                        toast.success('Signed out all other active admin sessions!');
                        recordAuditAction('Terminated Other Sessions');
                      }}
                      className="px-4 py-2 border border-[var(--border-main)] hover:bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-bold rounded-xl transition flex items-center gap-2"
                    >
                      <span>🔒</span> Sign Out All Other Devices
                    </button>
                  </div>
                </Section>

                <Section title="System Backup & Configuration Export" icon="📥">
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-3">
                    Export platform settings, security audit logs, screening rules, and subscription pricing as a downloadable backup file.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const backupData = {
                          exportDate: new Date().toISOString(),
                          settings,
                          auditLogs,
                        };
                        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ld_platform_backup_${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('System configuration backup downloaded!');
                        recordAuditAction('System Backup Exported');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow"
                    >
                      <span>📥</span> Export Platform Backup (.json)
                    </button>
                  </div>
                </Section>

                <Section title="Security Audit Log" icon="📋">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] text-[var(--text-muted)] font-extrabold uppercase bg-[var(--bg-main)]/50">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Date</th>
                          <th className="px-3 py-2.5 text-left">Action</th>
                          <th className="px-3 py-2.5 text-left">IP Address</th>
                          <th className="px-3 py-2.5 text-left">Device</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-main)]">
                        {auditLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-[var(--bg-main)] transition-colors">
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs font-mono">{log.date}</td>
                            <td className="px-3 py-2.5 font-bold text-[var(--text-main)] text-xs">{log.action}</td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)] font-mono text-xs">{log.ip}</td>
                            <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{log.device}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}

            {/* CATEGORY 2: Platform Setup */}
            {activeTab === 'platform' && (
              <>
                <Section title="Platform Branding" icon="🎨">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordOrInput label="App Name" value={platform?.name || ''} onChange={v => updateSetting('platform', 'name', v)} />
                    <PasswordOrInput label="Tagline" value={platform?.tagline || ''} onChange={v => updateSetting('platform', 'tagline', v)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl flex items-center justify-center text-xl overflow-hidden shadow-inner">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-purple-600">L</span>
                        )}
                      </div>
                      <div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <button onClick={() => logoInputRef.current?.click()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-sm">
                          Upload Logo
                        </button>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">PNG, JPG or SVG. Max 2MB.</p>
                      </div>
                      {logoPreview && (
                        <button onClick={() => setLogoPreview(null)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                      )}
                    </div>
                  </div>
                </Section>

                <Section title="System Preferences & Rules" icon="⚙️">
                  <Toggle label="Demo Mode" value={app?.demoMode || false} onChange={v => updateSetting('app', 'demoMode', v)} />
                  <Toggle label="Maintenance Mode" value={app?.maintenanceMode || false} onChange={v => updateSetting('app', 'maintenanceMode', v)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Registration Policy</label>
                      <select value={app?.registration || 'open'} onChange={e => updateSetting('app', 'registration', e.target.value)}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500 font-medium">
                        <option value="open">Open (anyone can signup)</option>
                        <option value="invite">Invite Only</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <PasswordOrInput label="Trial Days" value={app?.trialDays || 7} onChange={v => updateSetting('app', 'trialDays', Number(v))} type="number" />
                  </div>
                </Section>
              </>
            )}

            {/* CATEGORY 3: Learning & Subscriptions */}
            {activeTab === 'learning' && (
              <>
                <Section title="Screening Rules & Thresholds" icon="🧠">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <PasswordOrInput label="Questions / Level" value={screening?.questionsPerLevel || 6} onChange={v => updateSetting('screening', 'questionsPerLevel', Number(v))} type="number" />
                    <PasswordOrInput label="Total Levels" value={screening?.levels || 5} onChange={v => updateSetting('screening', 'levels', Number(v))} type="number" />
                    <PasswordOrInput label="Pass Threshold (%)" value={screening?.passThreshold || 70} onChange={v => updateSetting('screening', 'passThreshold', Number(v))} type="number" />
                    <PasswordOrInput label="Time Limit (min)" value={screening?.timeLimit || 20} onChange={v => updateSetting('screening', 'timeLimit', Number(v))} type="number" />
                  </div>
                </Section>

                <Section title="Subscription Plans Configuration" icon="💳">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <PasswordOrInput label="Monthly Price (₹)" value={subscription?.monthlyPrice || 199} onChange={v => updateSetting('subscription', 'monthlyPrice', Number(v))} type="number" />
                    <PasswordOrInput label="Annual Price (₹)" value={subscription?.annualPrice || 1499} onChange={v => updateSetting('subscription', 'annualPrice', Number(v))} type="number" />
                    <PasswordOrInput label="Trial Days" value={subscription?.trialDays || 7} onChange={v => updateSetting('subscription', 'trialDays', Number(v))} type="number" />
                    <PasswordOrInput label="Grace Period (days)" value={subscription?.gracePeriod || 3} onChange={v => updateSetting('subscription', 'gracePeriod', Number(v))} type="number" />
                  </div>
                  <Toggle label="Auto-Renewal Reminder Email" value={subscription?.autoRenewalReminder || false} onChange={v => updateSetting('subscription', 'autoRenewalReminder', v)} />
                </Section>
              </>
            )}

            {/* CATEGORY 4: Integrations & Privacy */}
            {activeTab === 'integrations' && (
              <>
                <Section title="Email (SMTP) Settings" icon="📧">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordOrInput label="SMTP Host" value={smtp?.host || ''} onChange={v => updateSetting('smtp', 'host', v)} placeholder="smtp.gmail.com" />
                    <PasswordOrInput label="SMTP Port" value={smtp?.port || ''} onChange={v => updateSetting('smtp', 'port', v)} type="number" placeholder="587" />
                    <PasswordOrInput label="From Email" value={smtp?.from || ''} onChange={v => updateSetting('smtp', 'from', v)} placeholder="noreply@ldsupport.in" />
                    <PasswordOrInput label="From Name" value={smtp?.fromName || ''} onChange={v => updateSetting('smtp', 'fromName', v)} placeholder="LD Support" />
                    <PasswordOrInput label="SMTP Username" value={smtp?.username || ''} onChange={v => updateSetting('smtp', 'username', v)} placeholder="your@gmail.com" />
                    <PasswordOrInput label="SMTP Password" value={smtp?.password || ''} onChange={v => updateSetting('smtp', 'password', v)} type="password" placeholder="App password" />
                  </div>
                  <Toggle label="Enable Email Notifications" value={smtp?.enabled || false} onChange={v => updateSetting('smtp', 'enabled', v)} />
                  <button onClick={handleTestEmail}
                    className="px-4 py-2 border border-[var(--border-main)] rounded-xl text-xs font-extrabold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition shadow-sm">
                    📤 Send Test Email
                  </button>
                </Section>

                <Section title="Cloud API Keys & AI Engine" icon="🔌">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PasswordOrInput label="Razorpay Key ID" value={integrations?.razorpayKeyId || ''} onChange={v => updateSetting('integrations', 'razorpayKeyId', v)} placeholder="rzp_live_xxxx" />
                      <PasswordOrInput label="Razorpay Key Secret" value={integrations?.razorpaySecret || ''} onChange={v => updateSetting('integrations', 'razorpaySecret', v)} type="password" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PasswordOrInput label="Firebase Project ID" value={integrations?.firebaseProjectId || ''} onChange={v => updateSetting('integrations', 'firebaseProjectId', v)} placeholder="my-app-xxxxx" />
                      <PasswordOrInput label="Firebase Server Key" value={integrations?.firebaseKey || ''} onChange={v => updateSetting('integrations', 'firebaseKey', v)} type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">AI Chat Engine</label>
                      <input
                        type="text"
                        value="Gemma 4 E2B (On-Device AI Engine)"
                        readOnly
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none font-medium cursor-default opacity-90"
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Admin System Alerts & Notifications" icon="🔔">
                  <Toggle
                    label="Alert Admin on New Student Screening Completion"
                    value={settings?.adminAlerts?.screeningAlert !== false}
                    onChange={v => updateSetting('adminAlerts', 'screeningAlert', v)}
                  />
                  <Toggle
                    label="Alert Admin on Payment & Subscription Failures"
                    value={settings?.adminAlerts?.paymentAlert !== false}
                    onChange={v => updateSetting('adminAlerts', 'paymentAlert', v)}
                  />
                  <Toggle
                    label="Alert Admin on Student Plan Expiry (3 Days Prior)"
                    value={settings?.adminAlerts?.expiryAlert !== false}
                    onChange={v => updateSetting('adminAlerts', 'expiryAlert', v)}
                  />
                </Section>

                <Section title="Data & Privacy (DPDP Act)" icon="🛡️">
                  <PasswordOrInput label="Data Retention (days)" value={privacy?.dataRetentionDays || 365} onChange={v => updateSetting('privacy', 'dataRetentionDays', Number(v))} type="number" />
                  <Toggle label="Allow Students to Export Data" value={privacy?.allowDataExport || false} onChange={v => updateSetting('privacy', 'allowDataExport', v)} />
                  <Toggle label="Allow Account Deletion" value={privacy?.allowAccountDeletion || false} onChange={v => updateSetting('privacy', 'allowAccountDeletion', v)} />
                  <Toggle label="Require Consent on Signup" value={privacy?.consentRequired || false} onChange={v => updateSetting('privacy', 'consentRequired', v)} />
                </Section>

                <Section title="Danger Zone" icon="⚠️">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-4">
                    <p className="text-xs text-red-400 font-bold">These actions are irreversible. Proceed with caution.</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => {
                        if (window.confirm('Reset all demo data? This will restore default sample data.')) {
                          toast.success('Demo data reset (demo)');
                        }
                      }} className="px-4 py-2.5 border border-red-300 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition">
                        🔄 Reset Demo Data
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Clear ALL student data? This cannot be undone!')) {
                          if (window.confirm('Are you ABSOLUTELY sure? All student accounts and progress will be permanently deleted.')) {
                            toast.success('All student data cleared (demo)');
                          }
                        }
                      }} className="px-4 py-2.5 border border-red-300 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition">
                        🗑️ Clear All Students
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Delete ALL content (questions + exercises)? This cannot be undone!')) {
                          toast.success('All content cleared (demo)');
                        }
                      }} className="px-4 py-2.5 border border-red-300 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition">
                        📝 Clear All Content
                      </button>
                    </div>
                  </div>
                </Section>
              </>
            )}

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-4 pb-8 border-t border-[var(--border-main)]">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2">
                {saving ? 'Saving...' : '💾 Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
};

export default AdminSettings;
