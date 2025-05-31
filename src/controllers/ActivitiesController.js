import { useState, useEffect, useCallback } from 'react';
import { useActivities } from '../contexts/ActivityContext';

const useActivitiesController = () => {
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    loadActivities,
    loadActivitiesByEntity,
    loadActivitiesByUser
  } = useActivities();

  const [filters, setFilters] = useState({
    entity: 'all',
    type: 'all',
    user: 'all',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Opciones para filtros
  const filterOptions = {
    entities: [
      { value: 'all', label: 'Todas las entidades' },
      { value: 'product', label: 'Productos' },
      { value: 'transfer', label: 'Transferencias' },
      { value: 'fumigation', label: 'Fumigaciones' },
      { value: 'harvest', label: 'Cosechas' },
      { value: 'purchase', label: 'Compras' },
      { value: 'expense', label: 'Gastos' },
      { value: 'field', label: 'Campos' },
      { value: 'warehouse', label: 'Almacenes' }
    ],
    types: [
      { value: 'all', label: 'Todas las acciones' },
      { value: 'create', label: 'Creación' },
      { value: 'update', label: 'Actualización' },
      { value: 'delete', label: 'Eliminación' },
      { value: 'approve', label: 'Aprobación' },
      { value: 'complete', label: 'Completado' },
      { value: 'cancel', label: 'Cancelación' }
    ]
  };

  // Actualizar estado de loading y error
  useEffect(() => {
    setLoading(activitiesLoading);
    setError(activitiesError || '');
  }, [activitiesLoading, activitiesError]);

  // Cargar actividades al iniciar
  useEffect(() => {
    loadActivities(100); // Cargar más actividades para el historial
  }, [loadActivities]);

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

  // Refrescar datos
  const handleRefresh = useCallback(async () => {
    try {
      await loadActivities(100);
    } catch (err) {
      console.error('Error al refrescar actividades:', err);
    }
  }, [loadActivities]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      entity: 'all',
      type: 'all',
      user: 'all',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  }, []);

  // Filtrar actividades según los filtros aplicados
  const filteredActivities = activities.filter(activity => {
    // Filtro por entidad
    if (filters.entity !== 'all' && activity.entity !== filters.entity) {
      return false;
    }

    // Filtro por tipo de acción
    if (filters.type !== 'all' && activity.type !== filters.type) {
      return false;
    }

    // Filtro por fecha
    if (filters.startDate || filters.endDate) {
      const activityDate = new Date(activity.createdAt);
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (activityDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (activityDate > endDate) return false;
      }
    }

    // Búsqueda por texto
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      return (
        activity.action.toLowerCase().includes(term) ||
        activity.description.toLowerCase().includes(term) ||
        activity.entityName.toLowerCase().includes(term) ||
        activity.userName.toLowerCase().includes(term)
      );
    }

    return true;
  });

  return {
    activities: filteredActivities,
    loading,
    error,
    filters,
    filterOptions,
    handleFilterChange,
    handleSearch,
    handleRefresh,
    clearFilters
  };
};

export default useActivitiesController;