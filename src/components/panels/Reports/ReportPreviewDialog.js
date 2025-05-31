// src/components/panels/Reports/ReportPreviewDialog.js - Diálogo de vista previa de reportes
import React, { useState } from 'react';

const ReportPreviewDialog = ({
  reportTitle,
  reportData,
  columns,
  onClose,
  onDownloadPDF,
  getNestedValue,
  formatValue,
  loading
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calcular paginación
  const totalItems = Array.isArray(reportData) ? reportData.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = Array.isArray(reportData) ? reportData.slice(startIndex, endIndex) : [];

  // Cambiar página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Cambiar elementos por página
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Generar páginas para la paginación
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si no hay suficientes páginas al final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="dialog report-preview-dialog">
      <div className="dialog-header">
        <div className="dialog-title-container">
          <i className="fas fa-eye"></i>
          <h2 className="dialog-title">Vista previa: {reportTitle}</h2>
        </div>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        {/* Información del reporte */}
        <div className="preview-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total de registros:</span>
              <span className="stat-value">{totalItems}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Generado el:</span>
              <span className="stat-value">{new Date().toLocaleString('es-ES')}</span>
            </div>
          </div>
        </div>

        {/* Contenido del reporte */}
        {totalItems > 0 ? (
          <div className="preview-content">
            {/* Controles de paginación superior */}
            <div className="pagination-controls-top">
              <div className="items-per-page">
                <label htmlFor="itemsPerPage">Mostrar:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="form-control"
                  style={{ height: 'auto', minHeight: '32px', paddingTop: '4px', paddingBottom: '4px' }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>por página</span>
              </div>
              
              <div className="page-info">
                Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} registros
              </div>
            </div>

            {/* Tabla de datos */}
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    {columns.map((column, index) => (
                      <th key={index}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={index}>
                      {columns.map((column, colIndex) => {
                        const value = getNestedValue(item, column.key);
                        const formattedValue = formatValue(value, column.format);
                        
                        return (
                          <td key={colIndex}>
                            {formattedValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación inferior */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  Página {currentPage} de {totalPages}
                </div>
                
                <div className="pagination-buttons">
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    title="Primera página"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>
                  
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Página anterior"
                  >
                    <i className="fas fa-angle-left"></i>
                  </button>
                  
                  {generatePageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Página siguiente"
                  >
                    <i className="fas fa-angle-right"></i>
                  </button>
                  
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-empty">
            <div className="empty-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <h3 className="empty-title">No hay datos para mostrar</h3>
            <p className="empty-description">
              No se encontraron registros con los filtros aplicados.
              Intenta ajustar los criterios de búsqueda.
            </p>
          </div>
        )}
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose}>
          Cerrar vista previa
        </button>
        <button 
          className="btn btn-primary" 
          onClick={onDownloadPDF}
          disabled={loading || totalItems === 0}
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
    </div>
  );
};

export default ReportPreviewDialog;