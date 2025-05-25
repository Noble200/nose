// src/components/panels/Harvests/HarvestDetailDialog.js
import React from 'react';

const HarvestDetailDialog = ({
  harvest,
  fields,
  products,
  warehouses,
  onClose,
  onEdit,
  onComplete,
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

  // Función para obtener el nombre del campo
  const getFieldName = () => {
    if (harvest.field && harvest.field.name) {
      return harvest.field.name;
    }
    
    if (harvest.fieldId) {
      const field = fields.find(f => f.id === harvest.fieldId);
      return field ? field.name : 'Campo desconocido';
    }
    
    return 'No asignado';
  };

  // Función para renderizar el estado como chip
  const renderStatusChip = (status) => {
    let statusClass = '';
    let statusText = '';

    switch (status) {
      case 'pending':
        statusClass = 'status-pending';
        statusText = 'Pendiente';
        break;
      case 'scheduled':
        statusClass = 'status-scheduled';
        statusText = 'Programada';
        break;
      case 'in_progress':
        statusClass = 'status-in-progress';
        statusText = 'En proceso';
        break;
      case 'completed':
        statusClass = 'status-completed';
        statusText = 'Completada';
        break;
      case 'cancelled':
        statusClass = 'status-cancelled';
        statusText = 'Cancelada';
        break;
      default:
        statusClass = 'status-pending';
        statusText = status || 'Pendiente';
    }

    return <span className={`status-chip ${statusClass}`}>{statusText}</span>;
  };

  // Función para obtener el texto del destino de almacenamiento
  const getDestinationText = () => {
    if (!harvest.targetWarehouse) return 'No asignado';
    
    const warehouse = warehouses.find(w => w.id === harvest.targetWarehouse);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Función para obtener productos seleccionados con nombres completos
  const getSelectedProducts = () => {
    if (!harvest.selectedProducts || harvest.selectedProducts.length === 0) {
      return [];
    }
    
    return harvest.selectedProducts.map(selectedProduct => {
      const product = products.find(p => p.id === selectedProduct.productId);
      return {
        ...selectedProduct,
        name: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : ''
      };
    });
  };

  // Función para obtener los lotes con nombre y superficie
  const getLotsText = () => {
    if (!harvest.lots || harvest.lots.length === 0) {
      return 'Sin lotes asignados';
    }

    return harvest.lots.map(lot => `${lot.name} (${lot.area} ${lot.areaUnit || 'ha'})`).join(', ');
  };

  return (
    <div className="dialog harvest-detail-dialog">
      <div className="dialog-header">
        <div className="dialog-title-container">
          <h2 className="dialog-title">Detalles de cosecha</h2>
          {renderStatusChip(harvest.status)}
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <div className="harvest-details-container">
          <div className="harvest-summary">
            <div className="harvest-summary-header">
              <div className="harvest-icon-large">
                <i className="fas fa-tractor"></i>
              </div>
              <div className="harvest-summary-content">
                <h3 className="harvest-name">{harvest.crop}</h3>
                <div className="harvest-field">{getFieldName()}</div>
                <div className="harvest-lots">
                  <strong>Lotes:</strong> {getLotsText()}
                </div>
              </div>
              <div className="harvest-stats">
                <div className="stat">
                  <div className="stat-value">{harvest.totalArea} {harvest.areaUnit || 'ha'}</div>
                  <div className="stat-label">Superficie</div>
                </div>
                {harvest.status === 'completed' && harvest.actualYield && (
                  <div className="stat">
                    <div className="stat-value">{harvest.actualYield}</div>
                    <div className="stat-label">{harvest.yieldUnit || 'kg/ha'}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="harvest-actions-bar">
              {harvest.status !== 'completed' && harvest.status !== 'cancelled' && (
                <>
                  <button className="btn btn-primary" onClick={() => onComplete(harvest)}>
                    <i className="fas fa-check"></i> Completar cosecha
                  </button>
                  <button className="btn btn-outline" onClick={() => onEdit(harvest)}>
                    <i className="fas fa-edit"></i> Editar
                  </button>
                </>
              )}
              <button 
                className="btn btn-outline btn-danger" 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar esta cosecha? Esta acción no se puede deshacer.')) {
                    onDelete(harvest.id);
                    onClose();
                  }
                }}
              >
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>

            {/* Información principal */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Información general
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Cultivo</span>
                  <span className="detail-value">{harvest.crop}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Estado</span>
                  <span className="detail-value">{renderStatusChip(harvest.status)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Fecha planificada</span>
                  <span className="detail-value">{formatDate(harvest.plannedDate)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Rendimiento estimado</span>
                  <span className="detail-value">
                    {harvest.estimatedYield ? `${harvest.estimatedYield} ${harvest.yieldUnit || 'kg/ha'}` : '-'}
                  </span>
                </div>
                
                {harvest.status === 'completed' && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Fecha de cosecha</span>
                      <span className="detail-value">{formatDate(harvest.harvestDate)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Rendimiento real</span>
                      <span className="detail-value">
                        {harvest.actualYield ? `${harvest.actualYield} ${harvest.yieldUnit || 'kg/ha'}` : '-'}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Total cosechado</span>
                      <span className="detail-value">
                        {harvest.totalHarvested ? `${harvest.totalHarvested} ${harvest.totalHarvestedUnit || 'kg'}` : '-'}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="detail-item">
                  <span className="detail-label">Método de cosecha</span>
                  <span className="detail-value">{harvest.harvestMethod || '-'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Personal asignado</span>
                  <span className="detail-value">{harvest.workers || '-'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Almacén de destino</span>
                  <span className="detail-value">{getDestinationText()}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Destino final</span>
                  <span className="detail-value">{harvest.destination || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Productos utilizados */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-seedling"></i> Productos para siembra
              </h3>
              
              {getSelectedProducts().length > 0 ? (
                <div className="products-table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSelectedProducts().map((product, index) => (
                        <tr key={index}>
                          <td>
                            <div className="product-info">
                              {product.name}
                              {product.code && (
                                <span className="product-code">{product.code}</span>
                              )}
                            </div>
                          </td>
                          <td>{product.quantity} {product.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay productos registrados para esta cosecha.</p>
              )}
            </div>
            
            {/* Maquinaria */}
            {harvest.machinery && harvest.machinery.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-cogs"></i> Maquinaria
                </h3>
                
                <div className="tags-display">
                  {harvest.machinery.map((item, index) => (
                    <span key={index} className="tag-display">{item}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Parámetros de calidad */}
            {harvest.qualityParameters && harvest.qualityParameters.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-chart-line"></i> Parámetros de calidad
                </h3>
                
                <div className="quality-params-list">
                  {harvest.qualityParameters.map((param, index) => (
                    <div key={index} className="quality-param">
                      <span className="param-name">{param}</span>
                      {harvest.qualityResults && harvest.qualityResults.length > index && (
                        <span className="param-result">{harvest.qualityResults[index]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Productos cosechados */}
            {harvest.status === 'completed' && harvest.productsHarvested && harvest.productsHarvested.length > 0 && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-boxes"></i> Productos cosechados
                </h3>
                
                <div className="products-table-container">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Almacén</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harvest.productsHarvested.map((product, index) => (
                        <tr key={index}>
                          <td>
                            <div className="product-info">
                              {product.name}
                              {product.code && (
                                <span className="product-code">{product.code}</span>
                              )}
                            </div>
                          </td>
                          <td>{product.quantity} {product.unit}</td>
                          <td>
                            {(() => {
                              const warehouse = warehouses.find(w => w.id === product.warehouseId);
                              return warehouse ? warehouse.name : 'No especificado';
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Notas */}
            {(harvest.notes || harvest.harvestNotes) && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-sticky-note"></i> Notas
                </h3>
                
                {harvest.notes && (
                  <div className="notes-content">
                    <h4>Notas de planificación</h4>
                    <p>{harvest.notes}</p>
                  </div>
                )}
                
                {harvest.harvestNotes && (
                  <div className="notes-content">
                    <h4>Notas de cosecha</h4>
                    <p>{harvest.harvestNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
        {harvest.status !== 'completed' && harvest.status !== 'cancelled' && (
          <button className="btn btn-primary" onClick={() => onComplete(harvest)}>
            <i className="fas fa-check"></i> Completar cosecha
          </button>
        )}
      </div>
    </div>
  );
};

export default HarvestDetailDialog;