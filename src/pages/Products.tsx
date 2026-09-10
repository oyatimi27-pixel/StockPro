import React from 'react';
import CrudPage from '../components/CrudPage';

export default function Products() {
  const columns = [
    { key: 'code', label: 'Code Produit', required: true },
    { key: 'barcode', label: 'Code Barre', required: false },
    { key: 'designation', label: 'Désignation', required: true },
    { key: 'category', label: 'Catégorie', required: false },
    { key: 'purchase_price', label: 'Prix Achat (HT)', type: 'number' as const, required: false },
    { key: 'sale_price', label: 'Prix Vente (HT)', type: 'number' as const, required: true },
    { key: 'tva', label: 'TVA %', type: 'number' as const, required: false },
    { key: 'stock_quantity', label: 'Quantité Stock', type: 'number' as const, required: false },
    { key: 'min_stock', label: 'Stock Minimum', type: 'number' as const, required: false },
  ];

  return (
    <CrudPage 
      title="Gestion des Produits" 
      endpoint="/products" 
      columns={columns} 
      itemName="Produit" 
      deleteConfirmMessage="Êtes-vous sûr de vouloir supprimer ce produit ?"
      deleteSuccessMessage="Produit supprimé avec succès."
    />
  );
}
