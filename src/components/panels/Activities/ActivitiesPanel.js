// src/components/panels/Activities/ActivitiesPanel.js - Panel con fecha y hora exacta
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

  // MODIFICADO: Función para formatear solo fecha y hora exacta
  const formatDateTime = (date) => {
    try {
      // Validar que date existe
      if (!date) {
        console.warn('Fecha no proporcionada');
        return 'Fecha desconocida';
      }

      console.log('Formateando fecha:', date, 'Tipo:', typeof date); // Debug

      let activityDate;

      // Manejo robusto de diferentes tipos de fecha
      if (date instanceof Date) {
        // Ya es un objeto Date
        activityDate = date;
      } else if (date && typeof date === 'object') {
        // Posible timestamp de Firebase
        if (date.seconds && typeof date.seconds === 'number') {
          // Timestamp de Firebase con propiedad seconds
          activityDate = new Date(date.seconds * 1000);
        } else if (typeof date.toDate === 'function') {
          // Timestamp object con método toDate
          activityDate = date.toDate();
        } else if (date.nanoseconds && date.seconds) {
          // Timestamp completo de Firebase
          activityDate = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
        } else {
          console.warn('Objeto de fecha no reconocido:', date);
          return 'Formato de fecha desconocido';
        }
      } else if (typeof date === 'string') {
        // String de fecha
        activityDate = new Date(date);
      } else if (typeof date === 'number') {
        // Timestamp en milisegundos o segundos
        activityDate = date > 1000000000000 ? new Date(date) : new Date(date * 1000);
      } else {
        console.warn('Tipo de fecha no reconocido:', typeof date, date);
        return 'Tipo de fecha no válido';
      }

      // Verificar que la fecha es válida después de la conversión
      if (!activityDate || isNaN(activityDate.getTime())) {
        console.warn('Fecha inválida después de conversión:', activityDate);
        return 'Fecha inválida';
      }

      console.log('Fecha convertida exitosamente:', activityDate); // Debug

      // MODIFICADO: Retornar solo fecha y hora formateada
      return activityDate.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Formato 24 horas
      });

    } catch (error) {
      console.error('Error al formatear fecha:', error, 'Fecha original:', date);
      return 'Error en fecha';
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
      'user': 'fas fa-user',
      'system': 'fas fa-cog'
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
      'receive': 'success',
      'stock-adjust': 'warning'
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
      'user': 'Usuario',
      'system': 'Sistema'
    };
    return entityMap[entity] || entity;
  };

  // Función para truncar texto largo
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
            title={filtersExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            <i className={`fas fa-filter ${filtersExpanded ? 'fa-eye-slash' : 'fa-eye'}`}></i> 
            {filtersExpanded ? 'Ocultar' : 'Filtros'}
          </button>
          <button className="btn btn-outline" onClick={onRefresh} title="Actualizar actividades">
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
                value={filters.searchTerm || ''}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Entidad:</label>
              <select
                className="form-control"
                value={filters.entity || 'all'}
                onChange={(e) => onFilterChange('entity', e.target.value)}
              >
                {filterOptions.entities?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )) || []}
              </select>
            </div>

            <div className="filter-group">
              <label>Acción:</label>
              <select
                className="form-control"
                value={filters.type || 'all'}
                onChange={(e) => onFilterChange('type', e.target.value)}
              >
                {filterOptions.types?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )) || []}
              </select>
            </div>

            <div className="filter-group">
              <label>Usuario:</label>
              <select
                className="form-control"
                value={filters.user || 'all'}
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
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Hasta:</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="filter-group" style={{ alignSelf: 'end' }}>
              <button className="btn btn-outline" onClick={onClearFilters} title="Limpiar todos los filtros">
                <i className="fas fa-eraser"></i> Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de resultados */}
      {totalCount > 0 && (
        <div style={{ 
          marginBottom: 'var(--spacing-md)', 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--text-secondary)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--gray-50)',
          borderRadius: 'var(--border-radius-md)'
        }}>
          <i className="fas fa-info-circle"></i> Mostrando {activities.length} de {totalCount} actividades registradas
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
                const formattedDateTime = formatDateTime(activity.createdAt);
                
                return (
                  <div key={activity.id || index} className="activity-item">
                    <div className={`activity-icon ${activity.entity} ${getActionColor(activity.type)}`}>
                      <i className={getEntityIcon(activity.entity)}></i>
                    </div>
                    
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-action" title={activity.action}>
                          {truncateText(activity.action, 60)}
                        </span>
                        {/* MODIFICADO: Solo mostrar fecha y hora exacta sin clases de tiempo relativo */}
                        <span className="activity-time" title={`Realizado el ${formattedDateTime}`}>
                          {formattedDateTime}
                        </span>
                      </div>
                      
                      <div className="activity-description" title={activity.description}>
                        {truncateText(activity.description, 120)}
                      </div>
                      
                      <div className="activity-meta">
                        <span className="activity-user" title={`Usuario: ${activity.userName}`}>
                          <i className="fas fa-user"></i> {activity.userName}
                        </span>
                        <span className={`activity-type ${getActionColor(activity.type)}`} title={`Entidad: ${activity.entity}`}>
                          {getEntityText(activity.entity)}
                        </span>
                        {activity.metadata?.category && (
                          <span className="activity-type info" title={`Categoría: ${activity.metadata.category}`}>
                            {activity.metadata.category}
                          </span>
                        )}
                        {activity.entityName && (
                          <span className="activity-type primary" title={`Elemento: ${activity.entityName}`}>
                            {truncateText(activity.entityName, 20)}
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
                    title="Cargar más actividades del historial"
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
            {(filters.searchTerm || filters.entity !== 'all' || filters.type !== 'all' || filters.startDate || filters.endDate) && (
              <button className="btn btn-primary" onClick={onClearFilters} style={{ marginTop: 'var(--spacing-md)' }}>
                <i className="fas fa-eraser"></i> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPanel;