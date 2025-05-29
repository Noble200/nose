// src/components/panels/Purchases/PurchaseDetailDialog.js - Diálogo de detalles de compra
import React from 'react';

const PurchaseDetailDialog = ({
  purchase,
  warehouses,
  onClose,
  onEdit,
  onAddDelivery,
  onViewDelivery,
  onCompleteDelivery,
  onCancelDelivery,
  onDelete
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

  // Función para formatear fecha y hora
  const formatDateTime = (date) => {
    if (!date) return '-';
    
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
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Función para renderizar el estado como chip
  const renderStatusChip = (status) => {
    let chipClass = '';
    let statusText = '';

    switch (status) {
      case 'pending':
        chipClass = 'chip-warning';
        statusText = 'Pendiente';
        break;
      case 'approved':
        chipClass = 'chip-info';
        statusText = 'Aprobada';
        break;
      case 'partial_delivered':
        chipClass = 'chip-primary';
        statusText = 'Entrega parcial';
        break;
      case 'completed':
        chipClass = 'chip-success';
        statusText = 'Completada';
        break;
      case 'cancelled':
        chipClass = 'chip-danger';
        statusText = 'Cancelada';
        break;
      default:
        chipClass = 'chip-warning';
        statusText = status || 'Pendiente';
    }

    return <span className={`chip ${chipClass}`}>{statusText}</span>;
  };

  // Función para renderizar el estado de entrega
  const renderDeliveryStatus = (status) => {
    let chipClass = '';
    let statusText = '';

    switch (status) {
      case 'in_transit':
        chipClass = 'chip-primary';
        statusText = 'En camino';
        break;
      case 'completed':
        chipClass = 'chip-success';
        statusText = 'Entregado';
        break;
      case 'cancelled':
        chipClass = 'chip-danger';
        statusText = 'Cancelado';
        break;
      default:
        chipClass = 'chip-warning';
        statusText = status || 'Desconocido';
    }

    return <span className={`chip ${chipClass}`}>{statusText}</span>;
  };

  // Obtener nombre del almacén
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Calcular progreso de entrega
  const calculateProgress = () => {
    const totalPurchased = purchase.products.reduce((sum, product) => sum + product.quantity, 0);
    const totalDelivered = purchase.totalDelivered || 0;
    
    if (totalPurchased === 0) return 0;
    return Math.round((totalDelivered / totalPurchased) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="dialog-content large">
      <div className="dialog-header">
        <h2 className="dialog-title">
          Detalles de Compra - {purchase.purchaseNumber || `Compra ${purchase.id.substring(0, 8)}`}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="dialog-body">
        {/* Información básica */}
        <div className="detail-section">
          <h3 className="section-title">Información General</h3>
          
          <div className="detail-grid">
            <div className="detail-item">
              <label>Número de Compra:</label>
              <span>{purchase.purchaseNumber || `Compra ${purchase.id.substring(0, 8)}`}</span>
            </div>
            
            <div className="detail-item">
              <label>Estado:</label>
              <span>{renderStatusChip(purchase.status)}</span>
            </div>
            
            <div className="detail-item">
              <label>Proveedor:</label>
              <span>{purchase.supplier || 'No especificado'}</span>
            </div>
            
            <div className="detail-item">
              <label>Fecha de Compra:</label>
              <span>{formatDate(purchase.purchaseDate)}</span>
            </div>
            
            <div className="detail-item">
              <label>Creado por:</label>
              <span>{purchase.createdBy || 'No especificado'}</span>
            </div>
            
            <div className="detail-item">
              <label>Fecha de Creación:</label>
              <span>{formatDateTime(purchase.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="detail-section">
          <h3 className="section-title">Productos</h3>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Costo Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.quantity} {product.unit}</td>
                    <td>{formatCurrency(product.unitCost)}</td>
                    <td>{formatCurrency(product.quantity * product.unitCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="detail-section">
          <h3 className="section-title">Resumen Financiero</h3>
          
          <div className="financial-summary">
            <div className="summary-row">
              <span>Subtotal productos:</span>
              <span>{formatCurrency(purchase.totalProducts)}</span>
            </div>
            <div className="summary-row">
              <span>Flete:</span>
              <span>{formatCurrency(purchase.freight)}</span>
            </div>
            <div className="summary-row">
              <span>Impuestos:</span>
              <span>{formatCurrency(purchase.taxes)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(purchase.totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Flete pagado:</span>
              <span>{formatCurrency(purchase.totalFreightPaid)}</span>
            </div>
          </div>
        </div>

        {/* Progreso de entregas */}
        <div className="detail-section">
          <h3 className="section-title">Progreso de Entregas</h3>
          
          <div className="delivery-progress">
            <div className="progress-info">
              <span className="progress-label">Progreso general</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#4caf50' : '#2196f3'
                }}
              ></div>
            </div>
            <div className="progress-details">
              <span>Entregado: {purchase.totalDelivered || 0}</span>
              <span>Pendiente: {purchase.totalPending || 0}</span>
            </div>
          </div>
        </div>

        {/* Lista de entregas */}
        <div className="detail-section">
          <div className="section-header">
            <h3 className="section-title">Entregas</h3>
            {(purchase.status === 'approved' || purchase.status === 'partial_delivered') && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAddDelivery(purchase)}
              >
                <i className="fas fa-plus"></i> Nueva Entrega
              </button>
            )}
          </div>
          
          {purchase.deliveries && purchase.deliveries.length > 0 ? (
            <div className="deliveries-list">
              {purchase.deliveries.map((delivery) => (
                <div key={delivery.id} className="delivery-card">
                  <div className="delivery-header">
                    <div className="delivery-info">
                      <h4 className="delivery-title">
                        Entrega a {getWarehouseName(delivery.warehouseId)}
                      </h4>
                      <span className="delivery-date">
                        {formatDate(delivery.deliveryDate)}
                      </span>
                    </div>
                    <div className="delivery-status-container">
                      {renderDeliveryStatus(delivery.status)}
                    </div>
                  </div>
                  
                  <div className="delivery-content">
                    <div className="delivery-products">
                      <strong>Productos:</strong>
                      <ul>
                        {delivery.products.map((product, index) => (
                          <li key={index}>
                            {product.name}: {product.quantity} {product.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {delivery.freight > 0 && (
                      <div className="delivery-freight">
                        <strong>Flete:</strong> {formatCurrency(delivery.freight)}
                      </div>
                    )}
                    
                    {delivery.notes && (
                      <div className="delivery-notes">
                        <strong>Notas:</strong> {delivery.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="delivery-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onViewDelivery(purchase, delivery)}
                    >
                      <i className="fas fa-eye"></i> Ver
                    </button>
                    
                    {delivery.status === 'in_transit' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onCompleteDelivery(purchase.id, delivery.id)}
                        >
                          <i className="fas fa-check"></i> Completar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onCancelDelivery(purchase.id, delivery.id)}
                        >
                          <i className="fas fa-times"></i> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-deliveries">
              <i className="fas fa-truck"></i>
              <p>No hay entregas registradas</p>
              {(purchase.status === 'approved' || purchase.status === 'partial_delivered') && (
                <button
                  className="btn btn-primary"
                  onClick={() => onAddDelivery(purchase)}
                >
                  <i className="fas fa-plus"></i> Crear Primera Entrega
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notas */}
        {purchase.notes && (
          <div className="detail-section">
            <h3 className="section-title">Notas</h3>
            <div className="notes-content">
              {purchase.notes}
            </div>
          </div>
        )}
      </div>

      <div className="dialog-footer">
        <div className="footer-left">
          {purchase.status !== 'completed' && purchase.status !== 'cancelled' && (
            <button
              className="btn btn-outline"
              onClick={() => onEdit(purchase)}
            >
              <i className="fas fa-edit"></i> Editar
            </button>
          )}
          
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.')) {
                onDelete(purchase.id);
                onClose();
              }
            }}
          >
            <i className="fas fa-trash"></i> Eliminar
          </button>
        </div>
        
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PurchaseDetailDialog;