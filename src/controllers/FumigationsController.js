// src/controllers/FumigationsController.js - Controlador para fumigaciones
import { useState, useEffect, useCallback } from 'react';
import { useFumigations } from '../contexts/FumigationContext';
import { useStock } from '../contexts/StockContext';

const useFumigationsController = () => {
  const {
    fumigations,
    loading: fumigationsLoading,
    error: fumigationsError,
    loadFumigations,
    addFumigation,
    updateFumigation,
    deleteFumigation,
    completeFumigation
  } = useFumigations();
  
  const {
    fields,
    products,
    loading: fieldsLoading,
    error: fieldsError,
    loadFields,
    loadProducts
  } = useStock();

  // Estados locales
  const [selectedFumigation, setSelectedFumigation] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedLots, setSelectedLots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-fumigation', 'edit-fumigation', 'view-fumigation', 'complete-fumigation'
  const [filters, setFilters] = useState({
    status: 'all',
    crop: 'all',
    field: 'all',
    dateRange: { start: null, end: null },
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredFumigationsList, setFilteredFumigationsList] = useState([]);

  // Cargar campos, productos y fumigaciones al iniciar
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar campos si no están cargados
      if (fields.length === 0) {
        await loadFields();
      }
      
      // Cargar productos si no están cargados
      if (products.length === 0) {
        await loadProducts();
      }
      
      // Cargar fumigaciones
      await loadFumigations();
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadFields, loadProducts, loadFumigations, fields.length, products.length]);

  // Actualizar estado de carga y error
  useEffect(() => {
    const isLoading = fumigationsLoading || fieldsLoading;
    setLoading(isLoading);
    
    // Establecer mensaje de error si lo hay
    if (fumigationsError) {
      setError(fumigationsError);
    } else if (fieldsError) {
      setError(fieldsError);
    } else {
      setError('');
    }
  }, [fumigationsLoading, fieldsLoading, fumigationsError, fieldsError]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar fumigaciones según filtros aplicados
  const getFilteredFumigations = useCallback(() => {
    if (!fumigations || fumigations.length === 0) return [];
    
    // Hacer una copia del array para no modificar el original
    const fumigationsWithFieldRefs = fumigations.map(fumigation => {
      // Si la fumigación ya tiene una referencia completa al campo, usarla
      if (fumigation.field && typeof fumigation.field === 'object') {
        return fumigation;
      }
      
      // Si no, buscar el campo por ID
      const field = fields.find(f => f.id === fumigation.fieldId);
      return {
        ...fumigation,
        field: field ? { id: field.id, name: field.name } : { id: fumigation.fieldId, name: 'Campo desconocido' }
      };
    });
    
    return fumigationsWithFieldRefs.filter(fumigation => {
      // Filtro por estado
      if (filters.status !== 'all' && fumigation.status !== filters.status) {
        return false;
      }
      
      // Filtro por cultivo
      if (filters.crop !== 'all' && fumigation.crop !== filters.crop) {
        return false;
      }
      
      // Filtro por campo
      if (filters.field !== 'all' && fumigation.fieldId !== filters.field) {
        return false;
      }
      
      // Filtro por fecha
      if (filters.dateRange.start || filters.dateRange.end) {
        const appDate = fumigation.applicationDate 
          ? new Date(fumigation.applicationDate.seconds ? fumigation.applicationDate.seconds * 1000 : fumigation.applicationDate)
          : null;
        
        if (!appDate) return false;
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (appDate < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Ajustar al final del día
          if (appDate > endDate) return false;
        }
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          (fumigation.establishment && fumigation.establishment.toLowerCase().includes(term)) ||
          (fumigation.applicator && fumigation.applicator.toLowerCase().includes(term)) ||
          (fumigation.crop && fumigation.crop.toLowerCase().includes(term)) ||
          (fumigation.orderNumber && fumigation.orderNumber.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [fumigations, fields, filters]);

  // Actualizar fumigaciones filtradas cuando cambian los filtros, fumigaciones o campos
  useEffect(() => {
    setFilteredFumigationsList(getFilteredFumigations());
  }, [getFilteredFumigations]);

  // Abrir diálogo para añadir fumigación
  const handleAddFumigation = useCallback(() => {
    setSelectedFumigation(null);
    setSelectedField(null);
    setSelectedLots([]);
    setDialogType('add-fumigation');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para añadir fumigación desde un campo específico
  const handleAddFumigationFromField = useCallback((field, lots = []) => {
    setSelectedFumigation(null);
    setSelectedField(field);
    setSelectedLots(lots);
    setDialogType('add-fumigation');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar fumigación
  const handleEditFumigation = useCallback((fumigation) => {
    setSelectedFumigation(fumigation);
    setSelectedField(null);
    setSelectedLots([]);
    setDialogType('edit-fumigation');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de fumigación
  const handleViewFumigation = useCallback((fumigation) => {
    setSelectedFumigation(fumigation);
    setDialogType('view-fumigation');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para completar fumigación
  const handleCompleteFumigation = useCallback((fumigation) => {
    setSelectedFumigation(fumigation);
    setDialogType('complete-fumigation');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de fumigación
  const handleDeleteFumigation = useCallback(async (fumigationId) => {
    try {
      await deleteFumigation(fumigationId);
      
      // Cerrar el diálogo si estaba abierto para esta fumigación
      if (selectedFumigation && selectedFumigation.id === fumigationId) {
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error al eliminar fumigación:', err);
      setError('Error al eliminar fumigación: ' + err.message);
    }
  }, [deleteFumigation, selectedFumigation]);

  // Guardar fumigación (nueva o editada)
  const handleSaveFumigation = useCallback(async (fumigationData) => {
    try {
      if (dialogType === 'add-fumigation') {
        // Crear nueva fumigación
        await addFumigation(fumigationData);
      } else if (dialogType === 'edit-fumigation' && selectedFumigation) {
        // Actualizar fumigación existente
        await updateFumigation(selectedFumigation.id, fumigationData);
      }
      
      setDialogOpen(false);
      await loadFumigations();
      return true;
    } catch (err) {
      console.error('Error al guardar fumigación:', err);
      setError('Error al guardar fumigación: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedFumigation, addFumigation, updateFumigation, loadFumigations]);

  // Completar fumigación
  const handleCompleteFumigationSubmit = useCallback(async (completionData) => {
    try {
      if (!selectedFumigation) return;
      
      await completeFumigation(selectedFumigation.id, completionData);
      
      setDialogOpen(false);
      await loadFumigations();
      return true;
    } catch (err) {
      console.error('Error al completar fumigación:', err);
      setError('Error al completar fumigación: ' + err.message);
      throw err;
    }
  }, [selectedFumigation, completeFumigation, loadFumigations]);

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
    setSelectedFumigation(null);
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
    fumigations: filteredFumigationsList,
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
    handleAddFumigation,
    handleAddFumigationFromField,
    handleEditFumigation,
    handleViewFumigation,
    handleCompleteFumigation,
    handleDeleteFumigation,
    handleSaveFumigation,
    handleCompleteFumigationSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useFumigationsController;