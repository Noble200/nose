import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { useHarvests } from '../contexts/HarvestContext'; 

// Controlador del Dashboard (lógica separada de la presentación)
const useDashboardController = () => {
  const { 
    products, 
    warehouses, 
    transfers, 
    fumigations, 
    loading: stockLoading, 
    error: stockError, 
    loadProducts,
    loadWarehouses
  } = useStock();
  
  const {
    harvests,
    loading: harvestsLoading,
    error: harvestsError,
    loadHarvests
  } = useHarvests(); // Usar el contexto de cosechas
  
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
  
  // Calcular estadísticas y listas filtradas
  const processData = useCallback(() => {
    console.log('Procesando datos del dashboard...'); // Debug
    console.log('Productos disponibles:', products.length); // Debug
    
    // Calcular productos con stock bajo - CORREGIDO
    const lowStock = products.filter(product => {
      // Usar directamente el campo 'stock' del producto
      const currentStock = product.stock || 0;
      const minStock = product.minStock || 0;
      
      console.log(`Producto: ${product.name}, Stock actual: ${currentStock}, Stock mínimo: ${minStock}`); // Debug
      
      return currentStock <= minStock && minStock > 0;
    }).slice(0, 5);
    
    console.log('Productos con stock bajo encontrados:', lowStock.length); // Debug
    
    // Calcular productos próximos a vencer
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
      .slice(0, 5);
    
    // Obtener transferencias pendientes
    const pendingTransfs = transfers
      .filter(transfer => transfer.status === 'pending')
      .map(transfer => ({
        ...transfer,
        sourceWarehouseName: getWarehouseName(transfer.sourceWarehouseId),
        targetWarehouseName: getWarehouseName(transfer.targetWarehouseId)
      }))
      .slice(0, 5);
    
    // Obtener fumigaciones pendientes
    const pendingFumigs = fumigations
      .filter(fumigation => fumigation.status === 'pending' || fumigation.status === 'scheduled')
      .slice(0, 5);
    
    // Obtener cosechas próximas
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(currentDate.getDate() + 90);
    
    const upcoming = (harvests || [])
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
      .slice(0, 5);
    
    // Generar actividades recientes
    const allActivities = [
      ...transfers.map(transfer => ({
        type: 'transfer',
        id: transfer.id,
        date: transfer.updatedAt ? new Date(transfer.updatedAt.seconds * 1000) : new Date(),
        description: `Transferencia de ${transfer.products.length} producto(s) de ${getWarehouseName(transfer.sourceWarehouseId)} a ${getWarehouseName(transfer.targetWarehouseId)}`,
        status: transfer.status
      })),
      ...fumigations.map(fumigation => ({
        type: 'fumigation',
        id: fumigation.id,
        date: fumigation.updatedAt ? new Date(fumigation.updatedAt.seconds * 1000) : new Date(),
        description: `Fumigación en ${fumigation.establishment} (${fumigation.surface} ha)`,
        status: fumigation.status
      })),
      ...(harvests || []).map(harvest => ({
        type: 'harvest',
        id: harvest.id,
        date: harvest.updatedAt ? new Date(harvest.updatedAt.seconds * 1000) : new Date(),
        description: `Cosecha de ${harvest.crop} en ${harvest.establishment} (${harvest.surface} ha)`,
        status: harvest.status
      }))
    ];
    
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
      warehouseCount: warehouses.length,
      pendingTransfersCount: pendingTransfs.length,
      pendingFumigationsCount: pendingFumigs.length,
      upcomingHarvestsCount: upcoming.length
    });
    
    console.log('Estadísticas actualizadas:', {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      expiringCount: expiringSoon.length
    }); // Debug
    
  }, [products, warehouses, transfers, fumigations, harvests]);
  
  // Función para obtener el nombre de un almacén por ID
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };
  
  // Evaluar y establecer estados de carga y error
  useEffect(() => {
    setLoading(stockLoading || harvestsLoading);
    
    if (stockError) {
      setError(stockError);
    } else if (harvestsError) {
      setError(harvestsError);
    } else {
      setError('');
    }
  }, [stockLoading, harvestsLoading, stockError, harvestsError]);
  
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
        loadHarvests()
      ]);
    } catch (err) {
      console.error('Error al recargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadProducts, loadWarehouses, loadHarvests]);
  
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