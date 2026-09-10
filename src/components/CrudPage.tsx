import React, { useState, useEffect } from 'react';
import { fetchApi } from '../apiClient';
import { Plus, Edit2, Trash2, Search, X, Archive, PowerOff, RefreshCw } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number';
  required?: boolean;
}

interface CrudPageProps {
  title: string;
  endpoint: string;
  columns: Column[];
  itemName: string;
  deleteConfirmMessage?: string;
  deleteSuccessMessage?: string;
}

export default function CrudPage({ title, endpoint, columns, itemName, deleteConfirmMessage, deleteSuccessMessage }: CrudPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: any;
    title: string;
    message: string;
    confirmText: string;
  }>({
    isOpen: false,
    item: null,
    title: '',
    message: '',
    confirmText: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchApi(endpoint);
      setData(result);
    } catch (err) {
      alert("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [endpoint]);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      const initial: any = {};
      columns.forEach(c => initial[c.key] = c.type === 'number' ? 0 : '');
      setFormData(initial);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Automatically set default category to Générale if empty
    if ('category' in payload && (!payload.category || payload.category.trim() === '')) {
      payload.category = 'Générale';
    }

    // Ensure number fields are safely mapped to 0 if left empty
    columns.forEach(col => {
      if (col.type === 'number') {
        if (payload[col.key] === '' || payload[col.key] === null || payload[col.key] === undefined) {
          payload[col.key] = 0;
        }
      }
    });

    try {
      if (editingItem) {
        await fetchApi(`${endpoint}/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredData = data.filter(item => {
    const isActive = item.status === 'ACTIF' || !item.status;
    if (!isActive) return false;
    return columns.some(col => String(item[col.key]).toLowerCase().includes(search.toLowerCase()));
  });

  const handleConfirmArchive = async () => {
    const { item } = confirmModal;
    if (!item) return;

    try {
      let targetStatus = 'ARCHIVÉ';
      if (endpoint === '/products') targetStatus = 'INACTIF';
      if (endpoint === '/suppliers') targetStatus = 'ARCHIVE';
      
      console.log("Sending API request...");
      const response = await fetchApi(`${endpoint}/${item.id}`, { method: 'PUT', body: JSON.stringify({ ...item, status: targetStatus }) });
      console.log("API response:", response);
      
      await loadData();
    } catch(err: any) { 
      console.error("Archive failed:", err);
    }
    setConfirmModal({ ...confirmModal, isOpen: false, item: null });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-200">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
        <h2 className="font-bold text-slate-700 dark:text-slate-200">{title}</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </button>
      </div>

      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none dark:text-slate-200 dark:placeholder-slate-400"
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
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">Statut</th>
                <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Aucune donnée trouvée.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${item.status === 'ARCHIVÉ' || item.status === 'ARCHIVE' || item.status === 'INACTIF' ? 'opacity-60' : ''}`}>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">
                        {item[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-2 font-medium">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'ACTIF' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.status || 'ACTIF'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors mr-3"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (endpoint === '/suppliers') {
                            console.log("Archive button clicked");
                            console.log("Supplier ID:", item.id);
                          } else {
                            console.log("Archive button clicked");
                            console.log("Record ID:", item.id);
                          }
                          
                          const typeLabel = endpoint === '/products' ? 'produit' : (endpoint === '/clients' ? 'client' : 'fournisseur');
                          
                          setConfirmModal({
                            isOpen: true,
                            item,
                            title: "Confirmer l'archivage",
                            message: `Êtes-vous sûr de vouloir archiver ce ${typeLabel} ?`,
                            confirmText: `Archiver le ${typeLabel}`
                          });
                        }}
                        className="text-orange-500 hover:text-orange-700 transition-colors p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-950/30"
                        title={endpoint === '/products' ? 'Désactiver' : 'Archiver'}
                      >
                        {endpoint === '/products' ? <PowerOff className="w-4 h-4 pointer-events-none" /> : <Archive className="w-4 h-4 pointer-events-none" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">
                {editingItem ? 'Modifier' : 'Ajouter'} {itemName}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {columns.map(col => (
                  <div key={col.key}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{col.label}</label>
                    <input
                      type={col.type === 'number' ? 'number' : 'text'}
                      step={col.type === 'number' ? 'any' : undefined}
                      required={col.required}
                      value={formData[col.key] !== undefined && formData[col.key] !== null ? formData[col.key] : ''}
                      onChange={(e) => setFormData({...formData, [col.key]: col.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value})}
                      onInvalid={(e) => col.required ? (e.target as HTMLInputElement).setCustomValidity(`Le champ ${col.label.toLowerCase()} est obligatoire.`) : undefined}
                      onInput={(e) => col.required ? (e.target as HTMLInputElement).setCustomValidity('') : undefined}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none dark:text-slate-200"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[13px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor="red"
        onConfirm={handleConfirmArchive}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
