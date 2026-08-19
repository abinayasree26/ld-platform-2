import { create } from 'zustand';
import { authAPI } from './api';
import { identifyUser, resetAnalytics } from './analytics';

// Clear per-session local progress so a newly logged-in / registered user never
// sees the previous user's cached dashboard data. (The dashboard reads real data
// from the DB; this just prevents stale localStorage from leaking across users.)
function clearLocalProgress() {
  try { localStorage.removeItem('ld_local_progress'); } catch {}
}

const safeParse = (str) => {
  if (!str || str === 'undefined' || str === 'null') return null;
  try { return JSON.parse(str); } catch { return null; }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem('auth_token') || null,
  user: safeParse(localStorage.getItem('user_data')),

  login: async (token, type = 'supabase') => {
    const result = await authAPI.login(token, type);
    localStorage.setItem('auth_token', result.token);
    if (result.refreshToken) localStorage.setItem('refresh_token', result.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(result.user));
    if (result.user?.role === 'student') {
      localStorage.setItem('student_user_data', JSON.stringify(result.user));
    }
    clearLocalProgress();
    set({ token: result.token, user: result.user });
    identifyUser(result.user);
    // Return full result so callers can read isNewUser
    return result;
  },

  demoLogin: async (role = 'teacher') => {
    const result = await authAPI.demo(role);
    localStorage.setItem('auth_token', result.token);
    localStorage.removeItem('refresh_token'); // demo sessions don't use refresh
    localStorage.setItem('user_data', JSON.stringify(result.user));
    if (result.user?.role === 'student') {
      localStorage.setItem('student_user_data', JSON.stringify(result.user));
    }
    clearLocalProgress();
    set({ token: result.token, user: result.user });
    identifyUser(result.user);
    return result.user;
  },

  setDemoAuth: (user, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.removeItem('refresh_token');
    localStorage.setItem('user_data', JSON.stringify(user));
    if (user?.role === 'student') {
      localStorage.setItem('student_user_data', JSON.stringify(user));
    }
    clearLocalProgress();
    set({ token, user });
    identifyUser(user);
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    clearLocalProgress();
    resetAnalytics();
    set({ token: null, user: null });
    window.location.href = '/login';
  },
}));

export default useAuthStore;
