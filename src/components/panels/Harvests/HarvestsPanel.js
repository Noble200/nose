// src/components/panels/Harvests/HarvestsPanel.js - Corregido
import React from 'react';
import './harvests.css';
import HarvestDialog from './HarvestDialog';
import HarvestDetailDialog from './HarvestDetailDialog';
import CompleteHarvestDialog from './CompleteHarvestDialog';

const HarvestsPanel = ({
  harvests = [], // CORREGIDO: Valor por defecto
  fields = [], // CORREGIDO: Valor por defecto
  products = [], // CORREGIDO: Valor por defecto
  warehouses = [], // CORREGIDO: Valor por defecto
  loading,
  error,
  selectedHarvest,
  selectedField,
  selectedLots,
  dialogOpen,
  dialogType,
  filterOptions,
  onAddHarvest,
  onEditHarvest,
  onViewHarvest,
  onCompleteHarvest,
  onDeleteHarvest,
  onSaveHarvest,
  onCompleteHarvestSubmit,
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

  // CORREGIDO: Función para obtener el nombre del campo con verificación
  const getFieldName = (harvest) => {
    if (harvest.field && harvest.field.name) {
      return harvest.field.name;
    }
    
    if (harvest.fieldId && Array.isArray(fields)) {
      const field = fields.find(f => f.id === harvest.fieldId);
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

  // Función para calcular el progreso de la cosecha
  const calculateProgress = (harvest) => {
    switch (harvest.status) {
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
  
  // CORREGIDO: Obtener los productos asignados a una cosecha con verificación
  const getSelectedProducts = (harvest) => {
    if (!harvest.selectedProducts || !Array.isArray(harvest.selectedProducts) || harvest.selectedProducts.length === 0) {
      return [];
    }
    
    if (!Array.isArray(products)) {
      return harvest.selectedProducts.map(selectedProduct => ({
        ...selectedProduct,
        name: 'Producto desconocido',
        unit: ''
      }));
    }
    
    return harvest.selectedProducts.map(selectedProduct => {
      const product = products.find(p => p.id === selectedProduct.productId);
      return {
        ...selectedProduct,
        name: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : ''
      };
    });
  };

  // Función para mostrar información de debug
  const showDebugInfo = (harvest) => {
    console.log('=== DEBUG COSECHA ===');
    console.log('ID:', harvest.id);
    console.log('Estado:', harvest.status);
    console.log('Productos seleccionados:', harvest.selectedProducts);
    console.log('Productos cosechados:', harvest.productsHarvested);
    console.log('==================');
  };

  // CORREGIDO: Función para obtener el texto del destino de almacenamiento con verificación
  const getDestinationText = (harvest) => {
    if (!harvest.targetWarehouse) return 'No asignado';
    
    // CORREGIDO: Verificar que warehouses sea un array antes de usar find
    if (!Array.isArray(warehouses)) {
      console.warn('Warehouses no es un array:', warehouses);
      return 'Almacén desconocido';
    }
    
    const warehouse = warehouses.find(w => w.id === harvest.targetWarehouse);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando cosechas...</p>
      </div>
    );
  }

  return (
    <div className="harvests-container">
      {/* Encabezado */}
      <div className="harvests-header">
        <h1 className="harvests-title">Gestión de Cosechas</h1>
        <div className="harvests-actions">
          <button
            className="btn btn-primary"
            onClick={onAddHarvest}
          >
            <i className="fas fa-plus"></i> Nueva Cosecha
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
              {Array.isArray(filterOptions?.status) && filterOptions.status.map((option) => (
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
              {Array.isArray(filterOptions?.crops) && filterOptions.crops.map((option) => (
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
              {Array.isArray(fields) && fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Fecha planificada:</label>
            <div className="date-range-filter">
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...(filterOptions?.dateRange || {}), 
                  start: e.target.value || null 
                })}
                style={{ height: 'auto', minHeight: '40px' }}
              />
              <span className="date-separator">a</span>
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...(filterOptions?.dateRange || {}), 
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
              placeholder="Buscar cosechas..."
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

      {/* CORREGIDO: Grid de cosechas con verificación de array */}
      {Array.isArray(harvests) && harvests.length > 0 ? (
        <div className="harvests-grid">
          {harvests.map((harvest) => (
            <div key={harvest.id} className="harvest-card">
              <div className="harvest-header">
                <div className="harvest-title-container">
                  <div className="harvest-icon">
                    <i className="fas fa-tractor"></i>
                  </div>
                  <h3 className="harvest-title">{harvest.crop || 'Sin cultivo'}</h3>
                </div>
                {renderStatusChip(harvest.status)}
              </div>
              
              <div className="harvest-content">
                <div className="harvest-details">
                  <div className="harvest-detail">
                    <span className="detail-label">Campo</span>
                    <span className="detail-value">{getFieldName(harvest)}</span>
                  </div>
                  
                  <div className="harvest-detail">
                    <span className="detail-label">Superficie</span>
                    <span className="detail-value">{harvest.totalArea || 0} {harvest.areaUnit || 'ha'}</span>
                  </div>
                  
                  <div className="harvest-detail">
                    <span className="detail-label">Fecha planificada</span>
                    <span className="detail-value">{formatDate(harvest.plannedDate)}</span>
                  </div>
                  
                  <div className="harvest-detail">
                    <span className="detail-label">Rend. estimado</span>
                    <span className="detail-value">
                      {harvest.estimatedYield ? `${harvest.estimatedYield} ${harvest.yieldUnit || 'kg/ha'}` : '-'}
                    </span>
                  </div>
                  
                  {harvest.status === 'completed' && (
                    <>
                      <div className="harvest-detail">
                        <span className="detail-label">Fecha de cosecha</span>
                        <span className="detail-value">{formatDate(harvest.harvestDate)}</span>
                      </div>
                      
                      <div className="harvest-detail">
                        <span className="detail-label">Rend. real</span>
                        <span className="detail-value">
                          {harvest.actualYield ? `${harvest.actualYield} ${harvest.yieldUnit || 'kg/ha'}` : '-'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="harvest-detail">
                    <span className="detail-label">Destino</span>
                    <span className="detail-value">{getDestinationText(harvest)}</span>
                  </div>
                </div>

                {/* Productos a utilizar */}
                {getSelectedProducts(harvest).length > 0 && (
                  <div className="harvest-products">
                    <h4 className="products-title">
                      <i className="fas fa-seedling"></i> Productos para siembra
                    </h4>
                    <div className="products-list">
                      {getSelectedProducts(harvest).map((item, index) => (
                        <div key={index} className="product-item">
                          <span className="product-name">{item.name}</span>
                          <span className="product-quantity">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barra de progreso */}
                <div className="harvest-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(harvest)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {harvest.status === 'completed' 
                      ? 'Cosecha completada' 
                      : harvest.status === 'cancelled' 
                        ? 'Cosecha cancelada'
                        : `Progreso: ${calculateProgress(harvest)}%`}
                  </span>
                </div>
                
                {/* Acciones */}
                <div className="harvest-actions">
                  {harvest.status !== 'completed' && harvest.status !== 'cancelled' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        showDebugInfo(harvest); // Debug
                        onCompleteHarvest(harvest);
                      }}
                    >
                      <i className="fas fa-check"></i> Completar
                    </button>
                  )}
                  
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onViewHarvest(harvest)}
                  >
                    <i className="fas fa-eye"></i> Ver detalles
                  </button>
                  
                  {harvest.status !== 'completed' && harvest.status !== 'cancelled' && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onEditHarvest(harvest)}
                    >
                      <i className="fas fa-edit"></i> Editar
                    </button>
                  )}
                  
                  <button
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar esta cosecha? Esta acción no se puede deshacer.')) {
                        onDeleteHarvest(harvest.id);
                      }
                    }}
                    title="Eliminar cosecha"
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
            <i className="fas fa-tractor"></i>
          </div>
          <h2 className="empty-title">No hay cosechas registradas</h2>
          <p className="empty-description">
            Comienza añadiendo una nueva cosecha para gestionar tus cultivos y producción.
          </p>
          <button className="btn btn-primary" onClick={onAddHarvest}>
            <i className="fas fa-plus"></i> Añadir cosecha
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-harvest' || dialogType === 'edit-harvest' ? (
            <HarvestDialog
              harvest={selectedHarvest}
              field={selectedField}
              selectedLots={selectedLots}
              fields={fields}
              products={products}
              warehouses={warehouses}
              isNew={dialogType === 'add-harvest'}
              onSave={onSaveHarvest}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-harvest' ? (
            <HarvestDetailDialog
              harvest={selectedHarvest}
              fields={fields}
              products={products}
              warehouses={warehouses}
              onClose={onCloseDialog}
              onEdit={onEditHarvest}
              onComplete={onCompleteHarvest}
              onDelete={onDeleteHarvest}
            />
          ) : dialogType === 'complete-harvest' ? (
            <CompleteHarvestDialog
              harvest={selectedHarvest}
              fields={fields}
              products={products}
              warehouses={warehouses}
              onSubmit={onCompleteHarvestSubmit}
              onClose={onCloseDialog}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default HarvestsPanel;