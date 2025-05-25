import React, { useState, useEffect } from 'react';

const LotDialog = ({ field, lot, isNew, onSave, onClose }) => {
  // Estado inicial para el formulario
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    areaUnit: 'ha',
    status: 'active',
    soilType: '',
    crops: [], // Cambiado a lista de cultivos
    irrigationType: '',
    irrigationFrequency: '',
    notes: '',
  });

  // Estado para el input de cultivo
  const [cropInput, setCropInput] = useState('');
  const [errors, setErrors] = useState({});

  // Cargar datos del lote si estamos editando, o valores por defecto del campo para lote nuevo
  useEffect(() => {
    if (!isNew && lot) {
      // Convertir currentCrop a crops si existe
      const crops = lot.currentCrop 
        ? [lot.currentCrop] 
        : lot.crops || [];

      // Editando lote existente
      setFormData({
        name: lot.name || '',
        area: lot.area || '',
        areaUnit: lot.areaUnit || 'ha',
        status: lot.status || 'active',
        soilType: lot.soilType || field.soilType || '',
        crops: crops,
        irrigationType: lot.irrigationType || field.irrigationType || '',
        irrigationFrequency: lot.irrigationFrequency || field.irrigationFrequency || '',
        notes: lot.notes || '',
      });
    } else if (field) {
      // Nuevo lote, heredar algunos valores del campo
      setFormData(prev => ({
        ...prev,
        soilType: field.soilType || '',
        crops: field.crops || [],
        irrigationType: field.irrigationType || '',
        irrigationFrequency: field.irrigationFrequency || '',
        areaUnit: field.areaUnit || 'ha',
      }));
    }
  }, [field, lot, isNew]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al modificar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar adición de cultivo
  const handleAddCrop = () => {
    if (cropInput.trim()) {
      setFormData(prev => ({
        ...prev,
        crops: [...prev.crops, cropInput.trim()]
      }));
      setCropInput('');
    }
  };

  // Manejar eliminación de cultivo
  const handleRemoveCrop = (index) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.filter((_, i) => i !== index)
    }));
  };

  // Manejar entrada de tecla en input de cultivo
  const handleCropKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCrop();
    }
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos obligatorios
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    if (formData.area && isNaN(Number(formData.area))) {
      newErrors.area = 'La superficie debe ser un número';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Estado para el loading
  const [submitting, setSubmitting] = useState(false);

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true); // Activar animación de carga
      
      // Preparar datos para guardar
      const lotData = {
        ...formData,
        area: formData.area ? Number(formData.area) : null,
        // Para compatibilidad, seguimos usando currentCrop como el primer cultivo
        currentCrop: formData.crops.length > 0 ? formData.crops[0] : '',
      };
      
      // Si es un lote nuevo, generar un ID único
      if (isNew) {
        lotData.id = Date.now().toString();
      } else if (lot) {
        lotData.id = lot.id;
      }
      
      onSave(lotData)
        .catch(error => {
          console.error("Error al guardar lote:", error);
        })
        .finally(() => {
          setSubmitting(false); // Desactivar animación de carga aunque haya error
        });
    }
  };

  return (
    <div className="dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? `Añadir lote a ${field.name}` : `Editar lote en ${field.name}`}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <form onSubmit={handleSubmit}>
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
                placeholder="Nombre o código del lote"
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            
            {/* Superficie */}
            <div className="form-group">
              <label htmlFor="area" className="form-label">Superficie</label>
              <div className="form-row">
                <div className="form-col" style={{ flex: 2 }}>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    className={`form-control ${errors.area ? 'is-invalid' : ''}`}
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Superficie"
                  />
                  {errors.area && <div className="invalid-feedback">{errors.area}</div>}
                </div>
                <div className="form-col" style={{ flex: 1 }}>
                  <select
                    id="areaUnit"
                    name="areaUnit"
                    className="form-control"
                    value={formData.areaUnit}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                  >
                    <option value="ha">ha</option>
                    <option value="m²">m²</option>
                    <option value="acre">acre</option>
                  </select>
                </div>
              </div>
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
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="prepared">Preparado</option>
                <option value="sown">Sembrado</option>
                <option value="fallow">En barbecho</option>
              </select>
            </div>
            
            {/* Tipo de suelo */}
            <div className="form-group">
              <label htmlFor="soilType" className="form-label">Tipo de suelo</label>
              <select
                id="soilType"
                name="soilType"
                className="form-control"
                value={formData.soilType}
                onChange={handleChange}
                style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
              >
                <option value="">No especificado</option>
                <option value="sandy">Arenoso</option>
                <option value="clay">Arcilloso</option>
                <option value="loam">Franco</option>
                <option value="silt">Limoso</option>
                <option value="chalky">Calcáreo</option>
                <option value="peat">Turboso</option>
              </select>
            </div>
            
            {/* Cultivos - Múltiples cultivos */}
            <div className="form-group">
              <label htmlFor="currentCrop" className="form-label">Cultivos</label>
              <div className="crops-container">
                <div className="crops-input-container">
                  <input
                    type="text"
                    id="cropInput"
                    className="form-control"
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    onKeyDown={handleCropKeyDown}
                    placeholder="Agregar cultivo"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary crop-add-btn"
                    onClick={handleAddCrop}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                {formData.crops && formData.crops.length > 0 ? (
                  <div className="crops-list">
                    {formData.crops.map((crop, index) => (
                      <div key={index} className="crop-tag">
                        {crop}
                        <button
                          type="button"
                          className="crop-remove-btn"
                          onClick={() => handleRemoveCrop(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-crops-message">No hay cultivos agregados</p>
                )}
              </div>
            </div>
            
            {/* Tipo de riego */}
            <div className="form-group">
              <label htmlFor="irrigationType" className="form-label">Tipo de riego</label>
              <select
                id="irrigationType"
                name="irrigationType"
                className="form-control"
                value={formData.irrigationType}
                onChange={handleChange}
                style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
              >
                <option value="">No especificado</option>
                <option value="sprinkler">Aspersión</option>
                <option value="drip">Goteo</option>
                <option value="flood">Inundación</option>
                <option value="furrow">Surco</option>
                <option value="none">Sin riego</option>
              </select>
            </div>
            
            {/* Frecuencia de riego */}
            <div className="form-group">
              <label htmlFor="irrigationFrequency" className="form-label">Frecuencia de riego</label>
              <input
                type="text"
                id="irrigationFrequency"
                name="irrigationFrequency"
                className="form-control"
                value={formData.irrigationFrequency}
                onChange={handleChange}
                placeholder="Ej: Diario, Semanal, etc."
              />
            </div>
            
            {/* Notas (ocupa todo el ancho) */}
            <div className="form-group form-grid-full">
              <label htmlFor="notes" className="form-label">Notas</label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales sobre el lote"
                rows={4}
              />
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
            isNew ? 'Crear lote' : 'Guardar cambios'
          )}
        </button>
      </div>
    </div>
  );
};

export default LotDialog;