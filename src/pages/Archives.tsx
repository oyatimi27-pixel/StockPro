import React, { useState, useEffect } from 'react';
import { fetchApi } from '../apiClient';
import { RefreshCw } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export default function Archives() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'clients' | 'suppliers' | 'invoices'>('products');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: any;
    endpoint: string;
    newStatus: string;
  }>({
    isOpen: false,
    item: null,
    endpoint: '',
    newStatus: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes, iRes] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/clients'),
        fetchApi('/suppliers'),
        fetchApi('/invoices')
      ]);

      setProducts(pRes.filter((p: any) => p.status === 'INACTIF' || p.status === 'ARCHIVÉ' || p.status === 'ARCHIVE'));
      setClients(cRes.filter((c: any) => c.status === 'ARCHIVÉ' || c.status === 'ARCHIVE' || c.status === 'INACTIF'));
      setSuppliers(sRes.filter((s: any) => s.status === 'ARCHIVÉ' || s.status === 'ARCHIVE' || s.status === 'INACTIF'));
      setInvoices(iRes.filter((i: any) => i.status === 'ANNULÉE'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReactivateClick = (endpoint: string, item: any, newStatus: string) => {
    if (endpoint === '/suppliers') {
      console.log("Reactivate button clicked");
      console.log("Supplier ID:", item.id);
    } else {
      console.log("Reactivate button clicked");
      console.log("Record ID:", item.id);
    }
    setConfirmModal({ isOpen: true, item, endpoint, newStatus });
  };

  const executeReactivate = async () => {
    const { item, endpoint, newStatus } = confirmModal;
    if (!item) return;

    try {
      console.log("Sending API request...");
      let response;
      if (endpoint === '/invoices') {
        response = await fetchApi(`/invoices/${item.id}/reactivate`, { method: 'PUT' });
      } else {
        response = await fetchApi(`${endpoint}/${item.id}`, { 
          method: 'PUT', 
          body: JSON.stringify({ ...item, status: newStatus }) 
        });
      }
      console.log("API response:", response);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la réactivation.");
    }
    setConfirmModal({ isOpen: false, item: null, endpoint: '', newStatus: '' });
  };

  const tabs = [
    { id: 'products', label: 'Produits Archivés' },
    { id: 'clients', label: 'Clients Archivés' },
    { id: 'suppliers', label: 'Fournisseurs Archivés' },
    { id: 'invoices', label: 'Factures Annulées' }
  ] as const;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-200">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0 gap-4">
        <h2 className="font-bold text-slate-700 dark:text-slate-200">Archives</h2>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-slate-500 py-12">Chargement...</div>
        ) : (
          <div className="w-full">
            {activeTab === 'products' && (
              <table className="w-full text-[13px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Désignation</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-slate-500">Aucun produit archivé</td></tr> :
                  products.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">{p.code}</td>
                      <td className="px-4 py-2">{p.designation}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleReactivateClick('/products', p, 'ACTIF')} className="text-green-600 hover:text-green-800" title="Réactiver">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'clients' && (
              <table className="w-full text-[13px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clients.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-slate-500">Aucun client archivé</td></tr> :
                  clients.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{c.code}</td>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleReactivateClick('/clients', c, 'ACTIF')} className="text-green-600 hover:text-green-800" title="Réactiver">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'suppliers' && (
              <table className="w-full text-[13px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suppliers.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-slate-500">Aucun fournisseur archivé</td></tr> :
                  suppliers.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-2">{s.code}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleReactivateClick('/suppliers', s, 'ACTIF')} className="text-green-600 hover:text-green-800" title="Réactiver">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'invoices' && (
              <table className="w-full text-[13px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2">N° Facture</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">Aucune facture annulée</td></tr> :
                  invoices.map(i => (
                    <tr key={i.id}>
                      <td className="px-4 py-2 font-mono font-bold text-slate-500">{i.invoice_number}</td>
                      <td className="px-4 py-2">{i.client_name}</td>
                      <td className="px-4 py-2">{i.date}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleReactivateClick('/invoices', i, 'VALIDÉE')} className="text-green-600 hover:text-green-800" title="Réactiver">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Confirmer la réactivation"
        message="Êtes-vous sûr de vouloir réactiver cet élément ?"
        confirmText="Réactiver"
        confirmColor="blue"
        onConfirm={executeReactivate}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
