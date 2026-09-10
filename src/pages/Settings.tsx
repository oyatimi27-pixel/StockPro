import React, { useState, useEffect } from 'react';
import { fetchApi } from '../apiClient';
import { Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Settings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi('/settings')
      .then(res => setSettings(res || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (PNG, JPG, JPEG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Format non supporté. Veuillez choisir un fichier PNG, JPG ou JPEG.');
      e.target.value = '';
      return;
    }

    // Validate size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. La taille maximale autorisée est de 5 Mo.');
      e.target.value = '';
      return;
    }

    // Convert file to Data URL for immediate preview and reliable storage
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings(prev => ({ ...prev, logo_path: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_path: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSettings(updated);
      alert('Paramètres enregistrés avec succès.');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-600 dark:text-slate-400">Chargement des paramètres...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 max-w-4xl mx-auto transition-colors duration-200">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-8">Paramètres de la Société</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="flex items-start space-x-8 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">Logo de la Société</h3>
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center overflow-hidden p-2 relative group shadow-inner">
                {settings.logo_path ? (
                  <img src={settings.logo_path} alt="Logo de la société" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs font-medium">Aucun logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center shadow-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    {settings.logo_path ? "Modifier le logo" : "Choisir un fichier"}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleFileChange} 
                    />
                  </label>

                  {settings.logo_path && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le logo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Formats acceptés : PNG, JPG, JPEG (Taille maximale : 5 Mo)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Nom Société</label>
            <input type="text" name="company_name" value={settings.company_name || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Activité</label>
            <input type="text" name="activity" placeholder="Ex: Négoce de produits alimentaires et de boissons" value={settings.activity || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Matricule Fiscal</label>
            <input type="text" name="tax_id" value={settings.tax_id || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Registre Commerce</label>
            <input type="text" name="commercial_register" value={settings.commercial_register || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Adresse</label>
            <input type="text" name="address" value={settings.address || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Ville</label>
            <input type="text" name="city" value={settings.city || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Téléphone</label>
            <input type="text" name="phone" value={settings.phone || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Mobile</label>
            <input type="text" name="mobile" value={settings.mobile || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Email</label>
            <input type="email" name="email" value={settings.email || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">RIB</label>
            <input type="text" name="rib" value={settings.rib || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Banque</label>
            <input type="text" name="bank" value={settings.bank || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Timbre Fiscal</label>
            <input type="number" step="0.001" name="fiscal_stamp" value={settings.fiscal_stamp || 0} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Devise</label>
            <input type="text" name="currency" value={settings.currency || 'TND'} onChange={handleChange} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[13px] focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none" />
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-[13px] font-bold uppercase tracking-wider flex items-center transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
