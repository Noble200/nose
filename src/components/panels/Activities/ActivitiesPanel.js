import React from 'react';
import './activities.css';

const ActivitiesPanel = ({
  activities,
  loading,
  error,
  filters,
  filterOptions,
  onFilterChange,
  onSearch,
  onRefresh,
  onClearFilters
}) => {
  // Función para formatear fecha y hora
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el icono según el tipo de entidad
  const getEntityIcon = (entity) => {
    const iconMap = {
      'product': 'fas fa-box',
      'transfer': 'fas fa-exchange-alt',
      'fumigation': 'fas fa-spray-can',
      'harvest': 'fas fa-tractor',
      'purchase': 'fas fa-shopping-cart',
      'expense': 'fas fa-receipt',
      'field': 'fas fa-seedling',
      'warehouse': 'fas fa-warehouse'
    };
    return iconMap[entity] || 'fas fa-info-circle';
  };

  // Función para obtener el color según el tipo de acción
  const getActionColor = (type) => {
    const colorMap = {
      'create': 'success',
      'update': 'info',
      'delete': 'danger',
      'approve': 'success',
      'complete': 'success',
      'cancel': 'warning'
    };
    return colorMap[type] || 'primary';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando historial de actividades...</p>
      </div>
    );
  }

  return (
    <div className="activities-container">
      {/* Encabezado */}
      <div className="activities-header">
        <h1 className="activities-title">Historial de Actividades</h1>
        <button className="btn btn-outline" onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="activities-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Buscar:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar en actividades..."
              value={filters.searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Entidad:</label>
            <select
              className="form-control"
              value={filters.entity}
              onChange={(e) => onFilterChange('entity', e.target.value)}
            >
              {filterOptions.entities.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Acción:</label>
            <select
              className="form-control"
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              {filterOptions.types.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Desde:</label>
            <input
              type="date"
              className="form-control"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Hasta:</label>
            <input
              type="date"
              className="form-control"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>

          <button className="btn btn-outline" onClick={onClearFilters}>
            <i className="fas fa-eraser"></i> Limpiar
          </button>
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="activities-list">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {activities.length > 0 ? (
          <div className="activities-timeline">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className="activity-item">
                <div className={`activity-icon ${getActionColor(activity.type)}`}>
                  <i className={getEntityIcon(activity.entity)}></i>
                </div>
                
                <div className="activity-content">
                  <div className="activity-header">
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-time">{formatDateTime(activity.createdAt)}</span>
                  </div>
                  
                  <div className="activity-description">
                    {activity.description}
                  </div>
                  
                  <div className="activity-meta">
                    <span className="activity-user">
                      <i className="fas fa-user"></i> {activity.userName}
                    </span>
                    <span className={`activity-type ${getActionColor(activity.type)}`}>
                      {activity.entity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="activities-empty">
            <i className="fas fa-history"></i>
            <h3>No hay actividades</h3>
            <p>No se encontraron actividades con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPanel;