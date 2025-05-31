// src/components/panels/Reports/ReportsPanel.js - Panel corregido para gestión de reportes
import React from 'react';
import './reports.css';
import ReportPreviewDialog from './ReportPreviewDialog';

const ReportsPanel = ({
  selectedReportType,
  filters,
  reportData,
  reportTitle,
  previewOpen,
  loading,
  error,
  availableOptions,
  reportTypes,
  onReportTypeChange,
  onFilterChange,
  onGeneratePreview,
  onDownloadPDF,
  onClosePreview,
  onClearFilters,
  getApplicableFilters,
  getPreviewColumns,
  getNestedValue,
  formatValue,
  fields,
  warehouses
}) => {
  // Obtener información del tipo de reporte seleccionado
  const selectedReport = reportTypes.find(rt => rt.value === selectedReportType);
  
  // Obtener filtros aplicables para el reporte actual
  const applicableFilters = getApplicableFilters();
  
  // CORREGIDO: Función para renderizar filtros específicos con validaciones
  const renderFilter = (filterKey) => {
    const baseClass = "form-control";
    
    // CORREGIDO: Validar que availableOptions exista y tenga las propiedades necesarias
    if (!availableOptions) {
      console.warn('availableOptions no está definido');
      return null;
    }
    
    switch (filterKey) {
      case 'startDate':
        return (
          <div className="filter-item">
            <label htmlFor="startDate">Fecha desde:</label>
            <input
              type="date"
              id="startDate"
              className={baseClass}
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
          </div>
        );
        
      case 'endDate':
        return (
          <div className="filter-item">
            <label htmlFor="endDate">Fecha hasta:</label>
            <input
              type="date"
              id="endDate"
              className={baseClass}
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>
        );
        
      case 'status':
        return (
          <div className="filter-item">
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              className={baseClass}
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange('status', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.statuses existe y es un array */}
              {availableOptions.statuses && Array.isArray(availableOptions.statuses) 
                ? availableOptions.statuses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los estados</option>
              }
            </select>
          </div>
        );
        
      case 'category':
        return (
          <div className="filter-item">
            <label htmlFor="category">Categoría:</label>
            <select
              id="category"
              className={baseClass}
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange('category', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.categories existe y es un array */}
              {availableOptions.categories && Array.isArray(availableOptions.categories)
                ? availableOptions.categories.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todas las categorías</option>
              }
            </select>
          </div>
        );
        
      case 'field':
        return (
          <div className="filter-item">
            <label htmlFor="field">Campo:</label>
            <select
              id="field"
              className={baseClass}
              value={filters.field || 'all'}
              onChange={(e) => onFilterChange('field', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.fields existe y es un array */}
              {availableOptions.fields && Array.isArray(availableOptions.fields)
                ? availableOptions.fields.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los campos</option>
              }
            </select>
          </div>
        );
        
      case 'sourceWarehouse':
        return (
          <div className="filter-item">
            <label htmlFor="sourceWarehouse">Almacén origen:</label>
            <select
              id="sourceWarehouse"
              className={baseClass}
              value={filters.sourceWarehouse || 'all'}
              onChange={(e) => onFilterChange('sourceWarehouse', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.warehouses existe y es un array */}
              {availableOptions.warehouses && Array.isArray(availableOptions.warehouses)
                ? availableOptions.warehouses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los almacenes</option>
              }
            </select>
          </div>
        );
        
      case 'targetWarehouse':
        return (
          <div className="filter-item">
            <label htmlFor="targetWarehouse">Almacén destino:</label>
            <select
              id="targetWarehouse"
              className={baseClass}
              value={filters.targetWarehouse || 'all'}
              onChange={(e) => onFilterChange('targetWarehouse', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.warehouses existe y es un array */}
              {availableOptions.warehouses && Array.isArray(availableOptions.warehouses)
                ? availableOptions.warehouses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los almacenes</option>
              }
            </select>
          </div>
        );
        
      case 'supplier':
        return (
          <div className="filter-item">
            <label htmlFor="supplier">Proveedor:</label>
            <select
              id="supplier"
              className={baseClass}
              value={filters.supplier || 'all'}
              onChange={(e) => onFilterChange('supplier', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.suppliers existe y es un array */}
              {availableOptions.suppliers && Array.isArray(availableOptions.suppliers)
                ? availableOptions.suppliers.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los proveedores</option>
              }
            </select>
          </div>
        );
        
      case 'type':
        return (
          <div className="filter-item">
            <label htmlFor="type">Tipo:</label>
            <select
              id="type"
              className={baseClass}
              value={filters.type || 'all'}
              onChange={(e) => onFilterChange('type', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Usar el array correcto para tipo (statuses) */}
              {availableOptions.statuses && Array.isArray(availableOptions.statuses)
                ? availableOptions.statuses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los tipos</option>
              }
            </select>
          </div>
        );
        
      case 'crop':
        return (
          <div className="filter-item">
            <label htmlFor="crop">Cultivo:</label>
            <select
              id="crop"
              className={baseClass}
              value={filters.crop || 'all'}
              onChange={(e) => onFilterChange('crop', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {/* CORREGIDO: Validar que availableOptions.crops existe y es un array */}
              {availableOptions.crops && Array.isArray(availableOptions.crops)
                ? availableOptions.crops.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : <option value="all">Todos los cultivos</option>
              }
            </select>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Encabezado */}
      <div className="reports-header">
        <h1 className="reports-title">Generación de Reportes</h1>
        <div className="reports-actions">
          <button
            className="btn btn-outline"
            onClick={onClearFilters}
          >
            <i className="fas fa-eraser"></i> Limpiar filtros
          </button>
        </div>
      </div>

      {/* Selección de tipo de reporte */}
      <div className="report-types-section">
        <h2 className="section-title">Seleccionar tipo de reporte</h2>
        <div className="report-types-grid">
          {reportTypes && Array.isArray(reportTypes) ? reportTypes.map((reportType) => (
            <div
              key={reportType.value}
              className={`report-type-card ${selectedReportType === reportType.value ? 'selected' : ''}`}
              onClick={() => onReportTypeChange(reportType.value)}
            >
              <div className="report-type-icon">
                <i className={reportType.icon}></i>
              </div>
              <div className="report-type-content">
                <h3 className="report-type-title">{reportType.label}</h3>
                <p className="report-type-description">{reportType.description}</p>
              </div>
              {selectedReportType === reportType.value && (
                <div className="report-type-selected">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>
          )) : (
            <div className="loading-container">
              <p>Cargando tipos de reporte...</p>
            </div>
          )}
        </div>
      </div>

      {/* Reporte seleccionado */}
      {selectedReport && (
        <div className="selected-report-section">
          <div className="selected-report-header">
            <div className="selected-report-info">
              <div className="selected-report-icon">
                <i className={selectedReport.icon}></i>
              </div>
              <div className="selected-report-details">
                <h3 className="selected-report-title">{selectedReport.label}</h3>
                <p className="selected-report-description">{selectedReport.description}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          {applicableFilters && applicableFilters.length > 0 && (
            <div className="filters-section">
              <h3 className="filters-title">
                <i className="fas fa-filter"></i> Filtros de búsqueda
              </h3>
              <div className="filters-grid">
                {applicableFilters.map((filterKey) => (
                  <React.Fragment key={filterKey}>
                    {renderFilter(filterKey)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Acciones del reporte */}
          <div className="report-actions">
            <button
              className="btn btn-outline btn-lg"
              onClick={onGeneratePreview}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Generando...
                </>
              ) : (
                <>
                  <i className="fas fa-eye"></i>
                  Vista previa
                </>
              )}
            </button>
            
            <button
              className="btn btn-primary btn-lg"
              onClick={onDownloadPDF}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Generando PDF...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  Descargar PDF
                </>
              )}
            </button>
          </div>

          {/* Mensaje de error si existe */}
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Información de la vista previa */}
          {reportData && Array.isArray(reportData) && reportData.length > 0 && (
            <div className="preview-info">
              <div className="preview-summary">
                <i className="fas fa-info-circle"></i>
                <span>Vista previa generada: {reportData.length} registro(s) encontrado(s)</span>
                <button className="btn btn-text" onClick={() => onGeneratePreview()}>
                  <i className="fas fa-eye"></i> Ver vista previa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diálogo de vista previa */}
      {previewOpen && (
        <div className="dialog-overlay">
          <ReportPreviewDialog
            reportTitle={reportTitle}
            reportData={reportData}
            columns={getPreviewColumns()}
            onClose={onClosePreview}
            onDownloadPDF={onDownloadPDF}
            getNestedValue={getNestedValue}
            formatValue={formatValue}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ReportsPanel;