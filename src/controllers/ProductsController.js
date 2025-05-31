// src/controllers/ProductsController.js - Controlador mejorado con registro detallado de cambios
import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../api/firebase';

const useProductsController = () => {
  const {
    products,
    fields,
    warehouses,
    loading: stockLoading,
    error: stockError,
    loadProducts,
    loadFields,
    loadWarehouses
  } = useStock();

  const { logProduct } = useActivityLogger(); // Usar el hook de actividades

  // Estados locales
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-product', 'edit-product', 'view-product'
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    fieldId: 'all',
    expiringSoon: false,
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredProductsList, setFilteredProductsList] = useState([]);

  // Effect para manejar filtros desde URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam === 'stock-low') {
      setFilters(prev => ({ ...prev, stockStatus: 'low' }));
    } else if (filterParam === 'expiring-soon') {
      setFilters(prev => ({ ...prev, expiringSoon: true }));
    }
    
    if (filterParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Función para añadir un producto con logging
  const addProduct = useCallback(async (productData) => {
    try {
      console.log('Datos recibidos para guardar:', productData);
      
      // Preparar datos para Firestore
      const dbProductData = {
        name: productData.name,
        code: productData.code || null,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0,
        minStock: Number(productData.minStock) || 0,
        lotNumber: productData.lotNumber || null,
        storageConditions: productData.storageConditions || null,
        dimensions: productData.dimensions || null,
        supplierCode: productData.supplierCode || null,
        cost: productData.cost ? Number(productData.cost) : null,
        supplierName: productData.supplierName || null,
        supplierContact: productData.supplierContact || null,
        tags: productData.tags || [],
        notes: productData.notes || null,
        fieldId: productData.fieldId || null,
        warehouseId: productData.warehouseId || null,
        lotId: productData.lotId || null,
        storageLevel: productData.storageLevel || 'field',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de vencimiento si existe
      if (productData.expiryDate) {
        if (productData.expiryDate instanceof Date) {
          dbProductData.expiryDate = Timestamp.fromDate(productData.expiryDate);
        } else if (typeof productData.expiryDate === 'string') {
          dbProductData.expiryDate = Timestamp.fromDate(new Date(productData.expiryDate));
        }
      }
      
      // Insertar producto en Firestore
      const productRef = await addDoc(collection(db, 'products'), dbProductData);
      
      // Registrar actividad
      const warehouseName = warehouses.find(w => w.id === productData.warehouseId)?.name || null;
      const fieldName = fields.find(f => f.id === productData.fieldId)?.name || null;
      
      await logProduct('create', {
        id: productRef.id,
        name: productData.name,
        category: productData.category
      }, {
        initialStock: Number(productData.stock) || 0,
        unit: productData.unit,
        warehouse: warehouseName,
        field: fieldName,
        cost: productData.cost ? Number(productData.cost) : null
      });
      
      // Recargar productos
      await loadProducts();
      
      return productRef.id;
    } catch (error) {
      console.error('Error al añadir producto:', error);
      setError('Error al añadir producto: ' + error.message);
      throw error;
    }
  }, [loadProducts, logProduct, warehouses, fields]);

  // Función para actualizar un producto con detección de cambios
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      console.log('Actualizando producto:', productId, productData);
      
      // Obtener los datos actuales del producto para comparar
      const currentProductDoc = await getDoc(doc(db, 'products', productId));
      const currentProduct = currentProductDoc.data();
      
      if (!currentProduct) {
        throw new Error('Producto no encontrado');
      }
      
      // Preparar datos para actualizar
      const updateData = {
        name: productData.name,
        code: productData.code || null,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0,
        minStock: Number(productData.minStock) || 0,
        lotNumber: productData.lotNumber || null,
        storageConditions: productData.storageConditions || null,
        dimensions: productData.dimensions || null,
        supplierCode: productData.supplierCode || null,
        cost: productData.cost ? Number(productData.cost) : null,
        supplierName: productData.supplierName || null,
        supplierContact: productData.supplierContact || null,
        tags: productData.tags || [],
        notes: productData.notes || null,
        fieldId: productData.fieldId || null,
        warehouseId: productData.warehouseId || null,
        lotId: productData.lotId || null,
        storageLevel: productData.storageLevel || 'field',
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de vencimiento si existe
      if (productData.expiryDate) {
        if (productData.expiryDate instanceof Date) {
          updateData.expiryDate = Timestamp.fromDate(productData.expiryDate);
        } else if (typeof productData.expiryDate === 'string') {
          updateData.expiryDate = Timestamp.fromDate(new Date(productData.expiryDate));
        }
      }
      
      // Actualizar producto en Firestore
      await updateDoc(doc(db, 'products', productId), updateData);
      
      // Detectar y registrar cambios específicos
      const changes = detectProductChanges(currentProduct, updateData);
      
      if (changes.length > 0) {
        // Preparar información adicional para el logging
        const additionalData = {
          changes: changes,
          changesCount: changes.length,
          changesSummary: generateChangesSummary(changes)
        };
        
        // Agregar contexto de ubicación si cambió
        if (changes.some(c => c.field === 'warehouseId' || c.field === 'fieldId')) {
          const oldWarehouse = warehouses.find(w => w.id === currentProduct.warehouseId)?.name || 'Sin almacén';
          const newWarehouse = warehouses.find(w => w.id === productData.warehouseId)?.name || 'Sin almacén';
          const oldField = fields.find(f => f.id === currentProduct.fieldId)?.name || 'Sin campo';
          const newField = fields.find(f => f.id === productData.fieldId)?.name || 'Sin campo';
          
          additionalData.locationChange = {
            fromWarehouse: oldWarehouse,
            toWarehouse: newWarehouse,
            fromField: oldField,
            toField: newField
          };
        }
        
        await logProduct('update', {
          id: productId,
          name: productData.name,
          category: productData.category
        }, additionalData);
      }
      
      // Recargar productos
      await loadProducts();
      
      return productId;
    } catch (error) {
      console.error(`Error al actualizar producto ${productId}:`, error);
      setError('Error al actualizar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts, logProduct, warehouses, fields]);

  // Función para detectar cambios entre producto actual y nuevos datos
  const detectProductChanges = (currentProduct, newData) => {
    const changes = [];
    
    // Campos a monitorear con sus nombres legibles
    const fieldsToMonitor = {
      name: 'Nombre',
      stock: 'Stock',
      minStock: 'Stock mínimo',
      cost: 'Costo',
      category: 'Categoría',
      unit: 'Unidad',
      warehouseId: 'Almacén',
      fieldId: 'Campo',
      storageType: 'Tipo de almacenamiento',
      supplierName: 'Proveedor',
      notes: 'Notas'
    };
    
    for (const [field, label] of Object.entries(fieldsToMonitor)) {
      const oldValue = currentProduct[field];
      const newValue = newData[field];
      
      // Comparar valores (considerar null y undefined como equivalentes)
      if (oldValue !== newValue && !(oldValue == null && newValue == null)) {
        changes.push({
          field,
          label,
          oldValue: formatValue(oldValue, field),
          newValue: formatValue(newValue, field),
          type: getChangeType(field, oldValue, newValue)
        });
      }
    }
    
    // Verificar cambio de fecha de vencimiento
    if (currentProduct.expiryDate || newData.expiryDate) {
      const oldDate = currentProduct.expiryDate 
        ? formatFirebaseDate(currentProduct.expiryDate)
        : null;
      const newDate = newData.expiryDate 
        ? formatFirebaseDate(newData.expiryDate)
        : null;
      
      if (oldDate !== newDate) {
        changes.push({
          field: 'expiryDate',
          label: 'Fecha de vencimiento',
          oldValue: oldDate || 'Sin fecha',
          newValue: newDate || 'Sin fecha',
          type: 'date'
        });
      }
    }
    
    return changes;
  };

  // Función para formatear valores según el tipo de campo
  const formatValue = (value, field) => {
    if (value == null) return 'Sin definir';
    
    switch (field) {
      case 'stock':
      case 'minStock':
        return `${value} unidades`;
      case 'cost':
        return value ? `$${Number(value).toLocaleString()}` : '$0';
      case 'warehouseId':
        const warehouse = warehouses.find(w => w.id === value);
        return warehouse ? warehouse.name : 'Almacén desconocido';
      case 'fieldId':
        const field_obj = fields.find(f => f.id === value);
        return field_obj ? field_obj.name : 'Campo desconocido';
      default:
        return String(value);
    }
  };

  // Función para formatear fechas de Firebase
  const formatFirebaseDate = (timestamp) => {
    try {
      let date;
      
      if (timestamp?.seconds) {
        // Timestamp de Firebase
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp?.toDate) {
        // Timestamp object con método toDate
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return null;
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', error);
      return null;
    }
  };

  // Función para determinar el tipo de cambio
  const getChangeType = (field, oldValue, newValue) => {
    switch (field) {
      case 'stock':
        const oldStock = Number(oldValue) || 0;
        const newStock = Number(newValue) || 0;
        if (newStock > oldStock) return 'increase';
        if (newStock < oldStock) return 'decrease';
        return 'update';
      case 'cost':
        const oldCost = Number(oldValue) || 0;
        const newCost = Number(newValue) || 0;
        if (newCost > oldCost) return 'increase';
        if (newCost < oldCost) return 'decrease';
        return 'update';
      case 'warehouseId':
      case 'fieldId':
        return 'location';
      default:
        return 'update';
    }
  };

  // Función para generar resumen de cambios
  const generateChangesSummary = (changes) => {
    const summaryParts = [];
    
    changes.forEach(change => {
      switch (change.type) {
        case 'increase':
          summaryParts.push(`${change.label}: ${change.oldValue} → ${change.newValue} (⬆️)`);
          break;
        case 'decrease':
          summaryParts.push(`${change.label}: ${change.oldValue} → ${change.newValue} (⬇️)`);
          break;
        case 'location':
          summaryParts.push(`${change.label}: ${change.oldValue} → ${change.newValue} (📍)`);
          break;
        default:
          summaryParts.push(`${change.label}: ${change.oldValue} → ${change.newValue}`);
      }
    });
    
    return summaryParts.join(', ');
  };

  // Función para eliminar un producto con logging
  const deleteProduct = useCallback(async (productId) => {
    try {
      // Obtener datos del producto antes de eliminarlo
      const productDoc = await getDoc(doc(db, 'products', productId));
      const productData = productDoc.data();
      
      if (productData) {
        // Eliminar el documento
        await deleteDoc(doc(db, 'products', productId));
        
        // Registrar actividad
        await logProduct('delete', {
          id: productId,
          name: productData.name,
          category: productData.category
        }, {
          finalStock: productData.stock || 0,
          unit: productData.unit,
          warehouse: warehouses.find(w => w.id === productData.warehouseId)?.name,
          field: fields.find(f => f.id === productData.fieldId)?.name
        });
      } else {
        await deleteDoc(doc(db, 'products', productId));
      }
      
      // Recargar productos
      await loadProducts();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar producto ${productId}:`, error);
      setError('Error al eliminar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts, logProduct, warehouses, fields]);

  // ... resto del código del controlador permanece igual ...

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      if (fields.length === 0) {
        await loadFields();
      }
      
      if (warehouses.length === 0) {
        await loadWarehouses();
      }
      
      await loadProducts();
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadFields, loadWarehouses, loadProducts, fields.length, warehouses.length]);

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

  // Función para obtener el estado del stock
  const getStockStatus = (product) => {
    const currentStock = product.stock || 0;
    const minStock = product.minStock || 0;
    
    if (currentStock === 0) return 'empty';
    if (currentStock <= minStock) return 'low';
    if (currentStock <= minStock * 1.5) return 'warning';
    return 'ok';
  };

  // Filtrar productos según filtros aplicados
  const getFilteredProducts = useCallback(() => {
    if (!products || products.length === 0) return [];
    
    return products.filter(product => {
      // Filtro por categoría
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }
      
      // Filtro por estado del stock
      if (filters.stockStatus !== 'all') {
        const stockStatus = getStockStatus(product);
        if (filters.stockStatus !== stockStatus) {
          return false;
        }
      }
      
      // Filtro por productos próximos a vencer
      if (filters.expiringSoon) {
        const currentDate = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
        
        const expiryDate = product.expiryDate 
          ? new Date(product.expiryDate.seconds ? product.expiryDate.seconds * 1000 : product.expiryDate) 
          : null;
          
        if (!expiryDate || expiryDate <= currentDate || expiryDate > thirtyDaysFromNow) {
          return false;
        }
      }
      
      // Filtro por campo
      if (filters.fieldId !== 'all' && product.fieldId !== filters.fieldId) {
        return false;
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          product.name.toLowerCase().includes(term) ||
          (product.code && product.code.toLowerCase().includes(term)) ||
          (product.lotNumber && product.lotNumber.toLowerCase().includes(term)) ||
          (product.tags && product.tags.some(tag => tag.toLowerCase().includes(term)))
        );
      }
      
      return true;
    });
  }, [products, filters]);

  // Actualizar productos filtrados cuando cambian los filtros o los productos
  useEffect(() => {
    setFilteredProductsList(getFilteredProducts());
  }, [getFilteredProducts]);

  // Abrir diálogo para añadir producto
  const handleAddProduct = useCallback(() => {
    setSelectedProduct(null);
    setDialogType('add-product');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar producto
  const handleEditProduct = useCallback((product) => {
    setSelectedProduct(product);
    setDialogType('edit-product');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de producto
  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setDialogType('view-product');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de producto
  const handleDeleteProduct = useCallback(async (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await deleteProduct(productId);
        
        if (selectedProduct && selectedProduct.id === productId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar producto:', err);
        setError('Error al eliminar producto: ' + err.message);
      }
    }
  }, [deleteProduct, selectedProduct]);

  // Guardar producto (nuevo o editado)
  const handleSaveProduct = useCallback(async (productData) => {
    try {
      console.log('handleSaveProduct - Datos recibidos:', productData);
      
      const processedData = {
        ...productData,
        stock: productData.stock ? Number(productData.stock) : 0,
        minStock: productData.minStock ? Number(productData.minStock) : 0,
        cost: productData.cost ? Number(productData.cost) : null
      };
      
      if (dialogType === 'add-product') {
        await addProduct(processedData);
      } else if (dialogType === 'edit-product' && selectedProduct) {
        await updateProduct(selectedProduct.id, processedData);
      }
      
      setDialogOpen(false);
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setError('Error al guardar producto: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedProduct, addProduct, updateProduct, loadProducts]);

  // Cambiar filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      
      if (filterName === 'stockStatus' || filterName === 'category') {
        newFilters.expiringSoon = false;
      }
      
      return newFilters;
    });
  }, []);

  // Buscar por texto
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({
      ...prev,
      searchTerm,
      expiringSoon: false
    }));
  }, []);

  // Cerrar diálogo
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  // Opciones para filtros
  const filterOptions = {
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
    stockStatus: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'empty', label: 'Sin stock' },
      { value: 'low', label: 'Stock bajo' },
      { value: 'warning', label: 'Stock limitado' },
      { value: 'ok', label: 'Stock normal' }
    ]
  };

  // Función para limpiar filtros especiales
  const clearSpecialFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      expiringSoon: false,
      stockStatus: 'all'
    }));
  }, []);

  return {
    products: filteredProductsList,
    fields,
    warehouses,
    loading,
    error,
    selectedProduct,
    dialogOpen,
    dialogType,
    filterOptions,
    filters,
    handleAddProduct,
    handleEditProduct,
    handleViewProduct,
    handleDeleteProduct,
    handleSaveProduct,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    clearSpecialFilters,
    refreshData: loadData
  };
};

export default useProductsController;