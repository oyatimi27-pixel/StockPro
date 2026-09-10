import React, { useEffect, useState } from 'react';
import { fetchApi } from '../apiClient';
import { Package, Users, Truck, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from '../types';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    fetchApi('/dashboard')
      .then(setData)
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError(err.message || 'Erreur lors du chargement des données');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-slate-500">Chargement...</div>;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <p className="text-red-500 font-medium mb-3">{error || 'Aucune donnée disponible'}</p>
        <button 
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const revenue = data.revenue || { monthly: 0, daily: 0 };
  const counts = data.counts || { invoices: 0, products: 0, suppliers: 0 };
  const lowStock = Array.isArray(data.lowStock) ? data.lowStock : [];
  const chartData = Array.isArray(data.chartData) ? data.chartData : [];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 h-full overflow-y-auto pb-4 transition-colors duration-200">
      {/* Top Stats */}
      <div className="col-span-12 md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-xl shadow-sm">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Chiffre d'Affaires (Mois)</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{Number(revenue.monthly || 0).toFixed(3)} <span className="text-[13px] font-normal text-slate-400">TND</span></h2>
        <p className="text-[11px] text-green-600 dark:text-green-500 mt-2 font-medium">Global: {Number(revenue.daily || 0).toFixed(3)} TND (Aujourd'hui)</p>
      </div>
      <div className="col-span-12 md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-xl shadow-sm">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Factures Émises</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{counts.invoices || 0} <span className="text-[13px] font-normal text-slate-400">Total</span></h2>
      </div>
      <div className="col-span-12 md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-xl shadow-sm">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Articles en Stock</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{counts.products || 0}</h2>
        <p className="text-[11px] text-blue-600 dark:text-blue-500 mt-2 font-medium">Répartis sur {counts.suppliers || 0} fournisseurs</p>
      </div>
      <div className="col-span-12 md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-xl shadow-sm">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Stock Faible</p>
        <h2 className="text-2xl md:text-3xl font-bold mt-2 text-red-600 dark:text-red-500">{lowStock.length} <span className="text-[13px] font-normal text-slate-400 italic">Articles</span></h2>
        <p className="text-[11px] text-orange-600 dark:text-orange-500 mt-2 font-medium">Action immédiate requise</p>
      </div>

      {/* Main Content Area */}
      <div className="col-span-12 md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Évolution du Chiffre d'Affaires</h3>
        </div>
        <div className="flex-grow p-4 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
              <Tooltip cursor={{fill: 'rgba(148, 163, 184, 0.1)'}} contentStyle={{borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)'}} />
              <Bar dataKey="Ventes" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Panel */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col p-5 min-h-[350px]">
        <h3 className="text-[13px] font-bold mb-4 text-blue-600 dark:text-blue-400 shrink-0 uppercase tracking-wider">Alertes Stock Critique</h3>
        <div className="space-y-3 flex-grow overflow-y-auto pr-2">
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">Tous les produits sont bien approvisionnés.</p>
            </div>
          ) : (
            lowStock.map((prod: Product) => (
              <div key={prod.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{prod.designation}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Code: {prod.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 dark:text-red-400 font-bold text-[13px]">{prod.stock_quantity} Unités</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 italic font-medium">Min: {prod.min_stock}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
