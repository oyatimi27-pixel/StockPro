import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Truck, FileText, Settings, LogOut, Archive } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/invoices', icon: FileText, label: 'Factures' },
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/suppliers', icon: Truck, label: 'Fournisseurs' },
    { to: '/archives', icon: Archive, label: 'Archives' },
  ];

  if (user?.role === 'Administrateur') {
    navItems.push({ to: '/settings', icon: Settings, label: 'Paramètres' });
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">STOCKPRO ERP</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Gestion Commerciale</p>
      </div>
      
      <nav className="flex-grow py-4 overflow-hidden overflow-y-auto">
        <div className="px-6 mb-2 text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Menu Principal</div>
        {navItems.filter(item => item.to !== '/settings').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex items-center px-6 py-3 font-medium transition-colors text-sm",
              isActive 
                ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white font-semibold border-r-4 border-blue-600 dark:border-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'Administrateur' && (
          <>
            <div className="px-6 mt-6 mb-2 text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Administration</div>
            <NavLink
              to="/settings"
              className={({ isActive }) => clsx(
                "flex items-center px-6 py-3 font-medium transition-colors text-sm",
                isActive 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white font-semibold border-r-4 border-blue-600 dark:border-blue-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Paramètres Société</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 bg-slate-50 dark:bg-slate-950 flex items-center border-t border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3 shrink-0">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-grow overflow-hidden mr-2">
          <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{user?.username}</p>
          <p className="text-[10px] text-slate-500 italic">Session Active</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
