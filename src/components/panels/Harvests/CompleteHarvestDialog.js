// src/components/panels/Harvests/CompleteHarvestDialog.js
import React, { useState, useEffect } from 'react';

const CompleteHarvestDialog = ({ 
  harvest, 
  fields, 
  products, 
  warehouses, 
  onSubmit, 
  onClose 
}) => {
  // Estado para el formulario
  const [formData, setFormData] = useState({
    harvestDate: '',
    actualYield: '',
    totalHarvested: '',
    totalHarvestedUnit: 'kg',
    destination: '',
    qualityResults: [],
    harvestNotes: '',
    productsHarvested: []
  });

  // Estados adicionales
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    category: 'insumo',
    warehouseId: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Inicializar calidad con parámetros existentes
  useEffect(() => {
    if (harvest.qualityParameters && harvest.qualityParameters.length > 0) {
      setFormData(prev => ({
        ...prev,
        qualityResults: Array(harvest.qualityParameters.length).fill('')
      }));
    }
    
    // Inicializar con valores predeterminados
    setFormData(prev => ({
      ...prev,
      harvestDate: new Date().toISOString().split('T')[0],
      warehouseId: harvest.targetWarehouse || ''
    }));
  }, [harvest]);

  // Formatear fecha para input de tipo date
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toISOString().split('T')[0];
  };

  // Manejar cambios en el formulario principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores al modificar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en los resultados de calidad
  const handleQualityChange = (index, value) => {
    const updatedResults = [...formData.qualityResults];
    updatedResults[index] = value;
    
    setFormData(prev => ({
      ...prev,
      qualityResults: updatedResults
    }));
  };

  // Manejar cambios en el formulario de nuevo producto
  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores al modificar el campo
    if (errors[`product_${name}`]) {
      setErrors(prev => ({ ...prev, [`product_${name}`]: '' }));
    }
    
    setNewProductForm(prev => ({ ...prev, [name]: value }));
  };

  // Añadir nuevo producto cosechado
  const handleAddProduct = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!newProductForm.name.trim()) {
      newErrors.product_name = 'El nombre es obligatorio';
    }
    
    if (!newProductForm.quantity || isNaN(Number(newProductForm.quantity)) || Number(newProductForm.quantity) <= 0) {
      newErrors.product_quantity = 'La cantidad debe ser un número positivo';
    }
    
    if (!newProductForm.warehouseId) {
      newErrors.product_warehouseId = 'Debe seleccionar un almacén';
    }
    
    // Si hay errores, no continuar
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    // Añadir producto a la lista
    const newProduct = {
      name: newProductForm.name,
      quantity: Number(newProductForm.quantity),
      unit: newProductForm.unit,
      category: newProductForm.category,
      warehouseId: newProductForm.warehouseId
    };
    
    setFormData(prev => ({
      ...prev,
      productsHarvested: [...prev.productsHarvested, newProduct]
    }));
    
    // Limpiar formulario
    setNewProductForm({
      name: '',
      quantity: '',
      unit: 'kg',
      category: 'insumo',
      warehouseId: newProductForm.warehouseId // Mantener el último almacén seleccionado
    });
  };

  // Eliminar producto de la lista
  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      productsHarvested: prev.productsHarvested.filter((_, i) => i !== index)
    }));
  };

  // Calcular total cosechado
  const calculateTotalHarvested = () => {
    if (!formData.actualYield || !harvest.totalArea) return '';
    
    const total = Number(formData.actualYield) * Number(harvest.totalArea);
    return total.toFixed(2);
  };

  // Actualizar total cosechado cuando cambia el rendimiento
  useEffect(() => {
    const calculatedTotal = calculateTotalHarvested();
    if (calculatedTotal) {
      setFormData(prev => ({
        ...prev,
        totalHarvested: calculatedTotal
      }));
    }
  }, [formData.actualYield]);

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.harvestDate) {
      newErrors.harvestDate = 'La fecha de cosecha es obligatoria';
    }
    
    if (!formData.actualYield || isNaN(Number(formData.actualYield)) || Number(formData.actualYield) <= 0) {
      newErrors.actualYield = 'El rendimiento real debe ser un número positivo';
    }
    
    if (!formData.totalHarvested || isNaN(Number(formData.totalHarvested)) || Number(formData.totalHarvested) <= 0) {
      newErrors.totalHarvested = 'El total cosechado debe ser un número positivo';
    }
    
    // Verificar que haya al menos un producto cosechado
    if (formData.productsHarvested.length === 0) {
      newErrors.productsHarvested = 'Debe añadir al menos un producto cosechado';
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
        // Preparar datos para completar la cosecha
        const harvestData = {
          ...formData,
          actualYield: Number(formData.actualYield),
          totalHarvested: Number(formData.totalHarvested),
          status: 'completed',
          harvestDate: new Date(formData.harvestDate)
        };
        
        await onSubmit(harvestData);
      } catch (error) {
        console.error('Error al completar cosecha:', error);
        setErrors({ submit: error.message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Obtener el nombre del campo
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

  // Obtener productos seleccionados con nombres completos
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

  return (
    <div className="dialog complete-harvest-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">Completar cosecha</h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <form onSubmit={handleSubmit}>
          {/* Resumen de la cosecha */}
          <div className="harvest-info-summary">
            <div className="info-item">
              <span className="info-label">Cultivo:</span>
              <span className="info-value">{harvest.crop}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Campo:</span>
              <span className="info-value">{getFieldName()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Superficie:</span>
              <span className="info-value">{harvest.totalArea} {harvest.areaUnit || 'ha'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estimado:</span>
              <span className="info-value">
                {harvest.estimatedYield ? `${harvest.estimatedYield} ${harvest.yieldUnit || 'kg/ha'}` : '-'}
              </span>
            </div>
          </div>
          
          <div className="form-sections">
            {/* Resultados de cosecha */}
            <div className="form-section">
              <h3 className="section-title">Resultados de cosecha</h3>
              
              <div className="form-grid">
                {/* Fecha de cosecha */}
                <div className="form-group">
                  <label htmlFor="harvestDate" className="form-label required">Fecha de cosecha</label>
                  <input
                    type="date"
                    id="harvestDate"
                    name="harvestDate"
                    className={`form-control ${errors.harvestDate ? 'is-invalid' : ''}`}
                    value={formData.harvestDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.harvestDate && <div className="invalid-feedback">{errors.harvestDate}</div>}
                </div>
                
                {/* Rendimiento real */}
                <div className="form-group">
                  <label htmlFor="actualYield" className="form-label required">Rendimiento real</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="actualYield"
                      name="actualYield"
                      className={`form-control ${errors.actualYield ? 'is-invalid' : ''}`}
                      value={formData.actualYield}
                      onChange={handleChange}
                      placeholder="Rendimiento real"
                      min="0.01"
                      step="0.01"
                      disabled={submitting}
                    />
                    <select
                      name="yieldUnit"
                      className="form-control"
                      value={formData.yieldUnit || harvest.yieldUnit || 'kg/ha'}
                      onChange={handleChange}
                      style={{ width: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={submitting}
                    >
                      <option value="kg/ha">kg/ha</option>
                      <option value="ton/ha">ton/ha</option>
                      <option value="qq/ha">qq/ha</option>
                    </select>
                  </div>
                  {errors.actualYield && <div className="invalid-feedback">{errors.actualYield}</div>}
                </div>
                
                {/* Total cosechado */}
                <div className="form-group">
                  <label htmlFor="totalHarvested" className="form-label required">Total cosechado</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="totalHarvested"
                      name="totalHarvested"
                      className={`form-control ${errors.totalHarvested ? 'is-invalid' : ''}`}
                      value={formData.totalHarvested}
                      onChange={handleChange}
                      placeholder="Total cosechado"
                      min="0.01"
                      step="0.01"
                      disabled={submitting}
                    />
                    <select
                      name="totalHarvestedUnit"
                      className="form-control"
                      value={formData.totalHarvestedUnit}
                      onChange={handleChange}
                      style={{ width: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={submitting}
                    >
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="qq">qq</option>
                    </select>
                  </div>
                  {errors.totalHarvested && <div className="invalid-feedback">{errors.totalHarvested}</div>}
                  <span className="form-text">
                    Calculado automáticamente como rendimiento × superficie.
                  </span>
                </div>
                
                {/* Destino final */}
                <div className="form-group">
                  <label htmlFor="destination" className="form-label">Destino final</label>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    className="form-control"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="Ej: Venta, Almacenamiento, Procesamiento"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            
            {/* Productos cosechados */}
            <div className="form-section">
              <h3 className="section-title">Productos cosechados</h3>
              
              <p className="help-text">
                Registre los productos que se han obtenido de la cosecha para añadirlos al inventario.
              </p>
              
              {errors.productsHarvested && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i> {errors.productsHarvested}
                </div>
              )}
              
              {/* Formulario de nuevo producto */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="product_name" className="form-label required">Nombre del producto</label>
                  <input
                    type="text"
                    id="product_name"
                    name="name"
                    className={`form-control ${errors.product_name ? 'is-invalid' : ''}`}
                    value={newProductForm.name}
                    onChange={handleNewProductChange}
                    placeholder="Nombre del producto cosechado"
                    disabled={submitting}
                  />
                  {errors.product_name && <div className="invalid-feedback">{errors.product_name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="product_quantity" className="form-label required">Cantidad</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="product_quantity"
                      name="quantity"
                      className={`form-control ${errors.product_quantity ? 'is-invalid' : ''}`}
                      value={newProductForm.quantity}
                      onChange={handleNewProductChange}
                      placeholder="Cantidad"
                      min="0.01"
                      step="0.01"
                      disabled={submitting}
                    />
                    <select
                      name="unit"
                      className="form-control"
                      value={newProductForm.unit}
                      onChange={handleNewProductChange}
                      style={{ width: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={submitting}
                    >
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="unidad">unidad</option>
                      <option value="L">L</option>
                      <option value="m³">m³</option>
                    </select>
                  </div>
                  {errors.product_quantity && <div className="invalid-feedback">{errors.product_quantity}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="product_category" className="form-label">Categoría</label>
                  <select
                    id="product_category"
                    name="category"
                    className="form-control"
                    value={newProductForm.category}
                    onChange={handleNewProductChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="insumo">Insumo</option>
                    <option value="semilla">Semilla</option>
                    <option value="fertilizante">Fertilizante</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="product_warehouseId" className="form-label required">Almacén de destino</label>
                  <select
                    id="product_warehouseId"
                    name="warehouseId"
                    className={`form-control ${errors.product_warehouseId ? 'is-invalid' : ''}`}
                    value={newProductForm.warehouseId}
                    onChange={handleNewProductChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar almacén</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.product_warehouseId && <div className="invalid-feedback">{errors.product_warehouseId}</div>}
                </div>
              </div>
              
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddProduct}
                  disabled={submitting}
                >
                  <i className="fas fa-plus"></i> Añadir producto al inventario
                </button>
              </div>
              
              {/* Lista de productos añadidos */}
              {formData.productsHarvested.length > 0 ? (
                <div className="products-list-summary">
                  <h4>Productos a añadir al inventario:</h4>
                  
                  {formData.productsHarvested.map((product, index) => (
                    <div key={index} className="product-summary-item">
                      <div className="product-info">
                        <strong>{product.name}</strong> ({product.quantity} {product.unit})
                      </div>
                      <div className="product-status">
                        <span>
                          {(() => {
                            const warehouse = warehouses.find(w => w.id === product.warehouseId);
                            return warehouse ? `Almacén: ${warehouse.name}` : 'Almacén no especificado';
                          })()}
                        </span>
                        <button
                          type="button"
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => handleRemoveProduct(index)}
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
                  No hay productos añadidos. Añada al menos un producto cosechado para continuar.
                </div>
              )}
            </div>
            
            {/* Resultados de calidad */}
            {harvest.qualityParameters && harvest.qualityParameters.length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Resultados de calidad</h3>
                
                <div className="quality-results-grid">
                  {harvest.qualityParameters.map((param, index) => (
                    <div key={index} className="form-group">
                      <label htmlFor={`quality-${index}`} className="form-label">{param}</label>
                      <input
                        type="text"
                        id={`quality-${index}`}
                        className="form-control"
                        value={formData.qualityResults[index] || ''}
                        onChange={(e) => handleQualityChange(index, e.target.value)}
                        placeholder="Resultado"
                        disabled={submitting}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notas de cosecha */}
            <div className="form-section">
              <h3 className="section-title">Notas de cosecha</h3>
              
              <div className="form-group">
                <textarea
                  name="harvestNotes"
                  className="form-control"
                  value={formData.harvestNotes}
                  onChange={handleChange}
                  placeholder="Observaciones sobre la cosecha"
                  rows={4}
                  disabled={submitting}
                ></textarea>
              </div>
            </div>
            
            {/* Productos usados en la siembra */}
            {getSelectedProducts().length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Productos utilizados en la siembra</h3>
                
                <div className="products-summary">
                  <div className="products-list-summary">
                    {getSelectedProducts().map((product, index) => (
                      <div key={index} className="product-summary-item">
                        <div className="product-info">
                          <strong>{product.name}</strong>
                        </div>
                        <div className="product-status">
                          <span>Cantidad utilizada: <strong>{product.quantity} {product.unit}</strong></span>
                          <i className="fas fa-check text-success"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
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
              Completando cosecha...
            </>
          ) : 'Completar cosecha'}
        </button>
      </div>
    </div>
  );
};

export default CompleteHarvestDialog;