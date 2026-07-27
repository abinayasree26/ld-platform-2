import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../services/authStore';
import { trackLogin } from '../../services/analytics';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setDemoAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Login failed');
      setDemoAuth(data.user, data.token);
      trackLogin('credentials', 'admin');
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-purple-500/30 mb-4">
            L
          </div>
          <h1 className="text-3xl font-black text-white mb-1">LD Support</h1>
          <p className="text-purple-300 text-sm font-medium">Admin Panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition pr-12"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition">
                {showPassword ? (
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-xl shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          LD Support Platform • Admin Access Only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
