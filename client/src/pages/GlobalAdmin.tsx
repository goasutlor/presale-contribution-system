import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const GlobalAdmin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('globalToken'));
  const [tenants, setTenants] = useState<any[]>([]);
  const [overview, setOverview] = useState<any | null>(null);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [form, setForm] = useState({ tenantPrefix: '', name: '', adminEmails: '' });
  const [error, setError] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      const [tenantsRes, statsRes, overviewRes] = await Promise.all([
        api.getTenants(),
        api.getTenantStats(dateRange),
        api.getGlobalOverview(dateRange)
      ]);
      const statsByPrefix: Record<string, any> = {};
      (statsRes.data || []).forEach((s: any) => { statsByPrefix[s.tenantPrefix] = s; });
      const combined = (tenantsRes.data || []).map((t: any) => ({
        ...t,
        stats: statsByPrefix[t.tenantPrefix] || { users: 0, contributions: 0, approved: 0, lastActivity: null }
      }));
      setTenants(combined);
      setOverview(overviewRes.data || null);
      const usersRes = await api.getGlobalUsers();
      setGlobalUsers(usersRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenants');
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    loadTenants().finally(() => setLoading(false));
  }, [token, dateRange.start, dateRange.end]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.globalLogin(email, password);
      const t = (res.data as any).token;
      localStorage.setItem('globalToken', t);
      setToken(t);
      loadTenants();
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const adminEmails = form.adminEmails.split(',').map(s => s.trim()).filter(Boolean);
      await api.createTenant({ tenantPrefix: form.tenantPrefix.trim(), name: form.name.trim(), adminEmails });
      setForm({ tenantPrefix: '', name: '', adminEmails: '' });
      loadTenants();
    } catch (e: any) {
      setError(e.message || 'Create tenant failed');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Global Admin Login</h2>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-gray-900 text-white rounded px-3 py-2">Login</button>
        </form>
      </div>
    );
  }

  const totalContrib = overview?.totals?.contributions ?? 0;
  const approved = overview?.byStatus?.find((s: any) => s.status === 'approved')?.count ?? 0;
  const submitted = overview?.byStatus?.find((s: any) => s.status === 'submitted')?.count ?? 0;
  const draft = overview?.byStatus?.find((s: any) => s.status === 'draft')?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero header to match Admin look */}
      <div className="rounded-2xl overflow-hidden shadow bg-gradient-to-r from-slate-800 to-sky-700 text-white">
        <div className="px-6 py-6">
          <div className="text-sm opacity-80">Control Center</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Global Admin Dashboard</h1>
          <p className="opacity-90 mt-1">Manage all tenants, users, and system-wide configuration from one place.</p>
        </div>
      </div>

      {/* Header and filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Global Overview</h2>
          <div className="flex gap-2 items-center">
            <input type="date" className="border rounded px-2 py-1" value={dateRange.start || ''} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} />
            <span>to</span>
            <input type="date" className="border rounded px-2 py-1" value={dateRange.end || ''} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} />
            <button className="px-3 py-1 border rounded" onClick={() => setDateRange({})}>Clear</button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <KPI title="Tenants" value={overview?.totals?.tenants ?? 0} />
          <KPI title="Users" value={overview?.totals?.users ?? 0} />
          <KPI title="Contributions" value={totalContrib} />
          <KPI title="Approved" value={approved} sub={`${submitted} submitted • ${draft} draft`} />
        </div>
      </div>

      {/* Create tenant */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Create Tenant</h2>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleCreateTenant} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Prefix (e.g., gable)" value={form.tenantPrefix} onChange={e => setForm({ ...form, tenantPrefix: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Tenant Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Admin Emails (comma-separated)" value={form.adminEmails} onChange={e => setForm({ ...form, adminEmails: e.target.value })} />
          <div className="md:col-span-4">
            <button className="bg-gray-900 text-white rounded px-4 py-2">Create Tenant</button>
          </div>
        </form>
      </div>

      {/* Tenants table */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tenants</h2>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Prefix</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Users</th>
                <th className="px-3 py-2">Contributions</th>
                <th className="px-3 py-2">Approved</th>
                <th className="px-3 py-2">Last Activity</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{t.tenantPrefix}</td>
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">{t.stats?.users ?? '-'}</td>
                  <td className="px-3 py-2">{t.stats?.contributions ?? '-'}</td>
                  <td className="px-3 py-2">{t.stats?.approved ?? '-'}</td>
                  <td className="px-3 py-2">{t.stats?.lastActivity ? new Date(t.stats.lastActivity).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:underline mr-3"
                      onClick={() => { localStorage.setItem('tenantPrefix', t.tenantPrefix); window.location.href = `/t/${t.tenantPrefix}/login`; }}
                    >Use</button>
                    <button
                      className="text-blue-600 hover:underline mr-3"
                      onClick={() => { localStorage.setItem('tenantPrefix', t.tenantPrefix); window.location.href = `/t/${t.tenantPrefix}/login`; }}
                    >Login</button>
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => { localStorage.setItem('tenantPrefix', t.tenantPrefix); window.location.href = `/t/${t.tenantPrefix}/signup`; }}
                    >Signup</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Users */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users (All Tenants)</h2>
          <div>
            <input value={userSearch} onChange={(e)=>setUserSearch(e.target.value)} placeholder="Search name/email/staffId" className="border rounded px-3 py-2 mr-2" />
            <button className="px-3 py-2 border rounded" onClick={async ()=>{ const res = await api.getGlobalUsers(userSearch); setGlobalUsers(res.data||[]); }}>Search</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Staff ID</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {globalUsers.map((u)=> (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.staffId}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2 font-mono">{u.tenantPrefix || '-'}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-blue-600 hover:underline" onClick={async ()=>{ await api.updateGlobalUser(u.id, { status: 'approved' }); const res = await api.getGlobalUsers(userSearch); setGlobalUsers(res.data||[]); }}>Approve</button>
                    <button className="text-blue-600 hover:underline" onClick={async ()=>{ await api.updateGlobalUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' }); const res = await api.getGlobalUsers(userSearch); setGlobalUsers(res.data||[]); }}>{u.role==='admin' ? 'Demote' : 'Promote'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Impact</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.recent || []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{new Date(r.updatedAt).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono">{r.tenantPrefix || '-'}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{r.userName}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalAdmin;

// Simple KPI component
function KPI({ title, value, sub }: { title: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}


