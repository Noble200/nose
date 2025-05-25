// src/contexts/StockContext.js - Contexto corregido para productos
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de stock
const StockContext = createContext();

export function useStock() {
  return useContext(StockContext);
}

export function StockProvider({ children }) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [fumigations, setFumigations] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar productos - CORREGIDO
  const loadProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando productos desde Firestore...'); // Debug
      
      // Crear consulta base
      const productsQuery = query(collection(db, 'products'), orderBy('name'));
      const querySnapshot = await getDocs(productsQuery);
      
      // Mapear documentos a objetos de productos
      let productsData = [];
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        
        console.log('Producto cargado:', doc.id, productData); // Debug
        
        productsData.push({
          id: doc.id,
          name: productData.name,
          code: productData.code,
          category: productData.category,
          storageType: productData.storageType,
          unit: productData.unit,
          stock: productData.stock || 0, // CORREGIDO: usar 'stock' en lugar de 'quantity'
          minStock: productData.minStock || 0,
          lotNumber: productData.lotNumber,
          storageConditions: productData.storageConditions,
          dimensions: productData.dimensions,
          expiryDate: productData.expiryDate,
          supplierCode: productData.supplierCode,
          cost: productData.cost,
          supplierName: productData.supplierName,
          supplierContact: productData.supplierContact,
          tags: productData.tags || [],
          notes: productData.notes,
          fieldId: productData.fieldId,
          warehouseId: productData.warehouseId,
          lotId: productData.lotId,
          storageLevel: productData.storageLevel,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt
        });
      });
      
      console.log('Total productos cargados:', productsData.length); // Debug
      
      // Aplicar filtros si se proporcionan
      if (filters.category) {
        productsData = productsData.filter(product => product.category === filters.category);
      }
      
      if (filters.minStock) {
        productsData = productsData.filter(product => product.stock <= product.minStock);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        productsData = productsData.filter(product => 
          product.name.toLowerCase().includes(term) || 
          (product.code && product.code.toLowerCase().includes(term)) ||
          (product.lotNumber && product.lotNumber.toLowerCase().includes(term))
        );
      }
      
      setProducts(productsData);
      return productsData;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar almacenes
  const loadWarehouses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      // Crear consulta base
      const warehousesQuery = query(collection(db, 'warehouses'), orderBy('name'));
      const querySnapshot = await getDocs(warehousesQuery);
      
      // Mapear documentos a objetos de almacenes
      let warehousesData = [];
      querySnapshot.forEach((doc) => {
        const warehouseData = doc.data();
        warehousesData.push({
          id: doc.id,
          name: warehouseData.name || '',
          type: warehouseData.type || 'shed',
          location: warehouseData.location || '',
          fieldId: warehouseData.fieldId || '',
          lotId: warehouseData.lotId || '',
          isFieldLevel: warehouseData.isFieldLevel !== undefined ? warehouseData.isFieldLevel : true,
          status: warehouseData.status || 'active',
          capacity: warehouseData.capacity || 0,
          capacityUnit: warehouseData.capacityUnit || 'ton',
          storageCondition: warehouseData.storageCondition || 'normal',
          temperature: warehouseData.temperature || null,
          humidity: warehouseData.humidity || null,
          supervisor: warehouseData.supervisor || '',
          description: warehouseData.description || '',
          notes: warehouseData.notes || '',
          createdAt: warehouseData.createdAt,
          updatedAt: warehouseData.updatedAt
        });
      });
      
      // Aplicar filtros si se proporcionan
      if (filters.status) {
        warehousesData = warehousesData.filter(warehouse => warehouse.status === filters.status);
      }
      
      if (filters.type) {
        warehousesData = warehousesData.filter(warehouse => warehouse.type === filters.type);
      }
      
      if (filters.fieldId) {
        warehousesData = warehousesData.filter(warehouse => warehouse.fieldId === filters.fieldId);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        warehousesData = warehousesData.filter(warehouse => 
          warehouse.name.toLowerCase().includes(term) || 
          (warehouse.description && warehouse.description.toLowerCase().includes(term)) ||
          (warehouse.location && warehouse.location.toLowerCase().includes(term))
        );
      }
      
      setWarehouses(warehousesData);
      return warehousesData;
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      setError('Error al cargar almacenes: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar campos
  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const fieldsQuery = query(collection(db, 'fields'), orderBy('name'));
      const querySnapshot = await getDocs(fieldsQuery);
      
      const fieldsData = [];
      querySnapshot.forEach((doc) => {
        const fieldData = doc.data();
        fieldsData.push({
          id: doc.id,
          name: fieldData.name,
          location: fieldData.location,
          area: fieldData.area,
          areaUnit: fieldData.areaUnit,
          owner: fieldData.owner,
          notes: fieldData.notes,
          lots: fieldData.lots || [],
          createdAt: fieldData.createdAt,
          updatedAt: fieldData.updatedAt
        });
      });
      
      setFields(fieldsData);
      return fieldsData;
    } catch (error) {
      console.error('Error al cargar campos:', error);
      setError('Error al cargar campos: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Añadir un producto - CORREGIDO
  const addProduct = useCallback(async (productData) => {
    try {
      setError('');
      
      console.log('addProduct - Datos recibidos:', productData); // Debug
      
      // Preparar datos para Firestore
      const dbProductData = {
        name: productData.name,
        code: productData.code,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0, // CORREGIDO: usar 'stock' y asegurar conversión
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
        }
      }
      
      console.log('addProduct - Datos a guardar:', dbProductData); // Debug
      
      // Insertar producto en Firestore
      const productRef = await addDoc(collection(db, 'products'), dbProductData);
      
      // Recargar productos
      await loadProducts();
      
      return productRef.id;
    } catch (error) {
      console.error('Error al añadir producto:', error);
      setError('Error al añadir producto: ' + error.message);
      throw error;
    }
  }, [loadProducts]);

  // Actualizar un producto - CORREGIDO
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setError('');
      
      // Preparar datos para actualizar
      const updateData = {
        name: productData.name,
        code: productData.code,
        category: productData.category,
        storageType: productData.storageType,
        unit: productData.unit,
        stock: Number(productData.stock) || 0, // CORREGIDO: usar 'stock' y asegurar conversión
        minStock: Number(productData.minStock) || 0,
        lotNumber: productData.lotNumber,
        storageConditions: productData.storageConditions,
        dimensions: productData.dimensions,
        supplierCode: productData.supplierCode,
        cost: productData.cost ? Number(productData.cost) : null,
        supplierName: productData.supplierName,
        supplierContact: productData.supplierContact,
        tags: productData.tags || [],
        notes: productData.notes,
        fieldId: productData.fieldId,
        warehouseId: productData.warehouseId,
        lotId: productData.lotId,
        storageLevel: productData.storageLevel,
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de vencimiento si existe
      if (productData.expiryDate) {
        if (productData.expiryDate instanceof Date) {
          updateData.expiryDate = Timestamp.fromDate(productData.expiryDate);
        }
      }
      
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

  // Eliminar un producto
  const deleteProduct = useCallback(async (productId) => {
    try {
      setError('');
      
      // Eliminar producto de Firestore
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setWarehouses([]);
      setTransfers([]);
      setFumigations([]);
      setFields([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cargar datos iniciales
    Promise.all([
      loadProducts(),
      loadWarehouses(),
      loadFields()
    ])
      .then(() => {
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar datos: ' + err.message);
        setLoading(false);
      });
  }, [currentUser, loadProducts, loadWarehouses, loadFields]);

  // Valor que se proporcionará a través del contexto
  const value = {
    products,
    warehouses,
    transfers,
    fumigations,
    fields,
    loading,
    error,
    setError,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    loadWarehouses,
    loadFields,
    
    // Funciones para almacenes
    addWarehouse: async (warehouseData) => {
      try {
        setError('');
        const newWarehouseRef = await addDoc(collection(db, 'warehouses'), {
          ...warehouseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await loadWarehouses();
        return newWarehouseRef.id;
      } catch (error) {
        setError('Error al crear almacén: ' + error.message);
        throw error;
      }
    },
    
    updateWarehouse: async (warehouseId, warehouseData) => {
      try {
        setError('');
        await updateDoc(doc(db, 'warehouses', warehouseId), {
          ...warehouseData,
          updatedAt: serverTimestamp()
        });
        await loadWarehouses();
        return warehouseId;
      } catch (error) {
        setError('Error al actualizar almacén: ' + error.message);
        throw error;
      }
    },
    
    deleteWarehouse: async (warehouseId) => {
      try {
        setError('');
        await deleteDoc(doc(db, 'warehouses', warehouseId));
        await loadWarehouses();
        return true;
      } catch (error) {
        setError('Error al eliminar almacén: ' + error.message);
        throw error;
      }
    }
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

export default StockContext;