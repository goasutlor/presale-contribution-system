import React, { useEffect, useState } from 'react';
import api from '../services/api';

const GlobalDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getGlobalOverview();
        setData(res.data || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-blue-600" /></div>;
  }

  const totals = data?.totals || { tenants: 0, users: 0, contributions: 0 };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden shadow bg-gradient-to-r from-slate-800 to-sky-700 text-white">
        <div className="px-6 py-6">
          <div className="text-sm opacity-80">Global</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Global Dashboard</h1>
          <p className="opacity-90 mt-1">System-wide metrics across all tenants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border">
          <div className="text-sm text-gray-500">Tenants</div>
          <div className="text-3xl font-bold">{totals.tenants}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-3xl font-bold">{totals.users}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border">
          <div className="text-sm text-gray-500">Contributions</div>
          <div className="text-3xl font-bold">{totals.contributions}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border">
        <div className="text-lg font-semibold mb-4">Recent Activity</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Impact</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).map((r: any) => (
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

export default GlobalDashboard;


