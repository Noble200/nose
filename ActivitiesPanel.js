// src/components/panels/Activities/ActivitiesPanel.js - Panel de historial de actividades CORREGIDO
import React, { useState } from 'react';
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
  onClearFilters,
  onLoadMore,
  hasMore,
  totalCount
}) => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // CORREGIDO: Función para formatear fecha y hora relativa
  const formatDateTime = (date) => {
    try {
      // Validar que date existe
      if (!date) {
        return { text: 'Fecha desconocida', class: '' };
      }

      const now = new Date();
      let activityDate;

      // Convertir diferentes tipos de fecha a objeto Date
      if (date instanceof Date) {
        activityDate = date;
      } else if (date?.seconds) {
        // Timestamp de Firebase
        activityDate = new Date(date.seconds * 1000);
      } else if (date?.toDate && typeof date.toDate === 'function') {
        // Timestamp object con método toDate
        activityDate = date.toDate();
      } else if (typeof date === 'string') {
        activityDate = new Date(date);
      } else if (typeof date === 'number') {
        activityDate = new Date(date);
      } else {
        console.warn('Formato de fecha no reconocido:', date);
        return { text: 'Fecha inválida', class: '' };
      }

      // Verificar que la fecha es válida
      if (isNaN(activityDate.getTime())) {
        console.warn('Fecha inválida detectada:', date);
        return { text: 'Fecha inválida', class: '' };
      }

      // Calcular diferencias de tiempo
      const diffTime = now.getTime() - activityDate.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Manejar fechas futuras
      if (diffTime < 0) {
        return { text: 'Fecha futura', class: 'future' };
      }

      // Formatear según el tiempo transcurrido
      if (diffMinutes < 1) {
        return { text: 'Ahora mismo', class: 'recent' };
      } else if (diffMinutes < 5) {
        return { text: 'Hace un momento', class: 'recent' };
      } else if (diffMinutes < 60) {
        return { text: `Hace ${diffMinutes} minutos`, class: 'recent' };
      } else if (diffHours < 24) {
        return { 
          text: diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`, 
          class: 'today' 
        };
      } else if (diffDays === 1) {
        return { text: 'Ayer', class: 'yesterday' };
      } else if (diffDays < 7) {
        return { text: `Hace ${diffDays} días`, class: '' };
      } else {
        return { 
          text: activityDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }), 
          class: '' 
        };
      }
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'Fecha original:', date);
      return { text: 'Error en fecha', class: '' };
    }
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
      'warehouse': 'fas fa-warehouse',
      'user': 'fas fa-user'
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
      'reject': 'danger',
      'complete': 'success',
      'cancel': 'warning',
      'ship': 'info',
      'receive': 'success'
    };
    return colorMap[type] || 'primary';
  };

  // Función para obtener texto en español del tipo de entidad
  const getEntityText = (entity) => {
    const entityMap = {
      'product': 'Producto',
      'transfer': 'Transferencia',
      'fumigation': 'Fumigación',
      'harvest': 'Cosecha',
      'purchase': 'Compra',
      'expense': 'Gasto',
      'field': 'Campo',
      'warehouse': 'Almacén',
      'user': 'Usuario'
    };
    return entityMap[entity] || entity;
  };

  if (loading && activities.length === 0) {
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
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <i className="fas fa-filter"></i> 
            {filtersExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button className="btn btn-outline" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      {filtersExpanded && (
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
              <label>Usuario:</label>
              <select
                className="form-control"
                value={filters.user}
                onChange={(e) => onFilterChange('user', e.target.value)}
              >
                {filterOptions.users?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )) || []}
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
      )}

      {/* Información de resultados */}
      {totalCount > 0 && (
        <div style={{ 
          marginBottom: 'var(--spacing-md)', 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--text-secondary)' 
        }}>
          Mostrando {activities.length} de {totalCount} actividades
        </div>
      )}

      {/* Lista de actividades */}
      <div className="activities-list">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {activities.length > 0 ? (
          <>
            <div className="activities-timeline">
              {activities.map((activity, index) => {
                const timeInfo = formatDateTime(activity.createdAt);
                
                return (
                  <div key={activity.id || index} className="activity-item">
                    <div className={`activity-icon ${activity.entity} ${getActionColor(activity.type)}`}>
                      <i className={getEntityIcon(activity.entity)}></i>
                    </div>
                    
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-action">{activity.action}</span>
                        <span className={`activity-time ${timeInfo.class}`}>
                          {timeInfo.text}
                        </span>
                      </div>
                      
                      <div className="activity-description">
                        {activity.description}
                      </div>
                      
                      <div className="activity-meta">
                        <span className="activity-user">
                          <i className="fas fa-user"></i> {activity.userName}
                        </span>
                        <span className={`activity-type ${getActionColor(activity.type)}`}>
                          {getEntityText(activity.entity)}
                        </span>
                        {activity.metadata?.category && (
                          <span className="activity-type info">
                            {activity.metadata.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación/Cargar más */}
            {(hasMore || loading) && (
              <div className="activities-pagination">
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                    <span>Cargando más actividades...</span>
                  </div>
                ) : (
                  <button 
                    className="load-more-btn" 
                    onClick={onLoadMore}
                    disabled={!hasMore}
                  >
                    <i className="fas fa-chevron-down"></i> Cargar más actividades
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="activities-empty">
            <i className="fas fa-history"></i>
            <h3>No hay actividades</h3>
            <p>
              {filters.searchTerm || filters.entity !== 'all' || filters.type !== 'all' || filters.startDate || filters.endDate
                ? 'No se encontraron actividades con los filtros aplicados.'
                : 'Aún no se han registrado actividades en el sistema.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPanel;