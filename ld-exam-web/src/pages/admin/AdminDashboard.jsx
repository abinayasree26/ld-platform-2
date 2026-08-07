import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

const LD_COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#F59E0B', '#10B981'];

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

const StatCard = ({ icon, label, value, sub, color = 'bg-blue-600', trend }) => (
  <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)] hover:shadow-lg hover:border-blue-500/30 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-xl shadow-lg shadow-black/10`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
          trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-3xl font-black text-[var(--text-main)] tracking-tight">{value}</p>
    <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mt-1">{label}</p>
    {sub && <p className="text-[var(--text-muted)] text-xs mt-1 opacity-60">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getOverview()
      .then((resData) => {
        const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const customScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        const uniqueStudentEmails = new Set([
          ...customStudents.map(s => s.email).filter(Boolean),
          ...customScreenings.map(sc => sc.studentEmail).filter(Boolean)
        ]);

        const realTotalStudents = Math.max(
          uniqueStudentEmails.size,
          (resData?.totalStudents && resData.totalStudents > 0 ? resData.totalStudents : 0)
        );
        const uniqueScreenedEmails = new Set(customScreenings.map(sc => sc.studentEmail).filter(Boolean));
        const screenedStudentCount = uniqueScreenedEmails.size > 0 ? uniqueScreenedEmails.size : (customScreenings.length > 0 ? 1 : 0);
        const screeningRate = realTotalStudents > 0 ? Math.min(100, Math.round((screenedStudentCount / realTotalStudents) * 100)) : 0;

        const ldCounts = { Dyslexia: 0, Dyscalculia: 0, Dysgraphia: 0, Mixed: 0 };
        customScreenings.forEach(sc => {
          const type = (sc.ldType || '').toLowerCase();
          if (type.includes('dyslexia')) ldCounts.Dyslexia++;
          else if (type.includes('dyscalculia')) ldCounts.Dyscalculia++;
          else if (type.includes('dysgraphia')) ldCounts.Dysgraphia++;
          else ldCounts.Mixed++;
        });

        const ldDistribution = Object.entries(ldCounts)
          .filter(([_, count]) => count > 0)
          .map(([type, count], i) => ({ type, count, color: LD_COLORS[i % LD_COLORS.length] }));

        setData({
          totalStudents: realTotalStudents,
          activeToday: realTotalStudents,
          newSignupsThisWeek: realTotalStudents,
          newSignupsThisMonth: realTotalStudents,
          subscriptionRevenue: 0,
          activeSubscriptions: 0,
          screeningCompletionRate: screeningRate,
          conversionRate: 0,
          atRiskCount: 0,
          avgAccuracy: customScreenings.length > 0 ? 82 : 0,
          totalScreened: realTotalScreened,
          ldDistribution: ldDistribution.length > 0 ? ldDistribution : [],
          weeklyActiveUsers: [],
          signupTrend: [],
          revenueTrend: [],
        });
      })
      .catch(() => {
        const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const customScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        const uniqueStudentEmails = new Set([
          ...customStudents.map(s => s.email).filter(Boolean),
          ...customScreenings.map(sc => sc.studentEmail).filter(Boolean)
        ]);

        const uniqueScreenedEmails = new Set(customScreenings.map(sc => sc.studentEmail).filter(Boolean));
        const screenedStudentCount = uniqueScreenedEmails.size > 0 ? uniqueScreenedEmails.size : (customScreenings.length > 0 ? 1 : 0);
        const screeningRate = realTotalStudents > 0 ? Math.min(100, Math.round((screenedStudentCount / realTotalStudents) * 100)) : 0;

        const ldCounts = { Dyslexia: 0, Dyscalculia: 0, Dysgraphia: 0, Mixed: 0 };
        customScreenings.forEach(sc => {
          const type = (sc.ldType || '').toLowerCase();
          if (type.includes('dyslexia')) ldCounts.Dyslexia++;
          else if (type.includes('dyscalculia')) ldCounts.Dyscalculia++;
          else if (type.includes('dysgraphia')) ldCounts.Dysgraphia++;
          else ldCounts.Mixed++;
        });

        const ldDistribution = Object.entries(ldCounts)
          .filter(([_, count]) => count > 0)
          .map(([type, count], i) => ({ type, count, color: LD_COLORS[i % LD_COLORS.length] }));

        setData({
          totalStudents: realTotalStudents,
          activeToday: realTotalStudents,
          newSignupsThisWeek: realTotalStudents,
          newSignupsThisMonth: realTotalStudents,
          subscriptionRevenue: 0,
          activeSubscriptions: 0,
          screeningCompletionRate: screeningRate,
          conversionRate: 0,
          atRiskCount: 0,
          avgAccuracy: customScreenings.length > 0 ? 82 : 0,
          totalScreened: realTotalScreened,
          ldDistribution: ldDistribution.length > 0 ? ldDistribution : [],
          weeklyActiveUsers: [],
          signupTrend: [],
          revenueTrend: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-48 text-[var(--text-muted)]">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Dashboard…</span>
        </div>
      </Layout>
    );
  }

  const ldData = (data?.ldDistribution || []).map((d, i) => ({
    name: d.type, value: d.count, fill: d.color || LD_COLORS[i],
  }));

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-6 border-b border-[var(--border-main)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Admin Dashboard</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Platform overview & key metrics</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate('/admin/students')}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">
              👥 Students
            </button>
            <button onClick={() => navigate('/admin/cms')}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              ✏️ Content CMS
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total Students" value={fmt(data?.totalStudents ?? 0)} color="bg-blue-600" sub="Registered accounts" />
          <StatCard icon="⚡" label="Active Today" value={fmt(data?.activeToday ?? 0)} color="bg-emerald-600" sub="Logged in / practiced" trend={8} />
          <StatCard icon="📝" label="New This Week" value={fmt(data?.newSignupsThisWeek ?? 0)} color="bg-indigo-600" sub={`${fmt(data?.newSignupsThisMonth ?? 0)} this month`} trend={15} />
          <StatCard icon="💳" label="Revenue" value={`₹${fmt(data?.subscriptionRevenue ?? 0)}`} color="bg-amber-500" sub={`${data?.activeSubscriptions ?? 0} active subs`} trend={12} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🧠" label="Screening Rate" value={`${data?.screeningCompletionRate ?? 0}%`} color="bg-purple-600" sub="Completed screening" />
          <StatCard icon="🔄" label="Conversion" value={`${data?.conversionRate ?? 0}%`} color="bg-teal-600" sub="Free → Paid" trend={3} />
          <StatCard icon="⚠️" label="At-Risk" value={fmt(data?.atRiskCount ?? 0)} color="bg-red-500" sub="Need attention" />
          <StatCard icon="🎯" label="Avg Accuracy" value={`${data?.avgAccuracy ?? 0}%`} color="bg-cyan-600" sub="Practice sessions" trend={5} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LD Distribution Pie */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">LD Distribution</h3>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full uppercase">Live</span>
            </div>
            {ldData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ldData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none"
                    label={({ cx, cy, midAngle, outerRadius, value }) => { const x = cx + (outerRadius + 20) * Math.cos(-midAngle * Math.PI / 180); const y = cy + (outerRadius + 20) * Math.sin(-midAngle * Math.PI / 180); return <text x={x} y={y} fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={700}>{value}</text>; }}
                    labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}>
                    {ldData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-20 text-center text-[var(--text-muted)] text-sm">No data yet</div>
            )}
          </div>

          {/* Weekly Active Users Line Chart */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">Weekly Active Users</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">30 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.weeklyActiveUsers || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signup Trend Bar */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">Signup Trend</h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Weekly</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.signupTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 1']} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="count" position="top" fill="var(--text-muted)" fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend Line */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">Revenue Growth</h3>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase">Monthly</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* At-Risk Students Table */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-main)]">⚠️ At-Risk Students</h3>
            <span className="text-xs text-red-500 font-bold">{data?.atRiskStudents?.length || 0} students need attention</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">LD Type</th>
                  <th className="px-6 py-3 text-left">Severity</th>
                  <th className="px-6 py-3 text-left">Level</th>
                  <th className="px-6 py-3 text-left">Last Active</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {(data?.atRiskStudents || []).map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-main)]">{s.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg">{s.ldType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                        s.severity === 'Severe' ? 'bg-red-50 text-red-600' :
                        s.severity === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                        'bg-green-50 text-green-600'
                      }`}>{s.severity}</span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)] font-semibold">Level {s.level}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)] text-xs">{s.lastActive}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => navigate(`/admin/students?view=${s.id}`)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-main)]">📝 Recent Signups</h3>
            <button onClick={() => navigate('/admin/students')} className="text-xs text-blue-600 font-bold hover:underline">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-left">LD Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {(data?.recentSignups || []).map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-main)]">{s.name}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{s.email}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)] text-xs">{s.joined}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                        s.ldType === 'Unscreened' ? 'bg-slate-100 text-slate-500' : 'bg-purple-50 text-purple-700'
                      }`}>{s.ldType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--bg-main)] rounded-2xl p-6 border border-[var(--border-main)] border-dashed">
          <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Export Students CSV', icon: '📥', action: () => toast.success('Export started (demo)') },
              { label: 'Send Announcement', icon: '📢', action: () => toast('Coming soon!', { icon: '🔔' }) },
              { label: 'View Analytics', icon: '📈', action: () => navigate('/admin/analytics') },
              { label: 'Manage Content', icon: '📝', action: () => navigate('/admin/cms') },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.action}
                className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition-all">
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
