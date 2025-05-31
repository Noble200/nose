// src/pages/Reports.js - Página principal de reportes
import React from 'react';
import ReportsPanel from '../components/panels/Reports/ReportsPanel';
import useReportsController from '../controllers/ReportsController';

const Reports = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    selectedReportType,
    filters,
    reportData,
    reportTitle,
    previewOpen,
    loading,
    error,
    availableOptions,
    reportTypes,
    handleReportTypeChange,
    handleFilterChange,
    handleGeneratePreview,
    handleDownloadPDF,
    handleClosePreview,
    handleClearFilters,
    getApplicableFilters,
    getPreviewColumns,
    getNestedValue,
    formatValue,
    fields,
    warehouses
  } = useReportsController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <ReportsPanel
      selectedReportType={selectedReportType}
      filters={filters}
      reportData={reportData}
      reportTitle={reportTitle}
      previewOpen={previewOpen}
      loading={loading}
      error={error}
      availableOptions={availableOptions}
      reportTypes={reportTypes}
      onReportTypeChange={handleReportTypeChange}
      onFilterChange={handleFilterChange}
      onGeneratePreview={handleGeneratePreview}
      onDownloadPDF={handleDownloadPDF}
      onClosePreview={handleClosePreview}
      onClearFilters={handleClearFilters}
      getApplicableFilters={getApplicableFilters}
      getPreviewColumns={getPreviewColumns}
      getNestedValue={getNestedValue}
      formatValue={formatValue}
      fields={fields}
      warehouses={warehouses}
    />
  );
};

export default Reports;