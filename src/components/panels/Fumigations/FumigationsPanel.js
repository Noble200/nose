// src/components/panels/Fumigations/FumigationsPanel.js
import React from 'react';
import './fumigations.css';
import FumigationDialog from './FumigationDialog';
import FumigationDetailDialog from './FumigationDetailDialog';
import CompleteFumigationDialog from './CompleteFumigationDialog';

const FumigationsPanel = ({
  fumigations,
  fields,
  products,
  loading,
  error,
  selectedFumigation,
  selectedField,
  selectedLots,
  dialogOpen,
  dialogType,
  filterOptions,
  onAddFumigation,
  onEditFumigation,
  onViewFumigation,
  onCompleteFumigation,
  onDeleteFumigation,
  onSaveFumigation,
  onCompleteFumigationSubmit,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh
}) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para obtener el nombre del campo
  const getFieldName = (fumigation) => {
    if (fumigation.field && fumigation.field.name) {
      return fumigation.field.name;
    }
    
    if (fumigation.fieldId) {
      const field = fields.find(f => f.id === fumigation.fieldId);
      return field ? field.name : 'Campo desconocido';
    }
    
    return 'No asignado';
  };

  // Función para renderizar el estado como chip
  const renderStatusChip = (status) => {
    let statusClass = '';
    let statusText = '';

    switch (status) {
      case 'pending':
        statusClass = 'status-pending';
        statusText = 'Pendiente';
        break;
      case 'scheduled':
        statusClass = 'status-scheduled';
        statusText = 'Programada';
        break;
      case 'in_progress':
        statusClass = 'status-in-progress';
        statusText = 'En proceso';
        break;
      case 'completed':
        statusClass = 'status-completed';
        statusText = 'Completada';
        break;
      case 'cancelled':
        statusClass = 'status-cancelled';
        statusText = 'Cancelada';
        break;
      default:
        statusClass = 'status-pending';
        statusText = status || 'Pendiente';
    }

    return <span className={`status-chip ${statusClass}`}>{statusText}</span>;
  };

  // Función para calcular el progreso de la fumigación
  const calculateProgress = (fumigation) => {
    switch (fumigation.status) {
      case 'pending':
        return 0;
      case 'scheduled':
        return 25;
      case 'in_progress':
        return 60;
      case 'completed':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };
  
  // Obtener los productos seleccionados de una fumigación
  const getSelectedProducts = (fumigation) => {
    if (!fumigation.selectedProducts || fumigation.selectedProducts.length === 0) {
      return [];
    }
    
    return fumigation.selectedProducts.map(selectedProduct => {
      const product = products.find(p => p.id === selectedProduct.productId);
      return {
        ...selectedProduct,
        name: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : ''
      };
    });
  };

  // Función para obtener los lotes como texto
  const getLotsText = (fumigation) => {
    if (!fumigation.lots || fumigation.lots.length === 0) {
      return 'Sin lotes';
    }

    return fumigation.lots.map(lot => lot.name).join(', ');
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando fumigaciones...</p>
      </div>
    );
  }

  return (
    <div className="fumigations-container">
      {/* Encabezado */}
      <div className="fumigations-header">
        <h1 className="fumigations-title">Gestión de Fumigaciones</h1>
        <div className="fumigations-actions">
          <button
            className="btn btn-primary"
            onClick={onAddFumigation}
          >
            <i className="fas fa-plus"></i> Nueva Fumigación
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
            <label htmlFor="cropFilter">Cultivo:</label>
            <select
              id="cropFilter"
              className="form-control"
              onChange={(e) => onFilterChange('crop', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.crops.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="fieldFilter">Campo:</label>
            <select
              id="fieldFilter"
              className="form-control"
              onChange={(e) => onFilterChange('field', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="all">Todos los campos</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item date-range">
            <label>Fecha de aplicación:</label>
            <div className="date-inputs">
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...filterOptions.dateRange, 
                  start: e.target.value || null 
                })}
                style={{ height: 'auto', minHeight: '40px' }}
              />
              <span>a</span>
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...filterOptions.dateRange, 
                  end: e.target.value || null 
                })}
                style={{ height: 'auto', minHeight: '40px' }}
              />
            </div>
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar fumigaciones..."
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

      {/* Grid de fumigaciones */}
      {fumigations.length > 0 ? (
        <div className="fumigations-grid">
          {fumigations.map((fumigation) => (
            <div key={fumigation.id} className={`fumigation-card ${fumigation.status}`}>
              <div className="fumigation-header">
                <div className="fumigation-title-container">
                  <div className="fumigation-icon">
                    <i className="fas fa-spray-can"></i>
                  </div>
                  <div className="fumigation-info">
                    <h3 className="fumigation-title">
                      {fumigation.orderNumber ? `Orden #${fumigation.orderNumber}` : fumigation.establishment}
                    </h3>
                    <div className="fumigation-subtitle">{fumigation.crop} - {getFieldName(fumigation)}</div>
                  </div>
                </div>
                {renderStatusChip(fumigation.status)}
              </div>
              
              <div className="fumigation-content">
                <div className="fumigation-details">
                  <div className="fumigation-detail">
                    <span className="detail-label">Establecimiento</span>
                    <span className="detail-value">{fumigation.establishment}</span>
                  </div>
                  
                  <div className="fumigation-detail">
                    <span className="detail-label">Aplicador</span>
                    <span className="detail-value">{fumigation.applicator}</span>
                  </div>
                  
                  <div className="fumigation-detail">
                    <span className="detail-label">Fecha aplicación</span>
                    <span className="detail-value">{formatDate(fumigation.applicationDate)}</span>
                  </div>
                  
                  <div className="fumigation-detail">
                    <span className="detail-label">Superficie</span>
                    <span className="detail-value">{fumigation.totalSurface} {fumigation.surfaceUnit || 'ha'}</span>
                  </div>
                  
                  <div className="fumigation-detail">
                    <span className="detail-label">Lotes</span>
                    <span className="detail-value">{getLotsText(fumigation)}</span>
                  </div>
                  
                  <div className="fumigation-detail">
                    <span className="detail-label">Caudal</span>
                    <span className="detail-value">{fumigation.flowRate || 80} L/ha</span>
                  </div>
                </div>

                {/* Productos a aplicar */}
                {getSelectedProducts(fumigation).length > 0 && (
                  <div className="fumigation-products">
                    <h4 className="products-title">
                      <i className="fas fa-flask"></i> Productos a aplicar
                    </h4>
                    <div className="products-list">
                      {getSelectedProducts(fumigation).map((item, index) => (
                        <div key={index} className="product-item">
                          <div className="product-info">
                            <span className="product-name">{item.name}</span>
                            <span className="product-dose">{item.dosePerHa} {item.doseUnit}</span>
                          </div>
                          <div className="product-total">
                            <span className="product-quantity">{item.totalQuantity} {item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barra de progreso */}
                <div className="fumigation-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(fumigation)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {fumigation.status === 'completed' 
                      ? 'Fumigación completada' 
                      : fumigation.status === 'cancelled' 
                        ? 'Fumigación cancelada'
                        : `Progreso: ${calculateProgress(fumigation)}%`}
                  </span>
                </div>
                
                {/* Acciones */}
                <div className="fumigation-actions">
                  {fumigation.status !== 'completed' && fumigation.status !== 'cancelled' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onCompleteFumigation(fumigation)}
                    >
                      <i className="fas fa-check"></i> Completar
                    </button>
                  )}
                  
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onViewFumigation(fumigation)}
                  >
                    <i className="fas fa-eye"></i> Ver detalles
                  </button>
                  
                  {fumigation.status !== 'completed' && fumigation.status !== 'cancelled' && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onEditFumigation(fumigation)}
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                  )}
                  
                  <button
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar esta fumigación? Esta acción no se puede deshacer.')) {
                        onDeleteFumigation(fumigation.id);
                      }
                    }}
                    title="Eliminar fumigación"
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
            <i className="fas fa-spray-can"></i>
          </div>
          <h2 className="empty-title">No hay fumigaciones registradas</h2>
          <p className="empty-description">
            Comienza añadiendo una nueva fumigación para gestionar las aplicaciones de productos fitosanitarios.
          </p>
          <button className="btn btn-primary" onClick={onAddFumigation}>
            <i className="fas fa-plus"></i> Añadir fumigación
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-fumigation' || dialogType === 'edit-fumigation' ? (
            <FumigationDialog
              fumigation={selectedFumigation}
              field={selectedField}
              selectedLots={selectedLots}
              fields={fields}
              products={products}
              isNew={dialogType === 'add-fumigation'}
              onSave={onSaveFumigation}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-fumigation' ? (
            <FumigationDetailDialog
              fumigation={selectedFumigation}
              fields={fields}
              products={products}
              onClose={onCloseDialog}
              onEdit={onEditFumigation}
              onComplete={onCompleteFumigation}
              onDelete={onDeleteFumigation}
            />
          ) : dialogType === 'complete-fumigation' ? (
            <CompleteFumigationDialog
              fumigation={selectedFumigation}
              fields={fields}
              products={products}
              onSubmit={onCompleteFumigationSubmit}
              onClose={onCloseDialog}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default FumigationsPanel;