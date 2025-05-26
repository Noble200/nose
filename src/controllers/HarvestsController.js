// src/controllers/HarvestsController.js - Controlador corregido para las cosechas
import { useState, useEffect, useCallback } from 'react';
import { useHarvests } from '../contexts/HarvestContext';
import { useStock } from '../contexts/StockContext';

const useHarvestsController = () => {
  const {
    harvests,
    loading: harvestsLoading,
    error: harvestsError,
    loadHarvests,
    addHarvest,
    updateHarvest,
    deleteHarvest,
    completeHarvest
  } = useHarvests();
  
  const {
    fields = [], // CORREGIDO: Valor por defecto como array vacío
    products = [], // CORREGIDO: Valor por defecto como array vacío
    warehouses = [], // CORREGIDO: Valor por defecto como array vacío
    loading: fieldsLoading,
    error: fieldsError,
    loadFields,
    loadProducts,
    loadWarehouses
  } = useStock();

  // Estados locales
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedLots, setSelectedLots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-harvest', 'edit-harvest', 'view-harvest', 'complete-harvest'
  const [filters, setFilters] = useState({
    status: 'all',
    crop: 'all',
    field: 'all',
    dateRange: { start: null, end: null },
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredHarvestsList, setFilteredHarvestsList] = useState([]);

  // CORREGIDO: Cargar campos, productos y almacenes al iniciar
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar todos los datos necesarios
      await Promise.all([
        loadFields(),
        loadProducts(), 
        loadWarehouses(),
        loadHarvests()
      ]);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadFields, loadProducts, loadWarehouses, loadHarvests]);

  // Actualizar estado de carga y error
  useEffect(() => {
    const isLoading = harvestsLoading || fieldsLoading;
    setLoading(isLoading);
    
    // Establecer mensaje de error si lo hay
    if (harvestsError) {
      setError(harvestsError);
    } else if (fieldsError) {
      setError(fieldsError);
    } else {
      setError('');
    }
  }, [harvestsLoading, fieldsLoading, harvestsError, fieldsError]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // CORREGIDO: Filtrar cosechas con verificación de arrays
  const getFilteredHarvests = useCallback(() => {
    // CORREGIDO: Verificar que harvests sea un array
    if (!Array.isArray(harvests) || harvests.length === 0) return [];
    
    // Hacer una copia del array para no modificar el original
    const harvestsWithFieldRefs = harvests.map(harvest => {
      // Si el harvest ya tiene una referencia completa al campo, usarla
      if (harvest.field && typeof harvest.field === 'object') {
        return harvest;
      }
      
      // CORREGIDO: Verificar que fields sea un array antes de usar find
      if (!Array.isArray(fields)) {
        return {
          ...harvest,
          field: { id: harvest.fieldId || '', name: 'Campo desconocido' }
        };
      }
      
      // Si no, buscar el campo por ID
      const field = fields.find(f => f.id === harvest.fieldId);
      return {
        ...harvest,
        field: field ? { id: field.id, name: field.name } : { id: harvest.fieldId || '', name: 'Campo desconocido' }
      };
    });
    
    return harvestsWithFieldRefs.filter(harvest => {
      // Filtro por estado
      if (filters.status !== 'all' && harvest.status !== filters.status) {
        return false;
      }
      
      // Filtro por cultivo
      if (filters.crop !== 'all' && harvest.crop !== filters.crop) {
        return false;
      }
      
      // Filtro por campo
      if (filters.field !== 'all' && harvest.fieldId !== filters.field) {
        return false;
      }
      
      // Filtro por fecha
      if (filters.dateRange.start || filters.dateRange.end) {
        const plannedDate = harvest.plannedDate
          ? new Date(harvest.plannedDate.seconds ? harvest.plannedDate.seconds * 1000 : harvest.plannedDate)
          : null;
        
        if (!plannedDate) return false;
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (plannedDate < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Ajustar al final del día
          if (plannedDate > endDate) return false;
        }
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          (harvest.crop && harvest.crop.toLowerCase().includes(term)) ||
          (harvest.field && harvest.field.name && harvest.field.name.toLowerCase().includes(term)) ||
          (harvest.harvestMethod && harvest.harvestMethod.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [harvests, fields, filters]);

  // Actualizar cosechas filtradas cuando cambian los filtros, cosechas o campos
  useEffect(() => {
    setFilteredHarvestsList(getFilteredHarvests());
  }, [getFilteredHarvests]);

  // Abrir diálogo para añadir cosecha
  const handleAddHarvest = useCallback(() => {
    setSelectedHarvest(null);
    setSelectedField(null);
    setSelectedLots([]);
    setDialogType('add-harvest');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para añadir cosecha desde un campo específico
  const handleAddHarvestFromField = useCallback((field, lots = []) => {
    setSelectedHarvest(null);
    setSelectedField(field);
    setSelectedLots(lots);
    setDialogType('add-harvest');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar cosecha
  const handleEditHarvest = useCallback((harvest) => {
    setSelectedHarvest(harvest);
    setSelectedField(null);
    setSelectedLots([]);
    setDialogType('edit-harvest');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de cosecha
  const handleViewHarvest = useCallback((harvest) => {
    setSelectedHarvest(harvest);
    setDialogType('view-harvest');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para completar cosecha
  const handleCompleteHarvest = useCallback((harvest) => {
    setSelectedHarvest(harvest);
    setDialogType('complete-harvest');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de cosecha
  const handleDeleteHarvest = useCallback(async (harvestId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cosecha? Esta acción no se puede deshacer.')) {
      try {
        await deleteHarvest(harvestId);
        
        // Cerrar el diálogo si estaba abierto para esta cosecha
        if (selectedHarvest && selectedHarvest.id === harvestId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar cosecha:', err);
        setError('Error al eliminar cosecha: ' + err.message);
      }
    }
  }, [deleteHarvest, selectedHarvest]);

  // Guardar cosecha (nueva o editada)
  const handleSaveHarvest = useCallback(async (harvestData) => {
    try {
      if (dialogType === 'add-harvest') {
        // Crear nueva cosecha
        await addHarvest(harvestData);
      } else if (dialogType === 'edit-harvest' && selectedHarvest) {
        // Actualizar cosecha existente
        await updateHarvest(selectedHarvest.id, harvestData);
      }
      
      setDialogOpen(false);
      await loadHarvests();
      return true;
    } catch (err) {
      console.error('Error al guardar cosecha:', err);
      setError('Error al guardar cosecha: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedHarvest, addHarvest, updateHarvest, loadHarvests]);

  // Completar cosecha
  const handleCompleteHarvestSubmit = useCallback(async (harvestData) => {
    try {
      if (!selectedHarvest) return;
      
      await completeHarvest(selectedHarvest.id, harvestData);
      
      setDialogOpen(false);
      await loadHarvests();
      return true;
    } catch (err) {
      console.error('Error al completar cosecha:', err);
      setError('Error al completar cosecha: ' + err.message);
      throw err;
    }
  }, [selectedHarvest, completeHarvest, loadHarvests]);

  // Cambiar filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Buscar por texto
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  }, []);

  // Cerrar diálogo
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedHarvest(null);
    setSelectedField(null);
    setSelectedLots([]);
  }, []);

  // Opciones para filtros
  const filterOptions = {
    status: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'scheduled', label: 'Programada' },
      { value: 'in_progress', label: 'En proceso' },
      { value: 'completed', label: 'Completada' },
      { value: 'cancelled', label: 'Cancelada' }
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
    dateRange: {
      start: null,
      end: null
    }
  };

  return {
    harvests: filteredHarvestsList,
    fields: Array.isArray(fields) ? fields : [], // CORREGIDO: Asegurar que sea un array
    products: Array.isArray(products) ? products : [], // CORREGIDO: Asegurar que sea un array
    warehouses: Array.isArray(warehouses) ? warehouses : [], // CORREGIDO: Asegurar que sea un array
    loading,
    error,
    selectedHarvest,
    selectedField,
    selectedLots,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddHarvest,
    handleAddHarvestFromField,
    handleEditHarvest,
    handleViewHarvest,
    handleCompleteHarvest,
    handleDeleteHarvest,
    handleSaveHarvest,
    handleCompleteHarvestSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useHarvestsController;