// src/controllers/ProductsController.js - Controlador corregido para la gestión de productos
import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

  // Estados locales
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-product', 'edit-product', 'view-product'
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    fieldId: 'all',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredProductsList, setFilteredProductsList] = useState([]);

  // Función para añadir un producto
  const addProduct = useCallback(async (productData) => {
    try {
      console.log('Datos recibidos para guardar:', productData); // Debug
      
      // Preparar datos para Firestore - CORREGIDO
      const dbProductData = {
        name: productData.name,
        code: productData.code || null,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0, // CORREGIDO: asegurar conversión a número
        minStock: Number(productData.minStock) || 0, // CORREGIDO: asegurar conversión a número
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
        }
      }
      
      console.log('Datos a guardar en Firestore:', dbProductData); // Debug
      
      // Insertar producto en Firestore
      const productRef = await addDoc(collection(db, 'products'), dbProductData);
      
      console.log('Producto guardado con ID:', productRef.id); // Debug
      
      // Recargar productos
      await loadProducts();
      
      return productRef.id;
    } catch (error) {
      console.error('Error al añadir producto:', error);
      setError('Error al añadir producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Función para actualizar un producto
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      console.log('Actualizando producto:', productId, productData); // Debug
      
      // Preparar datos para actualizar - CORREGIDO
      const updateData = {
        name: productData.name,
        code: productData.code || null,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0, // CORREGIDO: asegurar conversión a número
        minStock: Number(productData.minStock) || 0, // CORREGIDO: asegurar conversión a número
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
        }
      }
      
      console.log('Datos de actualización:', updateData); // Debug
      
      // Actualizar producto en Firestore
      await updateDoc(doc(db, 'products', productId), updateData);
      
      // Recargar productos
      await loadProducts();
      
      return productId;
    } catch (error) {
      console.error(`Error al actualizar producto ${productId}:`, error);
      setError('Error al actualizar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Función para eliminar un producto
  const deleteProduct = useCallback(async (productId) => {
    try {
      // Eliminar el documento de la colección 'products'
      await deleteDoc(doc(db, 'products', productId));
      
      // Recargar productos
      await loadProducts();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar producto ${productId}:`, error);
      setError('Error al eliminar producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setError('');
      
      // Cargar campos si no están cargados
      if (fields.length === 0) {
        await loadFields();
      }
      
      // Cargar almacenes si no están cargados
      if (warehouses.length === 0) {
        await loadWarehouses();
      }
      
      // Cargar productos
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
    try {
      await deleteProduct(productId);
      
      // Cerrar el diálogo si estaba abierto para este producto
      if (selectedProduct && selectedProduct.id === productId) {
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError('Error al eliminar producto: ' + err.message);
    }
  }, [deleteProduct, selectedProduct]);

  // Guardar producto (nuevo o editado) - CORREGIDO
  const handleSaveProduct = useCallback(async (productData) => {
    try {
      console.log('handleSaveProduct - Datos recibidos:', productData); // Debug
      
      // Asegurar que los números se conviertan correctamente antes de enviar
      const processedData = {
        ...productData,
        stock: productData.stock ? Number(productData.stock) : 0,
        minStock: productData.minStock ? Number(productData.minStock) : 0,
        cost: productData.cost ? Number(productData.cost) : null
      };
      
      console.log('handleSaveProduct - Datos procesados:', processedData); // Debug
      
      if (dialogType === 'add-product') {
        // Crear nuevo producto
        await addProduct(processedData);
      } else if (dialogType === 'edit-product' && selectedProduct) {
        // Actualizar producto existente
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
    handleAddProduct,
    handleEditProduct,
    handleViewProduct,
    handleDeleteProduct,
    handleSaveProduct,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useProductsController;