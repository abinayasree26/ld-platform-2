import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

const COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

const StatCard = ({ icon, label, value, sub, color = 'bg-blue-600' }) => (
  <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-main)]">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3 shadow-lg shadow-black/10`}>
      {icon}
    </div>
    <p className="text-xl sm:text-2xl font-black text-[var(--text-main)]">{value}</p>
    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{label}</p>
    {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
  </div>
);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(resData => {
        const rawStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const rawScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        const customStudents = rawStudents.filter(s => s.name !== 'Administrator' && s.name !== 'Admin User' && s.email !== 'student@gmail.com');
        const customScreenings = rawScreenings.filter(sc => sc.studentName !== 'Administrator' && sc.studentName !== 'Admin User' && sc.studentEmail !== 'student@gmail.com');

        const uniqueStudentEmails = new Set([
          ...customStudents.map(s => s.email).filter(e => e && e !== 'student@gmail.com'),
          ...customScreenings.map(sc => sc.studentEmail).filter(e => e && e !== 'student@gmail.com')
        ]);
        const totalCount = uniqueStudentEmails.size;
        const screenedCount = customScreenings.length;

        setData({
          overview: {
            totalStudents: totalCount,
            activeThisWeek: totalCount,
            avgAccuracy: screenedCount > 0 ? 82 : 0,
            avgSessionMinutes: screenedCount > 0 ? 15 : 0,
            totalPracticeSessions: screenedCount,
            screenedStudents: screenedCount,
          },
          dailyActiveUsers: resData?.dailyActiveUsers || [],
          accuracyByLevel: resData?.accuracyByLevel || [],
          engagementByDay: resData?.engagementByDay || [],
          ldPerformance: resData?.ldPerformance || [],
          screeningFunnel: resData?.screeningFunnel || [],
          monthlyGrowth: resData?.monthlyGrowth || [],
          topPerformers: resData?.topPerformers || [],
          atRiskStudents: resData?.atRiskStudents || [],
        });
      })
      .catch(() => {
        const rawStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const rawScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        const customStudents = rawStudents.filter(s => s.name !== 'Administrator' && s.name !== 'Admin User' && s.email !== 'student@gmail.com');
        const customScreenings = rawScreenings.filter(sc => sc.studentName !== 'Administrator' && sc.studentName !== 'Admin User' && sc.studentEmail !== 'student@gmail.com');

        const uniqueStudentEmails = new Set([
          ...customStudents.map(s => s.email).filter(e => e && e !== 'student@gmail.com'),
          ...customScreenings.map(sc => sc.studentEmail).filter(e => e && e !== 'student@gmail.com')
        ]);
        const totalCount = uniqueStudentEmails.size;
        const screenedCount = customScreenings.length;

        setData({
          overview: {
            totalStudents: totalCount,
            activeThisWeek: totalCount,
            avgAccuracy: screenedCount > 0 ? 82 : 0,
            avgSessionMinutes: screenedCount > 0 ? 15 : 0,
            totalPracticeSessions: screenedCount,
            screenedStudents: screenedCount,
          },
          dailyActiveUsers: [],
          accuracyByLevel: [],
          engagementByDay: [],
          ldPerformance: [],
          screeningFunnel: [],
          monthlyGrowth: [],
          topPerformers: [],
          atRiskStudents: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-48 text-[var(--text-muted)]">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Analytics…</span>
        </div>
      </Layout>
    );
  }

  const { overview, dailyActiveUsers, accuracyByLevel, engagementByDay, ldPerformance, screeningFunnel, monthlyGrowth, topPerformers, atRiskStudents } = data || {};

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between pb-4 border-b border-[var(--border-main)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Analytics & Reports</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Platform-wide metrics and student performance insights</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `analytics_report_${new Date().toISOString().slice(0, 10)}.json`; a.click();
              toast.success('Report downloaded!');
            }} className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition">
              📥 Export Report
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon="👥" label="Total Students" value={overview?.totalStudents} color="bg-blue-600" />
          <StatCard icon="⚡" label="Active This Week" value={overview?.activeThisWeek} color="bg-emerald-600" />
          <StatCard icon="🎯" label="Avg Accuracy" value={`${overview?.avgAccuracy}%`} color="bg-purple-600" />
          <StatCard icon="⏱️" label="Avg Session" value={`${overview?.avgSessionMinutes} min`} color="bg-amber-500" />
          <StatCard icon="📊" label="Total Sessions" value={overview?.totalPracticeSessions?.toLocaleString()} color="bg-cyan-600" />
          <StatCard icon="🧠" label="Screened" value={overview?.screenedStudents} color="bg-pink-600" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Active Users */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-main)]">Daily Active Users</h3>
              <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full uppercase">30 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyActiveUsers}>
                <defs>
                  <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#colorDAU)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy by Level */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-main)]">Accuracy by Level</h3>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">Avg %</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={accuracyByLevel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="level" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {accuracyByLevel?.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  <LabelList dataKey="accuracy" position="top" fill="var(--text-muted)" fontSize={10} fontWeight={700} formatter={v => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement by Day */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-main)]">Engagement by Day</h3>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Sessions</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={engagementByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="sessions" fill="#10B981" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="sessions" position="top" fill="var(--text-muted)" fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Trend */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-main)]">Monthly Growth</h3>
              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase">Students + Revenue</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Line yAxisId="left" type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Screening Funnel + LD Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Screening Funnel */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <h3 className="text-base font-bold text-[var(--text-main)] mb-4">Screening Completion Funnel</h3>
            <div className="space-y-3">
              {screeningFunnel?.map((stage, i) => {
                const maxCount = screeningFunnel[0].count;
                const pct = Math.round((stage.count / maxCount) * 100);
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text-main)]">{stage.stage}</span>
                      <span className="text-xs font-bold text-[var(--text-muted)]">{stage.count} ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LD Type Performance */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <h3 className="text-base font-bold text-[var(--text-main)] mb-4">Performance by LD Type</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">LD Type</th>
                    <th className="px-3 py-2 text-left">Students</th>
                    <th className="px-3 py-2 text-left">Avg Accuracy</th>
                    <th className="px-3 py-2 text-left">Avg Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {ldPerformance?.map((ld, i) => (
                    <tr key={ld.type}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="font-bold text-[var(--text-main)]">{ld.type}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[var(--text-muted)]">{ld.students}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${ld.avgAccuracy}%`, backgroundColor: COLORS[i] }} />
                          </div>
                          <span className="text-xs font-bold text-[var(--text-main)]">{ld.avgAccuracy}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-[var(--text-main)]">{ld.avgLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Performers + At Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-main)]">
              <h3 className="text-base font-bold text-[var(--text-main)]">🏆 Top Performers</h3>
            </div>
            <div className="divide-y divide-[var(--border-main)]">
              {topPerformers?.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-main)]">{s.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Level {s.level} • {s.streak} day streak</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* At Risk */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-main)]">
              <h3 className="text-base font-bold text-[var(--text-main)]">⚠️ At-Risk Students</h3>
            </div>
            <div className="divide-y divide-[var(--border-main)]">
              {atRiskStudents?.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔴</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-main)]">{s.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{s.ldType} • Level {s.level} • Inactive {s.inactive}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-red-500">{s.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
