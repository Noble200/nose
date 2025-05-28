// src/controllers/TransfersController.js - Controlador para transferencias
import { useState, useEffect, useCallback } from 'react';
import { useTransfers } from '../contexts/TransferContext';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';

const useTransfersController = () => {
  const {
    transfers,
    loading: transfersLoading,
    error: transfersError,
    loadTransfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    approveTransfer,
    rejectTransfer,
    shipTransfer,
    receiveTransfer
  } = useTransfers();
  
  const {
    warehouses = [],
    products = [],
    loading: stockLoading,
    error: stockError,
    loadWarehouses,
    loadProducts
  } = useStock();

  const { currentUser } = useAuth();

  // Estados locales
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-transfer', 'edit-transfer', 'view-transfer', 'approve-transfer', 'receive-transfer'
  const [filters, setFilters] = useState({
    status: 'all',
    sourceWarehouse: 'all',
    targetWarehouse: 'all',
    dateRange: { start: null, end: null },
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTransfersList, setFilteredTransfersList] = useState([]);

  // Cargar datos necesarios
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar almacenes y productos si no están cargados
      await Promise.all([
        warehouses.length === 0 ? loadWarehouses() : Promise.resolve(),
        products.length === 0 ? loadProducts() : Promise.resolve(),
        loadTransfers()
      ]);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadWarehouses, loadProducts, loadTransfers, warehouses.length, products.length]);

  // Actualizar estado de carga y error
  useEffect(() => {
    const isLoading = transfersLoading || stockLoading;
    setLoading(isLoading);
    
    // Establecer mensaje de error si lo hay
    if (transfersError) {
      setError(transfersError);
    } else if (stockError) {
      setError(stockError);
    } else {
      setError('');
    }
  }, [transfersLoading, stockLoading, transfersError, stockError]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar transferencias según filtros aplicados
  const getFilteredTransfers = useCallback(() => {
    if (!Array.isArray(transfers) || transfers.length === 0) return [];
    
    // Hacer una copia del array para no modificar el original
    const transfersWithWarehouseRefs = transfers.map(transfer => {
      // Si la transferencia ya tiene referencias completas a los almacenes, usarlas
      if (transfer.sourceWarehouse && typeof transfer.sourceWarehouse === 'object' && transfer.sourceWarehouse.name) {
        return transfer;
      }
      
      // Si no, buscar los almacenes por ID
      const sourceWarehouse = Array.isArray(warehouses) ? warehouses.find(w => w.id === transfer.sourceWarehouseId) : null;
      const targetWarehouse = Array.isArray(warehouses) ? warehouses.find(w => w.id === transfer.targetWarehouseId) : null;
      
      return {
        ...transfer,
        sourceWarehouse: sourceWarehouse ? { id: sourceWarehouse.id, name: sourceWarehouse.name } : { id: transfer.sourceWarehouseId || '', name: 'Almacén desconocido' },
        targetWarehouse: targetWarehouse ? { id: targetWarehouse.id, name: targetWarehouse.name } : { id: transfer.targetWarehouseId || '', name: 'Almacén desconocido' }
      };
    });
    
    return transfersWithWarehouseRefs.filter(transfer => {
      // Filtro por estado
      if (filters.status !== 'all' && transfer.status !== filters.status) {
        return false;
      }
      
      // Filtro por almacén origen
      if (filters.sourceWarehouse !== 'all' && transfer.sourceWarehouseId !== filters.sourceWarehouse) {
        return false;
      }
      
      // Filtro por almacén destino
      if (filters.targetWarehouse !== 'all' && transfer.targetWarehouseId !== filters.targetWarehouse) {
        return false;
      }
      
      // Filtro por fecha
      if (filters.dateRange.start || filters.dateRange.end) {
        const requestDate = transfer.requestDate 
          ? new Date(transfer.requestDate.seconds ? transfer.requestDate.seconds * 1000 : transfer.requestDate)
          : null;
        
        if (!requestDate) return false;
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (requestDate < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Ajustar al final del día
          if (requestDate > endDate) return false;
        }
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          (transfer.transferNumber && transfer.transferNumber.toLowerCase().includes(term)) ||
          (transfer.requestedBy && transfer.requestedBy.toLowerCase().includes(term)) ||
          (transfer.sourceWarehouse.name && transfer.sourceWarehouse.name.toLowerCase().includes(term)) ||
          (transfer.targetWarehouse.name && transfer.targetWarehouse.name.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [transfers, warehouses, filters]);

  // Actualizar transferencias filtradas cuando cambian los filtros, transferencias o almacenes
  useEffect(() => {
    setFilteredTransfersList(getFilteredTransfers());
  }, [getFilteredTransfers]);

  // Abrir diálogo para añadir transferencia
  const handleAddTransfer = useCallback(() => {
    setSelectedTransfer(null);
    setDialogType('add-transfer');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar transferencia
  const handleEditTransfer = useCallback((transfer) => {
    setSelectedTransfer(transfer);
    setDialogType('edit-transfer');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de transferencia
  const handleViewTransfer = useCallback((transfer) => {
    setSelectedTransfer(transfer);
    setDialogType('view-transfer');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para aprobar/rechazar transferencia
  const handleApproveTransfer = useCallback((transfer) => {
    setSelectedTransfer(transfer);
    setDialogType('approve-transfer');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para recibir transferencia
  const handleReceiveTransfer = useCallback((transfer) => {
    setSelectedTransfer(transfer);
    setDialogType('receive-transfer');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de transferencia
  const handleDeleteTransfer = useCallback(async (transferId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transferencia? Esta acción no se puede deshacer.')) {
      try {
        await deleteTransfer(transferId);
        
        // Cerrar el diálogo si estaba abierto para esta transferencia
        if (selectedTransfer && selectedTransfer.id === transferId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar transferencia:', err);
        setError('Error al eliminar transferencia: ' + err.message);
      }
    }
  }, [deleteTransfer, selectedTransfer]);

  // Guardar transferencia (nueva o editada)
  const handleSaveTransfer = useCallback(async (transferData) => {
    try {
      // Añadir información del usuario actual
      const dataWithUser = {
        ...transferData,
        requestedBy: currentUser?.displayName || currentUser?.email || 'Usuario desconocido'
      };

      if (dialogType === 'add-transfer') {
        // Crear nueva transferencia
        await addTransfer(dataWithUser);
      } else if (dialogType === 'edit-transfer' && selectedTransfer) {
        // Actualizar transferencia existente
        await updateTransfer(selectedTransfer.id, dataWithUser);
      }
      
      setDialogOpen(false);
      await loadTransfers();
      return true;
    } catch (err) {
      console.error('Error al guardar transferencia:', err);
      setError('Error al guardar transferencia: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedTransfer, addTransfer, updateTransfer, loadTransfers, currentUser]);

  // Aprobar transferencia
  const handleApproveTransferSubmit = useCallback(async (decision, reason = '') => {
    try {
      if (!selectedTransfer) return;
      
      const approverName = currentUser?.displayName || currentUser?.email || 'Usuario desconocido';
      
      if (decision === 'approve') {
        await approveTransfer(selectedTransfer.id, approverName);
      } else {
        await rejectTransfer(selectedTransfer.id, reason, approverName);
      }
      
      setDialogOpen(false);
      await loadTransfers();
      return true;
    } catch (err) {
      console.error('Error al procesar aprobación:', err);
      setError('Error al procesar aprobación: ' + err.message);
      throw err;
    }
  }, [selectedTransfer, approveTransfer, rejectTransfer, loadTransfers, currentUser]);

  // Enviar transferencia
  const handleShipTransfer = useCallback(async (transferId) => {
    if (window.confirm('¿Confirmas que deseas enviar esta transferencia? Esto descontará el stock del almacén origen.')) {
      try {
        const shipperName = currentUser?.displayName || currentUser?.email || 'Usuario desconocido';
        await shipTransfer(transferId, shipperName);
      } catch (err) {
        console.error('Error al enviar transferencia:', err);
        setError('Error al enviar transferencia: ' + err.message);
      }
    }
  }, [shipTransfer, currentUser]);

  // Recibir transferencia
  const handleReceiveTransferSubmit = useCallback(async (receivedProducts) => {
    try {
      if (!selectedTransfer) return;
      
      const receiverName = currentUser?.displayName || currentUser?.email || 'Usuario desconocido';
      await receiveTransfer(selectedTransfer.id, receiverName, receivedProducts);
      
      setDialogOpen(false);
      await loadTransfers();
      return true;
    } catch (err) {
      console.error('Error al recibir transferencia:', err);
      setError('Error al recibir transferencia: ' + err.message);
      throw err;
    }
  }, [selectedTransfer, receiveTransfer, loadTransfers, currentUser]);

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
    setSelectedTransfer(null);
  }, []);

  // Opciones para filtros
  const filterOptions = {
    status: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'pending', label: 'Pendiente' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'rejected', label: 'Rechazada' },
      { value: 'shipped', label: 'Enviada' },
      { value: 'completed', label: 'Completada' },
      { value: 'cancelled', label: 'Cancelada' }
    ],
    dateRange: {
      start: null,
      end: null
    }
  };

  return {
    transfers: filteredTransfersList,
    warehouses: Array.isArray(warehouses) ? warehouses : [],
    products: Array.isArray(products) ? products : [],
    loading,
    error,
    selectedTransfer,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddTransfer,
    handleEditTransfer,
    handleViewTransfer,
    handleApproveTransfer,
    handleReceiveTransfer,
    handleDeleteTransfer,
    handleSaveTransfer,
    handleApproveTransferSubmit,
    handleShipTransfer,
    handleReceiveTransferSubmit,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useTransfersController;