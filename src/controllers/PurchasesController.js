// src/controllers/PurchasesController.js - Controlador para la gestión de compras
import { useState, useEffect, useCallback } from 'react';
import { usePurchases } from '../contexts/PurchaseContext';
import { useStock } from '../contexts/StockContext';

const usePurchasesController = () => {
  const {
    purchases,
    loading: purchasesLoading,
    error: purchasesError,
    loadPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    createDelivery,
    completeDelivery,
    cancelDelivery
  } = usePurchases();
  
  const {
    warehouses = [],
    loading: warehousesLoading,
    error: warehousesError,
    loadWarehouses
  } = useStock();

  // Estados locales
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-purchase', 'edit-purchase', 'view-purchase', 'add-delivery', 'view-delivery'
  const [filters, setFilters] = useState({
    status: 'all',
    supplier: '',
    dateRange: { start: null, end: null },
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredPurchasesList, setFilteredPurchasesList] = useState([]);

  // Cargar datos necesarios
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar almacenes y compras
      await Promise.all([
        warehouses.length === 0 ? loadWarehouses() : Promise.resolve(),
        loadPurchases()
      ]);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadWarehouses, loadPurchases, warehouses.length]);

  // Actualizar estado de carga y error
  useEffect(() => {
    const isLoading = purchasesLoading || warehousesLoading;
    setLoading(isLoading);
    
    // Establecer mensaje de error si lo hay
    if (purchasesError) {
      setError(purchasesError);
    } else if (warehousesError) {
      setError(warehousesError);
    } else {
      setError('');
    }
  }, [purchasesLoading, warehousesLoading, purchasesError, warehousesError]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar compras según filtros aplicados
  const getFilteredPurchases = useCallback(() => {
    if (!Array.isArray(purchases) || purchases.length === 0) return [];
    
    return purchases.filter(purchase => {
      // Filtro por estado
      if (filters.status !== 'all' && purchase.status !== filters.status) {
        return false;
      }
      
      // Filtro por proveedor
      if (filters.supplier && !purchase.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) {
        return false;
      }
      
      // Filtro por fecha
      if (filters.dateRange.start || filters.dateRange.end) {
        const purchaseDate = purchase.purchaseDate
          ? new Date(purchase.purchaseDate.seconds ? purchase.purchaseDate.seconds * 1000 : purchase.purchaseDate)
          : null;
        
        if (!purchaseDate) return false;
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (purchaseDate < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Ajustar al final del día
          if (purchaseDate > endDate) return false;
        }
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          (purchase.purchaseNumber && purchase.purchaseNumber.toLowerCase().includes(term)) ||
          (purchase.supplier && purchase.supplier.toLowerCase().includes(term)) ||
          purchase.products.some(product => 
            product.name && product.name.toLowerCase().includes(term)
          )
        );
      }
      
      return true;
    });
  }, [purchases, filters]);

  // Actualizar compras filtradas cuando cambian los filtros o compras
  useEffect(() => {
    setFilteredPurchasesList(getFilteredPurchases());
  }, [getFilteredPurchases]);

  // Abrir diálogo para añadir compra
  const handleAddPurchase = useCallback(() => {
    setSelectedPurchase(null);
    setSelectedDelivery(null);
    setDialogType('add-purchase');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar compra
  const handleEditPurchase = useCallback((purchase) => {
    setSelectedPurchase(purchase);
    setSelectedDelivery(null);
    setDialogType('edit-purchase');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de compra
  const handleViewPurchase = useCallback((purchase) => {
    setSelectedPurchase(purchase);
    setSelectedDelivery(null);
    setDialogType('view-purchase');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para crear entrega
  const handleAddDelivery = useCallback((purchase) => {
    setSelectedPurchase(purchase);
    setSelectedDelivery(null);
    setDialogType('add-delivery');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver entrega
  const handleViewDelivery = useCallback((purchase, delivery) => {
    setSelectedPurchase(purchase);
    setSelectedDelivery(delivery);
    setDialogType('view-delivery');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de compra
  const handleDeletePurchase = useCallback(async (purchaseId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.')) {
      try {
        await deletePurchase(purchaseId);
        
        // Cerrar el diálogo si estaba abierto para esta compra
        if (selectedPurchase && selectedPurchase.id === purchaseId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar compra:', err);
        setError('Error al eliminar compra: ' + err.message);
      }
    }
  }, [deletePurchase, selectedPurchase]);

  // Guardar compra (nueva o editada)
  const handleSavePurchase = useCallback(async (purchaseData) => {
    try {
      if (dialogType === 'add-purchase') {
        // Crear nueva compra
        await addPurchase(purchaseData);
      } else if (dialogType === 'edit-purchase' && selectedPurchase) {
        // Actualizar compra existente
        await updatePurchase(selectedPurchase.id, purchaseData);
      }
      
      setDialogOpen(false);
      await loadPurchases();
      return true;
    } catch (err) {
      console.error('Error al guardar compra:', err);
      setError('Error al guardar compra: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedPurchase, addPurchase, updatePurchase, loadPurchases]);

  // Crear entrega
  const handleCreateDelivery = useCallback(async (deliveryData) => {
    try {
      if (!selectedPurchase) return;
      
      await createDelivery(selectedPurchase.id, deliveryData);
      
      setDialogOpen(false);
      await loadPurchases();
      return true;
    } catch (err) {
      console.error('Error al crear entrega:', err);
      setError('Error al crear entrega: ' + err.message);
      throw err;
    }
  }, [selectedPurchase, createDelivery, loadPurchases]);

  // Completar entrega
  const handleCompleteDelivery = useCallback(async (purchaseId, deliveryId) => {
    if (window.confirm('¿Confirmas que la entrega ha llegado y deseas añadir los productos al inventario?')) {
      try {
        await completeDelivery(purchaseId, deliveryId);
      } catch (err) {
        console.error('Error al completar entrega:', err);
        setError('Error al completar entrega: ' + err.message);
      }
    }
  }, [completeDelivery]);

  // Cancelar entrega
  const handleCancelDelivery = useCallback(async (purchaseId, deliveryId) => {
    const reason = window.prompt('¿Por qué deseas cancelar esta entrega? (opcional)');
    if (reason !== null) { // El usuario no canceló el prompt
      try {
        await cancelDelivery(purchaseId, deliveryId, reason);
      } catch (err) {
        console.error('Error al cancelar entrega:', err);
        setError('Error al cancelar entrega: ' + err.message);
      }
    }
  }, [cancelDelivery]);

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
    setSelectedPurchase(null);
    setSelectedDelivery(null);
  }, []);

  // Obtener productos únicos de todas las compras para el filtro
  const getUniqueSuppliers = useCallback(() => {
    const suppliers = new Set();
    purchases.forEach(purchase => {
      if (purchase.supplier) {
        suppliers.add(purchase.supplier);
      }
    });
    return Array.from(suppliers).sort();
  }, [purchases]);

  // Calcular estadísticas de compras
  const getStatistics = useCallback(() => {
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const pendingPurchases = purchases.filter(p => p.status === 'pending').length;
    const completedPurchases = purchases.filter(p => p.status === 'completed').length;
    const partialDeliveries = purchases.filter(p => p.status === 'partial_delivered').length;
    const totalFreightPaid = purchases.reduce((sum, purchase) => sum + (purchase.totalFreightPaid || 0), 0);
    
    return {
      totalPurchases,
      totalAmount,
      pendingPurchases,
      completedPurchases,
      partialDeliveries,
      totalFreightPaid
    };
  }, [purchases]);

  // Opciones para filtros
  const filterOptions = {
    status: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'partial_delivered', label: 'Entrega parcial' },
      { value: 'completed', label: 'Completada' },
      { value: 'cancelled', label: 'Cancelada' }
    ],
    suppliers: getUniqueSuppliers(),
    dateRange: {
      start: null,
      end: null
    }
  };

  return {
    purchases: filteredPurchasesList,
    warehouses: Array.isArray(warehouses) ? warehouses : [],
    loading,
    error,
    selectedPurchase,
    selectedDelivery,
    dialogOpen,
    dialogType,
    filterOptions,
    statistics: getStatistics(),
    handleAddPurchase,
    handleEditPurchase,
    handleViewPurchase,
    handleAddDelivery,
    handleViewDelivery,
    handleDeletePurchase,
    handleSavePurchase,
    handleCreateDelivery,
    handleCompleteDelivery,
    handleCancelDelivery,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default usePurchasesController;