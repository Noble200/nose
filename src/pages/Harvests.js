// src/pages/Harvests.js - Página principal de cosechas corregida
import React from 'react';
import HarvestsPanel from '../components/panels/Harvests/HarvestsPanel';
import useHarvestsController from '../controllers/HarvestsController';

const Harvests = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    harvests = [], // CORREGIDO: Valor por defecto
    fields = [], // CORREGIDO: Valor por defecto
    products = [], // CORREGIDO: Valor por defecto
    warehouses = [], // CORREGIDO: Valor por defecto
    loading,
    error,
    selectedHarvest,
    selectedField,
    selectedLots,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddHarvest,
    handleEditHarvest,
    handleViewHarvest,
    handleDeleteHarvest,
    handleCompleteHarvest,
    handleSaveHarvest,
    handleCompleteHarvestSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useHarvestsController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <HarvestsPanel
      harvests={harvests}
      fields={fields}
      products={products} // CORREGIDO: Asegurar que se pase products
      warehouses={warehouses} // CORREGIDO: Asegurar que se pase warehouses
      loading={loading}
      error={error}
      selectedHarvest={selectedHarvest}
      selectedField={selectedField}
      selectedLots={selectedLots}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      onAddHarvest={handleAddHarvest}
      onEditHarvest={handleEditHarvest}
      onViewHarvest={handleViewHarvest}
      onDeleteHarvest={handleDeleteHarvest}
      onCompleteHarvest={handleCompleteHarvest}
      onSaveHarvest={handleSaveHarvest}
      onCompleteHarvestSubmit={handleCompleteHarvestSubmit}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Harvests;