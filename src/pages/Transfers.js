// src/pages/Transfers.js - Página principal de transferencias
import React from 'react';
import TransfersPanel from '../components/panels/Transfers/TransfersPanel';
import useTransfersController from '../controllers/TransfersController';

const Transfers = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    transfers,
    warehouses,
    products,
    loading,
    error,
    selectedTransfer,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddTransfer,
    handleEditTransfer,
    handleViewTransfer,
    handleApproveTransfer,
    handleReceiveTransfer,
    handleDeleteTransfer,
    handleSaveTransfer,
    handleApproveTransferSubmit,
    handleShipTransfer,
    handleReceiveTransferSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useTransfersController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <TransfersPanel
      transfers={transfers}
      warehouses={warehouses}
      products={products}
      loading={loading}
      error={error}
      selectedTransfer={selectedTransfer}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      onAddTransfer={handleAddTransfer}
      onEditTransfer={handleEditTransfer}
      onViewTransfer={handleViewTransfer}
      onApproveTransfer={handleApproveTransfer}
      onReceiveTransfer={handleReceiveTransfer}
      onDeleteTransfer={handleDeleteTransfer}
      onSaveTransfer={handleSaveTransfer}
      onApproveTransferSubmit={handleApproveTransferSubmit}
      onShipTransfer={handleShipTransfer}
      onReceiveTransferSubmit={handleReceiveTransferSubmit}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Transfers;