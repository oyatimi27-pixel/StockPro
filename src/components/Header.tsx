import React from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 transition-colors duration-200">
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-96 border border-slate-200 dark:border-slate-700 transition-colors">
        <Search className="w-4 h-4 mr-2 text-slate-400" />
        <input type="text" placeholder="Rechercher un produit, une facture..." className="bg-transparent border-none text-[13px] w-full outline-none focus:ring-0 dark:text-slate-200 dark:placeholder-slate-400" />
      </div>
      <div className="flex items-center space-x-6">
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
          title="Changer le thème"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>☀️ Mode Clair</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>🌙 Mode Sombre</span>
            </>
          )}
        </button>
        <div className="text-right">
          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 transition-colors">STOCKPRO ERP</p>
          <p className="text-[10px] text-slate-400 uppercase">Version 1.0</p>
        </div>
        <div className="flex items-center text-sm space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-medium text-slate-600 dark:text-slate-300 uppercase tracking-tighter text-xs">Connecté</span>
        </div>
      </div>
    </header>
  );
}
