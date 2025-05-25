import React from 'react';
import FieldsPanel from '../components/panels/Fields/FieldsPanel';
import useFieldsController from '../controllers/FieldsController';

// Página principal que conecta el controlador con el componente visual
const Fields = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    fields,
    loading,
    error,
    selectedField,
    selectedLot,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddField,
    handleEditField,
    handleViewField,
    handleDeleteField,
    handleAddLot,
    handleEditLot,
    handleDeleteLot,
    handleSaveField,
    handleSaveLot,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useFieldsController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <FieldsPanel
      fields={fields}
      loading={loading}
      error={error}
      selectedField={selectedField}
      selectedLot={selectedLot}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      onAddField={handleAddField}
      onEditField={handleEditField}
      onViewField={handleViewField}
      onDeleteField={handleDeleteField}
      onAddLot={handleAddLot}
      onEditLot={handleEditLot}
      onDeleteLot={handleDeleteLot}
      onSaveField={handleSaveField}
      onSaveLot={handleSaveLot}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Fields;