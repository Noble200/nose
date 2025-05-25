// src/controllers/WarehousesController.js - Controlador para la gestión de almacenes
import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';

const useWarehousesController = () => {
  const {
    warehouses,
    fields,
    loading: stockLoading,
    error: stockError,
    loadWarehouses,
    loadFields
  } = useStock();

  // Estados locales
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-warehouse', 'edit-warehouse', 'view-warehouse'
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    fieldId: 'all',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredWarehousesList, setFilteredWarehousesList] = useState([]);

  // Función para añadir un almacén
  const addWarehouse = useCallback(async (warehouseData) => {
    try {
      // Añadir documento a la colección 'warehouses'
      const warehouseRef = await addDoc(collection(db, 'warehouses'), {
        ...warehouseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Recargar almacenes
      await loadWarehouses();
      
      return warehouseRef.id;
    } catch (error) {
      console.error('Error al añadir almacén:', error);
      setError('Error al añadir almacén: ' + error.message);
      throw error;
    }
  }, [loadWarehouses]);

  // Función para actualizar un almacén
  const updateWarehouse = useCallback(async (warehouseId, warehouseData) => {
    try {
      // Actualizar el documento en la colección 'warehouses'
      await updateDoc(doc(db, 'warehouses', warehouseId), {
        ...warehouseData,
        updatedAt: serverTimestamp()
      });
      
      // Recargar almacenes
      await loadWarehouses();
      
      return warehouseId;
    } catch (error) {
      console.error(`Error al actualizar almacén ${warehouseId}:`, error);
      setError('Error al actualizar almacén: ' + error.message);
      throw error;
    }
  }, [loadWarehouses]);

  // Función para eliminar un almacén
  const deleteWarehouse = useCallback(async (warehouseId) => {
    try {
      // Eliminar el documento de la colección 'warehouses'
      await deleteDoc(doc(db, 'warehouses', warehouseId));
      
      // Recargar almacenes
      await loadWarehouses();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar almacén ${warehouseId}:`, error);
      setError('Error al eliminar almacén: ' + error.message);
      throw error;
    }
  }, [loadWarehouses]);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar campos si no están cargados
      if (fields.length === 0) {
        await loadFields();
      }
      
      // Cargar almacenes
      await loadWarehouses();
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadFields, loadWarehouses, fields.length]);

  // Actualizar estado de carga y error
  useEffect(() => {
    setLoading(stockLoading);
    if (stockError) {
      setError(stockError);
    }
  }, [stockLoading, stockError]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar almacenes según filtros aplicados
  const getFilteredWarehouses = useCallback(() => {
    if (!warehouses || warehouses.length === 0) return [];
    
    return warehouses.filter(warehouse => {
      // Filtro por estado
      if (filters.status !== 'all' && warehouse.status !== filters.status) {
        return false;
      }
      
      // Filtro por tipo
      if (filters.type !== 'all' && warehouse.type !== filters.type) {
        return false;
      }
      
      // Filtro por campo
      if (filters.fieldId !== 'all' && warehouse.fieldId !== filters.fieldId) {
        return false;
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          warehouse.name.toLowerCase().includes(term) ||
          (warehouse.description && warehouse.description.toLowerCase().includes(term)) ||
          (warehouse.location && warehouse.location.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [warehouses, filters]);

  // Actualizar almacenes filtrados cuando cambian los filtros o los almacenes
  useEffect(() => {
    setFilteredWarehousesList(getFilteredWarehouses());
  }, [getFilteredWarehouses]);

  // Abrir diálogo para añadir almacén
  const handleAddWarehouse = useCallback(() => {
    setSelectedWarehouse(null);
    setDialogType('add-warehouse');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar almacén
  const handleEditWarehouse = useCallback((warehouse) => {
    setSelectedWarehouse(warehouse);
    setDialogType('edit-warehouse');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de almacén
  const handleViewWarehouse = useCallback((warehouse) => {
    setSelectedWarehouse(warehouse);
    setDialogType('view-warehouse');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de almacén
  const handleDeleteWarehouse = useCallback(async (warehouseId) => {
    try {
      await deleteWarehouse(warehouseId);
      
      // Cerrar el diálogo si estaba abierto para este almacén
      if (selectedWarehouse && selectedWarehouse.id === warehouseId) {
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error al eliminar almacén:', err);
      setError('Error al eliminar almacén: ' + err.message);
    }
  }, [deleteWarehouse, selectedWarehouse]);

  // Guardar almacén (nuevo o editado)
  const handleSaveWarehouse = useCallback(async (warehouseData) => {
    try {
      if (dialogType === 'add-warehouse') {
        // Crear nuevo almacén
        await addWarehouse(warehouseData);
      } else if (dialogType === 'edit-warehouse' && selectedWarehouse) {
        // Actualizar almacén existente
        await updateWarehouse(selectedWarehouse.id, warehouseData);
      }
      
      setDialogOpen(false);
      await loadWarehouses();
      return true;
    } catch (err) {
      console.error('Error al guardar almacén:', err);
      setError('Error al guardar almacén: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedWarehouse, addWarehouse, updateWarehouse, loadWarehouses]);

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
    setSelectedWarehouse(null);
  }, []);

  // Opciones para filtros
  const filterOptions = {
    status: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
      { value: 'maintenance', label: 'En mantenimiento' },
      { value: 'full', label: 'Lleno' }
    ],
    warehouseTypes: [
      { value: 'all', label: 'Todos los tipos' },
      { value: 'silo', label: 'Silo' },
      { value: 'shed', label: 'Galpón' },
      { value: 'barn', label: 'Granero' },
      { value: 'cellar', label: 'Depósito' },
      { value: 'coldroom', label: 'Cámara frigorífica' },
      { value: 'outdoor', label: 'Almacenamiento exterior' },
      { value: 'other', label: 'Otro' }
    ]
  };

  return {
    warehouses: filteredWarehousesList,
    fields,
    loading,
    error,
    selectedWarehouse,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddWarehouse,
    handleEditWarehouse,
    handleViewWarehouse,
    handleDeleteWarehouse,
    handleSaveWarehouse,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useWarehousesController;