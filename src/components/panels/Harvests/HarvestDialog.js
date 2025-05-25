// src/components/panels/Harvests/HarvestDialog.js
import React, { useState, useEffect } from 'react';

const HarvestDialog = ({ 
  harvest, 
  field,
  selectedLots,
  fields, 
  products, 
  warehouses, 
  isNew, 
  onSave, 
  onClose 
}) => {
  // Estado para el formulario
  const [formData, setFormData] = useState({
    crop: '',
    field: null,
    fieldId: '',
    lots: [],
    totalArea: '',
    areaUnit: 'ha',
    plannedDate: '',
    status: 'pending',
    estimatedYield: '',
    yieldUnit: 'kg/ha',
    harvestMethod: '',
    machinery: [],
    workers: '',
    targetWarehouse: '',
    qualityParameters: [],
    notes: '',
    selectedProducts: []
  });

  // Estados adicionales
  const [availableLots, setAvailableLots] = useState([]);
  const [selectableProducts, setSelectableProducts] = useState([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [machineryInput, setMachineryInput] = useState('');
  const [parameterInput, setParameterInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos de la cosecha si estamos editando
  useEffect(() => {
    if (!isNew && harvest) {
      setFormData({
        crop: harvest.crop || '',
        field: harvest.field || null,
        fieldId: harvest.fieldId || '',
        lots: harvest.lots || [],
        totalArea: harvest.totalArea || '',
        areaUnit: harvest.areaUnit || 'ha',
        plannedDate: formatDateForInput(harvest.plannedDate),
        status: harvest.status || 'pending',
        estimatedYield: harvest.estimatedYield || '',
        yieldUnit: harvest.yieldUnit || 'kg/ha',
        harvestMethod: harvest.harvestMethod || '',
        machinery: harvest.machinery || [],
        workers: harvest.workers || '',
        targetWarehouse: harvest.targetWarehouse || '',
        qualityParameters: harvest.qualityParameters || [],
        notes: harvest.notes || '',
        selectedProducts: harvest.selectedProducts || []
      });
      
      // Cargar lotes si hay campo seleccionado
      if (harvest.fieldId) {
        const field = fields.find(f => f.id === harvest.fieldId);
        if (field && field.lots) {
          setAvailableLots(field.lots);
        }
      }
    } else if (field) {
      // Si se proporciona un campo predeterminado (por ejemplo, al crear desde la vista de campos)
      setFormData(prev => ({
        ...prev,
        field: {
          id: field.id,
          name: field.name
        },
        fieldId: field.id,
        lots: selectedLots || []
      }));
      
      if (field.lots) {
        setAvailableLots(field.lots);
      }
    }
  }, [harvest, isNew, field, selectedLots, fields]);

  // Cargar productos sembrables (semillas, insumos)
  useEffect(() => {
    // Filtrar productos que pueden usarse para siembra (semillas, insumos agrícolas)
    const validProducts = products.filter(product => 
      product.category === 'semilla' || 
      product.category === 'insumo' || 
      product.category === 'fertilizante'
    );
    
    setSelectableProducts(validProducts);
  }, [products]);

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
    
    // Si cambia el campo, actualizar lotes disponibles
    if (name === 'fieldId') {
      const selectedField = fields.find(f => f.id === value);
      
      if (selectedField) {
        setFormData(prev => ({
          ...prev,
          field: {
            id: selectedField.id,
            name: selectedField.name
          },
          fieldId: selectedField.id,
          lots: [] // Resetear lotes seleccionados
        }));
        
        if (selectedField.lots) {
          setAvailableLots(selectedField.lots);
        } else {
          setAvailableLots([]);
        }
      } else {
        setFormData(prev => ({
          ...prev,
          field: null,
          fieldId: '',
          lots: []
        }));
        setAvailableLots([]);
      }
    }
  };

  // Manejar selección de lotes
  const handleLotChange = (e, lotId) => {
    const checked = e.target.checked;
    let updatedLots;
    
    if (checked) {
      // Añadir lote si no está ya seleccionado
      const lot = availableLots.find(l => l.id === lotId);
      if (lot) {
        updatedLots = [...formData.lots, lot];
      } else {
        updatedLots = formData.lots;
      }
    } else {
      // Eliminar lote
      updatedLots = formData.lots.filter(l => l.id !== lotId);
    }
    
    // Calcular área total de los lotes seleccionados
    const totalArea = updatedLots.reduce((total, lot) => {
      let area = lot.area || 0;
      // Convertir a hectáreas si es necesario
      if (lot.areaUnit === 'm²') {
        area = area / 10000; // 10000 m² = 1 ha
      } else if (lot.areaUnit === 'acre') {
        area = area * 0.404686; // 1 acre = 0.404686 ha
      }
      return total + area;
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      lots: updatedLots,
      totalArea: totalArea.toFixed(2)
    }));
  };

  // Añadir maquinaria
  const handleAddMachinery = () => {
    if (machineryInput.trim()) {
      setFormData(prev => ({
        ...prev,
        machinery: [...prev.machinery, machineryInput.trim()]
      }));
      setMachineryInput('');
    }
  };

  // Eliminar maquinaria
  const handleRemoveMachinery = (index) => {
    setFormData(prev => ({
      ...prev,
      machinery: prev.machinery.filter((_, i) => i !== index)
    }));
  };

  // Añadir parámetro de calidad
  const handleAddParameter = () => {
    if (parameterInput.trim()) {
      setFormData(prev => ({
        ...prev,
        qualityParameters: [...prev.qualityParameters, parameterInput.trim()]
      }));
      setParameterInput('');
    }
  };

  // Eliminar parámetro de calidad
  const handleRemoveParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      qualityParameters: prev.qualityParameters.filter((_, i) => i !== index)
    }));
  };

  // Manejar entrada de tecla en inputs
  const handleKeyDown = (e, actionFn) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      actionFn();
    }
  };

  // Añadir producto seleccionado
  const handleAddProduct = () => {
    if (!selectedProductId || !productQuantity || isNaN(Number(productQuantity)) || Number(productQuantity) <= 0) {
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    // Verificar que hay suficiente stock
    if (Number(productQuantity) > product.stock) {
      setErrors(prev => ({
        ...prev,
        productQuantity: `No hay suficiente stock. Disponible: ${product.stock} ${product.unit}`
      }));
      return;
    }
    
    // Verificar si el producto ya está añadido
    const existingIndex = formData.selectedProducts.findIndex(p => p.productId === selectedProductId);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedProducts = [...formData.selectedProducts];
      updatedProducts[existingIndex].quantity = Number(productQuantity);
      
      setFormData(prev => ({
        ...prev,
        selectedProducts: updatedProducts
      }));
    } else {
      // Añadir nuevo producto
      setFormData(prev => ({
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          {
            productId: selectedProductId,
            quantity: Number(productQuantity)
          }
        ]
      }));
    }
    
    // Limpiar selección
    setSelectedProductId('');
    setProductQuantity('');
    setErrors(prev => ({ ...prev, productQuantity: '' }));
  };

  // Eliminar producto seleccionado
  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId)
    }));
  };

  // Obtener nombre del producto
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Producto desconocido';
  };

  // Obtener unidad del producto
  const getProductUnit = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.unit : '';
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.crop.trim()) {
      newErrors.crop = 'El cultivo es obligatorio';
    }
    
    if (!formData.fieldId) {
      newErrors.fieldId = 'Debe seleccionar un campo';
    }
    
    if (formData.lots.length === 0) {
      newErrors.lots = 'Debe seleccionar al menos un lote';
    }
    
    if (!formData.plannedDate) {
      newErrors.plannedDate = 'La fecha planificada es obligatoria';
    }
    
    if (!formData.targetWarehouse) {
      newErrors.targetWarehouse = 'Debe seleccionar un almacén de destino';
    }
    
    // Validar campos numéricos
    if (formData.estimatedYield && (isNaN(Number(formData.estimatedYield)) || Number(formData.estimatedYield) < 0)) {
      newErrors.estimatedYield = 'El rendimiento estimado debe ser un número positivo';
    }
    
    // Validar selección de productos
    if (formData.selectedProducts.length === 0) {
      newErrors.selectedProducts = 'Debe seleccionar al menos un producto para la siembra';
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
        // Crear copia para enviar
        const harvestData = {
          ...formData,
          // Convertir campos numéricos
          estimatedYield: formData.estimatedYield ? Number(formData.estimatedYield) : null,
          totalArea: formData.totalArea ? Number(formData.totalArea) : 0,
          // Añadir datos para actualizar stock
          productsToHarvest: formData.selectedProducts.map(p => ({
            id: p.productId,
            quantityToHarvest: p.quantity
          }))
        };
        
        // Convertir fecha de planificación
        if (formData.plannedDate) {
          harvestData.plannedDate = new Date(formData.plannedDate);
        }
        
        await onSave(harvestData);
      } catch (error) {
        console.error('Error al guardar cosecha:', error);
        setErrors({ submit: error.message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Renderizar contenido del selector de productos
  const renderProductSelectorContent = () => {
    const filteredProducts = selectableProducts.filter(product => 
      // Filtrar productos con stock > 0
      (product.stock > 0) &&
      // Filtrar por nombre si hay término de búsqueda
      (product.name.toLowerCase().includes(selectedProductId.toLowerCase()))
    );
    
    return (
      <div className="product-selector-modal">
        <div className="product-selector-content">
          <div className="product-selector-header">
            <h3>Seleccionar producto para siembra</h3>
            <button 
              className="dialog-close" 
              onClick={() => setProductSelectorOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="product-selector-body">
            <div className="form-group">
              <select
                className="form-control"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Seleccionar un producto</option>
                {filteredProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Stock: {product.stock} {product.unit}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProductId && (
              <div className="form-group mt-2">
                <label>Cantidad para utilizar:</label>
                <div className="input-group">
                  <input
                    type="number"
                    className={`form-control ${errors.productQuantity ? 'is-invalid' : ''}`}
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)}
                    min="0.01"
                    step="0.01"
                    placeholder="Cantidad"
                  />
                  <span className="input-group-text">
                    {getProductUnit(selectedProductId)}
                  </span>
                </div>
                {errors.productQuantity && (
                  <div className="invalid-feedback">{errors.productQuantity}</div>
                )}
                
                <button 
                  className="btn btn-primary mt-2" 
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
    );
  };

  return (
    <div className="dialog harvest-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Añadir nueva cosecha' : 'Editar cosecha'}
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
                {/* Cultivo */}
                <div className="form-group">
                  <label htmlFor="crop" className="form-label required">Cultivo</label>
                  <select
                    id="crop"
                    name="crop"
                    className={`form-control ${errors.crop ? 'is-invalid' : ''}`}
                    value={formData.crop}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar cultivo</option>
                    <option value="maiz">Maíz</option>
                    <option value="soja">Soja</option>
                    <option value="trigo">Trigo</option>
                    <option value="girasol">Girasol</option>
                    <option value="alfalfa">Alfalfa</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.crop && <div className="invalid-feedback">{errors.crop}</div>}
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
                    <option value="scheduled">Programada</option>
                    <option value="in_progress">En proceso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                
                {/* Fecha planificada */}
                <div className="form-group">
                  <label htmlFor="plannedDate" className="form-label required">Fecha planificada</label>
                  <input
                    type="date"
                    id="plannedDate"
                    name="plannedDate"
                    className={`form-control ${errors.plannedDate ? 'is-invalid' : ''}`}
                    value={formData.plannedDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.plannedDate && <div className="invalid-feedback">{errors.plannedDate}</div>}
                </div>
                
                {/* Método de cosecha */}
                <div className="form-group">
                  <label htmlFor="harvestMethod" className="form-label">Método de cosecha</label>
                  <select
                    id="harvestMethod"
                    name="harvestMethod"
                    className="form-control"
                    value={formData.harvestMethod}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar método</option>
                    <option value="manual">Manual</option>
                    <option value="mecanizado">Mecanizado</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>
                
                {/* Rendimiento estimado */}
                <div className="form-group">
                  <label htmlFor="estimatedYield" className="form-label">Rendimiento estimado</label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="estimatedYield"
                      name="estimatedYield"
                      className={`form-control ${errors.estimatedYield ? 'is-invalid' : ''}`}
                      value={formData.estimatedYield}
                      onChange={handleChange}
                      placeholder="Rendimiento estimado"
                      min="0"
                      step="0.01"
                      disabled={submitting}
                    />
                    <select
                      name="yieldUnit"
                      className="form-control"
                      value={formData.yieldUnit}
                      onChange={handleChange}
                      style={{ width: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                      disabled={submitting}
                    >
                      <option value="kg/ha">kg/ha</option>
                      <option value="ton/ha">ton/ha</option>
                      <option value="qq/ha">qq/ha</option>
                    </select>
                  </div>
                  {errors.estimatedYield && <div className="invalid-feedback">{errors.estimatedYield}</div>}
                </div>
                
                {/* Almacén de destino */}
                <div className="form-group">
                  <label htmlFor="targetWarehouse" className="form-label required">Almacén de destino</label>
                  <select
                    id="targetWarehouse"
                    name="targetWarehouse"
                    className={`form-control ${errors.targetWarehouse ? 'is-invalid' : ''}`}
                    value={formData.targetWarehouse}
                    onChange={handleChange}
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
                  {errors.targetWarehouse && <div className="invalid-feedback">{errors.targetWarehouse}</div>}
                </div>
              </div>
            </div>
            
            {/* Campo y lotes */}
            <div className="form-section">
              <h3 className="section-title">Campo y lotes</h3>
              
              <div className="form-group">
                <label htmlFor="fieldId" className="form-label required">Campo</label>
                <select
                  id="fieldId"
                  name="fieldId"
                  className={`form-control ${errors.fieldId ? 'is-invalid' : ''}`}
                  value={formData.fieldId}
                  onChange={handleChange}
                  style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                  disabled={submitting}
                >
                  <option value="">Seleccionar campo</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
                {errors.fieldId && <div className="invalid-feedback">{errors.fieldId}</div>}
              </div>
              
              {formData.fieldId && availableLots.length > 0 ? (
                <div className="form-group">
                  <label className="form-label">Lotes</label>
                  <div className={`lots-selection ${errors.lots ? 'is-invalid' : ''}`}>
                    {availableLots.map(lot => (
                      <div key={lot.id} className="lot-checkbox">
                        <input
                          type="checkbox"
                          id={`lot-${lot.id}`}
                          checked={formData.lots.some(l => l.id === lot.id)}
                          onChange={(e) => handleLotChange(e, lot.id)}
                          disabled={submitting}
                        />
                        <label htmlFor={`lot-${lot.id}`}>
                          {lot.name} ({lot.area} {lot.areaUnit || 'ha'})
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.lots && <div className="invalid-feedback">{errors.lots}</div>}
                  
                  {formData.lots.length > 0 && (
                    <div className="mt-2">
                      <span className="form-text">
                        Superficie total seleccionada: <strong>{formData.totalArea} ha</strong>
                      </span>
                    </div>
                  )}
                </div>
              ) : formData.fieldId ? (
                <div className="no-field-message">
                  Este campo no tiene lotes registrados.
                </div>
              ) : null}
            </div>
            
            {/* Productos para siembra */}
            <div className="form-section">
              <div className="products-section-header">
                <h3 className="section-title">Productos para siembra</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setProductSelectorOpen(true)}
                  disabled={submitting}
                >
                  <i className="fas fa-plus"></i> Añadir producto
                </button>
              </div>
              
              <p className="help-text">
                Seleccione los productos que se utilizarán para la siembra. El stock se descuenta automáticamente al programar la cosecha.
              </p>
              
              {errors.selectedProducts && <div className="invalid-feedback">{errors.selectedProducts}</div>}
              
              {formData.selectedProducts.length > 0 ? (
                <div className="selected-products-list">
                  {formData.selectedProducts.map((selectedProduct, index) => (
                    <div key={index} className="selected-product-item">
                      <div className="product-info">
                        <span className="product-name">{getProductName(selectedProduct.productId)}</span>
                        <span className="product-stock">
                          {(() => {
                            const product = products.find(p => p.id === selectedProduct.productId);
                            if (product) {
                              return `Stock disponible: ${product.stock} ${product.unit}`;
                            }
                            return '';
                          })()}
                        </span>
                      </div>
                      
                      <div className="product-quantity">
                        <span>Cantidad: <strong>{selectedProduct.quantity} {getProductUnit(selectedProduct.productId)}</strong></span>
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
                  No hay productos seleccionados. Añada al menos un producto para la siembra.
                </div>
              )}
            </div>
            
            {/* Maquinaria y recursos */}
            <div className="form-section">
              <h3 className="section-title">Maquinaria y recursos</h3>
              
              <div className="form-grid">
                {/* Maquinaria */}
                <div className="form-group">
                  <label className="form-label">Maquinaria</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={machineryInput}
                      onChange={(e) => setMachineryInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleAddMachinery)}
                      placeholder="Añadir maquinaria"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddMachinery}
                      disabled={!machineryInput.trim() || submitting}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  
                  {formData.machinery.length > 0 && (
                    <div className="tags-container">
                      {formData.machinery.map((item, index) => (
                        <div key={index} className="tag">
                          {item}
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={() => handleRemoveMachinery(index)}
                            disabled={submitting}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Personal */}
                <div className="form-group">
                  <label htmlFor="workers" className="form-label">Personal asignado</label>
                  <input
                    type="text"
                    id="workers"
                    name="workers"
                    className="form-control"
                    value={formData.workers}
                    onChange={handleChange}
                    placeholder="Personal asignado"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            
            {/* Parámetros de calidad */}
            <div className="form-section">
              <h3 className="section-title">Parámetros de calidad</h3>
              
              <div className="form-group">
                <label className="form-label">Parámetros a evaluar</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={parameterInput}
                    onChange={(e) => setParameterInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleAddParameter)}
                    placeholder="Añadir parámetro (ej: Humedad, Proteína)"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddParameter}
                    disabled={!parameterInput.trim() || submitting}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                {formData.qualityParameters.length > 0 && (
                  <div className="tags-container">
                    {formData.qualityParameters.map((param, index) => (
                      <div key={index} className="tag">
                        {param}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveParameter(index)}
                          disabled={submitting}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  placeholder="Notas adicionales sobre la cosecha"
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
            isNew ? 'Crear cosecha' : 'Guardar cambios'
          )}
        </button>
      </div>
      
      {/* Selector de productos */}
      {productSelectorOpen && renderProductSelectorContent()}
    </div>
  );
};

export default HarvestDialog;