// src/components/panels/Transfers/ReceiveTransferDialog.js - Diálogo para recibir transferencias
import React, { useState, useEffect } from 'react';

const ReceiveTransferDialog = ({ 
  transfer, 
  warehouses, 
  products, 
  onSubmit, 
  onClose 
}) => {
  const [receivedProducts, setReceivedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Inicializar productos recibidos con las cantidades enviadas
  useEffect(() => {
    if (transfer.products && transfer.products.length > 0) {
      const initialProducts = transfer.products.map(product => ({
        ...product,
        quantityReceived: product.quantity, // Por defecto, la cantidad recibida es igual a la enviada
        hasDiscrepancy: false
      }));
      
      setReceivedProducts(initialProducts);
    }
  }, [transfer.products]);

  // Función para obtener el nombre del almacén
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return 'No asignado';
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Función para formatear fecha
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

  // Manejar cambio en cantidad recibida
  const handleQuantityReceivedChange = (productId, newQuantity) => {
    const quantity = Number(newQuantity);
    
    setReceivedProducts(prev => prev.map(product => {
      if (product.productId === productId) {
        const originalQuantity = product.quantity;
        const hasDiscrepancy = Math.abs(quantity - originalQuantity) > 0.01; // Tolerancia para decimales
        
        return {
          ...product,
          quantityReceived: quantity,
          hasDiscrepancy: hasDiscrepancy
        };
      }
      return product;
    }));
    
    // Limpiar errores para este producto
    if (errors[productId]) {
      setErrors(prev => ({ ...prev, [productId]: '' }));
    }
  };

  // Validar cantidades recibidas
  const validateReceivedQuantities = () => {
    const newErrors = {};
    
    receivedProducts.forEach(product => {
      if (product.quantityReceived < 0) {
        newErrors[product.productId] = 'La cantidad recibida no puede ser negativa';
      }
      
      if (product.quantityReceived > product.quantity * 1.1) { // Permitir hasta 10% más
        newErrors[product.productId] = `La cantidad recibida (${product.quantityReceived}) es significativamente mayor a la enviada (${product.quantity})`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obtener totales
  const getTotals = () => {
    const totalSent = receivedProducts.reduce((sum, product) => sum + product.quantity, 0);
    const totalReceived = receivedProducts.reduce((sum, product) => sum + (product.quantityReceived || 0), 0);
    const hasDiscrepancies = receivedProducts.some(product => product.hasDiscrepancy);
    
    return { totalSent, totalReceived, hasDiscrepancies };
  };

  // Manejar envío
  const handleSubmit = async () => {
    if (!validateReceivedQuantities()) return;
    
    setSubmitting(true);
    
    try {
      await onSubmit(receivedProducts);
    } catch (error) {
      console.error('Error al recibir transferencia:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const totals = getTotals();

  return (
    <div className="dialog receive-transfer-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">Recibir Transferencia</h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        {/* Resumen de la transferencia */}
        <div className="transfer-summary-section">
          <h3 className="section-title">
            <i className="fas fa-info-circle"></i> Información de la transferencia
          </h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Número</span>
              <span className="summary-value">{transfer.transferNumber || 'Sin asignar'}</span>
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
              <span className="summary-label">Enviado por</span>
              <span className="summary-value">{transfer.shippedBy || 'No especificado'}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Fecha de envío</span>
              <span className="summary-value">{formatDateTime(transfer.shippedDate)}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Costo de transferencia</span>
              <span className="summary-value">{formatCost(transfer.transferCost)}</span>
            </div>
          </div>
        </div>

        {/* Productos a recibir */}
        <div className="products-receive-section">
          <h3 className="section-title">
            <i className="fas fa-boxes"></i> Productos a recibir
          </h3>
          
          <p className="help-text">
            Confirme las cantidades recibidas. Por defecto se muestran las cantidades enviadas, 
            pero puede ajustarlas si hay diferencias.
          </p>
          
          {receivedProducts.length > 0 ? (
            <div className="receive-products-table">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad enviada</th>
                    <th>Cantidad recibida</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedProducts.map((product, index) => (
                    <tr key={index} className={product.hasDiscrepancy ? 'has-discrepancy' : ''}>
                      <td>
                        <div className="product-info">
                          {product.productName || 'Producto desconocido'}
                        </div>
                      </td>
                      <td>
                        <strong>{product.quantity} {product.unit}</strong>
                      </td>
                      <td>
                        <div className="quantity-input-container">
                          <input
                            type="number"
                            className={`form-control quantity-input ${errors[product.productId] ? 'is-invalid' : ''}`}
                            value={product.quantityReceived || ''}
                            onChange={(e) => handleQuantityReceivedChange(product.productId, e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={submitting}
                          />
                          <span className="unit-label">{product.unit}</span>
                          {errors[product.productId] && (
                            <div className="invalid-feedback">{errors[product.productId]}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {product.hasDiscrepancy ? (
                          <span className="discrepancy-indicator">
                            <i className="fas fa-exclamation-triangle"></i> Diferencia
                          </span>
                        ) : (
                          <span className="match-indicator">
                            <i className="fas fa-check"></i> Coincide
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay productos para recibir.</p>
          )}
        </div>

        {/* Resumen de totales */}
        {receivedProducts.length > 0 && (
          <div className="totals-summary-section">
            <h3 className="section-title">Resumen</h3>
            
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">Total enviado</span>
                <span className="total-value">{totals.totalSent.toFixed(2)} unidades</span>
              </div>
              
              <div className="total-item">
                <span className="total-label">Total a recibir</span>
                <span className="total-value">{totals.totalReceived.toFixed(2)} unidades</span>
              </div>
              
              <div className="total-item">
                <span className="total-label">Diferencia</span>
                <span className={`total-value ${totals.totalReceived !== totals.totalSent ? 'has-difference' : ''}`}>
                  {(totals.totalReceived - totals.totalSent).toFixed(2)} unidades
                </span>
              </div>
            </div>
            
            {totals.hasDiscrepancies && (
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <strong>Hay diferencias en las cantidades:</strong> Algunos productos tienen cantidades 
                recibidas diferentes a las enviadas. Esto se registrará en el sistema.
              </div>
            )}
          </div>
        )}

        {/* Confirmación */}
        <div className="confirmation-section">
          <div className="confirmation-message">
            <div className="confirmation-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <div className="confirmation-content">
              <h4>¿Confirmar recepción?</h4>
              <p>
                Al confirmar, los productos se añadirán al inventario del almacén destino 
                y la transferencia se marcará como completada.
              </p>
            </div>
          </div>
        </div>

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
          className="btn btn-success"
          onClick={handleSubmit} 
          disabled={submitting || receivedProducts.length === 0}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              Procesando recepción...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i> Confirmar recepción
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReceiveTransferDialog;