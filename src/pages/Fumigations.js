// src/pages/Fumigations.js - Página principal de fumigaciones
import React from 'react';
import FumigationsPanel from '../components/panels/Fumigations/FumigationsPanel';
import useFumigationsController from '../controllers/FumigationsController';

const Fumigations = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    fumigations,
    fields,
    products,
    loading,
    error,
    selectedFumigation,
    selectedField,
    selectedLots,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddFumigation,
    handleAddFumigationFromField,
    handleEditFumigation,
    handleViewFumigation,
    handleCompleteFumigation,
    handleDeleteFumigation,
    handleSaveFumigation,
    handleCompleteFumigationSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useFumigationsController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <FumigationsPanel
      fumigations={fumigations}
      fields={fields}
      products={products}
      loading={loading}
      error={error}
      selectedFumigation={selectedFumigation}
      selectedField={selectedField}
      selectedLots={selectedLots}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      onAddFumigation={handleAddFumigation}
      onEditFumigation={handleEditFumigation}
      onViewFumigation={handleViewFumigation}
      onCompleteFumigation={handleCompleteFumigation}
      onDeleteFumigation={handleDeleteFumigation}
      onSaveFumigation={handleSaveFumigation}
      onCompleteFumigationSubmit={handleCompleteFumigationSubmit}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Fumigations;