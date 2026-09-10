import React, { useState, useEffect } from 'react';
import { fetchApi } from '../apiClient';
import { Plus, Printer, Trash2, Search, Eye, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Invoice } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export default function Invoices() {
  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchApi('/invoices');
      setData(result);
    } catch (err) {
      alert("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelClick = (id: number) => {
    console.log("Annuler button clicked");
    console.log("Invoice ID:", id);
    setCancelId(id);
  };

  const handleConfirmCancel = async (id: number) => {
    try {
      console.log("API request sent");
      await fetchApi(`/invoices/${id}/cancel`, { method: 'PUT' });
      setCancelId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation de la facture.");
      setCancelId(null);
    }
  };

  const filteredData = data.filter(item => {
    if (item.status === 'ANNULÉE') return false;
    return item.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
           (item.client_name && item.client_name.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-200">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
        <h2 className="font-bold text-slate-700 dark:text-slate-200">Dernières Factures Émises</h2>
        <Link 
          to="/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors text-[13px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Facture
        </Link>
      </div>

      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° ou Client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 transition-colors outline-none dark:text-slate-200 dark:placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-[13px]">Chargement...</div>
        ) : (
          <table className="w-full text-[13px] text-left">
            <thead className="bg-white dark:bg-slate-900 text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">N° Facture</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">Date</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">Client</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right">Total HT</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right">Total TTC</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">Statut</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${item.status === 'ANNULÉE' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.invoice_number}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.date.split('-').reverse().join('/')}
                      {item.time ? <span className="ml-1 text-[11px] text-slate-400">{item.time}</span> : null}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{item.client_name}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300 text-right font-medium">{Number(item.total_ht).toFixed(3)}</td>
                    <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-100 text-right">{Number(item.total_ttc).toFixed(3)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                        item.status === 'ANNULÉE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {item.status || 'VALIDÉE'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link 
                        to={`/invoices/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors mr-3 inline-block"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {item.status !== 'ANNULÉE' && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCancelClick(item.id);
                          }}
                          className="text-orange-500 hover:text-orange-700 transition-colors p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          title="Annuler"
                        >
                          <Ban className="w-4 h-4 pointer-events-none" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelId !== null}
        title="Confirmer l'annulation"
        message="Êtes-vous sûr de vouloir annuler cette facture ?"
        confirmText="Annuler la facture"
        confirmColor="red"
        onConfirm={() => { if (cancelId !== null) handleConfirmCancel(cancelId); }}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
