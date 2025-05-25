// src/components/panels/Warehouses/WarehouseDialog.js - Formulario para añadir/editar almacenes
import React, { useState, useEffect } from 'react';

const WarehouseDialog = ({ warehouse, fields, isNew, onSave, onClose }) => {
  // Estado inicial para el formulario
  const [formData, setFormData] = useState({
    name: '',
    type: 'shed', // Tipo por defecto: galpón
    location: '',
    fieldId: '',
    lotId: '',
    isFieldLevel: true, // Si es true, el almacén está asignado a nivel de campo
    status: 'active',
    capacity: '',
    capacityUnit: 'ton',
    storageCondition: 'normal',
    temperature: '',
    humidity: '',
    supervisor: '',
    description: '',
    notes: '',
  });

  // Estado para campos adicionales
  const [availableLots, setAvailableLots] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos del almacén si estamos editando
  useEffect(() => {
    if (warehouse && !isNew) {
      setFormData({
        name: warehouse.name || '',
        type: warehouse.type || 'shed',
        location: warehouse.location || '',
        fieldId: warehouse.fieldId || '',
        lotId: warehouse.lotId || '',
        isFieldLevel: warehouse.isFieldLevel !== undefined ? warehouse.isFieldLevel : true,
        status: warehouse.status || 'active',
        capacity: warehouse.capacity || '',
        capacityUnit: warehouse.capacityUnit || 'ton',
        storageCondition: warehouse.storageCondition || 'normal',
        temperature: warehouse.temperature || '',
        humidity: warehouse.humidity || '',
        supervisor: warehouse.supervisor || '',
        description: warehouse.description || '',
        notes: warehouse.notes || '',
      });
      
      // Si hay un campo seleccionado, cargar sus lotes
      if (warehouse.fieldId) {
        const field = fields.find(f => f.id === warehouse.fieldId);
        if (field) {
          setAvailableLots(field.lots || []);
        }
      }
    }
  }, [warehouse, isNew, fields]);

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
      handleFieldChange(value);
    }
  };

  // Manejar cambio de campo
  const handleFieldChange = (fieldId) => {
    // Limpiar selección de lote cuando se cambia de campo
    setFormData(prev => ({
      ...prev, 
      fieldId, 
      lotId: '',
      isFieldLevel: true
    }));
    
    if (fieldId) {
      const selectedField = fields.find(f => f.id === fieldId);
      if (selectedField) {
        setAvailableLots(selectedField.lots || []);
      } else {
        setAvailableLots([]);
      }
    } else {
      setAvailableLots([]);
    }
  };

  // Manejar cambio en checkbox de nivel de campo
  const handleFieldLevelChange = (e) => {
    setFormData(prev => ({
      ...prev,
      isFieldLevel: e.target.checked,
      lotId: e.target.checked ? '' : prev.lotId // Si es a nivel de campo, quitar el lote seleccionado
    }));
  };
  
  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    if (!formData.type) {
      newErrors.type = 'El tipo de almacén es obligatorio';
    }
    
    if (formData.capacity && isNaN(Number(formData.capacity))) {
      newErrors.capacity = 'La capacidad debe ser un número';
    }
    
    if (formData.temperature && isNaN(Number(formData.temperature))) {
      newErrors.temperature = 'La temperatura debe ser un número';
    }
    
    if (formData.humidity && isNaN(Number(formData.humidity))) {
      newErrors.humidity = 'La humedad debe ser un número';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true);
      
      // Preparar datos para guardar
      const warehouseData = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        temperature: formData.temperature ? Number(formData.temperature) : null,
        humidity: formData.humidity ? Number(formData.humidity) : null,
      };
      
      onSave(warehouseData)
        .catch(error => {
          console.error("Error al guardar almacén:", error);
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  return (
    <div className="dialog warehouse-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Añadir nuevo almacén' : 'Editar almacén'}
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
                {/* Nombre */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label required">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nombre del almacén"
                    disabled={submitting}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                
                {/* Tipo de almacén */}
                <div className="form-group">
                  <label htmlFor="type" className="form-label required">Tipo de almacén</label>
                  <select
                    id="type"
                    name="type"
                    className={`form-control ${errors.type ? 'is-invalid' : ''}`}
                    value={formData.type}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="silo">Silo</option>
                    <option value="shed">Galpón</option>
                    <option value="barn">Granero</option>
                    <option value="cellar">Depósito</option>
                    <option value="coldroom">Cámara frigorífica</option>
                    <option value="outdoor">Almacenamiento exterior</option>
                    <option value="other">Otro</option>
                  </select>
                  {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                </div>
                
                {/* Ubicación */}
                <div className="form-group">
                  <label htmlFor="location" className="form-label">Ubicación</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Dirección o coordenadas"
                    disabled={submitting}
                  />
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
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="maintenance">En Mantenimiento</option>
                    <option value="full">Lleno</option>
                  </select>
                </div>
              </div>
              
              {/* Descripción corta */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">Descripción corta</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Breve descripción del almacén"
                  disabled={submitting}
                />
              </div>
            </div>
            
            {/* Asignación a campo/lote */}
            <div className="form-section">
              <h3 className="section-title">Asignación a campo/lote</h3>
              
              {/* Campo */}
              <div className="form-group">
                <label htmlFor="fieldId" className="form-label">Campo</label>
                <select
                  id="fieldId"
                  name="fieldId"
                  className="form-control"
                  value={formData.fieldId}
                  onChange={handleChange}
                  style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                  disabled={submitting}
                >
                  <option value="">No asignado a un campo</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.fieldId && (
                <div className="field-level-assignment">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isFieldLevel"
                      checked={formData.isFieldLevel}
                      onChange={handleFieldLevelChange}
                      disabled={submitting}
                    />
                    <label className="form-check-label" htmlFor="isFieldLevel">
                      Asignar a nivel de campo completo
                    </label>
                  </div>
                  
                  {!formData.isFieldLevel && (
                    <div className="form-group">
                      <label htmlFor="lotId" className="form-label">Lote específico</label>
                      <select
                        id="lotId"
                        name="lotId"
                        className="form-control"
                        value={formData.lotId}
                        onChange={handleChange}
                        style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                        disabled={submitting}
                      >
                        <option value="">Seleccionar lote</option>
                        {availableLots.map((lot) => (
                          <option key={lot.id} value={lot.id}>
                            {lot.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Capacidad y condiciones */}
            <div className="form-section">
              <h3 className="section-title">Capacidad y condiciones de almacenamiento</h3>
              
              {/* Capacidad */}
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label htmlFor="capacity" className="form-label">Capacidad</label>
                  <input
                    type="text"
                    id="capacity"
                    name="capacity"
                    className={`form-control ${errors.capacity ? 'is-invalid' : ''}`}
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="Ej: 500"
                    disabled={submitting}
                  />
                  {errors.capacity && <div className="invalid-feedback">{errors.capacity}</div>}
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="capacityUnit" className="form-label">Unidad</label>
                  <select
                    id="capacityUnit"
                    name="capacityUnit"
                    className="form-control"
                    value={formData.capacityUnit}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    disabled={submitting}
                  >
                    <option value="ton">Toneladas</option>
                    <option value="kg">Kilogramos</option>
                    <option value="m3">Metros cúbicos</option>
                    <option value="L">Litros</option>
                    <option value="units">Unidades</option>
                  </select>
                </div>
              </div>
              
              {/* Condiciones de almacenamiento */}
              <div className="form-group">
                <label htmlFor="storageCondition" className="form-label">Condición de almacenamiento</label>
                <select
                  id="storageCondition"
                  name="storageCondition"
                  className="form-control"
                  value={formData.storageCondition}
                  onChange={handleChange}
                  style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                  disabled={submitting}
                >
                  <option value="normal">Ambiente normal</option>
                  <option value="refrigerated">Refrigerado</option>
                  <option value="controlled_atmosphere">Atmósfera controlada</option>
                  <option value="ventilated">Ventilado</option>
                </select>
              </div>
              
              {/* Temperatura */}
              <div className="form-group">
                <label htmlFor="temperature" className="form-label">Temperatura (°C)</label>
                <input
                  type="text"
                  id="temperature"
                  name="temperature"
                  className={`form-control ${errors.temperature ? 'is-invalid' : ''}`}
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="Ej: 15"
                  disabled={submitting}
                />
                {errors.temperature && <div className="invalid-feedback">{errors.temperature}</div>}
              </div>
              
              {/* Humedad */}
              <div className="form-group">
                <label htmlFor="humidity" className="form-label">Humedad relativa (%)</label>
                <input
                  type="text"
                  id="humidity"
                  name="humidity"
                  className={`form-control ${errors.humidity ? 'is-invalid' : ''}`}
                  value={formData.humidity}
                  onChange={handleChange}
                  placeholder="Ej: 60"
                  disabled={submitting}
                />
                {errors.humidity && <div className="invalid-feedback">{errors.humidity}</div>}
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="form-section">
              <h3 className="section-title">Información adicional</h3>
              
              {/* Supervisor */}
              <div className="form-group">
                <label htmlFor="supervisor" className="form-label">Persona responsable</label>
                <input
                  type="text"
                  id="supervisor"
                  name="supervisor"
                  className="form-control"
                  value={formData.supervisor}
                  onChange={handleChange}
                  placeholder="Nombre del responsable del almacén"
                  disabled={submitting}
                />
              </div>
              
              {/* Notas */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">Notas adicionales</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notas adicionales sobre el almacén"
                  rows={4}
                  disabled={submitting}
                />
              </div>
            </div>
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
            isNew ? 'Crear almacén' : 'Guardar cambios'
          )}
        </button>
      </div>
    </div>
  );
};

export default WarehouseDialog;