import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../services/authStore';
import { authAPI, complianceAPI } from '../../services/api';
import { trackLogin, trackDemoLogin } from '../../services/analytics';

import { supabase } from '../../services/supabaseClient';

const ConsentModal = ({ onAccept }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
      <h2 className="text-lg font-extrabold text-slate-800">Data Privacy Consent</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        LD Support Platform collects and processes student learning data to provide personalised
        support. This is governed by India's <strong>DPDP Act 2023</strong>.
      </p>
      <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
        <li>Learning progress and assessment scores</li>
        <li>Error patterns for targeted recommendations</li>
        <li>Usage analytics to improve the platform</li>
      </ul>
      <p className="text-xs text-slate-400">
        You can request data export or account deletion at any time from Settings.
      </p>
      <button
        onClick={onAccept}
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-800 transition"
      >
        I Understand &amp; Agree
      </button>
    </div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { setDemoAuth } = useAuthStore();
  const [portalTab, setPortalTab] = useState('student');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  // Form fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('teacher');
  // Student registration extras (grade & age drive grade-aware AI questions)
  const [grade, setGrade]       = useState('');
  const [age, setAge]           = useState('');

  // Admin form fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  const handleConsentAccept = async () => {
    await complianceAPI.recordConsent('data_processing').catch(() => {});
    navigate(pendingNav || '/dashboard');
    setPendingNav(null);
  };

  const parseResponseJson = async (resp) => {
    const text = await resp.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        resp.ok
          ? 'Invalid server response'
          : `Server error (${resp.status}): Backend service unreachable`
      );
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      toast.error('Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername.trim(), password: adminPassword }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const data = await parseResponseJson(resp);
        setDemoAuth(data.user, data.token);
        trackLogin('credentials', 'admin');

        try {
          const savedLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const updatedLogs = [
            { date: dateStr, action: 'Admin Login', ip: '192.168.1.5', device: 'Chrome / Windows' },
            ...savedLogs,
          ].slice(0, 20);
          localStorage.setItem('admin_audit_logs', JSON.stringify(updatedLogs));
        } catch { /* ignore */ }

        toast.success('Welcome, Admin!');
        navigate('/admin');
        return;
      }

      // Record Admin Login entry in security audit log
      try {
        const savedLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        let device = 'Chrome / Windows';
        if (userAgent.includes('Macintosh')) device = 'Safari / macOS';
        else if (userAgent.includes('Android')) device = 'Chrome / Android';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) device = 'Safari / iOS';

        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const ip = (host === 'localhost' || host === '127.0.0.1') ? '127.0.0.1 (Local)' : 'Cloud / Web Client';

        const updatedLogs = [
          { date: dateStr, action: `Admin Login (${adminUsername.trim() || 'Administrator'})`, ip, device },
          ...savedLogs,
        ].slice(0, 20);
        localStorage.setItem('admin_audit_logs', JSON.stringify(updatedLogs));
      } catch { /* ignore */ }

      // Static deployment fallback for Admin login — verify credentials locally
      const VALID_ADMIN_USERNAME = 'admin';
      const VALID_ADMIN_PASSWORD = 'admin123';

      if (adminUsername.trim().toLowerCase() !== VALID_ADMIN_USERNAME ||
          adminPassword.trim() !== VALID_ADMIN_PASSWORD) {
        toast.error('Invalid username or password');
        setLoading(false);
        return;
      }

      const adminUser = {
        id: 'admin-1',
        name: 'Administrator',
        email: 'admin@ldschools.in',
        role: 'school_admin',
      };
      setDemoAuth(adminUser, 'admin-demo-token');
      toast.success('Welcome, Administrator!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const data = await parseResponseJson(resp);
        setDemoAuth(data.user, data.token);
        trackLogin('email', data.user.role);
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);
        const dest = data.user.role === 'parent' ? '/parent' : data.user.role === 'student' ? '/student' : '/dashboard';
        navigate(dest);
        return;
      }

      // Check registered students in Supabase Cloud DB or localStorage
      const cleanEmail = email.trim().toLowerCase();
      let foundStudent = null;
      try {
        const { data: supaMatch } = await supabase.from('students').select('*').eq('email', cleanEmail).maybeSingle();
        if (supaMatch && supaMatch.email) {
          foundStudent = supaMatch;
        }
      } catch { /* fallback */ }

      if (!foundStudent) {
        const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        foundStudent = customStudents.find(s => s.email?.toLowerCase() === cleanEmail);
      }

      if (!foundStudent) {
        toast.error('Account not found! Please register first.');
        setTab('register');
        return;
      }

      const user = {
        id: foundStudent.id || `st-${Date.now()}`,
        name: foundStudent.name || cleanEmail.split('@')[0],
        email: foundStudent.email || cleanEmail,
        role: 'student',
      };

      setDemoAuth(user, 'demo-token');
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error('Enter valid email and password (min 6 chars)');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: portalTab === 'student' ? 'student' : role,
          class_grade: grade ? parseInt(grade, 10) : null,
          age: age ? parseInt(age, 10) : null,
        }),
      }).catch(() => null);

      let user = null;
      let token = 'demo-token';

      if (resp && resp.ok) {
        const data = await parseResponseJson(resp);
        user = data.user;
        token = data.token;
      } else {
        const studentName = name.trim() || email.trim().split('@')[0] || 'Student';
        user = {
          id: `st-${Date.now()}`,
          name: studentName,
          email: email.trim(),
          role: 'student',
          grade: grade ? `Class ${grade}` : 'Class 5',
          age: age || '10',
        };
      }

      setDemoAuth(user, token);

      try {
        const newStudent = {
          id: user.id || `st-${Date.now()}`,
          name: user.name || 'Student',
          email: user.email,
          grade: grade ? `Class ${grade}` : 'Class 5',
          ldType: 'Unscreened',
          severity: 'Pending',
          level: 'Level 1',
          status: 'active',
          joined: new Date().toISOString().slice(0, 10),
          lastActive: 'Today',
          subscription: 'Free Tier',
          screened: false,
        };
        const stored = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const existingEmails = new Set(stored.map(s => s.email?.toLowerCase()));
        if (!existingEmails.has(newStudent.email.toLowerCase())) {
          localStorage.setItem('admin_registered_students', JSON.stringify([newStudent, ...stored]));
        }

        // Real-time Cloud DB sync with Supabase
        const { error: dbError } = await supabase.from('students').insert([{
          id: newStudent.id,
          name: newStudent.name,
          email: newStudent.email.toLowerCase(),
          grade: newStudent.grade,
          ld_type: null,
          severity: null,
          level: newStudent.level,
          status: newStudent.status,
          last_active: 'Today',
          subscription: newStudent.subscription,
          screened: false,
          created_at: new Date().toISOString(),
        }]);
        if (dbError) {
          console.warn('Supabase student insert failed:', dbError.message);
          // If duplicate email, try update instead
          if (dbError.code === '23505') {
            console.log('Student already exists in DB, skipping insert');
          }
        } else {
          console.log('Student saved to Supabase DB successfully');
        }
      } catch { /* ignore */ }

      toast.success(`Account created! Welcome, ${user.name}!`);
      navigate('/student');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {pendingNav && <ConsentModal onAccept={handleConsentAccept} />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-blue-800 mb-2">LD Support</h1>
            <p className="text-slate-500 font-medium">School Platform</p>
          </div>

          {/* Portal tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            {['student', 'admin'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setPortalTab(tab); setMode('login'); }}
                className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  portalTab === tab
                    ? 'bg-white shadow-sm ' + (tab === 'admin' ? 'text-purple-700' : 'text-orange-600')
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'student' ? '🎒' : '🔑'} {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Admin form */}
          {portalTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Username</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-purple-500 transition-colors font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 pr-11 text-base focus:outline-none focus:border-purple-500 transition-colors font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none text-lg select-none"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-purple-200 transition-all disabled:bg-purple-300"
              >
                {loading ? 'Signing in…' : 'Sign In as Admin'}
              </button>
            </form>
          )}

          {/* Student form — login OR register */}
          {portalTab === 'student' && (
            <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-xs text-orange-700 font-medium">
                {mode === 'register'
                  ? 'Create your student account to start learning.'
                  : 'Students: log in with your email and password.'}
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="your@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-500 transition-colors font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 pr-11 text-base focus:outline-none focus:border-orange-500 transition-colors font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none text-lg select-none"
                    title={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="flex gap-3">
                  <div className="space-y-2 flex-1">
                    <label className="block text-sm font-bold text-slate-700">Grade</label>
                    <input
                      type="number" min="1" max="12"
                      placeholder="1-12"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="block text-sm font-bold text-slate-700">Age</label>
                    <input
                      type="number" min="5" max="18"
                      placeholder="5-18"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-orange-200 transition-all disabled:bg-orange-300"
              >
                {loading ? 'Please wait…' : (mode === 'register' ? 'Create Account' : 'Student Login')}
              </button>

              <p className="text-center text-sm text-slate-500">
                {mode === 'register' ? 'Already have an account? ' : "First time here? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="text-orange-600 font-bold hover:underline"
                >
                  {mode === 'register' ? 'Log in' : 'Register'}
                </button>
              </p>
            </form>
          )}

          {/* Demo button for quick access */}
          {portalTab === 'student' && (
            <div className="mt-4">
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or for testing</span></div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await authAPI.demo('student');
                    setDemoAuth(
                      {
                        id: 'demo-student',
                        name: 'Demo Student',
                        role: 'student',
                        school_id: 'demo-school',
                        email: 'demo.student@ldsupport.in',
                        phone: '+91 98765 43210',
                        class: 'Class 5 - A',
                        school: 'Sunrise Public School',
                        board: 'CBSE',
                        subscription: 'advanced',
                        ...result.user,
                      },
                      result.token
                    );
                    trackDemoLogin('student');
                    toast.success('Demo Student — entering dashboard');
                    navigate('/student');
                  } catch {
                    toast.error('Could not start demo session');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full border-2 border-slate-100 hover:border-orange-200 hover:bg-orange-50 text-orange-700 font-bold py-3 rounded-xl transition-all text-sm"
              >
                🎒 Demo Student
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginPage;
