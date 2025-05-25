import React from 'react';
import './fields.css';
import FieldDialog from './FieldDialog';
import LotDialog from './LotDialog';
import FieldDetailDialog from './FieldDetailDialog';

const FieldsPanel = ({
  fields,
  loading,
  error,
  selectedField,
  selectedLot,
  dialogOpen,
  dialogType,
  filterOptions,
  onAddField,
  onEditField,
  onViewField,
  onDeleteField,
  onAddLot,
  onEditLot,
  onDeleteLot,
  onSaveField,
  onSaveLot,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh
}) => {
  // Función para renderizar el estado como un chip
  const renderStatusChip = (status) => {
    let statusClass = 'status-active';
    let statusText = 'Activo';

    switch (status) {
      case 'inactive':
        statusClass = 'status-inactive';
        statusText = 'Inactivo';
        break;
      case 'prepared':
        statusClass = 'status-prepared';
        statusText = 'Preparado';
        break;
      case 'sown':
        statusClass = 'status-sown';
        statusText = 'Sembrado';
        break;
      case 'fallow':
        statusClass = 'status-fallow';
        statusText = 'En barbecho';
        break;
      default:
        break;
    }

    return <span className={`field-status ${statusClass}`}>{statusText}</span>;
  };

  // Formatear área con unidad
  const formatArea = (area, unit = 'ha') => {
    if (!area && area !== 0) return 'No especificada';
    return `${area} ${unit}`;
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando campos...</p>
      </div>
    );
  }

  return (
    <div className="fields-container">
      {/* Encabezado */}
      <div className="fields-header">
        <h1 className="fields-title">Gestión de Campos</h1>
        <div className="fields-actions">
          <button
            className="btn btn-primary"
            onClick={onAddField}
          >
            <i className="fas fa-plus"></i> Nuevo Campo
          </button>
          <button
            className="btn btn-icon"
            onClick={onRefresh}
            title="Actualizar datos"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="statusFilter">Estado:</label>
            <select
              id="statusFilter"
              className="form-control"
              onChange={(e) => onFilterChange('status', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="soilTypeFilter">Tipo de suelo:</label>
            <select
              id="soilTypeFilter"
              className="form-control"
              onChange={(e) => onFilterChange('soilType', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.soilType.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar campos..."
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="btn btn-sm" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
      )}

      {/* Grilla de campos */}
      {fields.length > 0 ? (
        <div className="fields-grid">
          {fields.map((field) => (
            <div key={field.id} className="field-card">
              <div className="field-header">
                <h3 className="field-title">{field.name}</h3>
                {renderStatusChip(field.status)}
              </div>
              
              <div className="field-content">
                <div className="field-details">
                  <div className="field-detail">
                    <span className="detail-label">Superficie</span>
                    <span className="detail-value">{formatArea(field.area, field.areaUnit || 'ha')}</span>
                  </div>
                  
                  <div className="field-detail">
                    <span className="detail-label">Ubicación</span>
                    <span className="detail-value">{field.location || 'No especificada'}</span>
                  </div>
                  
                  <div className="field-detail">
                    <span className="detail-label">Tipo de suelo</span>
                    <span className="detail-value">
                      {field.soilType ? 
                        filterOptions.soilType.find(opt => opt.value === field.soilType)?.label || field.soilType 
                        : 'No especificado'}
                    </span>
                  </div>
                  
                  <div className="field-detail">
                    <span className="detail-label">Cultivos</span>
                    <span className="detail-value">
                      {field.crops && field.crops.length > 0 
                        ? field.crops.slice(0, 2).join(', ') + (field.crops.length > 2 ? '...' : '')
                        : field.currentCrop || 'Ninguno'}
                    </span>
                  </div>
                </div>

                {/* Lotes */}
                <div className="field-lots">
                  <div className="lots-header">
                    <h4 className="lots-title">Lotes</h4>
                    <span className="lots-count">{field.lots?.length || 0}</span>
                  </div>
                  
                  {field.lots && field.lots.length > 0 ? (
                    <div className="lot-chips">
                      {field.lots.slice(0, 4).map((lot) => (
                        <div 
                          key={lot.id} 
                          className="lot-chip"
                          onClick={() => onEditLot(field, lot)}
                        >
                          {lot.name}
                        </div>
                      ))}
                      {field.lots.length > 4 && (
                        <div className="lot-chip">
                          +{field.lots.length - 4} más
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="lot-chips">
                      <span className="lot-chip">Sin lotes</span>
                    </div>
                  )}
                </div>
                
                <div className="field-actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onAddLot(field)}
                    title="Añadir lote"
                  >
                    <i className="fas fa-plus"></i> Añadir lote
                  </button>
                  
                  <button
                    className="btn btn-sm btn-text"
                    onClick={() => onViewField(field)}
                    title="Ver detalles"
                  >
                    <i className="fas fa-eye"></i> Ver detalles
                  </button>
                  
                  <button
                    className="btn-icon btn-icon-sm"
                    onClick={() => onEditField(field)}
                    title="Editar campo"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  
                  <button
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => onDeleteField(field.id)}
                    title="Eliminar campo"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-seedling"></i>
          </div>
          <h2 className="empty-title">No hay campos registrados</h2>
          <p className="empty-description">
            Comienza añadiendo un nuevo campo para gestionar tus terrenos agrícolas.
          </p>
          <button className="btn btn-primary" onClick={onAddField}>
            <i className="fas fa-plus"></i> Añadir campo
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-field' || dialogType === 'edit-field' ? (
            <FieldDialog
              field={selectedField}
              isNew={dialogType === 'add-field'}
              onSave={onSaveField}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'add-lot' || dialogType === 'edit-lot' ? (
            <LotDialog
              field={selectedField}
              lot={selectedLot}
              isNew={dialogType === 'add-lot'}
              onSave={onSaveLot}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-field' ? (
            <FieldDetailDialog
              field={selectedField}
              onClose={onCloseDialog}
              onEditField={onEditField}
              onAddLot={onAddLot}
              onEditLot={onEditLot}
              onDeleteLot={onDeleteLot}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default FieldsPanel;