import React from 'react';
import CrudPage from '../components/CrudPage';

export default function Suppliers() {
  const columns = [
    { key: 'code', label: 'Code Fournisseur', required: true },
    { key: 'name', label: 'Nom Fournisseur', required: true },
    { key: 'address', label: 'Adresse', required: false },
    { key: 'phone', label: 'Téléphone', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'tax_id', label: 'Matricule Fiscal', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ];

  return (
    <CrudPage 
      title="Gestion des Fournisseurs" 
      endpoint="/suppliers" 
      columns={columns} 
      itemName="Fournisseur" 
      deleteConfirmMessage="Êtes-vous sûr de vouloir supprimer ce fournisseur ?"
      deleteSuccessMessage="Fournisseur supprimé avec succès."
    />
  );
}
