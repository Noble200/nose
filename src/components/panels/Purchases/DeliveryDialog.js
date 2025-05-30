// src/components/panels/Purchases/DeliveryDialog.js - Diálogo para crear entregas - CORREGIDO
import React, { useState, useEffect } from 'react';

const DeliveryDialog = ({
  purchase,
  warehouses,
  onSave,
  onClose
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    warehouseId: '',
    warehouseName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    products: [],
    freight: '', // CORREGIDO: string vacío en lugar de 0
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CORREGIDO: Función para convertir string a número de forma segura
  const parseNumberValue = (value) => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Inicializar productos disponibles para entrega
  useEffect(() => {
    if (purchase && purchase.products) {
      // Calcular cantidades ya entregadas por producto
      const deliveredQuantities = {};
      
      if (purchase.deliveries) {
        purchase.deliveries.forEach(delivery => {
          if (delivery.status === 'completed' || delivery.status === 'in_transit') {
            delivery.products.forEach(product => {
              const key = product.productId || product.id || product.name;
              deliveredQuantities[key] = (deliveredQuantities[key] || 0) + product.quantity;
            });
          }
        });
      }
      
      // Crear lista de productos con cantidades pendientes
      const availableProducts = purchase.products.map(product => {
        const key = product.id || product.name;
        const delivered = deliveredQuantities[key] || 0;
        const pending = product.quantity - delivered;
        
        return {
          ...product,
          productId: product.id || product.name,
          originalQuantity: product.quantity,
          deliveredQuantity: delivered,
          pendingQuantity: Math.max(0, pending),
          selectedQuantity: '' // CORREGIDO: string vacío en lugar de 0
        };
      }).filter(product => product.pendingQuantity > 0);
      
      setFormData(prev => ({
        ...prev,
        products: availableProducts
      }));
    }
  }, [purchase]);

  // Manejar cambios en el formulario - CORREGIDO
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'warehouseId') {
      const selectedWarehouse = warehouses.find(w => w.id === value);
      setFormData(prev => ({
        ...prev,
        warehouseId: value,
        warehouseName: selectedWarehouse ? selectedWarehouse.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value // CORREGIDO: mantener como string para campos numéricos
      }));
    }
  };

  // Manejar cambios en cantidades de productos - CORREGIDO
  const handleProductQuantityChange = (index, quantity) => {
    const maxQuantity = formData.products[index].pendingQuantity;
    
    // Si está vacío, permitir string vacío
    if (quantity === '') {
      setFormData(prev => ({
        ...prev,
        products: prev.products.map((product, i) => 
          i === index 
            ? { ...product, selectedQuantity: '' }
            : product
        )
      }));
      return;
    }
    
    // Si no está vacío, parsearlo y limitar
    const numQuantity = parseNumberValue(quantity);
    const finalQuantity = Math.min(numQuantity, maxQuantity);
    
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index 
          ? { ...product, selectedQuantity: finalQuantity.toString() }
          : product
      )
    }));
  };

  // Seleccionar/deseleccionar todos los productos - CORREGIDO
  const handleSelectAll = (selectAll) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(product => ({
        ...product,
        selectedQuantity: selectAll ? product.pendingQuantity.toString() : ''
      }))
    }));
  };

  // Obtener productos seleccionados para la entrega - CORREGIDO
  const getSelectedProducts = () => {
    return formData.products
      .filter(product => {
        const quantity = parseNumberValue(product.selectedQuantity);
        return quantity > 0;
      })
      .map(product => ({
        productId: product.productId,
        name: product.name,
        category: product.category,
        unit: product.unit,
        quantity: parseNumberValue(product.selectedQuantity),
        unitCost: product.unitCost
      }));
  };

  // Calcular totales - CORREGIDO
  const calculateTotals = () => {
    const selectedProducts = getSelectedProducts();
    const totalProducts = selectedProducts.length;
    const totalQuantity = selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
    const totalValue = selectedProducts.reduce((sum, product) => sum + (product.quantity * product.unitCost), 0);
    const freight = parseNumberValue(formData.freight);
    
    return { 
      totalProducts, 
      totalQuantity, 
      totalValue,
      totalWithFreight: totalValue + freight 
    };
  };

  // Manejar envío del formulario - CORREGIDO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (!formData.warehouseId) {
      setError('Debe seleccionar un almacén de destino');
      return;
    }
    
    if (!formData.deliveryDate) {
      setError('La fecha de entrega es obligatoria');
      return;
    }
    
    const selectedProducts = getSelectedProducts();
    if (selectedProducts.length === 0) {
      setError('Debe seleccionar al menos un producto para entregar');
      return;
    }

    try {
      setLoading(true);
      
      const deliveryData = {
        warehouseId: formData.warehouseId,
        warehouseName: formData.warehouseName,
        deliveryDate: new Date(formData.deliveryDate),
        products: selectedProducts,
        freight: parseNumberValue(formData.freight), // CORREGIDO: convertir a número
        notes: formData.notes
      };
      
      await onSave(deliveryData);
    } catch (err) {
      setError('Error al crear la entrega: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totals = calculateTotals();

  return (
    <div className="dialog-content">
      <div className="dialog-header">
        <h2 className="dialog-title">
          Nueva Entrega - {purchase.purchaseNumber || `Compra ${purchase.id.substring(0, 8)}`}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dialog-body">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Información básica */}
        <div className="form-section">
          <h3 className="section-title">Información de la Entrega</h3>
          
          <div className="form-row">
            <div className="form-col">
              <label htmlFor="warehouseId" className="form-label required">
                Almacén de Destino
              </label>
              <select
                id="warehouseId"
                name="warehouseId"
                className="form-control"
                value={formData.warehouseId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar almacén...</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location || 'Sin ubicación'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-col">
              <label htmlFor="deliveryDate" className="form-label required">
                Fecha de Entrega
              </label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                className="form-control"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label htmlFor="freight" className="form-label">
                Costo de Flete ($)
              </label>
              <input
                type="number"
                id="freight"
                name="freight"
                className="form-control"
                value={formData.freight}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Productos disponibles */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">Productos a Entregar</h3>
            <div className="section-actions">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleSelectAll(true)}
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleSelectAll(false)}
              >
                Deseleccionar todo
              </button>
            </div>
          </div>
          
          {formData.products.length > 0 ? (
            <div className="products-delivery-list">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Comprado</th>
                    <th>Entregado</th>
                    <th>Pendiente</th>
                    <th>A Entregar</th>
                    <th>Costo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-category">{product.category}</div>
                        </div>
                      </td>
                      <td>{product.originalQuantity} {product.unit}</td>
                      <td>{product.deliveredQuantity} {product.unit}</td>
                      <td>
                        <span className="pending-quantity">
                          {product.pendingQuantity} {product.unit}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={product.selectedQuantity}
                          onChange={(e) => handleProductQuantityChange(index, e.target.value)}
                          min="0"
                          max={product.pendingQuantity}
                          step="0.01"
                          style={{ width: '120px' }}
                          placeholder="0"
                        />
                      </td>
                      <td>{formatCurrency(product.unitCost)}                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-products">
              <i className="fas fa-box-open"></i>
              <p>No hay productos pendientes de entrega</p>
            </div>
          )}
        </div>

        {/* Resumen de entrega */}
        {totals.totalProducts > 0 && (
          <div className="form-section">
            <h3 className="section-title">Resumen de Entrega</h3>
            
            <div className="delivery-summary">
              <div className="summary-row">
                <span>Productos seleccionados:</span>
                <span>{totals.totalProducts}</span>
              </div>
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
                <span>{formatCurrency(parseNumberValue(formData.freight))}</span>
              </div>
              <div className="summary-row total">
                <span>Total de entrega:</span>
                <span>{formatCurrency(totals.totalWithFreight)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notas de la Entrega
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre la entrega, instrucciones especiales, etc."
            />
          </div>
        </div>
      </form>

      <div className="dialog-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || totals.totalProducts === 0}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              Creando entrega...
            </>
          ) : (
            <>
              <i className="fas fa-truck"></i>
              Crear Entrega
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeliveryDialog;