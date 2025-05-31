// src/controllers/DashboardController.js - Controlador del Dashboard actualizado con actividades reales
import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { useHarvests } from '../contexts/HarvestContext';
import { useFumigations } from '../contexts/FumigationContext';
import { useTransfers } from '../contexts/TransferContext';
import { useActivities } from '../contexts/ActivityContext'; // NUEVO

const useDashboardController = () => {
  const { 
    products = [], 
    warehouses = [], 
    loading: stockLoading, 
    error: stockError, 
    loadProducts,
    loadWarehouses
  } = useStock();
  
  const {
    harvests = [],
    loading: harvestsLoading,
    error: harvestsError,
    loadHarvests
  } = useHarvests();

  const {
    fumigations = [],
    loading: fumigationsLoading,
    error: fumigationsError,
    loadFumigations
  } = useFumigations();

  const {
    transfers = [],
    loading: transfersLoading,
    error: transfersError,
    loadTransfers
  } = useTransfers();

  // NUEVO: Usar actividades reales del contexto
  const {
    getRecentActivities,
    loading: activitiesLoading,
    error: activitiesError
  } = useActivities();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    warehouseCount: 0,
    pendingTransfersCount: 0,
    pendingFumigationsCount: 0,
    upcomingHarvestsCount: 0
  });
  
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingFumigations, setPendingFumigations] = useState([]);
  const [upcomingHarvests, setUpcomingHarvests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calcular estadísticas y listas filtradas con verificación de arrays
  const processData = useCallback(() => {
    console.log('Procesando datos del dashboard...'); // Debug
    
    // Verificar que products sea un array antes de usar filter
    if (!Array.isArray(products)) {
      console.warn('Products no es un array:', products);
      setLowStockProducts([]);
      setExpiringSoonProducts([]);
      setStats(prev => ({ ...prev, totalProducts: 0, lowStockCount: 0, expiringCount: 0 }));
      return;
    }
    
    // Calcular productos con stock bajo
    const lowStock = products.filter(product => {
      const currentStock = product.stock || 0;
      const minStock = product.minStock || 0;
      return currentStock <= minStock && minStock > 0;
    }).slice(0, 5);
    
    // Calcular productos próximos a vencer (próximos 30 días)
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
    
    const expiringSoon = products
      .filter(product => {
        const expiryDate = product.expiryDate 
          ? new Date(product.expiryDate.seconds ? product.expiryDate.seconds * 1000 : product.expiryDate) 
          : null;
        return expiryDate && expiryDate > currentDate && expiryDate < thirtyDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = a.expiryDate.seconds ? a.expiryDate.seconds * 1000 : a.expiryDate;
        const dateB = b.expiryDate.seconds ? b.expiryDate.seconds * 1000 : b.expiryDate;
        return new Date(dateA) - new Date(dateB);
      })
      .slice(0, 5);
    
    // Obtener transferencias pendientes
    const pendingTransfs = Array.isArray(transfers) 
      ? transfers
          .filter(transfer => transfer.status === 'pending' || transfer.status === 'approved' || transfer.status === 'shipped')
          .map(transfer => ({
            ...transfer,
            sourceWarehouseName: getWarehouseName(transfer.sourceWarehouseId),
            targetWarehouseName: getWarehouseName(transfer.targetWarehouseId)
          }))
          .slice(0, 5)
      : [];
    
    // Obtener fumigaciones pendientes y programadas
    const pendingFumigs = Array.isArray(fumigations)
      ? fumigations
          .filter(fumigation => fumigation.status === 'pending' || fumigation.status === 'scheduled')
          .sort((a, b) => {
            const dateA = a.applicationDate 
              ? (a.applicationDate.seconds ? a.applicationDate.seconds * 1000 : a.applicationDate)
              : new Date().getTime() + 999999999;
              
            const dateB = b.applicationDate 
              ? (b.applicationDate.seconds ? b.applicationDate.seconds * 1000 : b.applicationDate)
              : new Date().getTime() + 999999999;
              
            return new Date(dateA) - new Date(dateB);
          })
          .slice(0, 5)
      : [];
    
    // Obtener cosechas próximas (próximos 90 días)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(currentDate.getDate() + 90);
    
    const upcoming = Array.isArray(harvests)
      ? harvests
          .filter(harvest => {
            const plannedDate = harvest.plannedDate
              ? new Date(harvest.plannedDate.seconds ? harvest.plannedDate.seconds * 1000 : harvest.plannedDate)
              : null;
            return plannedDate && plannedDate > currentDate && plannedDate < ninetyDaysFromNow &&
                   (harvest.status === 'pending' || harvest.status === 'scheduled');
          })
          .sort((a, b) => {
            const dateA = a.plannedDate.seconds ? a.plannedDate.seconds * 1000 : a.plannedDate;
            const dateB = b.plannedDate.seconds ? b.plannedDate.seconds * 1000 : b.plannedDate;
            return new Date(dateA) - new Date(dateB);
          })
          .slice(0, 5)
      : [];
    
    // ACTUALIZADO: Usar actividades reales del contexto
    const recent = getRecentActivities ? getRecentActivities() : [];
    
    // Actualizar estados
    setLowStockProducts(lowStock);
    setExpiringSoonProducts(expiringSoon);
    setPendingTransfers(pendingTransfs);
    setPendingFumigations(pendingFumigs);
    setUpcomingHarvests(upcoming);
    setRecentActivities(recent); // ACTUALIZADO: Usar actividades reales
    
    // Actualizar estadísticas
    setStats({
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      expiringCount: expiringSoon.length,
      warehouseCount: Array.isArray(warehouses) ? warehouses.length : 0,
      pendingTransfersCount: pendingTransfs.length,
      pendingFumigationsCount: pendingFumigs.length,
      upcomingHarvestsCount: upcoming.length
    });
    
  }, [products, warehouses, transfers, fumigations, harvests, getRecentActivities]);
  
  // Función para obtener el nombre de un almacén por ID
  const getWarehouseName = (warehouseId) => {
    if (!Array.isArray(warehouses) || !warehouseId) {
      return 'Almacén desconocido';
    }
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };
  
  // ACTUALIZADO: Evaluar estados de carga y error incluyendo actividades
  useEffect(() => {
    const isLoading = stockLoading || harvestsLoading || fumigationsLoading || 
                     transfersLoading || activitiesLoading;
    setLoading(isLoading);
    
    if (stockError) {
      setError(stockError);
    } else if (harvestsError) {
      setError(harvestsError);
    } else if (fumigationsError) {
      setError(fumigationsError);
    } else if (transfersError) {
      setError(transfersError);
    } else if (activitiesError) {
      setError(activitiesError);
    } else {
      setError('');
    }
  }, [stockLoading, harvestsLoading, fumigationsLoading, transfersLoading, activitiesLoading,
      stockError, harvestsError, fumigationsError, transfersError, activitiesError]);
  
  // Cargar datos cuando cambien las dependencias
  useEffect(() => {
    if (!loading) {
      processData();
    }
  }, [products, warehouses, transfers, fumigations, harvests, loading, processData]);
  
  // Función para recargar datos
  const refreshData = useCallback(async () => {
    try {
      setError('');
      await Promise.all([
        loadProducts(),
        loadWarehouses(),
        loadHarvests(),
        loadFumigations(),
        loadTransfers()
        // Las actividades se cargan automáticamente por el contexto
      ]);
    } catch (err) {
      console.error('Error al recargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadProducts, loadWarehouses, loadHarvests, loadFumigations, loadTransfers]);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Retornar estados y funciones necesarias para el componente visual
  return {
    stats,
    lowStockProducts,
    expiringSoonProducts,
    pendingTransfers,
    pendingFumigations,
    upcomingHarvests,
    recentActivities, // ACTUALIZADO: Ahora contiene actividades reales
    loading,
    error,
    refreshData
  };
};

export default useDashboardController;