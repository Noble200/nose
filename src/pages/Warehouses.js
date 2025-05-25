// src/pages/Warehouses.js - Página principal de almacenes que conecta con el controlador
import React from 'react';
import WarehousesPanel from '../components/panels/Warehouses/WarehousesPanel';
import useWarehousesController from '../controllers/WarehousesController';

const Warehouses = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    warehouses,
    fields,
    loading,
    error,
    selectedWarehouse,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddWarehouse,
    handleEditWarehouse,
    handleViewWarehouse,
    handleDeleteWarehouse,
    handleSaveWarehouse,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useWarehousesController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <WarehousesPanel
      warehouses={warehouses}
      fields={fields}
      loading={loading}
      error={error}
      selectedWarehouse={selectedWarehouse}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      onAddWarehouse={handleAddWarehouse}
      onEditWarehouse={handleEditWarehouse}
      onViewWarehouse={handleViewWarehouse}
      onDeleteWarehouse={handleDeleteWarehouse}
      onSaveWarehouse={handleSaveWarehouse}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Warehouses;