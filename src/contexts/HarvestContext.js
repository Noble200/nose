// src/contexts/HarvestContext.js - Contexto corregido con integración de stock
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
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de cosechas
const HarvestContext = createContext();

export function useHarvests() {
  return useContext(HarvestContext);
}

export function HarvestProvider({ children }) {
  const { currentUser } = useAuth();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar cosechas
  const loadHarvests = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando cosechas desde Firestore...'); // Debug
      
      // Crear consulta base
      const harvestsQuery = query(collection(db, 'harvests'), orderBy('plannedDate', 'desc'));
      const querySnapshot = await getDocs(harvestsQuery);
      
      // Mapear documentos a objetos de cosechas
      let harvestsData = [];
      querySnapshot.forEach((doc) => {
        const harvestData = doc.data();
        harvestsData.push({
          id: doc.id,
          field: harvestData.field || {},
          fieldId: harvestData.fieldId || '',
          crop: harvestData.crop || '',
          lots: harvestData.lots || [],
          totalArea: harvestData.totalArea || 0,
          areaUnit: harvestData.areaUnit || 'ha',
          plannedDate: harvestData.plannedDate,
          harvestDate: harvestData.harvestDate || null,
          status: harvestData.status || 'pending',
          estimatedYield: harvestData.estimatedYield || 0,
          actualYield: harvestData.actualYield || 0,
          yieldUnit: harvestData.yieldUnit || 'kg/ha',
          totalHarvested: harvestData.totalHarvested || 0,
          totalHarvestedUnit: harvestData.totalHarvestedUnit || 'kg',
          harvestMethod: harvestData.harvestMethod || '',
          machinery: harvestData.machinery || [],
          workers: harvestData.workers || '',
          targetWarehouse: harvestData.targetWarehouse || '',
          destination: harvestData.destination || '',
          qualityParameters: harvestData.qualityParameters || [],
          qualityResults: harvestData.qualityResults || [],
          notes: harvestData.notes || '',
          harvestNotes: harvestData.harvestNotes || '',
          // Campos para productos
          selectedProducts: harvestData.selectedProducts || [],
          productsHarvested: harvestData.productsHarvested || [],
          createdAt: harvestData.createdAt,
          updatedAt: harvestData.updatedAt
        });
      });
      
      console.log('Total cosechas cargadas:', harvestsData.length); // Debug
      
      // Aplicar filtros si se proporcionan
      if (filters.status) {
        harvestsData = harvestsData.filter(harvest => harvest.status === filters.status);
      }
      
      if (filters.crop) {
        harvestsData = harvestsData.filter(harvest => harvest.crop === filters.crop);
      }

      if (filters.field) {
        harvestsData = harvestsData.filter(harvest => harvest.fieldId === filters.field);
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        harvestsData = harvestsData.filter(harvest => {
          const plannedDate = harvest.plannedDate 
            ? new Date(harvest.plannedDate.seconds ? harvest.plannedDate.seconds * 1000 : harvest.plannedDate) 
            : null;
          
          if (!plannedDate) return false;
          
          return (!start || plannedDate >= new Date(start)) && 
                 (!end || plannedDate <= new Date(end));
        });
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        harvestsData = harvestsData.filter(harvest => 
          (harvest.crop && harvest.crop.toLowerCase().includes(term)) || 
          (harvest.field && harvest.field.name && harvest.field.name.toLowerCase().includes(term)) ||
          (harvest.harvestMethod && harvest.harvestMethod.toLowerCase().includes(term))
        );
      }
      
      setHarvests(harvestsData);
      return harvestsData;
    } catch (error) {
      console.error('Error al cargar cosechas:', error);
      setError('Error al cargar cosechas: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // CORREGIDO: Añadir una cosecha con descuento de stock automático
  const addHarvest = useCallback(async (harvestData) => {
    try {
      setError('');
      
      console.log('Añadiendo cosecha con datos:', harvestData); // Debug
      
      // Usar transacción para asegurar consistencia
      const harvestId = await runTransaction(db, async (transaction) => {
        // Verificar y descontar stock de productos seleccionados
        if (harvestData.selectedProducts && harvestData.selectedProducts.length > 0) {
          console.log('Verificando stock de productos seleccionados...'); // Debug
          
          for (const selectedProduct of harvestData.selectedProducts) {
            const productRef = doc(db, 'products', selectedProduct.productId);
            const productDoc = await transaction.get(productRef);
            
            if (!productDoc.exists()) {
              throw new Error(`El producto con ID ${selectedProduct.productId} no existe`);
            }
            
            const productData = productDoc.data();
            const currentStock = productData.stock || 0;
            const quantityToUse = selectedProduct.quantity || 0;
            
            console.log(`Producto: ${productData.name}, Stock actual: ${currentStock}, Cantidad a usar: ${quantityToUse}`); // Debug
            
            // Verificar que hay suficiente stock
            if (currentStock < quantityToUse) {
              throw new Error(`No hay suficiente stock del producto ${productData.name}. Stock disponible: ${currentStock}, requerido: ${quantityToUse}`);
            }
            
            // Descontar del stock
            const newStock = currentStock - quantityToUse;
            console.log(`Actualizando stock de ${productData.name} de ${currentStock} a ${newStock}`); // Debug
            
            transaction.update(productRef, {
              stock: newStock,
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // Preparar datos para Firestore
        const dbHarvestData = {
          field: harvestData.field || {},
          fieldId: harvestData.fieldId || harvestData.field?.id || '',
          crop: harvestData.crop || '',
          lots: harvestData.lots || [],
          totalArea: harvestData.totalArea || 0,
          areaUnit: harvestData.areaUnit || 'ha',
          status: harvestData.status || 'pending',
          estimatedYield: harvestData.estimatedYield || 0,
          yieldUnit: harvestData.yieldUnit || 'kg/ha',
          harvestMethod: harvestData.harvestMethod || '',
          machinery: harvestData.machinery || [],
          workers: harvestData.workers || '',
          targetWarehouse: harvestData.targetWarehouse || '',
          qualityParameters: harvestData.qualityParameters || [],
          notes: harvestData.notes || '',
          selectedProducts: harvestData.selectedProducts || [],
          productsHarvested: [], // Se llenará al completar la cosecha
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Convertir fechas si existen
        if (harvestData.plannedDate) {
          if (harvestData.plannedDate instanceof Date) {
            dbHarvestData.plannedDate = Timestamp.fromDate(harvestData.plannedDate);
          }
        }
        
        // Insertar cosecha en Firestore
        const harvestRef = doc(collection(db, 'harvests'));
        transaction.set(harvestRef, dbHarvestData);
        
        return harvestRef.id;
      });
      
      console.log('Cosecha creada con ID:', harvestId); // Debug
      
      // Recargar cosechas
      await loadHarvests();
      
      return harvestId;
    } catch (error) {
      console.error('Error al añadir cosecha:', error);
      setError('Error al añadir cosecha: ' + error.message);
      throw error;
    }
  }, [loadHarvests]);

  // Actualizar una cosecha
  const updateHarvest = useCallback(async (harvestId, harvestData) => {
    try {
      setError('');
      
      // Preparar datos para actualizar
      const updateData = {
        ...harvestData,
        updatedAt: serverTimestamp()
      };
      
      // Convertir fechas si existen
      if (harvestData.plannedDate) {
        if (harvestData.plannedDate instanceof Date) {
          updateData.plannedDate = Timestamp.fromDate(harvestData.plannedDate);
        }
      }
      
      // Si viene fecha de cosecha, convertirla
      if (harvestData.harvestDate) {
        if (harvestData.harvestDate instanceof Date) {
          updateData.harvestDate = Timestamp.fromDate(harvestData.harvestDate);
        }
      }
      
      // Actualizar cosecha en Firestore
      await updateDoc(doc(db, 'harvests', harvestId), updateData);
      
      // Recargar cosechas
      await loadHarvests();
      
      return harvestId;
    } catch (error) {
      console.error(`Error al actualizar cosecha ${harvestId}:`, error);
      setError('Error al actualizar cosecha: ' + error.message);
      throw error;
    }
  }, [loadHarvests]);

  // Eliminar una cosecha
  const deleteHarvest = useCallback(async (harvestId) => {
    try {
      setError('');
      
      // Eliminar cosecha de Firestore
      await deleteDoc(doc(db, 'harvests', harvestId));
      
      // Recargar cosechas
      await loadHarvests();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar cosecha ${harvestId}:`, error);
      setError('Error al eliminar cosecha: ' + error.message);
      throw error;
    }
  }, [loadHarvests]);

  // CORREGIDO: Completar una cosecha con adición de productos al inventario
  const completeHarvest = useCallback(async (harvestId, harvestResults) => {
    try {
      setError('');
      
      console.log('Completando cosecha con resultados:', harvestResults); // Debug
      
      // Usar transacción para asegurar consistencia
      await runTransaction(db, async (transaction) => {
        // Obtener la cosecha actual
        const harvestRef = doc(db, 'harvests', harvestId);
        const harvestDoc = await transaction.get(harvestRef);
        
        if (!harvestDoc.exists()) {
          throw new Error('La cosecha no existe');
        }
        
        const harvestData = harvestDoc.data();
        
        // Datos para la actualización de la cosecha
        const updateData = {
          status: 'completed',
          updatedAt: serverTimestamp()
        };
        
        // Añadir los resultados de la cosecha
        if (harvestResults) {
          // Convertir la fecha de cosecha
          if (harvestResults.harvestDate) {
            if (harvestResults.harvestDate instanceof Date) {
              updateData.harvestDate = Timestamp.fromDate(harvestResults.harvestDate);
            }
          }
          
          // Otros campos de resultados
          updateData.actualYield = harvestResults.actualYield || 0;
          updateData.totalHarvested = harvestResults.totalHarvested || null;
          updateData.totalHarvestedUnit = harvestResults.totalHarvestedUnit || 'kg';
          updateData.destination = harvestResults.destination || '';
          updateData.qualityResults = harvestResults.qualityResults || [];
          updateData.harvestNotes = harvestResults.harvestNotes || '';
          updateData.productsHarvested = harvestResults.productsHarvested || [];
        }
        
        // CORREGIDO: Añadir productos cosechados al inventario
        if (harvestResults.productsHarvested && harvestResults.productsHarvested.length > 0) {
          console.log('Añadiendo productos cosechados al inventario...'); // Debug
          
          for (const harvestedProduct of harvestResults.productsHarvested) {
            console.log('Procesando producto cosechado:', harvestedProduct); // Debug
            
            // Crear nuevo producto en el inventario
            const newProductData = {
              name: harvestedProduct.name,
              category: harvestedProduct.category || 'insumo',
              unit: harvestedProduct.unit || 'kg',
              stock: Number(harvestedProduct.quantity) || 0,
              minStock: 0,
              storageType: 'bolsas',
              fieldId: harvestData.fieldId || null,
              warehouseId: harvestedProduct.warehouseId || harvestData.targetWarehouse || null,
              storageLevel: harvestedProduct.warehouseId ? 'warehouse' : 'field',
              lotNumber: `COSECHA-${harvestId.substring(0, 8)}-${Date.now()}`,
              tags: ['cosecha', harvestData.crop || 'cultivo'],
              notes: `Producto obtenido de cosecha de ${harvestData.crop || 'cultivo'} el ${new Date().toLocaleDateString()}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            console.log('Datos del nuevo producto:', newProductData); // Debug
            
            // Insertar nuevo producto
            const productRef = doc(collection(db, 'products'));
            transaction.set(productRef, newProductData);
            
            console.log('Producto añadido al inventario:', harvestedProduct.name); // Debug
          }
        }
        
        // Actualizar la cosecha
        transaction.update(harvestRef, updateData);
        
        console.log('Cosecha completada exitosamente'); // Debug
      });
      
      // Recargar cosechas
      await loadHarvests();
      
      return harvestId;
    } catch (error) {
      console.error(`Error al completar cosecha ${harvestId}:`, error);
      setError('Error al completar cosecha: ' + error.message);
      throw error;
    }
  }, [loadHarvests]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setHarvests([]);
      setLoading(false);
      return;
    }

    loadHarvests()
      .catch(err => {
        console.error('Error al cargar datos iniciales de cosechas:', err);
        setError('Error al cargar datos: ' + err.message);
      });
  }, [currentUser, loadHarvests]);

  // Valor que se proporcionará a través del contexto
  const value = {
    harvests,
    loading,
    error,
    setError,
    loadHarvests,
    addHarvest,
    updateHarvest,
    deleteHarvest,
    completeHarvest
  };

  return (
    <HarvestContext.Provider value={value}>
      {children}
    </HarvestContext.Provider>
  );
}

export default HarvestContext;