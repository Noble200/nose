// src/components/panels/Transfers/TransferDialog.js - Diálogo para crear/editar transferencias
import React, { useState, useEffect } from 'react';

const TransferDialog = ({ 
  transfer, 
  warehouses, 
  products, 
  isNew, 
  onSave, 
  onClose 
}) => {
  // Estado inicial para el formulario
  const [formData, setFormData] = useState({
    transferNumber: '',
    sourceWarehouseId: '',
    targetWarehouseId: '',
    sourceWarehouse: {},
    targetWarehouse: {},
    products: [],
    distance: '',
    distanceUnit: 'km',
    transferCost: '',
    requestDate: '',
    notes: '',
    status: 'pending'
  });

  // Estados adicionales
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos de la transferencia si estamos editando
  useEffect(() => {
    if (!isNew && transfer) {
      setFormData({
        transferNumber: transfer.transferNumber || '',
        sourceWarehouseId: transfer.sourceWarehouseId || '',
        targetWarehouseId: transfer.targetWarehouseId || '',
        sourceWarehouse: transfer.sourceWarehouse || {},
        targetWarehouse: transfer.targetWarehouse || {},
        products: transfer.products || [],
        distance: transfer.distance || '',
        distanceUnit: transfer.distanceUnit || 'km',
        transferCost: transfer.transferCost || '',
        requestDate: formatDateForInput(transfer.requestDate),
        notes: transfer.notes || '',
        status: transfer.status || 'pending'
      });
    } else {
      // Nuevo transfer - establecer fecha actual
      setFormData(prev => ({
        ...prev,
        requestDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [transfer, isNew]);

  // Actualizar productos disponibles cuando cambia el almacén origen
  useEffect(() => {
    if (formData.sourceWarehouseId) {
      // Filtrar productos que estén en el almacén origen y tengan stock
      const productsInWarehouse = products.filter(product => 
        product.warehouseId === formData.sourceWarehouseId && 
        (product.stock || 0) > 0
      );
      
      setAvailableProducts(productsInWarehouse);
    } else {
      setAvailableProducts([]);
    }
  }, [formData.sourceWarehouseId, products]);

  // Formatear fecha para input de tipo date
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toISOString().split('T')[0];
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores al modificar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si cambia el almacén origen, actualizar referencia y limpiar productos
    if (name === 'sourceWarehouseId') {
      const selectedWarehouse = warehouses.find(w => w.id === value);
      
      setFormData(prev => ({
        ...prev,
        sourceWarehouse: selectedWarehouse ? {
          id: selectedWarehouse.id,
          name: selectedWarehouse.name
        } : {},
        products: [] // Limpiar productos seleccionados
      }));
    }
    
    // Si cambia el almacén destino, actualizar referencia
    if (name === 'targetWarehouseId') {
      const selectedWarehouse = warehouses.find(w => w.id === value);
      
      setFormData(prev => ({
        ...prev,
        targetWarehouse: selectedWarehouse ? {
          id: selectedWarehouse.id,
          name: selectedWarehouse.name
        } : {}
      }));
    }
  };

  // Añadir producto seleccionado
  const handleAddProduct = () => {
    if (!selectedProductId || !productQuantity || isNaN(Number(productQuantity)) || Number(productQuantity) <= 0) {
      setErrors(prev => ({ ...prev, productQuantity: 'Ingrese una cantidad válida' }));
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const quantity = Number(productQuantity);
    
    // Verificar stock disponible
    if (quantity > product.stock) {
      setErrors(prev => ({
        ...prev,
        productQuantity: `No hay suficiente stock. Disponible: ${product.stock} ${product.unit}`
      }));
      return;
    }
    
    // Verificar si el producto ya está añadido
    const existingIndex = formData.products.findIndex(p => p.productId === selectedProductId);
    
    const productData = {
      productId: selectedProductId,
      productName: product.name,
      quantity: quantity,
      unit: product.unit,
      availableStock: product.stock
    };
    
    if (existingIndex >= 0) {
      // Actualizar si ya existe
      const updatedProducts = [...formData.products];
      updatedProducts[existingIndex] = productData;
      
      setFormData(prev => ({
        ...prev,
        products: updatedProducts
      }));
    } else {
      // Añadir nuevo producto
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, productData]
      }));
    }
    
    // Limpiar selección
    setSelectedProductId('');
    setProductQuantity('');
    setErrors(prev => ({ ...prev, productQuantity: '' }));
    setProductSelectorOpen(false);
  };

  // Eliminar producto seleccionado
  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.productId !== productId)
    }));
  };

  // Calcular costo por unidad de distancia
  const calculateCostPerUnit = () => {
    const distance = Number(formData.distance) || 0;
    const cost = Number(formData.transferCost) || 0;
    
    if (distance > 0 && cost > 0) {
      return (cost / distance).toFixed(2);
    }
    
    return '0';
  };

  // Formatear costo
  const formatCost = (cost) => {
    if (!cost && cost !== 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cost);
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.sourceWarehouseId) {
      newErrors.sourceWarehouseId = 'Debe seleccionar el almacén origen';
    }
    
    if (!formData.targetWarehouseId) {
      newErrors.targetWarehouseId = 'Debe seleccionar el almacén destino';
    }
    
    // No pueden ser el mismo almacén
    if (formData.sourceWarehouseId && formData.targetWarehouseId && 
        formData.sourceWarehouseId === formData.targetWarehouseId) {
      newErrors.targetWarehouseId = 'El almacén destino debe ser diferente al origen';
    }
    
    if (!formData.requestDate) {
      newErrors.requestDate = 'La fecha de solicitud es obligatoria';
    }
    
    // Validar productos
    if (formData.products.length === 0) {
      newErrors.products = 'Debe seleccionar al menos un producto para transferir';
    }
    
    // Validar campos numéricos
    if (formData.distance && (isNaN(Number(formData.distance)) || Number(formData.distance) < 0)) {
      newErrors.distance = 'La distancia debe ser un número positivo';
    }
    
    if (formData.transferCost && (isNaN(Number(formData.transferCost)) || Number(formData.transferCost) < 0)) {
      newErrors.transferCost = 'El costo debe ser un número positivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true);
      
      try {
        // Preparar datos para enviar
        const transferData = {
          ...formData,
          // Convertir campos numéricos
          distance: formData.distance ? Number(formData.distance) : 0,
          transferCost: formData.transferCost ? Number(formData.transferCost) : 0
        };
        
        // Convertir fecha de solicitud
        if (formData.requestDate) {
          transferData.requestDate = new Date(formData.requestDate);
        }
        
        await onSave(transferData);
      } catch (error) {
        console.error('Error al guardar transferencia:', error);
        setErrors({ submit: error.message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="dialog transfer-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Nueva transferencia' : 'Editar transferencia'}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* Información general */}
            <div className="form-section">
              <h3 className="section-title">Información general</h3>
              
              <div className="form-grid">
                {/* Número de transferencia */}
                <div className="form-group">
                  <label htmlFor="transferNumber" className="form-label">Número de transferencia</label>
                  <input
                    type="text"
                    id="transferNumber"
                    name="transferNumber"
                    className="form-control"
                    value={formData.transferNumber}
                    onChange={handleChange}
                    placeholder="Se genera automáticamente"
                    disabled={submitting}
                  />
                </div>
                
                {/* Fecha de solicitud */}
                <div className="form-group">
                  <label htmlFor="requestDate" className="form-label required">Fecha de solicitud</label>
                  <input
                    type="date"
                    id="requestDate"
                    name="requestDate"
                    className={`form-control ${errors.requestDate ? 'is-invalid' : ''}`}
                    value={formData.requestDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.requestDate && <div className="invalid-feedback">{errors.requestDate}</div>}
                </div>
                
                {/* Estado */}
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Estado</label>
                  <select
                    id="status"
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                    <option value="shipped">Enviada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Almacenes */}
            <div className="form-section">
              <h3 className="section-title">Almacenes</h3>
              
              <div className="form-grid">
                {/* Almacén origen */}
                <div className="form-group">
                  <label htmlFor="sourceWarehouseId" className="form-label required">Almacén origen</label>
                  <select
                    id="sourceWarehouseId"
                    name="sourceWarehouseId"
                    className={`form-control ${errors.sourceWarehouseId ? 'is-invalid' : ''}`}
                    value={formData.sourceWarehouseId}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar almacén origen</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.location && `- ${warehouse.location}`}
                      </option>
                    ))}
                  </select>
                  {errors.sourceWarehouseId && <div className="invalid-feedback">{errors.sourceWarehouseId}</div>}
                </div>
                
                {/* Almacén destino */}
                <div className="form-group">
                  <label htmlFor="targetWarehouseId" className="form-label required">Almacén destino</label>
                  <select
                    id="targetWarehouseId"
                    name="targetWarehouseId"
                    className={`form-control ${errors.targetWarehouseId ? 'is-invalid' : ''}`}
                    value={formData.targetWarehouseId}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar almacén destino</option>
                    {warehouses.filter(w => w.id !== formData.sourceWarehouseId).map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.location && `- ${warehouse.location}`}
                      </option>
                    ))}
                  </select>
                  {errors.targetWarehouseId && <div className="invalid-feedback">{errors.targetWarehouseId}</div>}
                </div>
              </div>
            </div>
            
            {/* Productos a transferir */}
            <div className="form-section">
              <div className="products-section-header">
                <h3 className="section-title">Productos a transferir</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setProductSelectorOpen(true)}
                  disabled={submitting || !formData.sourceWarehouseId}
                >
                  <i className="fas fa-plus"></i> Añadir producto
                </button>
              </div>
              
              {!formData.sourceWarehouseId && (
                <p className="help-text">
                  Seleccione primero un almacén origen para ver los productos disponibles.
                </p>
              )}
              
              {errors.products && <div className="invalid-feedback">{errors.products}</div>}
              
              {formData.products.length > 0 ? (
                <div className="selected-products-list">
                  {formData.products.map((selectedProduct, index) => (
                    <div key={index} className="selected-product-item">
                      <div className="product-info">
                        <span className="product-name">{selectedProduct.productName}</span>
                        <span className="product-stock">
                          Stock disponible: {selectedProduct.availableStock} {selectedProduct.unit}
                        </span>
                      </div>
                      
                      <div className="product-quantity">
                        <span>Cantidad: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong></span>
                        <button
                          type="button"
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => handleRemoveProduct(selectedProduct.productId)}
                          disabled={submitting}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-products-message">
                  No hay productos seleccionados. Añada al menos un producto para transferir.
                </div>
              )}
            </div>
            
            {/* Distancia y costo */}
            <div className="form-section">
              <h3 className="section-title">Distancia y costo de transferencia</h3>
              
              <div className="form-grid">
                {/* Distancia */}
                <div className="form-group">
                  <label htmlFor="distance" className="form-label">Distancia</label>
                  <div className="form-row">
                    <div className="form-col" style={{ flex: 2 }}>
                      <input
                        type="number"
                        id="distance"
                        name="distance"
                        className={`form-control ${errors.distance ? 'is-invalid' : ''}`}
                        value={formData.distance}
                        onChange={handleChange}
                        placeholder="Distancia entre almacenes"
                        min="0"
                        step="0.1"
                        disabled={submitting}
                      />
                      {errors.distance && <div className="invalid-feedback">{errors.distance}</div>}
                    </div>
                    <div className="form-col" style={{ flex: 1 }}>
                      <select
                        id="distanceUnit"
                        name="distanceUnit"
                        className="form-control"
                        value={formData.distanceUnit}
                        onChange={handleChange}
                        style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                        disabled={submitting}
                      >
                        <option value="km">km</option>
                        <option value="m">m</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Costo de transferencia */}
                <div className="form-group">
                  <label htmlFor="transferCost" className="form-label">Costo de transferencia</label>
                  <input
                    type="number"
                    id="transferCost"
                    name="transferCost"
                    className={`form-control ${errors.transferCost ? 'is-invalid' : ''}`}
                    value={formData.transferCost}
                    onChange={handleChange}
                    placeholder="Costo total en pesos"
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                  {errors.transferCost && <div className="invalid-feedback">{errors.transferCost}</div>}
                </div>
              </div>
              
              {/* Mostrar cálculo de costo por unidad */}
              {formData.distance && formData.transferCost && (
                <div className="cost-calculation">
                  <div className="calculation-result">
                    <span className="calculation-label">Costo por {formData.distanceUnit}:</span>
                    <span className="calculation-value">
                      {formatCost(calculateCostPerUnit())} / {formData.distanceUnit}
                    </span>
                  </div>
                  <div className="calculation-breakdown">
                    <small>
                      {formatCost(formData.transferCost)} ÷ {formData.distance} {formData.distanceUnit} = {formatCost(calculateCostPerUnit())}/{formData.distanceUnit}
                    </small>
                  </div>
                </div>
              )}
            </div>
            
            {/* Notas */}
            <div className="form-section">
              <h3 className="section-title">Notas adicionales</h3>
              
              <div className="form-group">
                <textarea
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observaciones o instrucciones especiales para la transferencia"
                  rows={4}
                  disabled={submitting}
                ></textarea>
              </div>
            </div>
            
            {/* Mensaje de error global */}
            {errors.submit && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i> {errors.submit}
              </div>
            )}
          </div>
        </form>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              {isNew ? 'Creando...' : 'Guardando...'}
            </>
          ) : (
            isNew ? 'Crear transferencia' : 'Guardar cambios'
          )}
        </button>
      </div>
      
      {/* Selector de productos */}
      {productSelectorOpen && (
        <div className="product-selector-modal">
          <div className="product-selector-content">
            <div className="product-selector-header">
              <h3>Seleccionar producto para transferir</h3>
              <button 
                className="dialog-close" 
                onClick={() => setProductSelectorOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="product-selector-body">
              <div className="form-group">
                <label>Producto:</label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                >
                  <option value="">Seleccionar un producto</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.stock} {product.unit}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProductId && (
                <div className="quantity-input">
                  <div className="form-group">
                    <label>Cantidad a transferir:</label>
                    <input
                      type="number"
                      className={`form-control ${errors.productQuantity ? 'is-invalid' : ''}`}
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder="Cantidad"
                    />
                    {errors.productQuantity && (
                      <div className="invalid-feedback">{errors.productQuantity}</div>
                    )}
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddProduct}
                    disabled={!selectedProductId || !productQuantity}
                  >
                    Añadir producto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDialog;