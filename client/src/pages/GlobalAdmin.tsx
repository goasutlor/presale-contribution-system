import React, { useEffect, useState } from 'react';
import api, { ApiResponse } from '../services/api';

const GlobalAdmin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('globalToken'));
  const [tenants, setTenants] = useState<any[]>([]);
  const [form, setForm] = useState({ tenantPrefix: '', name: '', adminEmails: '' });
  const [error, setError] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      const res = await api.getTenants();
      setTenants(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenants');
    }
  };

  useEffect(() => {
    if (token) loadTenants();
  }, [token]);

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

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tenants</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Prefix</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Admins</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{t.tenantPrefix}</td>
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">{Array.isArray(t.adminEmails) ? t.adminEmails.join(', ') : t.adminEmails}</td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:underline mr-3"
                      onClick={() => { localStorage.setItem('tenantPrefix', t.tenantPrefix); window.location.reload(); }}
                    >Use</button>
                  </td>
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


