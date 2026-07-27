import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

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
  <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
    <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-main)]">
      <h3 className="text-base font-bold text-[var(--text-main)]">{icon} {title}</h3>
    </div>
    <div className="px-4 sm:px-6 py-5 space-y-4">
      {children}
    </div>
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', disabled = false, placeholder = '' }) => (
  <PasswordOrInput label={label} value={value} onChange={onChange} type={type} disabled={disabled} placeholder={placeholder} />
);

const PasswordOrInput = ({ label, value, onChange, type, disabled, placeholder }) => {
  const [show, setShow] = React.useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">{label}</label>
      <div className="relative">
        <input type={isPassword && !show ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500 transition disabled:opacity-50 placeholder:text-[var(--text-muted)] pr-10" />
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
const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const logoInputRef = React.useRef(null);

  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/admin/settings', { headers })
      .then(r => r.json())
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', { method: 'PATCH', headers, body: JSON.stringify(settings) });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
        toast.success(`Logo "${file.name}" uploaded!`);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between pb-4 border-b border-[var(--border-main)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Settings</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Platform configuration and preferences</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-4 sm:px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50">
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {/* Platform Branding */}
        <Section title="Platform Branding" icon="🎨">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="App Name" value={platform?.name || ''} onChange={v => updateSetting('platform', 'name', v)} />
            <InputField label="Tagline" value={platform?.tagline || ''} onChange={v => updateSetting('platform', 'tagline', v)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl flex items-center justify-center text-xl overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-purple-600">L</span>
                )}
              </div>
              <div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition">
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

        {/* Admin Credentials */}
        <Section title="Admin Credentials" icon="🔐">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Username" value={admin?.username || ''} onChange={v => updateSetting('admin', 'username', v)} />
            <InputField label="Email" value={admin?.email || ''} onChange={v => updateSetting('admin', 'email', v)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Leave blank to keep current" />
            <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm new password" />
          </div>
          <Toggle label="Two-Factor Authentication (2FA)" value={admin?.twoFactor || false} onChange={v => updateSetting('admin', 'twoFactor', v)} />
        </Section>

        {/* App Configuration */}
        <Section title="App Configuration" icon="⚙️">
          <Toggle label="Demo Mode" value={app?.demoMode || false} onChange={v => updateSetting('app', 'demoMode', v)} />
          <Toggle label="Maintenance Mode" value={app?.maintenanceMode || false} onChange={v => updateSetting('app', 'maintenanceMode', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Registration</label>
              <select value={app?.registration || 'open'} onChange={e => updateSetting('app', 'registration', e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500">
                <option value="open">Open (anyone can signup)</option>
                <option value="invite">Invite Only</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <InputField label="Trial Days" value={app?.trialDays || 7} onChange={v => updateSetting('app', 'trialDays', Number(v))} type="number" />
          </div>
        </Section>

        {/* Screening Config */}
        <Section title="Screening Configuration" icon="🧠">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Questions/Level" value={screening?.questionsPerLevel || 6} onChange={v => updateSetting('screening', 'questionsPerLevel', Number(v))} type="number" />
            <InputField label="Total Levels" value={screening?.levels || 5} onChange={v => updateSetting('screening', 'levels', Number(v))} type="number" />
            <InputField label="Pass Threshold (%)" value={screening?.passThreshold || 70} onChange={v => updateSetting('screening', 'passThreshold', Number(v))} type="number" />
            <InputField label="Time Limit (min)" value={screening?.timeLimit || 20} onChange={v => updateSetting('screening', 'timeLimit', Number(v))} type="number" />
          </div>
        </Section>

        {/* Subscription */}
        <Section title="Subscription Plans" icon="💳">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Monthly Price (₹)" value={subscription?.monthlyPrice || 199} onChange={v => updateSetting('subscription', 'monthlyPrice', Number(v))} type="number" />
            <InputField label="Annual Price (₹)" value={subscription?.annualPrice || 1499} onChange={v => updateSetting('subscription', 'annualPrice', Number(v))} type="number" />
            <InputField label="Trial Days" value={subscription?.trialDays || 7} onChange={v => updateSetting('subscription', 'trialDays', Number(v))} type="number" />
            <InputField label="Grace Period (days)" value={subscription?.gracePeriod || 3} onChange={v => updateSetting('subscription', 'gracePeriod', Number(v))} type="number" />
          </div>
          <Toggle label="Auto-Renewal Reminder Email" value={subscription?.autoRenewalReminder || false} onChange={v => updateSetting('subscription', 'autoRenewalReminder', v)} />
        </Section>

        {/* Email / SMTP Settings */}
        <Section title="Email (SMTP) Settings" icon="📧">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="SMTP Host" value={smtp?.host || ''} onChange={v => updateSetting('smtp', 'host', v)} placeholder="smtp.gmail.com" />
            <InputField label="SMTP Port" value={smtp?.port || ''} onChange={v => updateSetting('smtp', 'port', v)} type="number" placeholder="587" />
            <InputField label="From Email" value={smtp?.from || ''} onChange={v => updateSetting('smtp', 'from', v)} placeholder="noreply@ldsupport.in" />
            <InputField label="From Name" value={smtp?.fromName || ''} onChange={v => updateSetting('smtp', 'fromName', v)} placeholder="LD Support" />
            <InputField label="SMTP Username" value={smtp?.username || ''} onChange={v => updateSetting('smtp', 'username', v)} placeholder="your@gmail.com" />
            <InputField label="SMTP Password" value={smtp?.password || ''} onChange={v => updateSetting('smtp', 'password', v)} type="password" placeholder="App password" />
          </div>
          <Toggle label="Enable Email Notifications" value={smtp?.enabled || false} onChange={v => updateSetting('smtp', 'enabled', v)} />
          <button onClick={() => toast.success('Test email sent to admin (demo)')}
            className="px-4 py-2 border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition">
            📤 Send Test Email
          </button>
        </Section>

        {/* Privacy & Compliance */}
        <Section title="Data & Privacy (DPDP Act)" icon="🛡️">
          <InputField label="Data Retention (days)" value={privacy?.dataRetentionDays || 365} onChange={v => updateSetting('privacy', 'dataRetentionDays', Number(v))} type="number" />
          <Toggle label="Allow Students to Export Data" value={privacy?.allowDataExport || false} onChange={v => updateSetting('privacy', 'allowDataExport', v)} />
          <Toggle label="Allow Account Deletion" value={privacy?.allowAccountDeletion || false} onChange={v => updateSetting('privacy', 'allowAccountDeletion', v)} />
          <Toggle label="Require Consent on Signup" value={privacy?.consentRequired || false} onChange={v => updateSetting('privacy', 'consentRequired', v)} />
        </Section>

        {/* API Keys & Integrations */}
        <Section title="API Keys & Integrations" icon="🔌">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Razorpay Key ID" value={integrations?.razorpayKeyId || ''} onChange={v => updateSetting('integrations', 'razorpayKeyId', v)} placeholder="rzp_live_xxxx" />
              <InputField label="Razorpay Key Secret" value={integrations?.razorpaySecret || ''} onChange={v => updateSetting('integrations', 'razorpaySecret', v)} type="password" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Firebase Project ID" value={integrations?.firebaseProjectId || ''} onChange={v => updateSetting('integrations', 'firebaseProjectId', v)} placeholder="my-app-xxxxx" />
              <InputField label="Firebase Server Key" value={integrations?.firebaseKey || ''} onChange={v => updateSetting('integrations', 'firebaseKey', v)} type="password" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Anthropic API Key" value={integrations?.anthropicKey || ''} onChange={v => updateSetting('integrations', 'anthropicKey', v)} type="password" placeholder="sk-ant-xxxx" />
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">AI Chat Model</label>
                <select value={integrations?.aiModel || 'gemma'} onChange={e => updateSetting('integrations', 'aiModel', e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500">
                  <option value="gemma">Gemma 4 E2B (on-device)</option>
                  <option value="claude">Claude (cloud)</option>
                </select>
              </div>
            </div>
          </div>
        </Section>

        {/* Login History / Audit Log */}
        <Section title="Login History & Audit Log" icon="📋">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">IP Address</th>
                  <th className="px-3 py-2 text-left">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {[
                  { date: '2026-07-27 09:15', action: 'Admin Login', ip: '192.168.1.5', device: 'Chrome / Windows' },
                  { date: '2026-07-26 18:30', action: 'Settings Updated', ip: '192.168.1.5', device: 'Chrome / Windows' },
                  { date: '2026-07-26 10:00', action: 'Admin Login', ip: '192.168.1.5', device: 'Edge / Windows' },
                  { date: '2026-07-25 14:20', action: 'Student Deleted', ip: '192.168.1.5', device: 'Chrome / Windows' },
                  { date: '2026-07-25 09:45', action: 'Admin Login', ip: '103.45.67.89', device: 'Safari / iPhone' },
                  { date: '2026-07-24 11:00', action: 'Notification Sent', ip: '192.168.1.5', device: 'Chrome / Windows' },
                ].map((log, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{log.date}</td>
                    <td className="px-3 py-2.5 font-bold text-[var(--text-main)]">{log.action}</td>
                    <td className="px-3 py-2.5 text-[var(--text-muted)] font-mono text-xs">{log.ip}</td>
                    <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs">{log.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Danger Zone */}
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
              <button onClick={() => {
                if (window.confirm('Factory reset the entire platform? Everything will be deleted.')) {
                  if (window.confirm('FINAL WARNING: This will delete ALL data — students, content, payments, chats, everything. Continue?')) {
                    toast.success('Factory reset complete (demo)');
                  }
                }
              }} className="px-4 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition">
                💀 Factory Reset
              </button>
            </div>
          </div>
        </Section>

        {/* Save Button (bottom) */}
        <div className="flex justify-end pt-4 pb-8">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50">
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
