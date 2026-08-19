import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  Success: 'bg-emerald-50 text-emerald-600',
  Failed: 'bg-red-50 text-red-500',
  Refunded: 'bg-amber-50 text-amber-600',
  Pending: 'bg-blue-50 text-blue-600',
};

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

const AdminBilling = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/admin/billing', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load billing data'))
      .finally(() => setLoading(false));
  }, []);

  const handleRazorpayCheckout = async (plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      toast.loading(`Creating ${plan.name} payment order…`, { id: 'rzp' });

      const resp = await fetch('/api/payments/order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: plan.price || 499, planType: plan.id }),
      });
      const orderData = await resp.json();
      if (!resp.ok) throw new Error(orderData.error || 'Failed to create payment order');

      toast.dismiss('rzp');

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'LD Support Platform',
        description: `Subscription: ${plan.name}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          toast.loading('Verifying payment signature…', { id: 'verify' });
          const verifyResp = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyResp.json();
          toast.dismiss('verify');

          if (verifyResp.ok) {
            toast.success(`Payment Successful for ${plan.name}!`);
          } else {
            toast.error(verifyData.error || 'Payment verification failed');
          }
        },
        prefill: {
          name: 'School Administrator',
          email: 'admin@ldschools.in',
        },
        theme: {
          color: '#7C3AED',
        },
      };

      const isTestKey = !orderData.keyId || orderData.keyId.includes('demoKey') || orderData.demoMode;

      if (!isTestKey && window.Razorpay) {
        const rzpModal = new window.Razorpay(options);
        rzpModal.open();
      } else {
        // Test / Demo Mode Verification Flow
        if (window.confirm(`[Razorpay Payment Test Mode]\n\nPlan: ${plan.name}\nAmount: ₹${plan.price}\nOrder ID: ${orderData.orderId}\n\nClick OK to simulate successful payment verification.`)) {
          toast.loading('Verifying payment signature…', { id: 'verify' });
          const verifyResp = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(7)}`,
              razorpay_signature: 'test_demo_signature',
            }),
          });
          const verifyData = await verifyResp.json();
          toast.dismiss('verify');

          if (verifyResp.ok) {
            toast.success(`💳 Payment Successful for ${plan.name}!`);
          } else {
            toast.error(verifyData.error || 'Payment verification failed');
          }
        }
      }
    } catch (err) {
      toast.dismiss('rzp');
      toast.error(err.message || 'Payment processing error');
    }
  };

  const handleExtend = async (name) => {
    if (!window.confirm(`Extend subscription for "${name}" by 30 days?`)) return;
    const token = localStorage.getItem('auth_token');
    await fetch('/api/admin/billing/extend', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    toast.success(`Subscription extended for ${name}`);
  };

  const handleRefund = async (id, name) => {
    if (!window.confirm(`Process refund for "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('auth_token');
    await fetch('/api/admin/billing/refund', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: id }) });
    toast.success(`Refund processed for ${name}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-48 text-[var(--text-muted)]">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading Billing…</span>
        </div>
      </Layout>
    );
  }

  const { overview, plans, recentPayments, revenueTrend, expiringThisWeek } = data || {};
  const filteredPayments = paymentFilter === 'all' ? recentPayments : recentPayments?.filter(p => p.status === paymentFilter);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between pb-4 border-b border-[var(--border-main)] flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">Subscription & Billing</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Revenue, payments, and plan management</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRazorpayCheckout({ id: 'monthly', name: 'Monthly', price: 199 })}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-extrabold hover:bg-purple-700 transition shadow-md shadow-purple-600/20 flex items-center gap-1.5"
            >
              💳 Test Razorpay Payment
            </button>
            <button onClick={() => {
              const headers = 'Student,Email,Amount,Plan,Status,Date,Method\n';
              const rows = (recentPayments || []).map(p => `${p.student},${p.email},₹${p.amount},${p.plan},${p.status},${p.date},${p.method}`).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
              toast.success('Payment history downloaded!');
            }} className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:border-purple-400 hover:text-purple-600 transition">
              📥 Export Payments
            </button>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon="💰" label="Monthly Revenue" value={`₹${overview?.monthlyRevenue?.toLocaleString('en-IN')}`} color="bg-emerald-600" sub={`↑ ${overview?.growthPct}% growth`} />
          <StatCard icon="📊" label="Annual Revenue" value={`₹${overview?.annualRevenue?.toLocaleString('en-IN')}`} color="bg-blue-600" />
          <StatCard icon="✅" label="Active Subs" value={overview?.activeSubscriptions} color="bg-purple-600" sub={`${overview?.freeUsers} free users`} />
          <StatCard icon="🔄" label="Conversion" value={`${overview?.conversionRate}%`} color="bg-amber-500" sub="Free → Paid" />
          <StatCard icon="📉" label="Churn Rate" value={`${overview?.churnRate}%`} color="bg-red-500" sub={`ARPU: ₹${overview?.arpu}`} />
        </div>

        {/* Plans Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans?.map((plan) => (
            <div key={plan.id} className={`bg-[var(--bg-card)] rounded-2xl p-5 border-2 ${plan.id === 'annual' ? 'border-purple-500 shadow-lg shadow-purple-900/20' : 'border-[var(--border-main)]'} relative flex flex-col justify-between h-full`}>
              <div>
                {plan.id === 'annual' && (
                  <span className="absolute -top-2.5 left-4 bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">Best Value</span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-[var(--text-main)]">{plan.name}</h3>
                  <span className="text-xl font-black text-purple-600">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                    {plan.period && <span className="text-xs font-bold text-[var(--text-muted)]">/{plan.period}</span>}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-1">{plan.students}</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-4">students on this plan</p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
                      <span className="text-emerald-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              {plan.price > 0 && (
                <div className="pt-3 border-t border-[var(--border-main)] mt-2">
                  <button
                    onClick={() => handleRazorpayCheckout(plan)}
                    className="w-full py-2 bg-purple-600/10 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-purple-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    💳 Test {plan.name} Plan (₹{plan.price})
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-main)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--text-main)]">Revenue & Subscriptions Trend</h3>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">7 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} formatter={(v, name) => [name === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v, name === 'revenue' ? 'Revenue' : 'Subscriptions']} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Revenue (₹)" />
              <Line yAxisId="right" type="monotone" dataKey="subscriptions" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} name="Active Subs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expiring This Week */}
        {expiringThisWeek?.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-400 mb-3">⚠️ Expiring This Week ({expiringThisWeek.length} students)</h3>
            <div className="space-y-2">
              {expiringThisWeek.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-[var(--bg-main)] rounded-xl px-4 py-2.5 border border-[var(--border-main)]">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{s.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.email} • {s.plan} • Expires {s.expiresOn}</p>
                  </div>
                  <button onClick={() => handleExtend(s.name)}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition">
                    Extend 30d
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-main)]">Payment History</h3>
            <div className="flex gap-1">
              {['all', 'Success', 'Failed', 'Refunded'].map(f => (
                <button key={f} onClick={() => setPaymentFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${paymentFilter === f ? 'bg-purple-600 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Plan</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Method</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredPayments?.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-[var(--text-main)]">{p.student}</p>
                      <p className="text-[var(--text-muted)] text-xs">{p.email}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-[var(--text-main)]">₹{p.amount}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded">{p.plan}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{p.method}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{p.date}</td>
                    <td className="px-5 py-3">
                      {p.status === 'Success' && (
                        <button onClick={() => handleRefund(p.id, p.student)} title="Refund"
                          className="px-2 py-1 text-[10px] font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
                          Refund
                        </button>
                      )}
                      {p.status === 'Failed' && (
                        <span className="text-[10px] text-[var(--text-muted)]">Payment failed</span>
                      )}
                      {p.status === 'Refunded' && (
                        <span className="text-[10px] text-amber-500">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminBilling;
