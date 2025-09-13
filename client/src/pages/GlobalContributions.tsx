import React, { useEffect, useState } from 'react';
import api from '../services/api';

const GlobalContributions: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      const res = await fetch(`/api/global/contributions?${qs.toString()}`, { headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      setRows(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden shadow bg-gradient-to-r from-slate-800 to-sky-700 text-white">
        <div className="px-6 py-6">
          <div className="text-sm opacity-80">Global</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Global Contributions</h1>
          <p className="opacity-90 mt-1">All contributions across all tenants.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 border mb-2 flex items-center gap-3">
        <label className="text-sm text-gray-600">Status</label>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border px-3 py-1 rounded">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="px-3 py-1 border rounded" onClick={load}>Reload</button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border">
        {loading ? (
          <div className="flex items-center justify-center min-h-64"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Tenant</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{new Date(r.updatedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono">{r.tenantPrefix || '-'}</td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">{r.userName || r.userEmail}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalContributions;


