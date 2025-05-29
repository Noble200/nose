// src/components/panels/Transfers/TransferDetailDialog.js - Vista detallada de transferencia
import React from 'react';

const TransferDetailDialog = ({ 
  transfer, 
  warehouses, 
  products, 
  onClose, 
  onEdit, 
  onApprove, 
  onShip, 
  onReceive, 
  onDelete 
}) => {
  // Función para obtener el nombre del almacén
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return 'No asignado';
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Función para formatear fechas
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

  // Función para formatear costo
  const formatCost = (cost) => {
    if (!cost && cost !== 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cost);
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
      case 'rejected':
        chipClass = 'chip-danger';
        statusText = 'Rechazada';
        break;
      case 'shipped':
        chipClass = 'chip-primary';
        statusText = 'Enviada';
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

  // Obtener información del producto
  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId);
    return product || { name: 'Producto desconocido', unit: '' };
  };

  // Calcular totales
  const getTotals = () => {
    const totalProducts = transfer.products?.length || 0;
    const totalQuantity = transfer.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    return { totalProducts, totalQuantity };
  };

  const totals = getTotals();

  return (
    <div className="dialog transfer-detail-dialog">
      <div className="dialog-header">
        <div className="dialog-title-container">
          <h2 className="dialog-title">Detalles de la transferencia</h2>
          {renderStatusChip(transfer.status)}
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <div className="transfer-details-container">
          {/* Resumen de la transferencia */}
          <div className="transfer-summary">
            <div className="transfer-summary-header">
              <div className="transfer-type-icon">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <div className="transfer-summary-content">
                <h3 className="transfer-number">
                  {transfer.transferNumber || `TRF-${transfer.id?.substring(0, 8)}`}
                </h3>
                <div className="transfer-route">
                  {getWarehouseName(transfer.sourceWarehouseId)} → {getWarehouseName(transfer.targetWarehouseId)}
                </div>
                <div className="transfer-products-summary">
                  {totals.totalProducts} producto{totals.totalProducts !== 1 ? 's' : ''} • {totals.totalQuantity.toFixed(2)} unidades totales
                </div>
              </div>
            </div>
            
            {/* Acciones rápidas según el estado */}
            <div className="transfer-actions-bar">
              {transfer.status === 'pending' && (
                <button className="btn btn-info" onClick={() => onApprove(transfer)}>
                  <i className="fas fa-check"></i> Aprobar/Rechazar
                </button>
              )}
              
              {transfer.status === 'approved' && (
                <button className="btn btn-primary" onClick={() => onShip(transfer.id)}>
                  <i className="fas fa-shipping-fast"></i> Enviar
                </button>
              )}
              
              {transfer.status === 'shipped' && (
                <button className="btn btn-success" onClick={() => onReceive(transfer)}>
                  <i className="fas fa-inbox"></i> Recibir
                </button>
              )}
              
              {(transfer.status === 'pending' || transfer.status === 'approved') && (
                <button className="btn btn-outline" onClick={() => onEdit(transfer)}>
                  <i className="fas fa-edit"></i> Editar
                </button>
              )}
              
              <button className="btn btn-outline btn-danger" onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar esta transferencia?')) {
                  onDelete(transfer.id);
                  onClose();
                }
              }}>
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>

            {/* Información general */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Información general
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Número de transferencia</span>
                  <span className="detail-value">{transfer.transferNumber || 'Sin asignar'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Estado</span>
                  <span className="detail-value">{renderStatusChip(transfer.status)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Fecha de solicitud</span>
                  <span className="detail-value">{formatDate(transfer.requestDate)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Solicitado por</span>
                  <span className="detail-value">{transfer.requestedBy || 'No especificado'}</span>
                </div>
              </div>
            </div>
            
            {/* Almacenes */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-warehouse"></i> Almacenes
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Almacén origen</span>
                  <span className="detail-value">{getWarehouseName(transfer.sourceWarehouseId)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Almacén destino</span>
                  <span className="detail-value">{getWarehouseName(transfer.targetWarehouseId)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Distancia</span>
                  <span className="detail-value">
                    {transfer.distance || 0} {transfer.distanceUnit || 'km'}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Costo de transferencia</span>
                  <span className="detail-value">{formatCost(transfer.transferCost)}</span>
                </div>
                
                {transfer.costPerUnit > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Costo por {transfer.distanceUnit || 'km'}</span>
                    <span className="detail-value">{formatCost(transfer.costPerUnit)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Productos */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-boxes"></i> Productos a transferir
              </h3>
              
              {transfer.products && transfer.products.length > 0 ? (
                <div className="products-detail-table">
                  <table className="detail-products-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfer.products.map((transferProduct, index) => {
                        const productInfo = getProductInfo(transferProduct.productId);
                        return (
                          <tr key={index}>
                            <td>{transferProduct.productName || productInfo.name}</td>
                            <td>{transferProduct.quantity}</td>
                            <td>{transferProduct.unit || productInfo.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="products-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total de productos:</span>
                      <span className="summary-value">{totals.totalProducts}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Cantidad total:</span>
                      <span className="summary-value">{totals.totalQuantity.toFixed(2)} unidades</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-products-message">
                  <p>No hay productos registrados para esta transferencia.</p>
                </div>
              )}
            </div>
            
            {/* Historial de estados */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-history"></i> Historial
              </h3>
              
              <div className="transfer-timeline">
                <div className="timeline-item completed">
                  <div className="timeline-icon">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">Transferencia solicitada</div>
                    <div className="timeline-details">
                      {formatDateTime(transfer.requestDate)} • {transfer.requestedBy || 'Usuario desconocido'}
                    </div>
                  </div>
                </div>
                
                {transfer.status !== 'pending' && (
                  <div className={`timeline-item ${transfer.status === 'rejected' ? 'rejected' : 'completed'}`}>
                    <div className="timeline-icon">
                      <i className={`fas ${transfer.status === 'rejected' ? 'fa-times' : 'fa-check'}`}></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {transfer.status === 'rejected' ? 'Transferencia rechazada' : 'Transferencia aprobada'}
                      </div>
                      <div className="timeline-details">
                        {formatDateTime(transfer.approvedDate)} • {transfer.approvedBy || 'Usuario desconocido'}
                      </div>
                      {transfer.rejectionReason && (
                        <div className="timeline-reason">
                          <strong>Razón:</strong> {transfer.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {transfer.status === 'shipped' || transfer.status === 'completed' ? (
                  <div className="timeline-item completed">
                    <div className="timeline-icon">
                      <i className="fas fa-shipping-fast"></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Transferencia enviada</div>
                      <div className="timeline-details">
                        {formatDateTime(transfer.shippedDate)} • {transfer.shippedBy || 'Usuario desconocido'}
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {transfer.status === 'completed' && (
                  <div className="timeline-item completed">
                    <div className="timeline-icon">
                      <i className="fas fa-inbox"></i>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Transferencia recibida</div>
                      <div className="timeline-details">
                        {formatDateTime(transfer.receivedDate)} • {transfer.receivedBy || 'Usuario desconocido'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notas */}
            {transfer.notes && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-sticky-note"></i> Notas
                </h3>
                
                <div className="notes-content">
                  <p>{transfer.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
        
        {transfer.status === 'pending' && (
          <button className="btn btn-info" onClick={() => onApprove(transfer)}>
            <i className="fas fa-check"></i> Aprobar/Rechazar
          </button>
        )}
        
        {transfer.status === 'approved' && (
          <button className="btn btn-primary" onClick={() => onShip(transfer.id)}>
            <i className="fas fa-shipping-fast"></i> Enviar
          </button>
        )}
        
        {transfer.status === 'shipped' && (
          <button className="btn btn-success" onClick={() => onReceive(transfer)}>
            <i className="fas fa-inbox"></i> Recibir
          </button>
        )}
        
        {(transfer.status === 'pending' || transfer.status === 'approved') && (
          <button className="btn btn-outline" onClick={() => onEdit(transfer)}>
            <i className="fas fa-edit"></i> Editar
          </button>
        )}
      </div>
    </div>
  );
};

export default TransferDetailDialog;