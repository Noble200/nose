// src/components/panels/Transfers/ApproveTransferDialog.js - Diálogo para aprobar/rechazar transferencias
import React, { useState } from 'react';

const ApproveTransferDialog = ({ 
  transfer, 
  warehouses, 
  products, 
  onSubmit, 
  onClose 
}) => {
  const [decision, setDecision] = useState(''); // 'approve' o 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Función para obtener el nombre del almacén
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return 'No asignado';
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Función para obtener información de productos con verificación de stock
  const getProductsWithStockCheck = () => {
    if (!transfer.products || transfer.products.length === 0) return [];
    
    return transfer.products.map(transferProduct => {
      const product = products.find(p => p.id === transferProduct.productId);
      const currentStock = product ? product.stock : 0;
      const hasEnoughStock = currentStock >= transferProduct.quantity;
      
      return {
        ...transferProduct,
        productName: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : '',
        currentStock: currentStock,
        hasEnoughStock: hasEnoughStock
      };
    });
  };

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

  // Verificar si hay problemas de stock
  const hasStockIssues = () => {
    const productsWithStock = getProductsWithStockCheck();
    return productsWithStock.some(product => !product.hasEnoughStock);
  };

  // Obtener productos con problemas de stock
  const getStockIssues = () => {
    const productsWithStock = getProductsWithStockCheck();
    return productsWithStock.filter(product => !product.hasEnoughStock);
  };

  // Manejar cambio de decisión
  const handleDecisionChange = (newDecision) => {
    setDecision(newDecision);
    setErrors({});
    
    if (newDecision === 'approve') {
      setRejectionReason('');
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!decision) {
      newErrors.decision = 'Debe seleccionar una decisión';
    }
    
    if (decision === 'reject' && !rejectionReason.trim()) {
      newErrors.rejectionReason = 'Debe proporcionar una razón para el rechazo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      await onSubmit(decision, rejectionReason);
    } catch (error) {
      console.error('Error al procesar decisión:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const productsWithStock = getProductsWithStockCheck();
  const stockIssues = getStockIssues();

  return (
    <div className="dialog approve-transfer-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">Aprobar/Rechazar Transferencia</h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        {/* Resumen de la transferencia */}
        <div className="transfer-summary-section">
          <h3 className="section-title">
            <i className="fas fa-info-circle"></i> Resumen de la transferencia
          </h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Número</span>
              <span className="summary-value">{transfer.transferNumber || 'Sin asignar'}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Fecha de solicitud</span>
              <span className="summary-value">{formatDate(transfer.requestDate)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Solicitado por</span>
              <span className="summary-value">{transfer.requestedBy || 'No especificado'}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Origen</span>
              <span className="summary-value">{getWarehouseName(transfer.sourceWarehouseId)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Destino</span>
              <span className="summary-value">{getWarehouseName(transfer.targetWarehouseId)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Distancia</span>
              <span className="summary-value">{transfer.distance || 0} {transfer.distanceUnit || 'km'}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Costo total</span>
              <span className="summary-value">{formatCost(transfer.transferCost)}</span>
            </div>
            
            {transfer.costPerUnit > 0 && (
              <div className="summary-item">
                <span className="summary-label">Costo por {transfer.distanceUnit || 'km'}</span>
                <span className="summary-value">{formatCost(transfer.costPerUnit)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Productos a transferir con verificación de stock */}
        <div className="products-summary-section">
          <h3 className="section-title">
            <i className="fas fa-boxes"></i> Productos a transferir
          </h3>
          
          {productsWithStock.length > 0 ? (
            <div className="products-approval-table">
              <table className="approval-products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad solicitada</th>
                    <th>Stock actual</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productsWithStock.map((product, index) => (
                    <tr key={index} className={!product.hasEnoughStock ? 'insufficient-stock' : ''}>
                      <td>{product.productName}</td>
                      <td>{product.quantity} {product.unit}</td>
                      <td>{product.currentStock} {product.unit}</td>
                      <td>
                        {product.hasEnoughStock ? (
                          <span className="stock-ok">✓ Stock suficiente</span>
                        ) : (
                          <span className="stock-insufficient">⚠ Stock insuficiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay productos registrados en esta transferencia.</p>
          )}
        </div>

        {/* Advertencias de stock */}
        {stockIssues.length > 0 && (
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <strong>Advertencia de stock:</strong> Los siguientes productos no tienen stock suficiente:
            <ul>
              {stockIssues.map((product, index) => (
                <li key={index}>
                  <strong>{product.productName}:</strong> Solicitado {product.quantity} {product.unit}, 
                  disponible {product.currentStock} {product.unit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notas de la transferencia */}
        {transfer.notes && (
          <div className="transfer-notes-section">
            <h3 className="section-title">
              <i className="fas fa-sticky-note"></i> Notas de la transferencia
            </h3>
            <div className="notes-content">
              <p>{transfer.notes}</p>
            </div>
          </div>
        )}

        {/* Decisión */}
        <div className="decision-section">
          <h3 className="section-title">Decisión</h3>
          
          <div className="decision-options">
            <div className={`decision-option ${decision === 'approve' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="approve"
                name="decision"
                value="approve"
                checked={decision === 'approve'}
                onChange={(e) => handleDecisionChange(e.target.value)}
                disabled={submitting}
              />
              <label htmlFor="approve" className="decision-label">
                <div className="decision-icon approve">
                  <i className="fas fa-check"></i>
                </div>
                <div className="decision-content">
                  <div className="decision-title">Aprobar transferencia</div>
                  <div className="decision-description">
                    La transferencia será aprobada y estará lista para ser enviada.
                    {hasStockIssues() && ' ⚠ Hay problemas de stock que deben resolverse.'}
                  </div>
                </div>
              </label>
            </div>
            
            <div className={`decision-option ${decision === 'reject' ? 'selected' : ''}`}>
              <input
                type="radio"
                id="reject"
                name="decision"
                value="reject"
                checked={decision === 'reject'}
                onChange={(e) => handleDecisionChange(e.target.value)}
                disabled={submitting}
              />
              <label htmlFor="reject" className="decision-label">
                <div className="decision-icon reject">
                  <i className="fas fa-times"></i>
                </div>
                <div className="decision-content">
                  <div className="decision-title">Rechazar transferencia</div>
                  <div className="decision-description">
                    La transferencia será rechazada y no se procesará.
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {errors.decision && <div className="invalid-feedback">{errors.decision}</div>}
        </div>

        {/* Razón del rechazo */}
        {decision === 'reject' && (
          <div className="rejection-reason-section">
            <div className="form-group">
              <label htmlFor="rejectionReason" className="form-label required">
                Razón del rechazo
              </label>
              <textarea
                id="rejectionReason"
                className={`form-control ${errors.rejectionReason ? 'is-invalid' : ''}`}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique por qué se rechaza esta transferencia"
                rows={4}
                disabled={submitting}
              />
              {errors.rejectionReason && <div className="invalid-feedback">{errors.rejectionReason}</div>}
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {errors.submit && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {errors.submit}
          </div>
        )}
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </button>
        <button 
          className={`btn ${decision === 'approve' ? 'btn-success' : 'btn-danger'}`}
          onClick={handleSubmit} 
          disabled={submitting || !decision}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              Procesando...
            </>
          ) : (
            <>
              <i className={`fas ${decision === 'approve' ? 'fa-check' : 'fa-times'}`}></i>
              {decision === 'approve' ? 'Aprobar transferencia' : 'Rechazar transferencia'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ApproveTransferDialog;