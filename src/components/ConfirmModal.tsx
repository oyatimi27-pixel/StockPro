import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: 'red' | 'blue' | 'orange';
  isAlert?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Retour',
  onConfirm,
  onCancel,
  confirmColor = 'red',
  isAlert = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          {!isAlert && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colorClasses[confirmColor]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
