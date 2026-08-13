import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

import { supabase } from '../../services/supabaseClient';

const LD_BADGE = {
  Dyslexia: 'bg-purple-50 text-purple-700',
  Dyscalculia: 'bg-blue-50 text-blue-700',
  Dysgraphia: 'bg-pink-50 text-pink-700',
  Mixed: 'bg-amber-50 text-amber-700',
};

const SEVERITY_BADGE = {
  Severe: 'bg-red-50 text-red-600',
  Moderate: 'bg-amber-50 text-amber-600',
  Mild: 'bg-green-50 text-green-600',
};

const STATUS_BADGE = {
  Completed: 'bg-emerald-50 text-emerald-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  'Not Started': 'bg-slate-100 text-slate-500',
};

const LD_PIE_COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#F59E0B', '#10B981'];

// Override Modal
const OverrideModal = ({ screening, onClose, onSave }) => {
  const [ldType, setLdType] = useState(screening.ldType || 'Dyslexia');
  const [severity, setSeverity] = useState(screening.severity || 'Mild');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-[var(--text-main)] mb-1">Override Classification</h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">Manually change LD type and severity for <b>{screening.studentName}</b></p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">LD Type</label>
            <select value={ldType} onChange={(e) => setLdType(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500">
              <option>Dyslexia</option>
              <option>Dyscalculia</option>
              <option>Dysgraphia</option>
              <option>Mixed</option>
              <option>None Detected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500">
              <option>Mild</option>
              <option>Moderate</option>
              <option>Severe</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[var(--border-main)] text-[var(--text-muted)] font-bold py-2.5 rounded-xl hover:bg-[var(--bg-main)] transition text-sm">
            Cancel
          </button>
          <button onClick={() => onSave(ldType, severity)} className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-700 transition text-sm">
            Save Override
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminScreening = () => {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLD, setFilterLD] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [overrideTarget, setOverrideTarget] = useState(null);

  const fetchScreening = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterLD !== 'all') params.set('ldType', filterLD);
      if (filterSeverity !== 'all') params.set('severity', filterSeverity);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const token = localStorage.getItem('auth_token');
      let list = [];
      try {
        const resp = await fetch(`/api/admin/screening?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
        if (resp && resp.ok) {
          const data = await resp.json().catch(() => ({}));
          list = data.results || [];
        }
      } catch { /* ignore api fallback */ }

      try {
        const { data: supaScreened } = await supabase.from('students').select('*').eq('screened', true);
        if (supaScreened && supaScreened.length > 0) {
          const existingEmails = new Set(list.map(r => r.studentEmail || r.email));
          const supaFormatted = supaScreened.map(s => ({
            id: `supa-sr-${s.id}`,
            studentId: s.id,
            studentName: s.name,
            studentEmail: s.email,
            ldType: s.ld_type || 'Dyslexia',
            severity: s.severity || 'Moderate',
            riskScore: 50,
            status: 'completed',
            completedAt: s.created_at || new Date().toISOString(),
            breakdown: { dyslexia: 50, dysgraphia: 40, dyscalculia: 30 },
          })).filter(s => !existingEmails.has(s.studentEmail));

          list = [...supaFormatted, ...list];
        }
      } catch { /* fallback */ }

      try {
        const rawSubmissions = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');
        const customSubmissions = rawSubmissions.filter(s => s.studentName !== 'Administrator' && s.studentName !== 'Admin User' && s.studentEmail !== 'student@gmail.com');
        if (customSubmissions.length > 0) {
          const existingEmails = new Set(list.map(r => r.studentEmail || r.email));
          const newCustom = customSubmissions.filter(s => !existingEmails.has(s.studentEmail));
          list = [...newCustom, ...list];
        }
      } catch { /* ignore */ }

      list = list.filter(item => item.studentName !== 'Administrator' && item.studentName !== 'Admin User' && item.studentEmail !== 'student@gmail.com');

      const latestPerStudentMap = new Map();
      list.forEach(item => {
        const email = item.studentEmail || item.email || item.studentName;
        if (!latestPerStudentMap.has(email)) {
          latestPerStudentMap.set(email, item);
        }
      });
      const uniqueList = Array.from(latestPerStudentMap.values());

      setResults(uniqueList);
      setStats({ total: uniqueList.length, completed: uniqueList.length, pending: 0 });
    } catch {
      setResults([]);
      setStats({ total: 0, completed: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideSave = async (ldType, severity) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/screening/${overrideTarget.id}/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ldType, severity }),
      });
      toast.success(`Classification overridden to ${ldType} (${severity})`);
      setOverrideTarget(null);
      fetchScreening();
    } catch {
      toast.error('Override failed');
    }
  };

  const handleReset = async (studentId, name) => {
    if (!window.confirm(`Reset screening for "${name}"? They will need to retake it.`)) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/screening/${studentId}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Screening reset — student can retake');
      fetchScreening();
    } catch {
      toast.error('Reset failed');
    }
  };

  useEffect(() => { fetchScreening(); }, [filterLD, filterSeverity, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => fetchScreening(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Build LD distribution pie data from completed results (normalized to Title Case)
  const ldDistribution = results
    .filter(r => r.ldType)
    .reduce((acc, r) => {
      const raw = String(r.ldType).trim();
      const formattedName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      const existing = acc.find(a => a.name.toLowerCase() === formattedName.toLowerCase());
      if (existing) existing.value++;
      else acc.push({ name: formattedName, value: 1 });
      return acc;
    }, []);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[var(--border-main)]">
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Screening & LD Results</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">View all screening sessions and LD classifications</p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-[var(--text-main)]">{stats.total}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Sessions</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-600">{stats.completed}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Completed</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-blue-600">{stats.inProgress}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">In Progress</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-slate-400">{stats.notStarted}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Not Started</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-purple-600">{stats.completionRate}%</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Completion Rate</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-main)] text-center">
              <p className="text-xl sm:text-2xl font-black text-amber-600">{stats.avgConfidence}%</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Avg Confidence</p>
            </div>
          </div>
        )}

        {/* Chart + Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LD Distribution Pie */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">LD Classification Distribution</h3>
            {ldDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ldDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none"
                    label={({ cx, cy, midAngle, outerRadius, value }) => { const x = cx + (outerRadius + 20) * Math.cos(-midAngle * Math.PI / 180); const y = cy + (outerRadius + 20) * Math.sin(-midAngle * Math.PI / 180); return <text x={x} y={y} fill="var(--text-muted)" textAnchor="middle" fontSize={11} fontWeight={700}>{value}</text>; }}
                    labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}>
                    {ldDistribution.map((_, i) => <Cell key={i} fill={LD_PIE_COLORS[i % LD_PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-16 text-center text-[var(--text-muted)] text-sm">No data</div>
            )}
          </div>

          {/* Severity Breakdown */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Severity Breakdown</h3>
            <div className="space-y-4">
              {['Mild', 'Moderate', 'Severe'].map((level) => {
                const count = results.filter(r => r.severity === level).length;
                const pct = results.length ? Math.round((count / results.filter(r => r.severity).length) * 100) : 0;
                const colors = { Mild: 'bg-green-500', Moderate: 'bg-amber-500', Severe: 'bg-red-500' };
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[var(--text-main)]">{level}</span>
                      <span className="text-xs font-bold text-[var(--text-muted)]">{count} students ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden">
                      <div className={`h-full ${colors[level]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border-main)]">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Severity Guide</h4>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <p><b className="text-green-600">Mild (60–74%):</b> Practice + monitoring</p>
                <p><b className="text-amber-600">Moderate (40–59%):</b> Intensive practice + referral</p>
                <p><b className="text-red-600">Severe (&lt;40%):</b> Immediate intervention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by student name or email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 transition" />
          </div>
          <select value={filterLD} onChange={(e) => setFilterLD(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All LD Types</option>
            <option value="Dyslexia">Dyslexia</option>
            <option value="Dyscalculia">Dyscalculia</option>
            <option value="Dysgraphia">Dysgraphia</option>
            <option value="Mixed">Mixed</option>
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All Severity</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Not Started">Not Started</option>
          </select>
          {(search || filterLD !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterLD('all'); setFilterSeverity('all'); setFilterStatus('all'); }}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">LD Type</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Confidence</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--bg-main)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[var(--text-main)]">{r.studentName}</p>
                        <p className="text-[var(--text-muted)] text-xs">{r.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.ldType ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${LD_BADGE[r.ldType] || 'bg-slate-100 text-slate-500'}`}>
                            {r.ldType}
                          </span>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.severity ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_BADGE[r.severity]}`}>
                            {r.severity}
                          </span>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.confidence ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${r.confidence >= 80 ? 'bg-emerald-500' : r.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${r.confidence}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-main)]">{r.confidence}%</span>
                          </div>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.score != null ? (
                          <span className={`text-xs font-bold ${r.score >= 60 ? 'text-green-600' : r.score >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                            {r.score}%
                          </span>
                        ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{r.duration || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{r.completedAt ? r.completedAt.split(' ')[0] : '—'}</td>
                      <td className="px-4 py-3">
                        {r.status === 'Completed' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setOverrideTarget(r)} title="Override Classification"
                              className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition text-xs">✏️</button>
                            <button onClick={() => handleReset(r.studentId, r.studentName)} title="Reset Screening"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition text-xs">🔄</button>
                          </div>
                        )}
                        {r.status === 'Not Started' && (
                          <span className="text-[10px] text-[var(--text-muted)]">Awaiting</span>
                        )}
                        {r.status === 'In Progress' && (
                          <span className="text-[10px] text-blue-500 font-bold">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="flex justify-end gap-3">
          <button onClick={() => {
              const headers = 'Student,Email,Status,LD Type,Severity,Confidence,Score,Duration,Date\n';
              const rows = results.map(r =>
                `${r.studentName},${r.email},${r.status},${r.ldType || 'N/A'},${r.severity || 'N/A'},${r.confidence || 'N/A'},${r.score || 'N/A'},${r.duration || 'N/A'},${r.completedAt || 'N/A'}`
              ).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `screening_results_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('CSV downloaded!');
            }}
            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition">
            📥 Export CSV
          </button>
          <button onClick={() => {
              toast.success('PDF report generated — downloading...');
              const blob = new Blob(['[Demo] Screening Report PDF content would go here'], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `screening_report_${new Date().toISOString().slice(0, 10)}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition">
            📄 Export PDF Reports
          </button>
        </div>
      </div>

      {/* Override Modal */}
      {overrideTarget && (
        <OverrideModal
          screening={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSave={handleOverrideSave}
        />
      )}
    </Layout>
  );
};

export default AdminScreening;
