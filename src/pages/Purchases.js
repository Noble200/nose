// src/pages/Purchases.js - Página principal de compras
import React from 'react';
import PurchasesPanel from '../components/panels/Purchases/PurchasesPanel';
import usePurchasesController from '../controllers/PurchasesController';

const Purchases = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    purchases,
    warehouses,
    loading,
    error,
    selectedPurchase,
    selectedDelivery,
    dialogOpen,
    dialogType,
    filterOptions,
    statistics,
    handleAddPurchase,
    handleEditPurchase,
    handleViewPurchase,
    handleAddDelivery,
    handleViewDelivery,
    handleDeletePurchase,
    handleSavePurchase,
    handleCreateDelivery,
    handleCompleteDelivery,
    handleCancelDelivery,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = usePurchasesController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <PurchasesPanel
      purchases={purchases}
      warehouses={warehouses}
      loading={loading}
      error={error}
      selectedPurchase={selectedPurchase}
      selectedDelivery={selectedDelivery}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      statistics={statistics}
      onAddPurchase={handleAddPurchase}
      onEditPurchase={handleEditPurchase}
      onViewPurchase={handleViewPurchase}
      onAddDelivery={handleAddDelivery}
      onViewDelivery={handleViewDelivery}
      onDeletePurchase={handleDeletePurchase}
      onSavePurchase={handleSavePurchase}
      onCreateDelivery={handleCreateDelivery}
      onCompleteDelivery={handleCompleteDelivery}
      onCancelDelivery={handleCancelDelivery}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Purchases;