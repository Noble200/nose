// src/components/panels/Purchases/DeliveryDetailDialog.js - Diálogo de detalles de entrega
import React from 'react';

const DeliveryDetailDialog = ({
  purchase,
  delivery,
  warehouses,
  onClose,
  onComplete,
  onCancel
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

  // Calcular totales de la entrega
  const calculateTotals = () => {
    const totalQuantity = delivery.products.reduce((sum, product) => sum + product.quantity, 0);
    const totalValue = delivery.products.reduce((sum, product) => 
      sum + (product.quantity * product.unitCost), 0
    );
    const totalWithFreight = totalValue + (delivery.freight || 0);
    
    return { totalQuantity, totalValue, totalWithFreight };
  };

  const totals = calculateTotals();

  return (
    <div className="dialog-content">
      <div className="dialog-header">
        <h2 className="dialog-title">
          Detalles de Entrega - {delivery.id.substring(0, 8)}
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
              <label>ID de Entrega:</label>
              <span>{delivery.id}</span>
            </div>
            
            <div className="detail-item">
              <label>Estado:</label>
              <span>{renderStatusChip(delivery.status)}</span>
            </div>
            
            <div className="detail-item">
              <label>Compra:</label>
              <span>{purchase.purchaseNumber || `Compra ${purchase.id.substring(0, 8)}`}</span>
            </div>
            
            <div className="detail-item">
              <label>Proveedor:</label>
              <span>{purchase.supplier || 'No especificado'}</span>
            </div>
            
            <div className="detail-item">
              <label>Almacén de Destino:</label>
              <span>{getWarehouseName(delivery.warehouseId)}</span>
            </div>
            
            <div className="detail-item">
              <label>Fecha de Entrega:</label>
              <span>{formatDate(delivery.deliveryDate)}</span>
            </div>
            
            <div className="detail-item">
              <label>Creado por:</label>
              <span>{delivery.createdBy || 'No especificado'}</span>
            </div>
            
            <div className="detail-item">
              <label>Fecha de Creación:</label>
              <span>{formatDateTime(delivery.createdAt)}</span>
            </div>
          </div>

          {/* Fechas de estado */}
          {delivery.completedAt && (
            <div className="detail-grid">
              <div className="detail-item">
                <label>Completado el:</label>
                <span>{formatDateTime(delivery.completedAt)}</span>
              </div>
            </div>
          )}
          
          {delivery.cancelledAt && (
            <div className="detail-grid">
              <div className="detail-item">
                <label>Cancelado el:</label>
                <span>{formatDateTime(delivery.cancelledAt)}</span>
              </div>
              
              {delivery.cancellationReason && (
                <div className="detail-item">
                  <label>Motivo de cancelación:</label>
                  <span>{delivery.cancellationReason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Productos de la entrega */}
        <div className="detail-section">
          <h3 className="section-title">Productos en la Entrega</h3>
          
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
                {delivery.products.map((product, index) => (
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
              <span>Cantidad total:</span>
              <span>{totals.totalQuantity.toFixed(2)} unidades</span>
            </div>
            <div className="summary-row">
              <span>Valor de productos:</span>
              <span>{formatCurrency(totals.totalValue)}</span>
            </div>
            <div className="summary-row">
              <span>Costo de flete:</span>
              <span>{formatCurrency(delivery.freight || 0)}</span>
            </div>
            <div className="summary-row total">
              <span>Total de entrega:</span>
              <span>{formatCurrency(totals.totalWithFreight)}</span>
            </div>
          </div>
        </div>

        {/* Información del almacén */}
        <div className="detail-section">
          <h3 className="section-title">Información del Almacén</h3>
          
          {(() => {
            const warehouse = warehouses.find(w => w.id === delivery.warehouseId);
            
            if (!warehouse) {
              return (
                <div className="warehouse-not-found">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Información del almacén no disponible</p>
                </div>
              );
            }
            
            return (
              <div className="warehouse-info">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Nombre:</label>
                    <span>{warehouse.name}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Tipo:</label>
                    <span>{warehouse.type || 'No especificado'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Ubicación:</label>
                    <span>{warehouse.location || 'No especificada'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Estado:</label>
                    <span>{warehouse.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                  </div>

                  {warehouse.capacity && (
                    <div className="detail-item">
                      <label>Capacidad:</label>
                      <span>{warehouse.capacity} {warehouse.capacityUnit || 'unidades'}</span>
                    </div>
                  )}

                  {warehouse.supervisor && (
                    <div className="detail-item">
                      <label>Supervisor:</label>
                      <span>{warehouse.supervisor}</span>
                    </div>
                  )}
                </div>
                
                {warehouse.description && (
                  <div className="warehouse-description">
                    <label><strong>Descripción:</strong></label>
                    <p>{warehouse.description}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Notas */}
        {delivery.notes && (
          <div className="detail-section">
            <h3 className="section-title">Notas</h3>
            <div className="notes-content">
              {delivery.notes}
            </div>
          </div>
        )}

        {/* Historial de estados */}
        <div className="detail-section">
          <h3 className="section-title">Historial</h3>
          
          <div className="status-timeline">
            <div className="timeline-item">
              <div className="timeline-marker created">
                <i className="fas fa-plus"></i>
              </div>
              <div className="timeline-content">
                <div className="timeline-title">Entrega creada</div>
                <div className="timeline-date">{formatDateTime(delivery.createdAt)}</div>
                <div className="timeline-user">Por: {delivery.createdBy}</div>
              </div>
            </div>

            {delivery.status === 'completed' && delivery.completedAt && (
              <div className="timeline-item">
                <div className="timeline-marker completed">
                  <i className="fas fa-check"></i>
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">Entrega completada</div>
                  <div className="timeline-date">{formatDateTime(delivery.completedAt)}</div>
                  <div className="timeline-description">
                    Los productos fueron añadidos al inventario del almacén
                  </div>
                </div>
              </div>
            )}

            {delivery.status === 'cancelled' && delivery.cancelledAt && (
              <div className="timeline-item">
                <div className="timeline-marker cancelled">
                  <i className="fas fa-times"></i>
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">Entrega cancelada</div>
                  <div className="timeline-date">{formatDateTime(delivery.cancelledAt)}</div>
                  {delivery.cancellationReason && (
                    <div className="timeline-description">
                      Motivo: {delivery.cancellationReason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dialog-footer">
        <div className="footer-left">
          {delivery.status === 'in_transit' && (
            <>
              <button
                className="btn btn-success"
                onClick={() => {
                  if (window.confirm('¿Confirmas que la entrega ha llegado y deseas añadir los productos al inventario?')) {
                    onComplete(purchase.id, delivery.id);
                    onClose();
                  }
                }}
              >
                <i className="fas fa-check"></i> Completar Entrega
              </button>
              
              <button
                className="btn btn-danger"
                onClick={() => {
                  const reason = window.prompt('¿Por qué deseas cancelar esta entrega? (opcional)');
                  if (reason !== null) {
                    onCancel(purchase.id, delivery.id);
                    onClose();
                  }
                }}
              >
                <i className="fas fa-times"></i> Cancelar Entrega
              </button>
            </>
          )}
        </div>
        
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default DeliveryDetailDialog;