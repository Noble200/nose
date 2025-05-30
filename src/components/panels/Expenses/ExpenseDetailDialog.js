// src/components/panels/Expenses/ExpenseDetailDialog.js - Vista detallada de un gasto
import React from 'react';

const ExpenseDetailDialog = ({ expense, products, onClose, onEditExpense, onDeleteExpense }) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para formatear hora completa
  const formatDateTime = (date) => {
    if (!date) return 'Sin fecha';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  };

  // Función para obtener el texto del tipo de gasto
  const getExpenseTypeText = (type) => {
    return type === 'product' ? 'Venta de producto' : 'Gasto varios';
  };

  // Función para obtener el icono según el tipo
  const getExpenseIcon = (type) => {
    return type === 'product' ? 'fas fa-shopping-cart' : 'fas fa-receipt';
  };

  // Función para obtener información del producto
  const getProductInfo = () => {
    if (!expense.productId) return null;
    
    const product = products.find(p => p.id === expense.productId);
    return product;
  };

  const productInfo = getProductInfo();

  return (
    <div className="dialog expense-detail-dialog">
      <div className="dialog-header">
        <div className="dialog-title-container">
          <h2 className="dialog-title">Detalles del gasto</h2>
          <span className={`expense-type-chip ${expense.type}`}>
            <i className={getExpenseIcon(expense.type)}></i>
            {getExpenseTypeText(expense.type)}
          </span>
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <div className="expense-details-container">
          <div className="expense-summary">
            <div className="expense-summary-header">
              <div className="expense-category-icon">
                <i className={getExpenseIcon(expense.type)}></i>
              </div>
              <div className="expense-summary-content">
                <h3 className="expense-number">{expense.expenseNumber}</h3>
                <div className="expense-type-text">{getExpenseTypeText(expense.type)}</div>
                <div className="expense-date-text">{formatDate(expense.date)}</div>
              </div>
              <div className="expense-amount-display">
                <div className="amount-value">
                  {expense.type === 'product' 
                    ? formatCurrency(expense.totalAmount)
                    : formatCurrency(expense.amount)
                  }
                </div>
                <div className="amount-label">Importe total</div>
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="expense-actions-bar">
              <button className="btn btn-primary" onClick={() => onEditExpense(expense)}>
                <i className="fas fa-edit"></i> Editar gasto
              </button>
              <button className="btn btn-outline btn-danger" onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
                  onDeleteExpense(expense.id);
                  onClose();
                }
              }}>
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>

            {/* Información básica */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Información básica
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Número de gasto</span>
                  <span className="detail-value">{expense.expenseNumber}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">{getExpenseTypeText(expense.type)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Fecha</span>
                  <span className="detail-value">{formatDate(expense.date)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Registrado por</span>
                  <span className="detail-value">{expense.createdBy || 'Usuario desconocido'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Fecha de registro</span>
                  <span className="detail-value">{formatDateTime(expense.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Detalles específicos según el tipo */}
            {expense.type === 'product' ? (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-shopping-cart"></i> Detalles de la venta
                </h3>
                
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Producto vendido</span>
                    <span className="detail-value">{expense.productName}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Categoría del producto</span>
                    <span className="detail-value">{expense.productCategory || 'Sin categoría'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Cantidad vendida</span>
                    <span className="detail-value">
                      {expense.quantitySold} {productInfo?.unit || 'unidades'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Precio unitario</span>
                    <span className="detail-value">{formatCurrency(expense.unitPrice)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Total de la venta</span>
                    <span className="detail-value total-amount">{formatCurrency(expense.totalAmount)}</span>
                  </div>
                  
                  {expense.saleReason && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Motivo de la venta</span>
                      <span className="detail-value">{expense.saleReason}</span>
                    </div>
                  )}
                </div>
                
                {/* Información del producto si está disponible */}
                {productInfo && (
                  <div className="product-info-section">
                    <h4>Información del producto</h4>
                    <div className="product-info-grid">
                      <div className="product-info-item">
                        <span className="info-label">Stock actual</span>
                        <span className="info-value">{productInfo.stock} {productInfo.unit}</span>
                      </div>
                      
                      {productInfo.cost && (
                        <div className="product-info-item">
                          <span className="info-label">Costo del producto</span>
                          <span className="info-value">{formatCurrency(productInfo.cost)}</span>
                        </div>
                      )}
                      
                      {productInfo.minStock && (
                        <div className="product-info-item">
                          <span className="info-label">Stock mínimo</span>
                          <span className="info-value">{productInfo.minStock} {productInfo.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-receipt"></i> Detalles del gasto
                </h3>
                
                <div className="detail-grid">
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-label">Descripción</span>
                    <span className="detail-value">{expense.description}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Categoría</span>
                    <span className="detail-value">{expense.category || 'Sin categoría'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Importe</span>
                    <span className="detail-value total-amount">{formatCurrency(expense.amount)}</span>
                  </div>
                  
                  {expense.supplier && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Proveedor</span>
                      <span className="detail-value">{expense.supplier}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Notas adicionales */}
            {expense.notes && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-sticky-note"></i> Notas adicionales
                </h3>
                
                <div className="notes-content">
                  <p>{expense.notes}</p>
                </div>
              </div>
            )}
            
            {/* Información de auditoría */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-history"></i> Información de registro
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Creado por</span>
                  <span className="detail-value">{expense.createdBy || 'Usuario desconocido'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Fecha de creación</span>
                  <span className="detail-value">{formatDateTime(expense.createdAt)}</span>
                </div>
                
                {expense.updatedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Última modificación</span>
                    <span className="detail-value">{formatDateTime(expense.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
        <button className="btn btn-primary" onClick={() => onEditExpense(expense)}>
          <i className="fas fa-edit"></i> Editar gasto
        </button>
      </div>
    </div>
  );
};

export default ExpenseDetailDialog;