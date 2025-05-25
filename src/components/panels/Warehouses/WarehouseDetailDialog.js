// src/components/panels/Warehouses/WarehouseDetailDialog.js - Vista detallada de un almacén
import React from 'react';

const WarehouseDetailDialog = ({ warehouse, fields, onClose, onEditWarehouse, onDeleteWarehouse }) => {
  // Función para mostrar el campo asociado
  const getFieldName = () => {
    if (!warehouse.fieldId) return 'No asignado';
    
    const field = fields.find(f => f.id === warehouse.fieldId);
    return field ? field.name : 'Campo desconocido';
  };

  // Función para mostrar el lote asociado
  const getLotName = () => {
    if (!warehouse.lotId) return warehouse.isFieldLevel ? 'Todo el campo' : 'No asignado';
    
    // Buscar el campo primero
    const field = fields.find(f => f.id === warehouse.fieldId);
    if (!field) return 'Lote desconocido';
    
    // Buscar el lote dentro del campo
    const lot = field.lots.find(l => l.id === warehouse.lotId);
    return lot ? lot.name : 'Lote desconocido';
  };

  // Función para obtener el texto del tipo de almacén
  const getWarehouseTypeText = (type) => {
    const types = {
      'silo': 'Silo',
      'shed': 'Galpón',
      'barn': 'Granero',
      'cellar': 'Depósito',
      'coldroom': 'Cámara frigorífica',
      'outdoor': 'Almacenamiento exterior',
      'other': 'Otro'
    };
    
    return types[type] || type;
  };

  // Función para obtener el texto de la condición de almacenamiento
  const getStorageConditionText = (condition) => {
    const conditions = {
      'normal': 'Ambiente normal',
      'refrigerated': 'Refrigerado',
      'controlled_atmosphere': 'Atmósfera controlada',
      'ventilated': 'Ventilado'
    };
    
    return conditions[condition] || condition;
  };

  // Función para renderizar el estado como chip
  const renderStatusChip = (status) => {
    let statusClass = '';
    let statusText = '';

    switch (status) {
      case 'active':
        statusClass = 'status-active';
        statusText = 'Activo';
        break;
      case 'inactive':
        statusClass = 'status-inactive';
        statusText = 'Inactivo';
        break;
      case 'maintenance':
        statusClass = 'status-maintenance';
        statusText = 'En Mantenimiento';
        break;
      case 'full':
        statusClass = 'status-full';
        statusText = 'Lleno';
        break;
      default:
        statusClass = 'status-active';
        statusText = status || 'Desconocido';
    }

    return <span className={`status-chip ${statusClass}`}>{statusText}</span>;
  };

  // Función para obtener el icono según el tipo de almacén
  const getWarehouseIcon = (type) => {
    switch (type) {
      case 'silo':
        return 'fas fa-silo';
      case 'shed':
        return 'fas fa-warehouse';
      case 'barn':
        return 'fas fa-home';
      case 'cellar':
        return 'fas fa-box';
      case 'coldroom':
        return 'fas fa-snowflake';
      case 'outdoor':
        return 'fas fa-cloud-sun';
      default:
        return 'fas fa-warehouse';
    }
  };

  return (
    <div className="dialog warehouse-detail-dialog">
      <div className="dialog-header">
        <div className="dialog-title-container">
          <h2 className="dialog-title">Detalles del almacén</h2>
          {renderStatusChip(warehouse.status)}
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <div className="warehouse-details-container">
          <div className="warehouse-summary">
            <div className="warehouse-summary-header">
              <div className="warehouse-type-icon">
                <i className={getWarehouseIcon(warehouse.type)}></i>
              </div>
              <div className="warehouse-summary-content">
                <h3 className="warehouse-name">{warehouse.name}</h3>
                <div className="warehouse-type">{getWarehouseTypeText(warehouse.type)}</div>
                {warehouse.description && (
                  <div className="warehouse-description">{warehouse.description}</div>
                )}
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="warehouse-actions-bar">
              <button className="btn btn-primary" onClick={() => onEditWarehouse(warehouse)}>
                <i className="fas fa-edit"></i> Editar almacén
              </button>
              <button className="btn btn-outline btn-danger" onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar este almacén?')) {
                  onDeleteWarehouse(warehouse.id);
                  onClose();
                }
              }}>
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>

            {/* Información general */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Información general
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Nombre</span>
                  <span className="detail-value">{warehouse.name}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">{getWarehouseTypeText(warehouse.type)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Estado</span>
                  <span className="detail-value">{renderStatusChip(warehouse.status)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Ubicación</span>
                  <span className="detail-value">{warehouse.location || 'No especificada'}</span>
                </div>
              </div>
            </div>
            
            {/* Asignación */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-map-marker-alt"></i> Asignación
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Campo</span>
                  <span className="detail-value">{getFieldName()}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Nivel de asignación</span>
                  <span className="detail-value">
                    {warehouse.isFieldLevel ? 'Campo completo' : 'Lote específico'}
                  </span>
                </div>
                
                {!warehouse.isFieldLevel && (
                  <div className="detail-item">
                    <span className="detail-label">Lote</span>
                    <span className="detail-value">{getLotName()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Capacidad y condiciones */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-thermometer-half"></i> Capacidad y condiciones
              </h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Capacidad total</span>
                  <span className="detail-value">
                    {warehouse.capacity ? `${warehouse.capacity} ${warehouse.capacityUnit}` : 'No especificada'}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Condición de almacenamiento</span>
                  <span className="detail-value">{getStorageConditionText(warehouse.storageCondition)}</span>
                </div>
                
                {warehouse.temperature && (
                  <div className="detail-item">
                    <span className="detail-label">Temperatura</span>
                    <span className="detail-value">{warehouse.temperature} °C</span>
                  </div>
                )}
                
                {warehouse.humidity && (
                  <div className="detail-item">
                    <span className="detail-label">Humedad relativa</span>
                    <span className="detail-value">{warehouse.humidity}%</span>
                  </div>
                )}
                
                {warehouse.supervisor && (
                  <div className="detail-item">
                    <span className="detail-label">Responsable</span>
                    <span className="detail-value">{warehouse.supervisor}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notas */}
            {warehouse.notes && (
              <div className="detail-section">
                <h3 className="section-title">
                  <i className="fas fa-sticky-note"></i> Notas
                </h3>
                
                <div className="notes-content">
                  <p>{warehouse.notes}</p>
                </div>
              </div>
            )}
            
            {/* Aquí podría añadirse una sección para mostrar los productos almacenados 
                en este almacén, que se obtendría del contexto de Stock */}
            <div className="detail-section">
              <h3 className="section-title">
                <i className="fas fa-boxes"></i> Inventario actual
              </h3>
              
              <div className="empty-inventory-message">
                <p>No hay información de inventario disponible para este almacén.</p>
                <p>Esta sección mostrará los productos almacenados una vez que se integre con el sistema de inventario.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
        <button className="btn btn-primary" onClick={() => onEditWarehouse(warehouse)}>
          <i className="fas fa-edit"></i> Editar almacén
        </button>
      </div>
    </div>
  );
};

export default WarehouseDetailDialog;