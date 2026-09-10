import React from 'react';
import CrudPage from '../components/CrudPage';

export default function Clients() {
  const columns = [
    { key: 'code', label: 'Code Client', required: true },
    { key: 'name', label: 'Nom Client', required: true },
    { key: 'address', label: 'Adresse', required: false },
    { key: 'phone', label: 'Téléphone', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'tax_id', label: 'Matricule Fiscal', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ];

  return (
    <CrudPage 
      title="Gestion des Clients" 
      endpoint="/clients" 
      columns={columns} 
      itemName="Client" 
      deleteConfirmMessage="Êtes-vous sûr de vouloir supprimer ce client ?"
      deleteSuccessMessage="Client supprimé avec succès."
    />
  );
}
