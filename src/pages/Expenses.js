// src/pages/Expenses.js - Página principal de gastos
import React from 'react';
import ExpensesPanel from '../components/panels/Expenses/ExpensesPanel';
import useExpensesController from '../controllers/ExpensesController';

const Expenses = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    expenses,
    products,
    loading,
    error,
    selectedExpense,
    dialogOpen,
    dialogType,
    filterOptions,
    statistics,
    handleAddExpense,
    handleEditExpense,
    handleViewExpense,
    handleDeleteExpense,
    handleSaveExpense,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData
  } = useExpensesController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <ExpensesPanel
      expenses={expenses}
      products={products}
      loading={loading}
      error={error}
      selectedExpense={selectedExpense}
      dialogOpen={dialogOpen}
      dialogType={dialogType}
      filterOptions={filterOptions}
      statistics={statistics}
      onAddExpense={handleAddExpense}
      onEditExpense={handleEditExpense}
      onViewExpense={handleViewExpense}
      onDeleteExpense={handleDeleteExpense}
      onSaveExpense={handleSaveExpense}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onCloseDialog={handleCloseDialog}
      onRefresh={refreshData}
    />
  );
};

export default Expenses;