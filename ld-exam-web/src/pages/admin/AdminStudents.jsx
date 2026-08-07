import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';

const LD_BADGE = {
  Dyslexia: 'bg-purple-50 text-purple-700',
  Dyscalculia: 'bg-blue-50 text-blue-700',
  Dysgraphia: 'bg-pink-50 text-pink-700',
  Mixed: 'bg-amber-50 text-amber-700',
  Unscreened: 'bg-slate-100 text-slate-500',
  'None Detected': 'bg-emerald-50 text-emerald-700',
};

const SEVERITY_BADGE = {
  Severe: 'bg-red-50 text-red-600',
  Moderate: 'bg-amber-50 text-amber-600',
  Mild: 'bg-green-50 text-green-600',
};

const SUB_BADGE = {
  Active: 'bg-emerald-50 text-emerald-600',
  Expired: 'bg-red-50 text-red-500',
  Free: 'bg-slate-100 text-slate-500',
};

const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: student.name || '', email: student.email || '',
    phone: student.phone || '', age: student.age || '',
    status: student.status || 'active',
  });

  const handleSave = () => {
    toast.success(`Profile updated for ${form.name} (demo)`);
    setEditing(false);
  };

  const Field = ({ label, field, type = 'text' }) => (
    <div>
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">{label}</p>
      {editing ? (
        <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500" />
      ) : (
        <p className="text-sm text-[var(--text-main)]">{field === 'age' ? `${student[field]} years` : student[field]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[var(--bg-card)] px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between z-10">
          <h3 className="text-xl font-black text-[var(--text-main)]">Student Profile</h3>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition">✏️ Edit</button>
            ) : (
              <>
                <button onClick={handleSave} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">💾 Save</button>
                <button onClick={() => { setEditing(false); setForm({ name: student.name, email: student.email, phone: student.phone, age: student.age, status: student.status }); }}
                  className="px-3 py-1.5 border border-[var(--border-main)] text-[var(--text-muted)] text-xs font-bold rounded-lg hover:bg-[var(--bg-main)] transition">Cancel</button>
              </>
            )}
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-red-500 text-xl font-bold ml-2">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" field="name" />
            <Field label="Email" field="email" type="email" />
            <Field label="Phone" field="phone" />
            <Field label="Age" field="age" type="number" />
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Joined</p>
              <p className="text-sm text-[var(--text-main)]">{student.joined}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Status</p>
              {editing ? (
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {student.status}
                </span>
              )}
            </div>
          </div>

          {/* LD Info */}
          <div className="bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border-main)]">
            <h4 className="text-sm font-bold text-[var(--text-main)] mb-3">LD Assessment</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">LD Type</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${LD_BADGE[student.ldType] || 'bg-slate-100 text-slate-500'}`}>
                  {student.ldType}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Severity</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_BADGE[student.severity] || 'bg-slate-100 text-slate-400'}`}>
                  {student.severity || 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Confidence</p>
                <p className="text-sm font-bold text-[var(--text-main)] mt-1">{student.confidence ? `${student.confidence}%` : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Screened</p>
                <p className="text-sm text-[var(--text-main)] mt-1">{student.screeningDate || 'Not yet'}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-[var(--bg-main)] rounded-xl p-4 border border-[var(--border-main)]">
            <h4 className="text-sm font-bold text-[var(--text-main)] mb-3">Progress</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-black text-purple-600">{student.level}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Level</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-blue-600">{student.practiceStats?.totalSessions || '—'}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{student.practiceStats?.avgAccuracy || '—'}%</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Test History */}
          {student.testHistory && (
            <div>
              <h4 className="text-sm font-bold text-[var(--text-main)] mb-3">Test History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Level</th>
                      <th className="px-3 py-2 text-left">Score</th>
                      <th className="px-3 py-2 text-left">Result</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {student.testHistory.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-bold">Level {t.level}</td>
                        <td className="px-3 py-2">{t.score}%</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {t.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{t.date}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{t.timeTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscription */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Subscription</p>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${SUB_BADGE[student.subscription] || 'bg-slate-100 text-slate-500'}`}>
                {student.subscription}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Last Active</p>
              <p className="text-sm text-[var(--text-main)]">{student.lastActive}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminStudents = () => {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterLD, setFilterLD] = useState('all');
  const [filterSub, setFilterSub] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = React.useRef(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (filterLD !== 'all') params.set('ldType', filterLD);
      if (filterSub !== 'all') params.set('subscription', filterSub);
      if (filterLevel !== 'all') params.set('level', filterLevel);

      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`/api/admin/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      let list = data.students || [];
      try {
        const rawCustomStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const rawCustomScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        const customStudents = rawCustomStudents.filter(s => s.name !== 'Administrator' && s.name !== 'Admin User' && s.email !== 'student@gmail.com');
        const customScreenings = rawCustomScreenings.filter(sc => sc.studentName !== 'Administrator' && sc.studentName !== 'Admin User' && sc.studentEmail !== 'student@gmail.com');

        if (customStudents.length > 0) {
          const existingEmails = new Set(list.map(s => s.email));
          const newCustom = customStudents.filter(s => !existingEmails.has(s.email));
          list = [...newCustom, ...list];
        }

        if (customScreenings.length > 0) {
          const existingEmails = new Set(list.map(s => s.email));
          const screeningMap = new Map(customScreenings.map(sc => [sc.studentEmail, sc]));

          customScreenings.forEach(sc => {
            if (sc.studentEmail && !existingEmails.has(sc.studentEmail)) {
              list.push({
                id: sc.studentId || `st-${Date.now()}`,
                name: sc.studentName || 'Student',
                email: sc.studentEmail,
                grade: 'Class 5',
                ldType: sc.ldType ? sc.ldType.charAt(0).toUpperCase() + sc.ldType.slice(1) : 'Dyslexia',
                severity: sc.severity || 'Moderate',
                level: 'Level 1',
                status: 'active',
                joined: sc.completedAt ? sc.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                lastActive: 'Today',
                subscription: 'Free Tier',
                screened: true,
              });
              existingEmails.add(sc.studentEmail);
            }
          });

          list = list.map(s => {
            const sc = screeningMap.get(s.email);
            if (sc) {
              return {
                ...s,
                ldType: sc.ldType ? sc.ldType.charAt(0).toUpperCase() + sc.ldType.slice(1) : s.ldType,
                severity: sc.severity || 'Moderate',
                screened: true,
                status: 'active',
              };
            }
            return s;
          });
        }
      } catch { /* ignore */ }

      // Final strict filter: Never show Administrator or fake demo student entries in Student Management
      list = list.filter(s => s.name !== 'Administrator' && s.name !== 'Admin User' && s.email !== 'student@gmail.com');

      setStudents(list);
      setTotal(list.length);
      setTotalPages(Math.max(1, Math.ceil(list.length / 10)));
    } catch {
      let list = [];
      try {
        const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const customScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');

        if (customStudents.length > 0) {
          list = [...customStudents];
        }

        if (customScreenings.length > 0) {
          const screeningMap = new Map(customScreenings.map(sc => [sc.studentEmail, sc]));
          if (list.length === 0) {
            customScreenings.forEach(sc => {
              list.push({
                id: sc.studentId || `st-${Date.now()}`,
                name: sc.studentName || 'Student',
                email: sc.studentEmail,
                grade: 'Class 5',
                ldType: sc.ldType ? sc.ldType.charAt(0).toUpperCase() + sc.ldType.slice(1) : 'Dyslexia',
                severity: sc.severity || 'Moderate',
                status: 'active',
                joined: sc.completedAt ? sc.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                subscription: 'Free Tier',
                screened: true,
              });
            });
          } else {
            list = list.map(s => {
              const sc = screeningMap.get(s.email);
              if (sc) {
                return {
                  ...s,
                  ldType: sc.ldType ? sc.ldType.charAt(0).toUpperCase() + sc.ldType.slice(1) : s.ldType,
                  severity: sc.severity || 'Moderate',
                  screened: true,
                  status: 'active',
                };
              }
              return s;
            });
          }
        }
      } catch { /* ignore */ }

      setStudents(list);
      setTotal(list.length);
      setTotalPages(Math.max(1, Math.ceil(list.length / 10)));
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (id) => {
    setDetailLoading(true);
    const studentFromState = students.find(s => s.id === id);
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (resp && resp.ok) {
        const data = await resp.json();
        setSelectedStudent(data);
      } else if (studentFromState) {
        setSelectedStudent({
          ...studentFromState,
          parentName: 'Parent / Guardian',
          phone: '+91 98765 43210',
          recentSessions: [
            { id: 'sess-1', date: studentFromState.joined || '2026-08-07', topic: 'Screening Assessment', score: 'Completed' }
          ]
        });
      } else {
        toast.error('Student details not found');
      }
    } catch {
      if (studentFromState) {
        setSelectedStudent(studentFromState);
      } else {
        toast.error('Student details not found');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchStudents();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Send a password reset email to "${name}"?`)) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/students/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* ignore */ });

      try {
        const customStudents = JSON.parse(localStorage.getItem('admin_registered_students') || '[]');
        const targetStudent = students.find(s => s.id === id);
        const targetEmail = targetStudent?.email;

        const updatedStudents = customStudents.filter(s => s.id !== id && (targetEmail ? s.email !== targetEmail : true));
        localStorage.setItem('admin_registered_students', JSON.stringify(updatedStudents));

        if (targetEmail) {
          const customScreenings = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');
          const updatedScreenings = customScreenings.filter(sc => sc.studentEmail !== targetEmail);
          localStorage.setItem('admin_custom_screening_results', JSON.stringify(updatedScreenings));
        }
      } catch { /* ignore */ }

      toast.success(`Student "${name}" deleted successfully`);
      fetchStudents();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([]);
    else setSelectedIds(students.map(s => s.id));
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected students? This cannot be undone.`)) return;
    const token = localStorage.getItem('auth_token');
    for (const id of selectedIds) {
      await fetch(`/api/admin/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }
    toast.success(`${selectedIds.length} students deleted`);
    setSelectedIds([]);
    fetchStudents();
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Generating CSV export file...', { id: 'csv-exp' });
      const token = localStorage.getItem('auth_token');
      const resp = await fetch('/api/admin/export/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await resp.blob();
      toast.dismiss('csv-exp');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Student roster CSV downloaded!');
    } catch {
      toast.dismiss('csv-exp');
      toast.error('Failed to export CSV');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading(`Importing ${file.name}...`, { id: 'csv-imp' });
      const token = localStorage.getItem('auth_token');
      const text = await file.text();
      const rows = text.split('\n').filter((r) => r.trim());

      const resp = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, rows: rows.slice(1) }),
      });
      const data = await resp.json();
      toast.dismiss('csv-imp');

      if (resp.ok) {
        toast.success(data.message || `Successfully imported students from ${file.name}!`);
        fetchStudents();
      } else {
        toast.error(data.error || 'Failed to import CSV');
      }
    } catch {
      toast.dismiss('csv-imp');
      toast.error('CSV Import error');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => { fetchStudents(); }, [page, filterLD, filterSub, filterLevel]);

  // Auto-open student detail if ?view=ID is in URL
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      fetchStudentDetail(viewId);
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchStudents(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[var(--border-main)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Student Management</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">{total} total students</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleImportCSV}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
            >
              📤 Import Roster
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-xl text-xs font-bold hover:border-purple-400 transition"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          <select value={filterLD} onChange={(e) => { setFilterLD(e.target.value); setPage(1); }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All LD Types</option>
            <option value="Dyslexia">Dyslexia</option>
            <option value="Dyscalculia">Dyscalculia</option>
            <option value="Dysgraphia">Dysgraphia</option>
            <option value="Mixed">Mixed</option>
            <option value="Unscreened">Unscreened</option>
          </select>
          <select value={filterSub} onChange={(e) => { setFilterSub(e.target.value); setPage(1); }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All Plans</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Free">Free</option>
          </select>
          <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-purple-500">
            <option value="all">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
          {(search || filterLD !== 'all' || filterSub !== 'all' || filterLevel !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterLD('all'); setFilterSub('all'); setFilterLevel('all'); setPage(1); }}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          {/* Bulk Delete Bar */}
          {selectedIds.length > 0 && (
            <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
              <span className="text-sm font-bold text-red-400">{selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected</span>
              <button onClick={handleBulkDelete}
                className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition">
                🗑️ Delete Selected
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={selectedIds.length === students.length && students.length > 0}
                        onChange={toggleSelectAll} className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">LD Type</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Level</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Last Active</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--bg-main)] transition-colors">
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)} className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => fetchStudentDetail(s.id)} className="font-bold text-[var(--text-main)] hover:text-purple-600 transition text-left">
                          {s.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${LD_BADGE[s.ldType] || 'bg-slate-100 text-slate-500'}`}>
                          {s.ldType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.severity ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_BADGE[s.severity]}`}>
                            {s.severity}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--text-main)]">{s.level || 'Level 1'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SUB_BADGE[s.subscription] || 'bg-slate-100 text-slate-600'}`}>
                          {s.subscription || 'Free Tier'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{s.lastActive || 'Today'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => fetchStudentDetail(s.id)} title="View" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition text-xs">👁️</button>
                          <button onClick={() => handleResetPassword(s.id, s.name)} title="Reset Password" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition text-xs">🔑</button>
                          <button onClick={() => handleDeactivate(s.id, s.status)} title={s.status === 'active' ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition text-xs">
                            {s.status === 'active' ? '🚫' : '✅'}
                          </button>
                          <button onClick={() => fetchStudentDetail(s.id)} title="Edit Profile" className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition text-xs">✏️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-main)]">
              <p className="text-xs text-[var(--text-muted)]">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-purple-400 disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      page === i + 1
                        ? 'bg-purple-600 text-white'
                        : 'bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-purple-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-purple-400 disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </Layout>
  );
};

export default AdminStudents;
