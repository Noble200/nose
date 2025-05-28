// src/contexts/FumigationContext.js - CORREGIDO: Transacción Firestore
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
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de fumigaciones
const FumigationContext = createContext();

export function useFumigations() {
  return useContext(FumigationContext);
}

export function FumigationProvider({ children }) {
  const { currentUser } = useAuth();
  const [fumigations, setFumigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar fumigaciones
  const loadFumigations = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      // Crear consulta base
      const fumigationsQuery = query(collection(db, 'fumigations'), orderBy('applicationDate', 'desc'));
      const querySnapshot = await getDocs(fumigationsQuery);
      
      // Mapear documentos a objetos de fumigaciones
      let fumigationsData = [];
      querySnapshot.forEach((doc) => {
        const fumigationData = doc.data();
        fumigationsData.push({
          id: doc.id,
          orderNumber: fumigationData.orderNumber || '',
          applicationDate: fumigationData.applicationDate,
          establishment: fumigationData.establishment || '',
          applicator: fumigationData.applicator || '',
          field: fumigationData.field || {},
          fieldId: fumigationData.fieldId || '',
          crop: fumigationData.crop || '',
          lots: fumigationData.lots || [],
          totalSurface: fumigationData.totalSurface || 0,
          surfaceUnit: fumigationData.surfaceUnit || 'ha',
          selectedProducts: fumigationData.selectedProducts || [],
          applicationMethod: fumigationData.applicationMethod || '',
          flowRate: fumigationData.flowRate || 80,
          observations: fumigationData.observations || '',
          status: fumigationData.status || 'pending',
          startDateTime: fumigationData.startDateTime || null,
          endDateTime: fumigationData.endDateTime || null,
          weatherConditions: fumigationData.weatherConditions || {},
          completionNotes: fumigationData.completionNotes || '',
          createdAt: fumigationData.createdAt,
          updatedAt: fumigationData.updatedAt
        });
      });
      
      // Aplicar filtros si se proporcionan
      if (filters.status) {
        fumigationsData = fumigationsData.filter(fumigation => fumigation.status === filters.status);
      }
      
      if (filters.crop) {
        fumigationsData = fumigationsData.filter(fumigation => fumigation.crop === filters.crop);
      }

      if (filters.field) {
        fumigationsData = fumigationsData.filter(fumigation => fumigation.fieldId === filters.field);
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        fumigationsData = fumigationsData.filter(fumigation => {
          const appDate = fumigation.applicationDate 
            ? new Date(fumigation.applicationDate.seconds ? fumigation.applicationDate.seconds * 1000 : fumigation.applicationDate) 
            : null;
          
          if (!appDate) return false;
          
          return (!start || appDate >= new Date(start)) && 
                 (!end || appDate <= new Date(end));
        });
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        fumigationsData = fumigationsData.filter(fumigation => 
          (fumigation.establishment && fumigation.establishment.toLowerCase().includes(term)) || 
          (fumigation.applicator && fumigation.applicator.toLowerCase().includes(term)) ||
          (fumigation.crop && fumigation.crop.toLowerCase().includes(term)) ||
          (fumigation.orderNumber && fumigation.orderNumber.toLowerCase().includes(term))
        );
      }
      
      setFumigations(fumigationsData);
      return fumigationsData;
    } catch (error) {
      console.error('Error al cargar fumigaciones:', error);
      setError('Error al cargar fumigaciones: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar número de orden automático
  const generateOrderNumber = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const fumigationsQuery = query(
        collection(db, 'fumigations'),
        where('orderNumber', '>=', `${currentYear}-`),
        where('orderNumber', '<', `${currentYear + 1}-`),
        orderBy('orderNumber', 'desc')
      );
      
      const querySnapshot = await getDocs(fumigationsQuery);
      
      let nextNumber = 1;
      if (!querySnapshot.empty) {
        const lastOrder = querySnapshot.docs[0].data().orderNumber;
        const lastNumber = parseInt(lastOrder.split('-')[1]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error al generar número de orden:', error);
      return `${new Date().getFullYear()}-001`;
    }
  }, []);

  // Añadir una fumigación
  const addFumigation = useCallback(async (fumigationData) => {
    try {
      setError('');
      
      // Generar número de orden si no se proporciona
      if (!fumigationData.orderNumber) {
        fumigationData.orderNumber = await generateOrderNumber();
      }
      
      // Preparar datos para Firestore
      const dbFumigationData = {
        orderNumber: fumigationData.orderNumber,
        establishment: fumigationData.establishment || '',
        applicator: fumigationData.applicator || '',
        field: fumigationData.field || {},
        fieldId: fumigationData.fieldId || fumigationData.field?.id || '',
        crop: fumigationData.crop || '',
        lots: fumigationData.lots || [],
        totalSurface: fumigationData.totalSurface || 0,
        surfaceUnit: fumigationData.surfaceUnit || 'ha',
        selectedProducts: fumigationData.selectedProducts || [],
        applicationMethod: fumigationData.applicationMethod || '',
        flowRate: fumigationData.flowRate || 80,
        observations: fumigationData.observations || '',
        status: fumigationData.status || 'pending',
        weatherConditions: fumigationData.weatherConditions || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de aplicación si existe
      if (fumigationData.applicationDate) {
        if (fumigationData.applicationDate instanceof Date) {
          dbFumigationData.applicationDate = Timestamp.fromDate(fumigationData.applicationDate);
        }
      }
      
      console.log('Añadiendo fumigación:', dbFumigationData); // Debug
      
      // Insertar fumigación en Firestore
      const fumigationRef = await addDoc(collection(db, 'fumigations'), dbFumigationData);
      
      console.log('Fumigación añadida con ID:', fumigationRef.id); // Debug
      
      // Recargar fumigaciones
      await loadFumigations();
      
      return fumigationRef.id;
    } catch (error) {
      console.error('Error al añadir fumigación:', error);
      setError('Error al añadir fumigación: ' + error.message);
      throw error;
    }
  }, [loadFumigations, generateOrderNumber]);

  // Actualizar una fumigación
  const updateFumigation = useCallback(async (fumigationId, fumigationData) => {
    try {
      setError('');
      
      console.log('Actualizando fumigación:', fumigationId, fumigationData); // Debug
      
      // Preparar datos para actualizar
      const updateData = {
        ...fumigationData,
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de aplicación si existe
      if (fumigationData.applicationDate) {
        if (fumigationData.applicationDate instanceof Date) {
          updateData.applicationDate = Timestamp.fromDate(fumigationData.applicationDate);
        }
      }
      
      // Convertir fechas de inicio y fin si existen
      if (fumigationData.startDateTime) {
        if (fumigationData.startDateTime instanceof Date) {
          updateData.startDateTime = Timestamp.fromDate(fumigationData.startDateTime);
        }
      }
      
      if (fumigationData.endDateTime) {
        if (fumigationData.endDateTime instanceof Date) {
          updateData.endDateTime = Timestamp.fromDate(fumigationData.endDateTime);
        }
      }
      
      // Actualizar fumigación en Firestore
      await updateDoc(doc(db, 'fumigations', fumigationId), updateData);
      
      console.log('Fumigación actualizada:', fumigationId); // Debug
      
      // Recargar fumigaciones
      await loadFumigations();
      
      return fumigationId;
    } catch (error) {
      console.error(`Error al actualizar fumigación ${fumigationId}:`, error);
      setError('Error al actualizar fumigación: ' + error.message);
      throw error;
    }
  }, [loadFumigations]);

  // Eliminar una fumigación
  const deleteFumigation = useCallback(async (fumigationId) => {
    try {
      setError('');
      
      console.log('Eliminando fumigación:', fumigationId); // Debug
      
      // Eliminar fumigación de Firestore
      await deleteDoc(doc(db, 'fumigations', fumigationId));
      
      console.log('Fumigación eliminada:', fumigationId); // Debug
      
      // Recargar fumigaciones
      await loadFumigations();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar fumigación ${fumigationId}:`, error);
      setError('Error al eliminar fumigación: ' + error.message);
      throw error;
    }
  }, [loadFumigations]);

  // CORREGIDO: Completar una fumigación - Transacción Firestore corregida
  const completeFumigation = useCallback(async (fumigationId, completionData) => {
    try {
      setError('');
      
      console.log('Completando fumigación:', fumigationId, completionData); // Debug
      
      // Usar transacción para asegurar consistencia
      await runTransaction(db, async (transaction) => {
        console.log('Iniciando transacción...'); // Debug
        
        // PASO 1: TODAS LAS LECTURAS PRIMERO
        console.log('Leyendo fumigación...'); // Debug
        const fumigationRef = doc(db, 'fumigations', fumigationId);
        const fumigationDoc = await transaction.get(fumigationRef);
        
        if (!fumigationDoc.exists()) {
          throw new Error('La fumigación no existe');
        }
        
        const fumigationData = fumigationDoc.data();
        console.log('Fumigación leída:', fumigationData); // Debug
        
        // Leer todos los productos ANTES de hacer escrituras
        const productUpdates = [];
        
        if (fumigationData.selectedProducts && fumigationData.selectedProducts.length > 0) {
          console.log('Leyendo productos seleccionados...'); // Debug
          
          for (const selectedProduct of fumigationData.selectedProducts) {
            console.log('Procesando producto:', selectedProduct); // Debug
            
            const productRef = doc(db, 'products', selectedProduct.productId);
            const productDoc = await transaction.get(productRef);
            
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const currentStock = productData.stock || 0;
              const quantityToUse = selectedProduct.totalQuantity || 0;
              
              console.log(`Producto ${productData.name}: Stock actual ${currentStock}, cantidad a usar ${quantityToUse}`); // Debug
              
              // Verificar que hay suficiente stock
              if (currentStock >= quantityToUse) {
                const newStock = currentStock - quantityToUse;
                
                // Guardar la actualización para aplicar después
                productUpdates.push({
                  ref: productRef,
                  newStock: newStock,
                  productName: productData.name
                });
              } else {
                console.warn(`Stock insuficiente para ${productData.name}: disponible ${currentStock}, necesario ${quantityToUse}`);
                // No lanzar error, solo advertir
              }
            } else {
              console.warn(`Producto ${selectedProduct.productId} no encontrado`);
            }
          }
        }
        
        // PASO 2: TODAS LAS ESCRITURAS DESPUÉS
        console.log('Aplicando actualizaciones...'); // Debug
        
        // Actualizar stock de productos
        for (const update of productUpdates) {
          console.log(`Actualizando stock de ${update.productName} a ${update.newStock}`); // Debug
          transaction.update(update.ref, {
            stock: update.newStock,
            updatedAt: serverTimestamp()
          });
        }
        
        // Preparar datos para la actualización de la fumigación
        const updateData = {
          status: 'completed',
          updatedAt: serverTimestamp()
        };
        
        // Añadir los datos de finalización
        if (completionData) {
          if (completionData.startDateTime instanceof Date) {
            updateData.startDateTime = Timestamp.fromDate(completionData.startDateTime);
          }
          
          if (completionData.endDateTime instanceof Date) {
            updateData.endDateTime = Timestamp.fromDate(completionData.endDateTime);
          }
          
          updateData.weatherConditions = completionData.weatherConditions || {};
          updateData.completionNotes = completionData.completionNotes || '';
        }
        
        console.log('Actualizando fumigación con:', updateData); // Debug
        
        // Actualizar la fumigación
        transaction.update(fumigationRef, updateData);
        
        console.log('Transacción completada exitosamente'); // Debug
      });
      
      console.log('Fumigación completada, recargando datos...'); // Debug
      
      // Recargar fumigaciones
      await loadFumigations();
      
      console.log('Datos recargados'); // Debug
      
      return fumigationId;
    } catch (error) {
      console.error(`Error al completar fumigación ${fumigationId}:`, error);
      setError('Error al completar fumigación: ' + error.message);
      throw error;
    }
  }, [loadFumigations]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setFumigations([]);
      setLoading(false);
      return;
    }

    console.log('Cargando fumigaciones iniciales...'); // Debug
    
    loadFumigations()
      .then(() => {
        console.log('Fumigaciones cargadas exitosamente'); // Debug
      })
      .catch(err => {
        console.error('Error al cargar datos iniciales de fumigaciones:', err);
        setError('Error al cargar datos: ' + err.message);
      });
  }, [currentUser, loadFumigations]);

  // Valor que se proporcionará a través del contexto
  const value = {
    fumigations,
    loading,
    error,
    setError,
    loadFumigations,
    addFumigation,
    updateFumigation,
    deleteFumigation,
    completeFumigation,
    generateOrderNumber
  };

  return (
    <FumigationContext.Provider value={value}>
      {children}
    </FumigationContext.Provider>
  );
}

export default FumigationContext;