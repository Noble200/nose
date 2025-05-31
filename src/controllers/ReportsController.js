// src/controllers/ReportsController.js - Controlador para gestión de reportes - CORREGIDO
import { useState, useEffect, useCallback } from 'react';
import { useReports } from '../contexts/ReportsContext';
import { useStock } from '../contexts/StockContext';
import { downloadReportPDF } from '../utils/reportsPdfGenerator';

const useReportsController = () => {
  const {
    loading: reportsLoading,
    error: reportsError,
    getProductsReport,
    getTransfersReport,
    getFumigationsReport,
    getHarvestsReport,
    getPurchasesReport,
    getExpensesReport,
    getActivitiesReport,
    getInventoryReport
  } = useReports();

  const {
    fields = [],
    warehouses = [],
    loadFields,
    loadWarehouses
  } = useStock();

  // Estados locales
  const [selectedReportType, setSelectedReportType] = useState('products');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    category: 'all',
    field: 'all',
    warehouse: 'all',
    supplier: 'all',
    type: 'all'
  });
  const [reportData, setReportData] = useState([]);
  const [reportTitle, setReportTitle] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // CORREGIDO: Inicializar availableOptions con valores por defecto
  const [availableOptions, setAvailableOptions] = useState({
    categories: [{ value: 'all', label: 'Todas las categorías' }],
    suppliers: [{ value: 'all', label: 'Todos los proveedores' }],
    crops: [{ value: 'all', label: 'Todos los cultivos' }],
    statuses: [{ value: 'all', label: 'Todos los estados' }],
    fields: [{ value: 'all', label: 'Todos los campos' }],
    warehouses: [{ value: 'all', label: 'Todos los almacenes' }]
  });

  // Tipos de reportes disponibles
  const reportTypes = [
    { 
      value: 'products', 
      label: 'Reporte de Productos',
      description: 'Inventario completo con stock, costos y valorización',
      icon: 'fas fa-box'
    },
    { 
      value: 'transfers', 
      label: 'Reporte de Transferencias',
      description: 'Movimientos de productos entre almacenes',
      icon: 'fas fa-exchange-alt'
    },
    { 
      value: 'fumigations', 
      label: 'Reporte de Fumigaciones',
      description: 'Aplicaciones fitosanitarias realizadas',
      icon: 'fas fa-spray-can'
    },
    { 
      value: 'harvests', 
      label: 'Reporte de Cosechas',
      description: 'Cosechas planificadas y realizadas',
      icon: 'fas fa-tractor'
    },
    { 
      value: 'purchases', 
      label: 'Reporte de Compras',
      description: 'Compras realizadas a proveedores',
      icon: 'fas fa-shopping-cart'
    },
    { 
      value: 'expenses', 
      label: 'Reporte de Gastos',
      description: 'Gastos y ventas registradas',
      icon: 'fas fa-receipt'
    },
    { 
      value: 'activities', 
      label: 'Reporte de Actividades',
      description: 'Resumen general de todas las actividades',
      icon: 'fas fa-list-alt'
    },
    { 
      value: 'inventory', 
      label: 'Reporte de Inventario',
      description: 'Campos, lotes y almacenes disponibles',
      icon: 'fas fa-warehouse'
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadFields(),
          loadWarehouses()
        ]);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };

    loadInitialData();
  }, [loadFields, loadWarehouses]);

  // Actualizar título del reporte según el tipo seleccionado
  useEffect(() => {
    const reportType = reportTypes.find(rt => rt.value === selectedReportType);
    if (reportType) {
      setReportTitle(reportType.label);
    }
  }, [selectedReportType]);

  // Establecer fechas por defecto (último mes)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  // CORREGIDO: Obtener opciones disponibles para filtros según el tipo de reporte
  const getFilterOptions = useCallback(() => {
    const options = {
      categories: [
        { value: 'all', label: 'Todas las categorías' },
        { value: 'insumo', label: 'Insumo' },
        { value: 'herramienta', label: 'Herramienta' },
        { value: 'semilla', label: 'Semilla' },
        { value: 'fertilizante', label: 'Fertilizante' },
        { value: 'pesticida', label: 'Pesticida' },
        { value: 'maquinaria', label: 'Maquinaria' },
        { value: 'combustible', label: 'Combustible' },
        { value: 'otro', label: 'Otro' }
      ],
      statuses: [
        { value: 'all', label: 'Todos los estados' }
      ],
      crops: [
        { value: 'all', label: 'Todos los cultivos' },
        { value: 'maiz', label: 'Maíz' },
        { value: 'soja', label: 'Soja' },
        { value: 'trigo', label: 'Trigo' },
        { value: 'girasol', label: 'Girasol' },
        { value: 'alfalfa', label: 'Alfalfa' },
        { value: 'otro', label: 'Otro' }
      ],
      suppliers: [
        { value: 'all', label: 'Todos los proveedores' }
      ],
      fields: [
        { value: 'all', label: 'Todos los campos' },
        ...(Array.isArray(fields) ? fields.map(field => ({ value: field.id, label: field.name })) : [])
      ],
      warehouses: [
        { value: 'all', label: 'Todos los almacenes' },
        ...(Array.isArray(warehouses) ? warehouses.map(warehouse => ({ value: warehouse.id, label: warehouse.name })) : [])
      ]
    };

    // Añadir estados específicos según el tipo de reporte
    switch (selectedReportType) {
      case 'products':
        options.statuses.push(
          { value: 'low', label: 'Stock bajo' },
          { value: 'empty', label: 'Sin stock' },
          { value: 'ok', label: 'Stock normal' }
        );
        break;
      case 'transfers':
        options.statuses.push(
          { value: 'pending', label: 'Pendiente' },
          { value: 'approved', label: 'Aprobada' },
          { value: 'shipped', label: 'Enviada' },
          { value: 'completed', label: 'Completada' },
          { value: 'cancelled', label: 'Cancelada' }
        );
        break;
      case 'fumigations':
      case 'harvests':
        options.statuses.push(
          { value: 'pending', label: 'Pendiente' },
          { value: 'scheduled', label: 'Programada' },
          { value: 'in_progress', label: 'En Proceso' },
          { value: 'completed', label: 'Completada' },
          { value: 'cancelled', label: 'Cancelada' }
        );
        break;
      case 'purchases':
        options.statuses.push(
          { value: 'pending', label: 'Pendiente' },
          { value: 'approved', label: 'Aprobada' },
          { value: 'partial_delivered', label: 'Entrega Parcial' },
          { value: 'completed', label: 'Completada' },
          { value: 'cancelled', label: 'Cancelada' }
        );
        break;
      case 'expenses':
        options.statuses.push(
          { value: 'product', label: 'Venta de producto' },
          { value: 'misc', label: 'Gasto varios' }
        );
        break;
    }

    return options;
  }, [selectedReportType, fields, warehouses]);

  // Actualizar opciones disponibles cuando cambie el tipo de reporte
  useEffect(() => {
    const newOptions = getFilterOptions();
    setAvailableOptions(newOptions);
  }, [getFilterOptions]);

  // Cambiar tipo de reporte
  const handleReportTypeChange = useCallback((reportType) => {
    setSelectedReportType(reportType);
    setReportData([]);
    setPreviewOpen(false);
    
    // Resetear filtros específicos
    setFilters(prev => ({
      ...prev,
      status: 'all',
      category: 'all',
      field: 'all',
      warehouse: 'all',
      supplier: 'all',
      type: 'all'
    }));
  }, []);

  // Cambiar filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Obtener los filtros aplicables según el tipo de reporte
  const getApplicableFilters = useCallback(() => {
    const baseFilters = ['startDate', 'endDate'];
    
    switch (selectedReportType) {
      case 'products':
        return [...baseFilters, 'category', 'status', 'field'];
      case 'transfers':
        return [...baseFilters, 'status', 'sourceWarehouse', 'targetWarehouse'];
      case 'fumigations':
        return [...baseFilters, 'status', 'crop', 'field'];
      case 'harvests':
        return [...baseFilters, 'status', 'crop', 'field'];
      case 'purchases':
        return [...baseFilters, 'status', 'supplier'];
      case 'expenses':
        return [...baseFilters, 'type', 'category'];
      case 'activities':
        return [...baseFilters, 'status'];
      case 'inventory':
        return []; // No requiere filtros de fecha
      default:
        return baseFilters;
    }
  }, [selectedReportType]);

  // Generar vista previa del reporte
  const handleGeneratePreview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Generando vista previa para:', selectedReportType, 'con filtros:', filters);
      
      let data = [];
      
      // Preparar filtros para la consulta
      const queryFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        field: filters.field !== 'all' ? filters.field : undefined,
        fieldId: filters.field !== 'all' ? filters.field : undefined,
        sourceWarehouse: filters.sourceWarehouse !== 'all' ? filters.sourceWarehouse : undefined,
        targetWarehouse: filters.targetWarehouse !== 'all' ? filters.targetWarehouse : undefined,
        supplier: filters.supplier !== 'all' ? filters.supplier : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        crop: filters.crop !== 'all' ? filters.crop : undefined
      };
      
      // Obtener datos según el tipo de reporte
      switch (selectedReportType) {
        case 'products':
          data = await getProductsReport(queryFilters);
          break;
        case 'transfers':
          data = await getTransfersReport(queryFilters);
          break;
        case 'fumigations':
          data = await getFumigationsReport(queryFilters);
          break;
        case 'harvests':
          data = await getHarvestsReport(queryFilters);
          break;
        case 'purchases':
          data = await getPurchasesReport(queryFilters);
          break;
        case 'expenses':
          data = await getExpensesReport(queryFilters);
          break;
        case 'activities':
          data = await getActivitiesReport(queryFilters);
          break;
        case 'inventory':
          data = await getInventoryReport();
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      
      console.log('Datos obtenidos:', data.length || 0, 'registros');
      
      setReportData(data);
      setPreviewOpen(true);
      
    } catch (err) {
      console.error('Error al generar vista previa:', err);
      setError('Error al generar vista previa: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    selectedReportType, 
    filters, 
    getProductsReport,
    getTransfersReport,
    getFumigationsReport,
    getHarvestsReport,
    getPurchasesReport,
    getExpensesReport,
    getActivitiesReport,
    getInventoryReport
  ]);

  // Generar y descargar PDF
  const handleDownloadPDF = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
        // Si no hay datos en preview, generar primero
        await handleGeneratePreview();
        return;
      }
      
      console.log('Generando PDF para:', selectedReportType);
      
      // Preparar filtros para el PDF
      const pdfFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined
      };
      
      // Generar nombre del archivo
      const reportType = reportTypes.find(rt => rt.value === selectedReportType);
      const fileName = `${reportType?.label || 'Reporte'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Descargar PDF
      await downloadReportPDF(
        selectedReportType,
        reportData,
        pdfFilters,
        reportTitle,
        fileName
      );
      
      console.log('PDF descargado exitosamente');
      
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedReportType, reportData, filters, reportTitle, handleGeneratePreview]);

  // Cerrar vista previa
  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  // Limpiar filtros
  const handleClearFilters = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    setFilters({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'all',
      category: 'all',
      field: 'all',
      warehouse: 'all',
      supplier: 'all',
      type: 'all'
    });
    
    setReportData([]);
    setPreviewOpen(false);
  }, []);

  // Funciones para formatear datos de preview
  const getPreviewColumns = useCallback(() => {
    switch (selectedReportType) {
      case 'products':
        return [
          { key: 'name', label: 'Nombre' },
          { key: 'category', label: 'Categoría' },
          { key: 'stock', label: 'Stock' },
          { key: 'unit', label: 'Unidad' },
          { key: 'minStock', label: 'Stock Mín.' },
          { key: 'cost', label: 'Costo', format: 'currency' }
        ];
      case 'transfers':
        return [
          { key: 'transferNumber', label: 'Número' },
          { key: 'requestDate', label: 'Fecha', format: 'date' },
          { key: 'sourceWarehouse.name', label: 'Origen' },
          { key: 'targetWarehouse.name', label: 'Destino' },
          { key: 'status', label: 'Estado', format: 'status' }
        ];
      case 'fumigations':
        return [
          { key: 'orderNumber', label: 'Orden' },
          { key: 'applicationDate', label: 'Fecha', format: 'date' },
          { key: 'establishment', label: 'Establecimiento' },
          { key: 'crop', label: 'Cultivo' },
          { key: 'totalSurface', label: 'Superficie (ha)' },
          { key: 'status', label: 'Estado', format: 'status' }
        ];
      case 'harvests':
        return [
          { key: 'field.name', label: 'Campo' },
          { key: 'crop', label: 'Cultivo' },
          { key: 'plannedDate', label: 'Fecha Plan.', format: 'date' },
          { key: 'totalArea', label: 'Área (ha)' },
          { key: 'estimatedYield', label: 'Rend. Est.' },
          { key: 'status', label: 'Estado', format: 'status' }
        ];
      case 'purchases':
        return [
          { key: 'purchaseNumber', label: 'Número' },
          { key: 'purchaseDate', label: 'Fecha', format: 'date' },
          { key: 'supplier', label: 'Proveedor' },
          { key: 'totalAmount', label: 'Monto', format: 'currency' },
          { key: 'status', label: 'Estado', format: 'status' }
        ];
      case 'expenses':
        return [
          { key: 'expenseNumber', label: 'Número' },
          { key: 'date', label: 'Fecha', format: 'date' },
          { key: 'type', label: 'Tipo', format: 'expenseType' },
          { key: 'description', label: 'Descripción' },
          { key: 'amount', label: 'Monto', format: 'currency' }
        ];
      case 'activities':
        return [
          { key: 'date', label: 'Fecha', format: 'date' },
          { key: 'type', label: 'Tipo', format: 'activityType' },
          { key: 'title', label: 'Título' },
          { key: 'description', label: 'Descripción' },
          { key: 'status', label: 'Estado', format: 'status' }
        ];
      default:
        return [];
    }
  }, [selectedReportType]);

  // Función para obtener valor de una propiedad anidada
  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Función para formatear valores según el tipo
  const formatValue = useCallback((value, format) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(value);
      case 'date':
        return new Date(value).toLocaleDateString('es-ES');
      case 'status':
        const statusMap = {
          'pending': 'Pendiente',
          'approved': 'Aprobado',
          'rejected': 'Rechazado',
          'shipped': 'Enviado',
          'completed': 'Completado',
          'cancelled': 'Cancelado',
          'scheduled': 'Programado',
          'in_progress': 'En Proceso',
          'active': 'Activo',
          'inactive': 'Inactivo'
        };
        return statusMap[value] || value;
      case 'expenseType':
        return value === 'product' ? 'Venta' : 'Gasto';
      case 'activityType':
        const typeMap = {
          'transfer': 'Transferencia',
          'fumigation': 'Fumigación',
          'harvest': 'Cosecha',
          'purchase': 'Compra',
          'expense': 'Gasto'
        };
        return typeMap[value] || value;
      default:
        return value;
    }
  }, []);

  // Estados de loading y error combinados
  const isLoading = loading || reportsLoading;
  const currentError = error || reportsError;

  return {
    // Estados
    selectedReportType,
    filters,
    reportData,
    reportTitle,
    previewOpen,
    loading: isLoading,
    error: currentError,
    availableOptions,
    reportTypes,
    
    // Funciones
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
    
    // Datos auxiliares
    fields,
    warehouses
  };
};

export default useReportsController;