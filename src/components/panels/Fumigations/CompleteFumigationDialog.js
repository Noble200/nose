// src/components/panels/Fumigations/CompleteFumigationDialog.js - CORREGIDO
import React, { useState, useEffect } from 'react';

const CompleteFumigationDialog = ({ 
  fumigation, 
  fields, 
  products, 
  onSubmit, 
  onClose 
}) => {
  // Estado para el formulario de finalización
  const [formData, setFormData] = useState({
    startDateTime: '',
    endDateTime: '',
    weatherConditions: {
      temperature: '',
      humidity: '',
      windSpeed: '',
      windDirection: ''
    },
    completionNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar condiciones climáticas previas si existen
  useEffect(() => {
    if (fumigation.weatherConditions) {
      setFormData(prev => ({
        ...prev,
        weatherConditions: {
          ...prev.weatherConditions,
          ...fumigation.weatherConditions
        }
      }));
    }

    // CORREGIDO: Establecer valores por defecto más flexibles
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // Una hora atrás
    
    // Solo establecer valores por defecto si no hay fechas ya configuradas
    setFormData(prev => ({
      ...prev,
      startDateTime: prev.startDateTime || formatDateTimeForInput(oneHourAgo),
      endDateTime: prev.endDateTime || formatDateTimeForInput(now)
    }));
  }, [fumigation]);

  // CORREGIDO: Formatear fecha y hora para input datetime-local
  const formatDateTimeForInput = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Formatear como YYYY-MM-DDTHH:MM
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores al modificar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // Obtener productos seleccionados con nombres completos
  const getSelectedProducts = () => {
    if (!fumigation.selectedProducts || fumigation.selectedProducts.length === 0) {
      return [];
    }
    
    return fumigation.selectedProducts.map(selectedProduct => {
      const product = products.find(p => p.id === selectedProduct.productId);
      return {
        ...selectedProduct,
        name: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : '',
        availableStock: product ? product.stock : 0
      };
    });
  };

  // Validar formulario antes de enviar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar fechas
    if (!formData.startDateTime) {
      newErrors.startDateTime = 'La hora de inicio es obligatoria';
    }
    
    if (!formData.endDateTime) {
      newErrors.endDateTime = 'La hora de finalización es obligatoria';
    }
    
    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      
      if (end <= start) {
        newErrors.endDateTime = 'La hora de finalización debe ser posterior a la de inicio';
      }
      
      // CORREGIDO: Eliminamos las validaciones de fechas futuras
      // Los usuarios pueden establecer libremente las fechas de inicio y fin
    }
    
    // Validar condiciones climáticas (opcionales pero si se llenan deben ser válidas)
    if (formData.weatherConditions.temperature && 
        (isNaN(Number(formData.weatherConditions.temperature)) || 
         Number(formData.weatherConditions.temperature) < -50 || 
         Number(formData.weatherConditions.temperature) > 60)) {
      newErrors.temperature = 'La temperatura debe estar entre -50°C y 60°C';
    }
    
    if (formData.weatherConditions.humidity && 
        (isNaN(Number(formData.weatherConditions.humidity)) || 
         Number(formData.weatherConditions.humidity) < 0 || 
         Number(formData.weatherConditions.humidity) > 100)) {
      newErrors.humidity = 'La humedad debe estar entre 0% y 100%';
    }
    
    if (formData.weatherConditions.windSpeed && 
        (isNaN(Number(formData.weatherConditions.windSpeed)) || 
         Number(formData.weatherConditions.windSpeed) < 0)) {
      newErrors.windSpeed = 'La velocidad del viento debe ser un número positivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar stock de productos
  const checkProductStock = () => {
    const selectedProducts = getSelectedProducts();
    const insufficientStock = [];
    
    selectedProducts.forEach(product => {
      if (product.availableStock < product.totalQuantity) {
        insufficientStock.push({
          name: product.name,
          required: product.totalQuantity,
          available: product.availableStock,
          unit: product.unit
        });
      }
    });
    
    return insufficientStock;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Verificar stock antes de completar
    const insufficientStock = checkProductStock();
    if (insufficientStock.length > 0) {
      const message = insufficientStock.map(item => 
        `${item.name}: necesario ${item.required} ${item.unit}, disponible ${item.available} ${item.unit}`
      ).join('\n');
      
      if (!window.confirm(`Hay productos con stock insuficiente:\n\n${message}\n\n¿Desea continuar de todas formas?`)) {
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      // Preparar datos para enviar
      const completionData = {
        ...formData,
        // Convertir fechas
        startDateTime: new Date(formData.startDateTime),
        endDateTime: new Date(formData.endDateTime),
        // Convertir números en condiciones climáticas
        weatherConditions: {
          temperature: formData.weatherConditions.temperature 
            ? Number(formData.weatherConditions.temperature) 
            : null,
          humidity: formData.weatherConditions.humidity 
            ? Number(formData.weatherConditions.humidity) 
            : null,
          windSpeed: formData.weatherConditions.windSpeed 
            ? Number(formData.weatherConditions.windSpeed) 
            : null,
          windDirection: formData.weatherConditions.windDirection || null
        }
      };
      
      await onSubmit(completionData);
    } catch (error) {
      console.error('Error al completar fumigación:', error);
      setErrors({ submit: error.message || 'Error al completar la fumigación' });
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular duración estimada
  const calculateDuration = () => {
    if (!formData.startDateTime || !formData.endDateTime) return '';
    
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);
    const duration = Math.round((end - start) / (1000 * 60)); // minutos
    
    if (duration <= 0) return '';
    
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}min`;
    } else {
      return `${duration} min`;
    }
  };

  return (
    <div className="dialog complete-fumigation-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">Completar Fumigación</h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        {/* Resumen de la fumigación */}
        <div className="fumigation-summary-section">
          <h3 className="section-title">
            <i className="fas fa-info-circle"></i> Resumen de la fumigación
          </h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Establecimiento</span>
              <span className="summary-value">{fumigation.establishment}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Cultivo</span>
              <span className="summary-value">{fumigation.crop}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Superficie</span>
              <span className="summary-value">{fumigation.totalSurface} {fumigation.surfaceUnit}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Aplicador</span>
              <span className="summary-value">{fumigation.applicator}</span>
            </div>
          </div>
        </div>

        {/* Productos a aplicar */}
        <div className="products-summary-section">
          <h3 className="section-title">
            <i className="fas fa-flask"></i> Productos aplicados
          </h3>
          
          {getSelectedProducts().length > 0 ? (
            <div className="products-completion-table">
              <table className="completion-products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad aplicada</th>
                    <th>Stock disponible</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {getSelectedProducts().map((product, index) => {
                    const hasStock = product.availableStock >= product.totalQuantity;
                    return (
                      <tr key={index} className={!hasStock ? 'insufficient-stock' : ''}>
                        <td>{product.name}</td>
                        <td>{product.totalQuantity.toFixed(2)} {product.unit}</td>
                        <td>{product.availableStock} {product.unit}</td>
                        <td>
                          {hasStock ? (
                            <span className="stock-ok">✓ Stock OK</span>
                          ) : (
                            <span className="stock-insufficient">⚠ Stock insuficiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay productos registrados.</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* Tiempos de aplicación */}
            <div className="form-section">
              <h3 className="section-title">Tiempos de aplicación</h3>
              <p className="form-help-text">Ingrese las horas reales de inicio y finalización de la fumigación.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="startDateTime" className="form-label required">Hora de inicio</label>
                  <input
                    type="datetime-local"
                    id="startDateTime"
                    name="startDateTime"
                    className={`form-control ${errors.startDateTime ? 'is-invalid' : ''}`}
                    value={formData.startDateTime}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.startDateTime && <div className="invalid-feedback">{errors.startDateTime}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDateTime" className="form-label required">Hora de finalización</label>
                  <input
                    type="datetime-local"
                    id="endDateTime"
                    name="endDateTime"
                    className={`form-control ${errors.endDateTime ? 'is-invalid' : ''}`}
                    value={formData.endDateTime}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.endDateTime && <div className="invalid-feedback">{errors.endDateTime}</div>}
                </div>
              </div>
              
              {calculateDuration() && (
                <div className="duration-display">
                  <span className="duration-label">Duración total:</span>
                  <span className="duration-value">{calculateDuration()}</span>
                </div>
              )}
            </div>
            
            {/* Condiciones climáticas finales */}
            <div className="form-section">
              <h3 className="section-title">Condiciones climáticas durante la aplicación</h3>
              <p className="form-help-text">Complete las condiciones climáticas reales durante la aplicación.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="temperature" className="form-label">Temperatura (°C)</label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    className={`form-control ${errors.temperature ? 'is-invalid' : ''}`}
                    value={formData.weatherConditions.temperature}
                    onChange={handleWeatherChange}
                    placeholder="25"
                    min="-50"
                    max="60"
                    step="0.1"
                    disabled={submitting}
                  />
                  {errors.temperature && <div className="invalid-feedback">{errors.temperature}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="humidity" className="form-label">Humedad relativa (%)</label>
                  <input
                    type="number"
                    id="humidity"
                    name="humidity"
                    className={`form-control ${errors.humidity ? 'is-invalid' : ''}`}
                    value={formData.weatherConditions.humidity}
                    onChange={handleWeatherChange}
                    placeholder="60"
                    min="0"
                    max="100"
                    step="1"
                    disabled={submitting}
                  />
                  {errors.humidity && <div className="invalid-feedback">{errors.humidity}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="windSpeed" className="form-label">Velocidad del viento (km/h)</label>
                  <input
                    type="number"
                    id="windSpeed"
                    name="windSpeed"
                    className={`form-control ${errors.windSpeed ? 'is-invalid' : ''}`}
                    value={formData.weatherConditions.windSpeed}
                    onChange={handleWeatherChange}
                    placeholder="10"
                    min="0"
                    step="0.1"
                    disabled={submitting}
                  />
                  {errors.windSpeed && <div className="invalid-feedback">{errors.windSpeed}</div>}
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
            
            {/* Notas de finalización */}
            <div className="form-section">
              <h3 className="section-title">Notas de finalización</h3>
              
              <div className="form-group">
                <label htmlFor="completionNotes" className="form-label">Observaciones finales</label>
                <textarea
                  id="completionNotes"
                  name="completionNotes"
                  className="form-control"
                  value={formData.completionNotes}
                  onChange={handleChange}
                  placeholder="Observaciones sobre la aplicación, incidencias, resultados, etc."
                  rows={4}
                  disabled={submitting}
                />
              </div>
            </div>
            
            {/* Advertencia sobre stock */}
            {checkProductStock().length > 0 && (
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <strong>Advertencia:</strong> Algunos productos no tienen stock suficiente. 
                El stock se descontará hasta donde sea posible.
              </div>
            )}
            
            {/* Mensaje de error */}
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
              Completando fumigación...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i> Completar fumigación
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CompleteFumigationDialog;