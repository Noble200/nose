import React from 'react';

const FieldDetailDialog = ({ field, onClose, onEditField, onAddLot, onEditLot, onDeleteLot }) => {
  // Mapear tipos de suelo a su descripción
  const getSoilTypeName = (type) => {
    const soilTypes = {
      'sandy': 'Arenoso',
      'clay': 'Arcilloso',
      'loam': 'Franco',
      'silt': 'Limoso',
      'chalky': 'Calcáreo',
      'peat': 'Turboso'
    };
    
    return soilTypes[type] || type || 'No especificado';
  };
  
  // Mapear tipos de riego a su descripción
  const getIrrigationTypeName = (type) => {
    const irrigationTypes = {
      'sprinkler': 'Aspersión',
      'drip': 'Goteo',
      'flood': 'Inundación',
      'furrow': 'Surco',
      'none': 'Sin riego'
    };
    
    return irrigationTypes[type] || type || 'No especificado';
  };
  
  // Mapear estados a su descripción
  const getStatusName = (status) => {
    const statuses = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'prepared': 'Preparado',
      'sown': 'Sembrado',
      'fallow': 'En barbecho'
    };
    
    return statuses[status] || status || 'No especificado';
  };

  // Formatear área con unidad
  const formatArea = (area, unit = 'ha') => {
    if (!area && area !== 0) return 'No especificada';
    return `${area} ${unit}`;
  };
  
  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'No especificada';
    
    if (date.seconds) {
      // Timestamp de Firestore
      return new Date(date.seconds * 1000).toLocaleDateString('es-ES');
    }
    
    return new Date(date).toLocaleDateString('es-ES');
  };

  // Calcular área total de lotes
  const calculateTotalLotArea = () => {
    if (!field.lots || field.lots.length === 0) return 0;
    
    return field.lots.reduce((total, lot) => {
      // Convertir a ha si es necesario
      let area = lot.area || 0;
      if (lot.areaUnit === 'm²') {
        area = area / 10000; // convertir m² a ha
      } else if (lot.areaUnit === 'acre') {
        area = area * 0.404686; // convertir acre a ha
      }
      return total + area;
    }, 0).toFixed(2);
  };

  // Renderizar el estado como chip
  const renderStatusChip = (status) => {
    let statusClass = '';
    
    switch (status) {
      case 'active': statusClass = 'status-active'; break;
      case 'inactive': statusClass = 'status-inactive'; break;
      case 'prepared': statusClass = 'status-prepared'; break;
      case 'sown': statusClass = 'status-sown'; break;
      case 'fallow': statusClass = 'status-fallow'; break;
      default: statusClass = 'status-active';
    }
    
    return <span className={`field-status-chip ${statusClass}`}>{getStatusName(status)}</span>;
  };

  return (
    <div className="dialog" style={{ maxWidth: '900px' }}>
      <div className="dialog-header">
        <div className="dialog-title-container">
          <h2 className="dialog-title">{field.name}</h2>
          {renderStatusChip(field.status)}
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body field-detail-dialog-body">
        <div className="field-detail-tabs">
          <div className="field-summary">
            {/* Resumen principal */}
            <div className="field-summary-header">
              <div className="field-summary-title">
                <i className="fas fa-map-marker-alt"></i>
                <span>
                  {field.location ? field.location : 'Ubicación no especificada'}
                </span>
              </div>
              <div className="field-summary-stats">
                <div className="summary-stat">
                  <div className="summary-stat-value">{formatArea(field.area, field.areaUnit)}</div>
                  <div className="summary-stat-label">Superficie total</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-value">{field.lots?.length || 0}</div>
                  <div className="summary-stat-label">Lotes</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-value">{calculateTotalLotArea()} ha</div>
                  <div className="summary-stat-label">Área en lotes</div>
                </div>
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="field-actions-bar">
              <button className="btn btn-primary" onClick={() => onEditField(field)}>
                <i className="fas fa-edit"></i> Editar campo
              </button>
              <button className="btn btn-outline" onClick={() => onAddLot(field)}>
                <i className="fas fa-plus"></i> Añadir lote
              </button>
            </div>

            {/* Información general */}
            <div className="field-detail-section">
              <h3 className="field-detail-title">
                <i className="fas fa-info-circle"></i> Información General
              </h3>
              
              <div className="detail-grid">
                <div className="field-detail">
                  <span className="detail-label">Fecha de creación</span>
                  <span className="detail-value">{formatDate(field.createdAt)}</span>
                </div>
                
                <div className="field-detail">
                  <span className="detail-label">Última modificación</span>
                  <span className="detail-value">{formatDate(field.updatedAt)}</span>
                </div>
                
                <div className="field-detail">
                  <span className="detail-label">Propietario</span>
                  <span className="detail-value">{field.owner || 'No especificado'}</span>
                </div>
                
                <div className="field-detail">
                  <span className="detail-label">Tipo de suelo</span>
                  <span className="detail-value">{getSoilTypeName(field.soilType)}</span>
                </div>
              </div>
            </div>
            
            {/* Cultivos y riego */}
            <div className="field-detail-section">
              <h3 className="field-detail-title">
                <i className="fas fa-seedling"></i> Cultivo y Riego
              </h3>
              
              <div className="detail-grid">
                <div className="field-detail">
                  <span className="detail-label">Cultivos</span>
                  <div className="crops-display">
                    {field.crops && field.crops.length > 0 ? (
                      field.crops.map((crop, index) => (
                        <span key={index} className="crop-tag">{crop}</span>
                      ))
                    ) : field.currentCrop ? (
                      <span className="detail-value">{field.currentCrop}</span>
                    ) : (
                      <span className="detail-value">Ninguno</span>
                    )}
                  </div>
                </div>
                
                <div className="field-detail">
                  <span className="detail-label">Tipo de riego</span>
                  <span className="detail-value">{getIrrigationTypeName(field.irrigationType)}</span>
                </div>
                
                <div className="field-detail">
                  <span className="detail-label">Frecuencia de riego</span>
                  <span className="detail-value">{field.irrigationFrequency || 'No especificada'}</span>
                </div>
              </div>
            </div>
            
            {/* Notas */}
            {field.notes && (
              <div className="field-detail-section">
                <h3 className="field-detail-title">
                  <i className="fas fa-sticky-note"></i> Notas
                </h3>
                <div className="field-notes">
                  {field.notes}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Lotes */}
        <div className="field-detail-section lots-section">
          <div className="lots-header">
            <h3 className="field-detail-title">
              <i className="fas fa-th"></i> Lotes <span className="lots-count">{field.lots?.length || 0}</span>
            </h3>
            
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onAddLot(field)}
            >
              <i className="fas fa-plus"></i> Añadir lote
            </button>
          </div>
          
          {field.lots && field.lots.length > 0 ? (
            <div className="lots-table-container">
              <table className="lots-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Superficie</th>
                    <th>Estado</th>
                    <th>Cultivos</th>
                    <th>Tipo de suelo</th>
                    <th>Riego</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {field.lots.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.name}</td>
                      <td>{formatArea(lot.area, lot.areaUnit || field.areaUnit)}</td>
                      <td>{renderStatusChip(lot.status || 'active')}</td>
                      <td>
                        <div className="crops-display">
                          {lot.crops && lot.crops.length > 0 ? (
                            lot.crops.map((crop, index) => (
                              <span key={index} className="crop-tag">{crop}</span>
                            ))
                          ) : lot.currentCrop ? (
                            <span>{lot.currentCrop}</span>
                          ) : (
                            <span>Ninguno</span>
                          )}
                        </div>
                      </td>
                      <td>{getSoilTypeName(lot.soilType || field.soilType)}</td>
                      <td>{getIrrigationTypeName(lot.irrigationType || field.irrigationType)}</td>
                      <td>
                        <div className="lot-actions">
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => onEditLot(field, lot)}
                            title="Editar lote"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          <button
                            className="btn-icon btn-icon-sm btn-icon-danger"
                            onClick={() => onDeleteLot(field.id, lot.id)}
                            title="Eliminar lote"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-message">
              <p>No hay lotes registrados en este campo.</p>
              <button className="btn btn-primary" onClick={() => onAddLot(field)}>
                <i className="fas fa-plus"></i> Añadir primer lote
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default FieldDetailDialog;