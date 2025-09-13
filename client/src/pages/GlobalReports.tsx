import React, { useEffect, useState } from 'react';
import api from '../services/api';

const GlobalReports: React.FC = () => {
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

  const monthly = data?.monthly?.data || [];
  const year = data?.monthly?.year || new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden shadow bg-gradient-to-r from-slate-800 to-sky-700 text-white">
        <div className="px-6 py-6">
          <div className="text-sm opacity-80">Global</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Global Reports</h1>
          <p className="opacity-90 mt-1">Yearly timeline across all tenants ({year}).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border">
        <div className="text-lg font-semibold mb-4">Monthly Totals</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {monthly.map((m: any) => (
            <div key={m.month} className="border rounded p-3">
              <div className="text-xs text-gray-500">{m.month}</div>
              <div className="text-xl font-bold">{m.contributions?.total ?? m.count ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalReports;


