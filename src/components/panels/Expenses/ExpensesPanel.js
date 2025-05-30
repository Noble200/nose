// src/components/panels/Expenses/ExpensesPanel.js - Panel principal para gestión de gastos
import React from 'react';
import './expenses.css';
import ExpenseDialog from './ExpenseDialog';
import ExpenseDetailDialog from './ExpenseDetailDialog';

const ExpensesPanel = ({
  expenses,
  products,
  loading,
  error,
  selectedExpense,
  dialogOpen,
  dialogType,
  filterOptions,
  statistics,
  onAddExpense,
  onEditExpense,
  onViewExpense,
  onDeleteExpense,
  onSaveExpense,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh
}) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.seconds 
      ? new Date(date.seconds * 1000) 
      : new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  };

  // Función para obtener el tipo de gasto formateado
  const getExpenseTypeText = (type) => {
    return type === 'product' ? 'Venta de producto' : 'Gasto varios';
  };

  // Función para obtener el icono según el tipo
  const getExpenseIcon = (type) => {
    return type === 'product' ? 'fas fa-shopping-cart' : 'fas fa-receipt';
  };

  // Función para obtener el color del tipo
  const getExpenseTypeClass = (type) => {
    return type === 'product' ? 'expense-type-product' : 'expense-type-misc';
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      {/* Encabezado */}
      <div className="expenses-header">
        <h1 className="expenses-title">Gestión de Gastos</h1>
        <div className="expenses-actions">
          <button
            className="btn btn-primary"
            onClick={onAddExpense}
          >
            <i className="fas fa-plus"></i> Nuevo Gasto
          </button>
          <button
            className="btn btn-icon"
            onClick={onRefresh}
            title="Actualizar datos"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="expenses-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Gastos</h3>
            <div className="stat-value">{statistics.totalExpenses}</div>
            <p className="stat-description">Registros totales</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Ventas de Productos</h3>
            <div className="stat-value">{statistics.productExpenses}</div>
            <p className="stat-description">{statistics.totalProductsSold} unidades vendidas</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Gastos Varios</h3>
            <div className="stat-value">{statistics.miscExpenses}</div>
            <p className="stat-description">Gastos administrativos</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Importe</h3>
            <div className="stat-value">{formatCurrency(statistics.totalAmount)}</div>
            <p className="stat-description">Este mes: {formatCurrency(statistics.thisMonthAmount)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="typeFilter">Tipo:</label>
            <select
              id="typeFilter"
              className="form-control"
              onChange={(e) => onFilterChange('type', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.types.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="categoryFilter">Categoría:</label>
            <select
              id="categoryFilter"
              className="form-control"
              onChange={(e) => onFilterChange('category', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="startDateFilter">Fecha desde:</label>
            <input
              type="date"
              id="startDateFilter"
              className="form-control"
              onChange={(e) => onFilterChange('dateRange', { ...filterOptions.dateRange, start: e.target.value })}
            />
          </div>
          
          <div className="filter-item">
            <label htmlFor="endDateFilter">Fecha hasta:</label>
            <input
              type="date"
              id="endDateFilter"
              className="form-control"
              onChange={(e) => onFilterChange('dateRange', { ...filterOptions.dateRange, end: e.target.value })}
            />
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar gastos..."
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="btn btn-sm" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
      )}

      {/* Tabla de gastos */}
      {expenses.length > 0 ? (
        <div className="expenses-table-container">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Cantidad/Motivo</th>
                <th>Importe</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className={getExpenseTypeClass(expense.type)}>
                  <td>
                    <div className="expense-number">
                      <i className={getExpenseIcon(expense.type)}></i>
                      <span>{expense.expenseNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="expense-date">
                      {formatDate(expense.date)}
                    </div>
                  </td>
                  <td>
                    <span className={`expense-type-badge ${getExpenseTypeClass(expense.type)}`}>
                      {getExpenseTypeText(expense.type)}
                    </span>
                  </td>
                  <td>
                    <div className="expense-description">
                      {expense.type === 'product' ? (
                        <>
                          <div className="product-name">{expense.productName}</div>
                          {expense.saleReason && (
                            <div className="sale-reason">{expense.saleReason}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="misc-description">{expense.description}</div>
                          {expense.supplier && (
                            <div className="supplier-name">Proveedor: {expense.supplier}</div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="expense-quantity">
                      {expense.type === 'product' ? (
                        <>
                          <div className="quantity-sold">{expense.quantitySold} unidades</div>
                          <div className="unit-price">@ {formatCurrency(expense.unitPrice)}</div>
                        </>
                      ) : (
                        <div className="misc-category">{expense.category || 'Sin categoría'}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="expense-amount">
                      {expense.type === 'product' 
                        ? formatCurrency(expense.totalAmount)
                        : formatCurrency(expense.amount)
                      }
                    </div>
                  </td>
                  <td>
                    <div className="expense-actions">
                      <button
                        className="btn-icon btn-icon-sm"
                        onClick={() => onViewExpense(expense)}
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      
                      <button
                        className="btn-icon btn-icon-sm btn-icon-primary"
                        onClick={() => onEditExpense(expense)}
                        title="Editar gasto"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      
                      <button
                        className="btn-icon btn-icon-sm btn-icon-danger"
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
                            onDeleteExpense(expense.id);
                          }
                        }}
                        title="Eliminar gasto"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <h2 className="empty-title">No hay gastos registrados</h2>
          <p className="empty-description">
            Comienza registrando un nuevo gasto o venta de producto.
          </p>
          <button className="btn btn-primary" onClick={onAddExpense}>
            <i className="fas fa-plus"></i> Registrar gasto
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-expense' || dialogType === 'edit-expense' ? (
            <ExpenseDialog
              expense={selectedExpense}
              products={products}
              isNew={dialogType === 'add-expense'}
              onSave={onSaveExpense}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-expense' ? (
            <ExpenseDetailDialog
              expense={selectedExpense}
              products={products}
              onClose={onCloseDialog}
              onEditExpense={onEditExpense}
              onDeleteExpense={onDeleteExpense}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ExpensesPanel;