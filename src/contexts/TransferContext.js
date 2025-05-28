// src/contexts/TransferContext.js - Contexto para gestión de transferencias
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

// Crear el contexto de transferencias
const TransferContext = createContext();

export function useTransfers() {
  return useContext(TransferContext);
}

export function TransferProvider({ children }) {
  const { currentUser } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar transferencias
  const loadTransfers = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando transferencias desde Firestore...'); // Debug
      
      // Crear consulta base
      const transfersQuery = query(collection(db, 'transfers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(transfersQuery);
      
      // Mapear documentos a objetos de transferencias
      let transfersData = [];
      querySnapshot.forEach((doc) => {
        const transferData = doc.data();
        transfersData.push({
          id: doc.id,
          transferNumber: transferData.transferNumber || '',
          sourceWarehouseId: transferData.sourceWarehouseId || '',
          targetWarehouseId: transferData.targetWarehouseId || '',
          sourceWarehouse: transferData.sourceWarehouse || {},
          targetWarehouse: transferData.targetWarehouse || {},
          products: transferData.products || [],
          distance: transferData.distance || 0,
          distanceUnit: transferData.distanceUnit || 'km',
          transferCost: transferData.transferCost || 0,
          costPerUnit: transferData.costPerUnit || 0, // Calculado automáticamente
          status: transferData.status || 'pending',
          requestedBy: transferData.requestedBy || '',
          requestDate: transferData.requestDate,
          approvedBy: transferData.approvedBy || '',
          approvedDate: transferData.approvedDate || null,
          shippedBy: transferData.shippedBy || '',
          shippedDate: transferData.shippedDate || null,
          receivedBy: transferData.receivedBy || '',
          receivedDate: transferData.receivedDate || null,
          notes: transferData.notes || '',
          rejectionReason: transferData.rejectionReason || '',
          createdAt: transferData.createdAt,
          updatedAt: transferData.updatedAt
        });
      });
      
      console.log('Total transferencias cargadas:', transfersData.length); // Debug
      
      // Aplicar filtros si se proporcionan
      if (filters.status) {
        transfersData = transfersData.filter(transfer => transfer.status === filters.status);
      }
      
      if (filters.sourceWarehouse) {
        transfersData = transfersData.filter(transfer => transfer.sourceWarehouseId === filters.sourceWarehouse);
      }

      if (filters.targetWarehouse) {
        transfersData = transfersData.filter(transfer => transfer.targetWarehouseId === filters.targetWarehouse);
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        transfersData = transfersData.filter(transfer => {
          const requestDate = transfer.requestDate
            ? new Date(transfer.requestDate.seconds ? transfer.requestDate.seconds * 1000 : transfer.requestDate)
            : null;
          
          if (!requestDate) return false;
          
          return (!start || requestDate >= new Date(start)) && 
                 (!end || requestDate <= new Date(end));
        });
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        transfersData = transfersData.filter(transfer => 
          (transfer.transferNumber && transfer.transferNumber.toLowerCase().includes(term)) ||
          (transfer.requestedBy && transfer.requestedBy.toLowerCase().includes(term)) ||
          (transfer.sourceWarehouse.name && transfer.sourceWarehouse.name.toLowerCase().includes(term)) ||
          (transfer.targetWarehouse.name && transfer.targetWarehouse.name.toLowerCase().includes(term))
        );
      }
      
      setTransfers(transfersData);
      return transfersData;
    } catch (error) {
      console.error('Error al cargar transferencias:', error);
      setError('Error al cargar transferencias: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar número de transferencia automático
  const generateTransferNumber = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const transfersQuery = query(
        collection(db, 'transfers'),
        where('transferNumber', '>=', `TRF-${currentYear}-`),
        where('transferNumber', '<', `TRF-${currentYear + 1}-`),
        orderBy('transferNumber', 'desc')
      );
      
      const querySnapshot = await getDocs(transfersQuery);
      
      let nextNumber = 1;
      if (!querySnapshot.empty) {
        const lastTransfer = querySnapshot.docs[0].data().transferNumber;
        const lastNumber = parseInt(lastTransfer.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `TRF-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error al generar número de transferencia:', error);
      return `TRF-${new Date().getFullYear()}-0001`;
    }
  }, []);

  // Añadir una transferencia con verificación de stock
  const addTransfer = useCallback(async (transferData) => {
    try {
      setError('');
      
      console.log('Añadiendo transferencia con datos:', transferData); // Debug
      
      // Generar número de transferencia si no se proporciona
      if (!transferData.transferNumber) {
        transferData.transferNumber = await generateTransferNumber();
      }
      
      // Calcular costo por unidad de distancia
      const costPerUnit = transferData.distance > 0 && transferData.transferCost > 0 
        ? transferData.transferCost / transferData.distance 
        : 0;
      
      // Usar transacción para asegurar consistencia
      const transferId = await runTransaction(db, async (transaction) => {
        // Verificar stock de productos seleccionados
        if (transferData.products && transferData.products.length > 0) {
          console.log('Verificando stock de productos...'); // Debug
          
          for (const transferProduct of transferData.products) {
            const productRef = doc(db, 'products', transferProduct.productId);
            const productDoc = await transaction.get(productRef);
            
            if (!productDoc.exists()) {
              throw new Error(`El producto con ID ${transferProduct.productId} no existe`);
            }
            
            const productData = productDoc.data();
            const currentStock = productData.stock || 0;
            const quantityToTransfer = transferProduct.quantity || 0;
            
            console.log(`Producto: ${productData.name}, Stock actual: ${currentStock}, Cantidad a transferir: ${quantityToTransfer}`); // Debug
            
            // Verificar que hay suficiente stock
            if (currentStock < quantityToTransfer) {
              throw new Error(`No hay suficiente stock del producto ${productData.name}. Stock disponible: ${currentStock}, requerido: ${quantityToTransfer}`);
            }
            
            // Solo descontar del stock si la transferencia es automáticamente aprobada y enviada
            if (transferData.status === 'shipped' || transferData.status === 'completed') {
              const newStock = currentStock - quantityToTransfer;
              console.log(`Actualizando stock de ${productData.name} de ${currentStock} a ${newStock}`); // Debug
              
              transaction.update(productRef, {
                stock: newStock,
                updatedAt: serverTimestamp()
              });
            }
          }
        }
        
        // Preparar datos para Firestore
        const dbTransferData = {
          transferNumber: transferData.transferNumber,
          sourceWarehouseId: transferData.sourceWarehouseId || '',
          targetWarehouseId: transferData.targetWarehouseId || '',
          sourceWarehouse: transferData.sourceWarehouse || {},
          targetWarehouse: transferData.targetWarehouse || {},
          products: transferData.products || [],
          distance: transferData.distance || 0,
          distanceUnit: transferData.distanceUnit || 'km',
          transferCost: transferData.transferCost || 0,
          costPerUnit: costPerUnit,
          status: transferData.status || 'pending',
          requestedBy: transferData.requestedBy || '',
          notes: transferData.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Convertir fechas si existen
        if (transferData.requestDate) {
          if (transferData.requestDate instanceof Date) {
            dbTransferData.requestDate = Timestamp.fromDate(transferData.requestDate);
          }
        } else {
          dbTransferData.requestDate = serverTimestamp();
        }
        
        // Insertar transferencia en Firestore
        const transferRef = doc(collection(db, 'transfers'));
        transaction.set(transferRef, dbTransferData);
        
        return transferRef.id;
      });
      
      console.log('Transferencia creada con ID:', transferId); // Debug
      
      // Recargar transferencias
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error('Error al añadir transferencia:', error);
      setError('Error al añadir transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers, generateTransferNumber]);

  // Actualizar una transferencia
  const updateTransfer = useCallback(async (transferId, transferData) => {
    try {
      setError('');
      
      // Calcular costo por unidad de distancia
      const costPerUnit = transferData.distance > 0 && transferData.transferCost > 0 
        ? transferData.transferCost / transferData.distance 
        : 0;
      
      // Preparar datos para actualizar
      const updateData = {
        ...transferData,
        costPerUnit: costPerUnit,
        updatedAt: serverTimestamp()
      };
      
      // Convertir fechas si existen
      ['requestDate', 'approvedDate', 'shippedDate', 'receivedDate'].forEach(dateField => {
        if (transferData[dateField]) {
          if (transferData[dateField] instanceof Date) {
            updateData[dateField] = Timestamp.fromDate(transferData[dateField]);
          }
        }
      });
      
      // Actualizar transferencia en Firestore
      await updateDoc(doc(db, 'transfers', transferId), updateData);
      
      // Recargar transferencias
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error(`Error al actualizar transferencia ${transferId}:`, error);
      setError('Error al actualizar transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Eliminar una transferencia
  const deleteTransfer = useCallback(async (transferId) => {
    try {
      setError('');
      
      // Eliminar transferencia de Firestore
      await deleteDoc(doc(db, 'transfers', transferId));
      
      // Recargar transferencias
      await loadTransfers();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar transferencia ${transferId}:`, error);
      setError('Error al eliminar transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Aprobar una transferencia
  const approveTransfer = useCallback(async (transferId, approvedBy) => {
    try {
      setError('');
      
      const updateData = {
        status: 'approved',
        approvedBy: approvedBy,
        approvedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'transfers', transferId), updateData);
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error(`Error al aprobar transferencia ${transferId}:`, error);
      setError('Error al aprobar transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Rechazar una transferencia
  const rejectTransfer = useCallback(async (transferId, rejectionReason, rejectedBy) => {
    try {
      setError('');
      
      const updateData = {
        status: 'rejected',
        rejectionReason: rejectionReason,
        approvedBy: rejectedBy, // Quien la rechazó
        approvedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'transfers', transferId), updateData);
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error(`Error al rechazar transferencia ${transferId}:`, error);
      setError('Error al rechazar transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Enviar una transferencia (descontar stock)
  const shipTransfer = useCallback(async (transferId, shippedBy) => {
    try {
      setError('');
      
      await runTransaction(db, async (transaction) => {
        // Obtener la transferencia actual
        const transferRef = doc(db, 'transfers', transferId);
        const transferDoc = await transaction.get(transferRef);
        
        if (!transferDoc.exists()) {
          throw new Error('La transferencia no existe');
        }
        
        const transferData = transferDoc.data();
        
        // Descontar stock de productos
        if (transferData.products && transferData.products.length > 0) {
          for (const transferProduct of transferData.products) {
            const productRef = doc(db, 'products', transferProduct.productId);
            const productDoc = await transaction.get(productRef);
            
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const currentStock = productData.stock || 0;
              const quantityToTransfer = transferProduct.quantity || 0;
              
              // Verificar que hay suficiente stock
              if (currentStock >= quantityToTransfer) {
                const newStock = currentStock - quantityToTransfer;
                transaction.update(productRef, {
                  stock: newStock,
                  updatedAt: serverTimestamp()
                });
              } else {
                throw new Error(`No hay suficiente stock del producto ${productData.name}. Stock disponible: ${currentStock}, requerido: ${quantityToTransfer}`);
              }
            }
          }
        }
        
        // Actualizar la transferencia
        transaction.update(transferRef, {
          status: 'shipped',
          shippedBy: shippedBy,
          shippedDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      // Recargar transferencias
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error(`Error al enviar transferencia ${transferId}:`, error);
      setError('Error al enviar transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Recibir una transferencia (añadir stock al destino)
  const receiveTransfer = useCallback(async (transferId, receivedBy, receivedProducts = null) => {
    try {
      setError('');
      
      await runTransaction(db, async (transaction) => {
        // Obtener la transferencia actual
        const transferRef = doc(db, 'transfers', transferId);
        const transferDoc = await transaction.get(transferRef);
        
        if (!transferDoc.exists()) {
          throw new Error('La transferencia no existe');
        }
        
        const transferData = transferDoc.data();
        
        // Usar productos recibidos o productos originales
        const productsToReceive = receivedProducts || transferData.products || [];
        
        // Añadir stock a productos en el almacén destino
        if (productsToReceive.length > 0) {
          for (const transferProduct of productsToReceive) {
            const productRef = doc(db, 'products', transferProduct.productId);
            const productDoc = await transaction.get(productRef);
            
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const currentStock = productData.stock || 0;
              const quantityReceived = transferProduct.quantityReceived || transferProduct.quantity || 0;
              
              // Añadir al stock
              const newStock = currentStock + quantityReceived;
              transaction.update(productRef, {
                stock: newStock,
                // Actualizar almacén del producto al destino
                warehouseId: transferData.targetWarehouseId,
                updatedAt: serverTimestamp()
              });
            }
          }
        }
        
        // Actualizar la transferencia
        transaction.update(transferRef, {
          status: 'completed',
          receivedBy: receivedBy,
          receivedDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      // Recargar transferencias
      await loadTransfers();
      
      return transferId;
    } catch (error) {
      console.error(`Error al recibir transferencia ${transferId}:`, error);
      setError('Error al recibir transferencia: ' + error.message);
      throw error;
    }
  }, [loadTransfers]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setTransfers([]);
      setLoading(false);
      return;
    }

    loadTransfers()
      .catch(err => {
        console.error('Error al cargar datos iniciales de transferencias:', err);
        setError('Error al cargar datos: ' + err.message);
      });
  }, [currentUser, loadTransfers]);

  // Valor que se proporcionará a través del contexto
  const value = {
    transfers,
    loading,
    error,
    setError,
    loadTransfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    approveTransfer,
    rejectTransfer,
    shipTransfer,
    receiveTransfer,
    generateTransferNumber
  };

  return (
    <TransferContext.Provider value={value}>
      {children}
    </TransferContext.Provider>
  );
}

export default TransferContext;