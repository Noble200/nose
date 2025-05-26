// src/components/panels/Fumigations/FumigationDialog.js - Mejorado con cc/ha
import React, { useState, useEffect } from 'react';

const FumigationDialog = ({ 
  fumigation, 
  field,
  selectedLots,
  fields, 
  products, 
  isNew, 
  onSave, 
  onClose 
}) => {
  // Estado para el formulario
  const [formData, setFormData] = useState({
    orderNumber: '',
    applicationDate: '',
    establishment: '',
    applicator: '',
    field: null,
    fieldId: '',
    crop: '',
    lots: [],
    totalSurface: '',
    surfaceUnit: 'ha',
    applicationMethod: 'terrestre',
    flowRate: '80',
    observations: '',
    status: 'pending',
    selectedProducts: [],
    weatherConditions: {
      temperature: '',
      humidity: '',
      windSpeed: '',
      windDirection: ''
    }
  });

  // Estados adicionales
  const [availableLots, setAvailableLots] = useState([]);
  const [selectableProducts, setSelectableProducts] = useState([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [dosePerHa, setDosePerHa] = useState('');
  const [doseUnit, setDoseUnit] = useState('L/ha');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // NUEVO: Función para convertir unidades a litros
  const convertToLiters = (value, unit) => {
    switch (unit) {
      case 'cc/ha':
      case 'ml/ha':
        return value / 1000; // 1000 cc = 1 L
      case 'L/ha':
        return value;
      case 'g/ha':
      case 'kg/ha':
        // Para sólidos, asumimos densidad aproximada de 1 (puede ajustarse)
        return unit === 'kg/ha' ? value : value / 1000;
      default:
        return value;
    }
  };

  // NUEVO: Función para mostrar la conversión
  const showConversion = (value, fromUnit, toUnit = 'L') => {
    if (fromUnit === 'L/ha') return null;
    
    const converted = convertToLiters(value, fromUnit);
    return `≈ ${converted.toFixed(3)} L/ha`;
  };

  // Cargar datos de la fumigación si estamos editando
  useEffect(() => {
    if (!isNew && fumigation) {
      setFormData({
        orderNumber: fumigation.orderNumber || '',
        applicationDate: formatDateForInput(fumigation.applicationDate),
        establishment: fumigation.establishment || '',
        applicator: fumigation.applicator || '',
        field: fumigation.field || null,
        fieldId: fumigation.fieldId || '',
        crop: fumigation.crop || '',
        lots: fumigation.lots || [],
        totalSurface: fumigation.totalSurface || '',
        surfaceUnit: fumigation.surfaceUnit || 'ha',
        applicationMethod: fumigation.applicationMethod || 'terrestre',
        flowRate: fumigation.flowRate || '80',
        observations: fumigation.observations || '',
        status: fumigation.status || 'pending',
        selectedProducts: fumigation.selectedProducts || [],
        weatherConditions: fumigation.weatherConditions || {
          temperature: '',
          humidity: '',
          windSpeed: '',
          windDirection: ''
        }
      });
      
      // Cargar lotes si hay campo seleccionado
      if (fumigation.fieldId) {
        const field = fields.find(f => f.id === fumigation.fieldId);
        if (field && field.lots) {
          setAvailableLots(field.lots);
        }
      }
    } else if (field) {
      // Si se proporciona un campo predeterminado
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
  }, [fumigation, isNew, field, selectedLots, fields]);

  // Cargar productos aplicables (pesticidas, herbicidas, fertilizantes)
  useEffect(() => {
    const validProducts = products.filter(product => 
      product.category === 'pesticida' || 
      product.category === 'fertilizante' ||
      product.category === 'herbicida' ||
      product.category === 'fungicida' ||
      product.category === 'insecticida'
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

  // Manejar cambios en condiciones climáticas
  const handleWeatherChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      weatherConditions: {
        ...prev.weatherConditions,
        [name]: value
      }
    }));
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
    
    // Calcular superficie total de los lotes seleccionados
    const totalSurface = updatedLots.reduce((total, lot) => {
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
      totalSurface: totalSurface.toFixed(2)
    }));
  };

  // MEJORADO: Añadir producto seleccionado con conversión de unidades
  const handleAddProduct = () => {
    if (!selectedProductId || !dosePerHa || isNaN(Number(dosePerHa)) || Number(dosePerHa) <= 0) {
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    // MEJORADO: Calcular cantidad total con conversión a litros
    const doseInLiters = convertToLiters(Number(dosePerHa), doseUnit);
    const totalQuantity = doseInLiters * Number(formData.totalSurface || 0);
    
    // MEJORADO: Verificar stock considerando la unidad del producto
    let stockToCheck = totalQuantity;
    
    // Si el producto se almacena en cc/ml y calculamos en litros, convertir
    if (product.unit === 'ml' || product.unit === 'cc') {
      stockToCheck = totalQuantity * 1000; // L a ml
    } else if (product.unit === 'L') {
      stockToCheck = totalQuantity; // Ya en litros
    }
    
    if (stockToCheck > product.stock) {
      setErrors(prev => ({
        ...prev,
        productQuantity: `No hay suficiente stock. Disponible: ${product.stock} ${product.unit}, necesario: ${stockToCheck.toFixed(2)} ${product.unit}`
      }));
      return;
    }
    
    // Verificar si el producto ya está añadido
    const existingIndex = formData.selectedProducts.findIndex(p => p.productId === selectedProductId);
    
    const productData = {
      productId: selectedProductId,
      dosePerHa: Number(dosePerHa),
      doseUnit: doseUnit,
      doseInLiters: doseInLiters, // NUEVO: Almacenar conversión
      totalQuantity: stockToCheck, // Cantidad en la unidad del producto
      totalQuantityLiters: totalQuantity, // NUEVO: Cantidad en litros para cálculos
      unit: product.unit,
      conversion: showConversion(Number(dosePerHa), doseUnit) // NUEVO: Mostrar conversión
    };
    
    if (existingIndex >= 0) {
      // Actualizar si ya existe
      const updatedProducts = [...formData.selectedProducts];
      updatedProducts[existingIndex] = productData;
      
      setFormData(prev => ({
        ...prev,
        selectedProducts: updatedProducts
      }));
    } else {
      // Añadir nuevo producto
      setFormData(prev => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, productData]
      }));
    }
    
    // Limpiar selección
    setSelectedProductId('');
    setDosePerHa('');
    setDoseUnit('L/ha');
    setErrors(prev => ({ ...prev, productQuantity: '' }));
    setProductSelectorOpen(false);
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

  // NUEVO: Calcular volumen total de mezcla considerando conversiones
  const calculateTotalMixVolume = () => {
    if (!formData.flowRate || !formData.totalSurface) return 0;
    return (Number(formData.flowRate) * Number(formData.totalSurface)).toFixed(1);
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.establishment.trim()) {
      newErrors.establishment = 'El establecimiento es obligatorio';
    }
    
    if (!formData.applicator.trim()) {
      newErrors.applicator = 'El aplicador es obligatorio';
    }
    
    if (!formData.crop.trim()) {
      newErrors.crop = 'El cultivo es obligatorio';
    }
    
    if (!formData.fieldId) {
      newErrors.fieldId = 'Debe seleccionar un campo';
    }
    
    if (formData.lots.length === 0) {
      newErrors.lots = 'Debe seleccionar al menos un lote';
    }
    
    if (!formData.applicationDate) {
      newErrors.applicationDate = 'La fecha de aplicación es obligatoria';
    }
    
    // Validar campos numéricos
    if (formData.flowRate && (isNaN(Number(formData.flowRate)) || Number(formData.flowRate) <= 0)) {
      newErrors.flowRate = 'El caudal debe ser un número positivo';
    }
    
    // Validar selección de productos
    if (formData.selectedProducts.length === 0) {
      newErrors.selectedProducts = 'Debe seleccionar al menos un producto para aplicar';
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
        const fumigationData = {
          ...formData,
          // Convertir campos numéricos
          flowRate: formData.flowRate ? Number(formData.flowRate) : 80,
          totalSurface: formData.totalSurface ? Number(formData.totalSurface) : 0
        };
        
        // Convertir fecha de aplicación
        if (formData.applicationDate) {
          fumigationData.applicationDate = new Date(formData.applicationDate);
        }
        
        await onSave(fumigationData);
      } catch (error) {
        console.error('Error al guardar fumigación:', error);
        setErrors({ submit: error.message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="dialog fumigation-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Añadir nueva fumigación' : 'Editar fumigación'}
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
                {/* Número de orden */}
                <div className="form-group">
                  <label htmlFor="orderNumber" className="form-label">Número de orden</label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    className="form-control"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    placeholder="Se genera automáticamente"
                    disabled={submitting}
                  />
                </div>
                
                {/* Fecha de aplicación */}
                <div className="form-group">
                  <label htmlFor="applicationDate" className="form-label required">Fecha de aplicación</label>
                  <input
                    type="date"
                    id="applicationDate"
                    name="applicationDate"
                    className={`form-control ${errors.applicationDate ? 'is-invalid' : ''}`}
                    value={formData.applicationDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.applicationDate && <div className="invalid-feedback">{errors.applicationDate}</div>}
                </div>
                
                {/* Establecimiento */}
                <div className="form-group">
                  <label htmlFor="establishment" className="form-label required">Establecimiento</label>
                  <input
                    type="text"
                    id="establishment"
                    name="establishment"
                    className={`form-control ${errors.establishment ? 'is-invalid' : ''}`}
                    value={formData.establishment}
                    onChange={handleChange}
                    placeholder="Nombre del establecimiento"
                    disabled={submitting}
                  />
                  {errors.establishment && <div className="invalid-feedback">{errors.establishment}</div>}
                </div>
                
                {/* Aplicador */}
                <div className="form-group">
                  <label htmlFor="applicator" className="form-label required">Aplicador</label>
                  <input
                    type="text"
                    id="applicator"
                    name="applicator"
                    className={`form-control ${errors.applicator ? 'is-invalid' : ''}`}
                    value={formData.applicator}
                    onChange={handleChange}
                    placeholder="Nombre del aplicador"
                    disabled={submitting}
                  />
                  {errors.applicator && <div className="invalid-feedback">{errors.applicator}</div>}
                </div>
                
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
                        Superficie total seleccionada: <strong>{formData.totalSurface} ha</strong>
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
            
            {/* Productos a aplicar */}
            <div className="form-section">
              <div className="products-section-header">
                <h3 className="section-title">Productos a aplicar</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setProductSelectorOpen(true)}
                  disabled={submitting || !formData.totalSurface}
                >
                  <i className="fas fa-plus"></i> Añadir producto
                </button>
              </div>
              
              <p className="help-text">
                Seleccione los productos fitosanitarios que se aplicarán. Las dosis se pueden especificar en cc/ha o L/ha. 
                El sistema convertirá automáticamente y el stock se descuenta al completar la fumigación.
              </p>
              
              {errors.selectedProducts && <div className="invalid-feedback">{errors.selectedProducts}</div>}
              
              {formData.selectedProducts.length > 0 ? (
                <div className="selected-products-list">
                  {formData.selectedProducts.map((selectedProduct, index) => (
                    <div key={index} className="selected-product-item">
                      <div className="product-info">
                        <span className="product-name">{getProductName(selectedProduct.productId)}</span>
                        <span className="product-dose">
                          Dosis: {selectedProduct.dosePerHa} {selectedProduct.doseUnit}
                          {selectedProduct.conversion && (
                            <span className="dose-conversion"> {selectedProduct.conversion}</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="product-quantity">
                        <span>Total: <strong>{selectedProduct.totalQuantity.toFixed(2)} {selectedProduct.unit}</strong></span>
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
                  No hay productos seleccionados. Añada al menos un producto para aplicar.
                </div>
              )}
            </div>
            
            {/* Método de aplicación */}
            <div className="form-section">
              <h3 className="section-title">Método de aplicación</h3>
              
              <div className="form-grid">
                {/* Método de aplicación */}
                <div className="form-group">
                  <label htmlFor="applicationMethod" className="form-label">Método de aplicación</label>
                  <select
                    id="applicationMethod"
                    name="applicationMethod"
                    className="form-control"
                    value={formData.applicationMethod}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="terrestre">Terrestre</option>
                    <option value="aereo">Aéreo</option>
                    <option value="dron">Dron</option>
                  </select>
                </div>
                
                {/* Caudal */}
                <div className="form-group">
                  <label htmlFor="flowRate" className="form-label">Caudal (L/ha)</label>
                  <input
                    type="number"
                    id="flowRate"
                    name="flowRate"
                    className={`form-control ${errors.flowRate ? 'is-invalid' : ''}`}
                    value={formData.flowRate}
                    onChange={handleChange}
                    placeholder="80"
                    min="1"
                    step="0.1"
                    disabled={submitting}
                  />
                  {errors.flowRate && <div className="invalid-feedback">{errors.flowRate}</div>}
                  {formData.flowRate && formData.totalSurface && (
                    <div className="form-text">
                      Volumen total de mezcla: <strong>{calculateTotalMixVolume()} L</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Condiciones climáticas */}
            <div className="form-section">
              <h3 className="section-title">Condiciones climáticas</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="temperature" className="form-label">Temperatura (°C)</label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    className="form-control"
                    value={formData.weatherConditions.temperature}
                    onChange={handleWeatherChange}
                    placeholder="25"
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="humidity" className="form-label">Humedad (%)</label>
                  <input
                    type="number"
                    id="humidity"
                    name="humidity"
                    className="form-control"
                    value={formData.weatherConditions.humidity}
                    onChange={handleWeatherChange}
                    placeholder="60"
                    min="0"
                    max="100"
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="windSpeed" className="form-label">Velocidad del viento (km/h)</label>
                  <input
                    type="number"
                    id="windSpeed"
                    name="windSpeed"
                    className="form-control"
                    value={formData.weatherConditions.windSpeed}
                    onChange={handleWeatherChange}
                    placeholder="10"
                    min="0"
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="windDirection" className="form-label">Dirección del viento</label>
                  <select
                    id="windDirection"
                    name="windDirection"
                    className="form-control"
                    value={formData.weatherConditions.windDirection}
                    onChange={handleWeatherChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="">Seleccionar dirección</option>
                    <option value="N">Norte</option>
                    <option value="NE">Noreste</option>
                    <option value="E">Este</option>
                    <option value="SE">Sureste</option>
                    <option value="S">Sur</option>
                    <option value="SW">Suroeste</option>
                    <option value="W">Oeste</option>
                    <option value="NW">Noroeste</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Observaciones */}
            <div className="form-section">
              <h3 className="section-title">Observaciones</h3>
              
              <div className="form-group">
                <textarea
                  name="observations"
                  className="form-control"
                  value={formData.observations}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales sobre la fumigación"
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
            isNew ? 'Crear fumigación' : 'Guardar cambios'
          )}
        </button>
      </div>
      
      {/* Selector de productos mejorado */}
      {productSelectorOpen && (
        <div className="product-selector-modal">
          <div className="product-selector-content">
            <div className="product-selector-header">
              <h3>Seleccionar producto para aplicar</h3>
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
                  {selectableProducts.filter(p => p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.stock} {product.unit}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProductId && (
                <div className="dose-inputs">
                  <div className="form-group">
                    <label>Dosis por hectárea:</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={dosePerHa}
                        onChange={(e) => setDosePerHa(e.target.value)}
                        min="0.01"
                        step="0.01"
                        placeholder="Dosis"
                      />
                      <select
                        className="form-control"
                        value={doseUnit}
                        onChange={(e) => setDoseUnit(e.target.value)}
                        style={{ width: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                      >
                        <option value="L/ha">L/ha</option>
                        <option value="cc/ha">cc/ha</option>
                        <option value="ml/ha">ml/ha</option>
                        <option value="kg/ha">kg/ha</option>
                        <option value="g/ha">g/ha</option>
                      </select>
                    </div>
                    {dosePerHa && formData.totalSurface && (
                      <div className="total-calculation">
                        <div className="dose-calculation">
                          <span>Dosis total: <strong>
                            {(Number(dosePerHa) * Number(formData.totalSurface)).toFixed(2)} {doseUnit.split('/')[0]}
                          </strong></span>
                          {showConversion(Number(dosePerHa), doseUnit) && (
                            <span className="conversion-display">
                              {showConversion(Number(dosePerHa), doseUnit)}
                            </span>
                          )}
                        </div>
                        <div className="total-needed">
                          <span>Total necesario: <strong>
                            {(() => {
                              const product = products.find(p => p.id === selectedProductId);
                              if (!product) return '0';
                              
                              const doseInLiters = convertToLiters(Number(dosePerHa), doseUnit);
                              const totalQuantity = doseInLiters * Number(formData.totalSurface);
                              
                              if (product.unit === 'ml' || product.unit === 'cc') {
                                return (totalQuantity * 1000).toFixed(2) + ' ' + product.unit;
                              } else {
                                return totalQuantity.toFixed(2) + ' ' + product.unit;
                              }
                            })()}
                          </strong></span>
                        </div>
                      </div>
                    )}
                    {errors.productQuantity && (
                      <div className="invalid-feedback">{errors.productQuantity}</div>
                    )}
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddProduct}
                    disabled={!selectedProductId || !dosePerHa}
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

export default FumigationDialog;