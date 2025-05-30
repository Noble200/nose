// src/controllers/DashboardController.js - Controlador corregido del Dashboard
import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { useHarvests } from '../contexts/HarvestContext';
import { useFumigations } from '../contexts/FumigationContext';
import { useTransfers } from '../contexts/TransferContext';

// Controlador del Dashboard (lógica separada de la presentación)
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
    console.log('Productos disponibles:', Array.isArray(products) ? products.length : 0); // Debug
    
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
      
      console.log(`Producto: ${product.name}, Stock actual: ${currentStock}, Stock mínimo: ${minStock}`); // Debug
      
      return currentStock <= minStock && minStock > 0;
    }).slice(0, 5);
    
    console.log('Productos con stock bajo encontrados:', lowStock.length); // Debug
    
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
        // Ordenar por fecha de vencimiento más próxima
        const dateA = a.expiryDate.seconds ? a.expiryDate.seconds * 1000 : a.expiryDate;
        const dateB = b.expiryDate.seconds ? b.expiryDate.seconds * 1000 : b.expiryDate;
        return new Date(dateA) - new Date(dateB);
      })
      .slice(0, 5);
    
    // Obtener transferencias pendientes con verificación de array
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
    
    // MEJORADO: Obtener fumigaciones pendientes y programadas con fechas
    const pendingFumigs = Array.isArray(fumigations)
      ? fumigations
          .filter(fumigation => fumigation.status === 'pending' || fumigation.status === 'scheduled')
          .sort((a, b) => {
            // Ordenar por fecha de aplicación más próxima
            const dateA = a.applicationDate 
              ? (a.applicationDate.seconds ? a.applicationDate.seconds * 1000 : a.applicationDate)
              : new Date().getTime() + 999999999; // Poner las sin fecha al final
              
            const dateB = b.applicationDate 
              ? (b.applicationDate.seconds ? b.applicationDate.seconds * 1000 : b.applicationDate)
              : new Date().getTime() + 999999999;
              
            return new Date(dateA) - new Date(dateB);
          })
          .slice(0, 5)
      : [];
    
    // MEJORADO: Obtener cosechas próximas (próximos 90 días) con fechas
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
            // Ordenar por fecha planificada más próxima
            const dateA = a.plannedDate.seconds ? a.plannedDate.seconds * 1000 : a.plannedDate;
            const dateB = b.plannedDate.seconds ? b.plannedDate.seconds * 1000 : b.plannedDate;
            return new Date(dateA) - new Date(dateB);
          })
          .slice(0, 5)
      : [];
    
    // Generar actividades recientes con verificación de arrays
    const allActivities = [];
    
    if (Array.isArray(transfers)) {
      allActivities.push(...transfers.map(transfer => ({
        type: 'transfer',
        id: transfer.id,
        date: transfer.updatedAt ? new Date(transfer.updatedAt.seconds * 1000) : new Date(),
        description: `Transferencia de ${transfer.products?.length || 0} producto(s) de ${getWarehouseName(transfer.sourceWarehouseId)} a ${getWarehouseName(transfer.targetWarehouseId)}`,
        status: transfer.status
      })));
    }
    
    if (Array.isArray(fumigations)) {
      allActivities.push(...fumigations.map(fumigation => ({
        type: 'fumigation',
        id: fumigation.id,
        date: fumigation.updatedAt ? new Date(fumigation.updatedAt.seconds * 1000) : new Date(),
        description: `Fumigación en ${fumigation.establishment} - ${fumigation.crop} (${fumigation.totalSurface || 0} ha)`,
        status: fumigation.status
      })));
    }
    
    if (Array.isArray(harvests)) {
      allActivities.push(...harvests.map(harvest => ({
        type: 'harvest',
        id: harvest.id,
        date: harvest.updatedAt ? new Date(harvest.updatedAt.seconds * 1000) : new Date(),
        description: `Cosecha de ${harvest.crop || 'cultivo'} en ${harvest.field?.name || 'Campo'} (${harvest.totalArea || 0} ${harvest.areaUnit || 'ha'})`,
        status: harvest.status
      })));
    }
    
    // Ordenar por fecha descendente y tomar los 10 más recientes
    const recent = allActivities
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
    
    // Actualizar estados
    setLowStockProducts(lowStock);
    setExpiringSoonProducts(expiringSoon);
    setPendingTransfers(pendingTransfs);
    setPendingFumigations(pendingFumigs);
    setUpcomingHarvests(upcoming);
    setRecentActivities(recent);
    
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
    
    console.log('Estadísticas actualizadas:', {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      expiringCount: expiringSoon.length,
      pendingTransfersCount: pendingTransfs.length,
      pendingFumigationsCount: pendingFumigs.length,
      upcomingHarvestsCount: upcoming.length
    }); // Debug
    
  }, [products, warehouses, transfers, fumigations, harvests]);
  
  // Función para obtener el nombre de un almacén por ID con verificación de array
  const getWarehouseName = (warehouseId) => {
    if (!Array.isArray(warehouses) || !warehouseId) {
      return 'Almacén desconocido';
    }
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };
  
  // Evaluar y establecer estados de carga y error
  useEffect(() => {
    const isLoading = stockLoading || harvestsLoading || fumigationsLoading || transfersLoading;
    setLoading(isLoading);
    
    if (stockError) {
      setError(stockError);
    } else if (harvestsError) {
      setError(harvestsError);
    } else if (fumigationsError) {
      setError(fumigationsError);
    } else if (transfersError) {
      setError(transfersError);
    } else {
      setError('');
    }
  }, [stockLoading, harvestsLoading, fumigationsLoading, transfersLoading, stockError, harvestsError, fumigationsError, transfersError]);
  
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
    recentActivities,
    loading,
    error,
    refreshData
  };
};

export default useDashboardController;