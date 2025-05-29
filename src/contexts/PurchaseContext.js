// src/contexts/PurchaseContext.js - Contexto para gestión de compras
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

// Crear el contexto de compras
const PurchaseContext = createContext();

export function usePurchases() {
  return useContext(PurchaseContext);
}

export function PurchaseProvider({ children }) {
  const { currentUser } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar compras
  const loadPurchases = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando compras desde Firestore...'); // Debug
      
      // Crear consulta base
      const purchasesQuery = query(collection(db, 'purchases'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(purchasesQuery);
      
      // Mapear documentos a objetos de compras
      let purchasesData = [];
      querySnapshot.forEach((doc) => {
        const purchaseData = doc.data();
        purchasesData.push({
          id: doc.id,
          purchaseNumber: purchaseData.purchaseNumber || '',
          supplier: purchaseData.supplier || '',
          purchaseDate: purchaseData.purchaseDate,
          products: purchaseData.products || [],
          totalProducts: purchaseData.totalProducts || 0,
          freight: purchaseData.freight || 0,
          taxes: purchaseData.taxes || 0,
          totalAmount: purchaseData.totalAmount || 0,
          status: purchaseData.status || 'pending',
          deliveries: purchaseData.deliveries || [],
          totalDelivered: purchaseData.totalDelivered || 0,
          totalPending: purchaseData.totalPending || 0,
          totalFreightPaid: purchaseData.totalFreightPaid || 0,
          notes: purchaseData.notes || '',
          createdBy: purchaseData.createdBy || '',
          createdAt: purchaseData.createdAt,
          updatedAt: purchaseData.updatedAt
        });
      });
      
      console.log('Total compras cargadas:', purchasesData.length); // Debug
      
      // Aplicar filtros si se proporcionan
      if (filters.status) {
        purchasesData = purchasesData.filter(purchase => purchase.status === filters.status);
      }
      
      if (filters.supplier) {
        purchasesData = purchasesData.filter(purchase => 
          purchase.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
        );
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        purchasesData = purchasesData.filter(purchase => {
          const purchaseDate = purchase.purchaseDate
            ? new Date(purchase.purchaseDate.seconds ? purchase.purchaseDate.seconds * 1000 : purchase.purchaseDate)
            : null;
          
          if (!purchaseDate) return false;
          
          return (!start || purchaseDate >= new Date(start)) && 
                 (!end || purchaseDate <= new Date(end));
        });
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        purchasesData = purchasesData.filter(purchase => 
          (purchase.purchaseNumber && purchase.purchaseNumber.toLowerCase().includes(term)) ||
          (purchase.supplier && purchase.supplier.toLowerCase().includes(term)) ||
          purchase.products.some(product => 
            product.name && product.name.toLowerCase().includes(term)
          )
        );
      }
      
      setPurchases(purchasesData);
      return purchasesData;
    } catch (error) {
      console.error('Error al cargar compras:', error);
      setError('Error al cargar compras: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar número de compra automático
  const generatePurchaseNumber = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('purchaseNumber', '>=', `COMP-${currentYear}-`),
        where('purchaseNumber', '<', `COMP-${currentYear + 1}-`),
        orderBy('purchaseNumber', 'desc')
      );
      
      const querySnapshot = await getDocs(purchasesQuery);
      
      let nextNumber = 1;
      if (!querySnapshot.empty) {
        const lastPurchase = querySnapshot.docs[0].data().purchaseNumber;
        const lastNumber = parseInt(lastPurchase.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `COMP-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error al generar número de compra:', error);
      return `COMP-${new Date().getFullYear()}-0001`;
    }
  }, []);

  // Calcular totales de una compra
  const calculatePurchaseTotals = (products, freight = 0, taxes = 0) => {
    const totalProducts = products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitCost);
    }, 0);
    
    const totalAmount = totalProducts + freight + taxes;
    
    return {
      totalProducts,
      totalAmount
    };
  };

  // Añadir una compra
  const addPurchase = useCallback(async (purchaseData) => {
    try {
      setError('');
      
      console.log('Añadiendo compra con datos:', purchaseData); // Debug
      
      // Generar número de compra si no se proporciona
      if (!purchaseData.purchaseNumber) {
        purchaseData.purchaseNumber = await generatePurchaseNumber();
      }
      
      // Calcular totales
      const totals = calculatePurchaseTotals(
        purchaseData.products, 
        purchaseData.freight, 
        purchaseData.taxes
      );
      
      // Calcular total pendiente (inicialmente todo está pendiente)
      const totalPending = purchaseData.products.reduce((sum, product) => sum + product.quantity, 0);
      
      // Preparar datos para Firestore
      const dbPurchaseData = {
        purchaseNumber: purchaseData.purchaseNumber,
        supplier: purchaseData.supplier || '',
        products: purchaseData.products || [],
        freight: purchaseData.freight || 0,
        taxes: purchaseData.taxes || 0,
        totalProducts: totals.totalProducts,
        totalAmount: totals.totalAmount,
        status: purchaseData.status || 'pending',
        deliveries: [],
        totalDelivered: 0,
        totalPending: totalPending,
        totalFreightPaid: 0,
        notes: purchaseData.notes || '',
        createdBy: currentUser?.displayName || currentUser?.email || 'Usuario desconocido',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha de compra si existe
      if (purchaseData.purchaseDate) {
        if (purchaseData.purchaseDate instanceof Date) {
          dbPurchaseData.purchaseDate = Timestamp.fromDate(purchaseData.purchaseDate);
        }
      }
      
      console.log('Datos a guardar en Firestore:', dbPurchaseData); // Debug
      
      // Insertar compra en Firestore
      const purchaseRef = await addDoc(collection(db, 'purchases'), dbPurchaseData);
      
      console.log('Compra creada con ID:', purchaseRef.id); // Debug
      
      // Recargar compras
      await loadPurchases();
      
      return purchaseRef.id;
    } catch (error) {
      console.error('Error al añadir compra:', error);
      setError('Error al añadir compra: ' + error.message);
      throw error;
    }
  }, [loadPurchases, generatePurchaseNumber, currentUser]);

  // Actualizar una compra
  const updatePurchase = useCallback(async (purchaseId, purchaseData) => {
    try {
      setError('');
      
      console.log('Actualizando compra:', purchaseId, purchaseData); // Debug
      
      // Si se actualizan productos, recalcular totales
      let updateData = {
        ...purchaseData,
        updatedAt: serverTimestamp()
      };
      
      if (purchaseData.products) {
        const totals = calculatePurchaseTotals(
          purchaseData.products, 
          purchaseData.freight || 0, 
          purchaseData.taxes || 0
        );
        
        updateData.totalProducts = totals.totalProducts;
        updateData.totalAmount = totals.totalAmount;
      }
      
      // Convertir fechas si existen
      if (purchaseData.purchaseDate) {
        if (purchaseData.purchaseDate instanceof Date) {
          updateData.purchaseDate = Timestamp.fromDate(purchaseData.purchaseDate);
        }
      }
      
      // Actualizar compra en Firestore
      await updateDoc(doc(db, 'purchases', purchaseId), updateData);
      
      console.log('Compra actualizada:', purchaseId); // Debug
      
      // Recargar compras
      await loadPurchases();
      
      return purchaseId;
    } catch (error) {
      console.error(`Error al actualizar compra ${purchaseId}:`, error);
      setError('Error al actualizar compra: ' + error.message);
      throw error;
    }
  }, [loadPurchases]);

  // Eliminar una compra
  const deletePurchase = useCallback(async (purchaseId) => {
    try {
      setError('');
      
      console.log('Eliminando compra:', purchaseId); // Debug
      
      // Eliminar compra de Firestore
      await deleteDoc(doc(db, 'purchases', purchaseId));
      
      console.log('Compra eliminada:', purchaseId); // Debug
      
      // Recargar compras
      await loadPurchases();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar compra ${purchaseId}:`, error);
      setError('Error al eliminar compra: ' + error.message);
      throw error;
    }
  }, [loadPurchases]);

  // Crear una entrega/retiro
  const createDelivery = useCallback(async (purchaseId, deliveryData) => {
    try {
      setError('');
      
      console.log('Creando entrega para compra:', purchaseId, deliveryData); // Debug
      
      await runTransaction(db, async (transaction) => {
        // Obtener la compra actual
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await transaction.get(purchaseRef);
        
        if (!purchaseDoc.exists()) {
          throw new Error('La compra no existe');
        }
        
        const purchaseData = purchaseDoc.data();
        
        // Crear nueva entrega
        const newDelivery = {
          id: Date.now().toString(), // ID simple basado en timestamp
          products: deliveryData.products || [],
          warehouseId: deliveryData.warehouseId,
          warehouseName: deliveryData.warehouseName,
          freight: deliveryData.freight || 0,
          deliveryDate: deliveryData.deliveryDate ? Timestamp.fromDate(deliveryData.deliveryDate) : serverTimestamp(),
          status: 'in_transit', // en camino
          notes: deliveryData.notes || '',
          createdBy: currentUser?.displayName || currentUser?.email || 'Usuario desconocido',
          createdAt: serverTimestamp()
        };
        
        // Actualizar la compra con la nueva entrega
        const updatedDeliveries = [...(purchaseData.deliveries || []), newDelivery];
        
        // Calcular nuevos totales
        const totalDelivered = updatedDeliveries
          .filter(delivery => delivery.status === 'completed')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalInTransit = updatedDeliveries
          .filter(delivery => delivery.status === 'in_transit')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalPurchased = purchaseData.products.reduce((sum, product) => sum + product.quantity, 0);
        const totalPending = totalPurchased - totalDelivered - totalInTransit;
        
        const totalFreightPaid = updatedDeliveries
          .filter(delivery => delivery.status === 'completed')
          .reduce((sum, delivery) => sum + (delivery.freight || 0), 0);
        
        // Determinar nuevo estado de la compra
        let newStatus = purchaseData.status;
        if (totalDelivered === totalPurchased) {
          newStatus = 'completed';
        } else if (totalDelivered > 0 || totalInTransit > 0) {
          newStatus = 'partial_delivered';
        }
        
        // Actualizar compra
        transaction.update(purchaseRef, {
          deliveries: updatedDeliveries,
          totalDelivered: totalDelivered,
          totalPending: totalPending,
          totalFreightPaid: totalFreightPaid,
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        
        console.log('Entrega creada exitosamente'); // Debug
      });
      
      // Recargar compras
      await loadPurchases();
      
      return true;
    } catch (error) {
      console.error(`Error al crear entrega para compra ${purchaseId}:`, error);
      setError('Error al crear entrega: ' + error.message);
      throw error;
    }
  }, [loadPurchases, currentUser]);

  // Completar una entrega (añadir productos al inventario)
  const completeDelivery = useCallback(async (purchaseId, deliveryId) => {
    try {
      setError('');
      
      console.log('Completando entrega:', purchaseId, deliveryId); // Debug
      
      await runTransaction(db, async (transaction) => {
        // Obtener la compra actual
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await transaction.get(purchaseRef);
        
        if (!purchaseDoc.exists()) {
          throw new Error('La compra no existe');
        }
        
        const purchaseData = purchaseDoc.data();
        
        // Encontrar la entrega
        const delivery = purchaseData.deliveries.find(d => d.id === deliveryId);
        if (!delivery) {
          throw new Error('La entrega no existe');
        }
        
        if (delivery.status === 'completed') {
          throw new Error('La entrega ya está completada');
        }
        
        // Añadir productos al inventario
        for (const deliveryProduct of delivery.products) {
          // Buscar el producto original en la compra para obtener datos completos
          const originalProduct = purchaseData.products.find(p => p.id === deliveryProduct.productId);
          
          const newProductData = {
            name: originalProduct.name,
            category: originalProduct.category || 'insumo',
            unit: originalProduct.unit || 'kg',
            stock: Number(deliveryProduct.quantity) || 0,
            minStock: 0,
            storageType: 'bolsas',
            fieldId: null,
            warehouseId: delivery.warehouseId,
            storageLevel: 'warehouse',
            lotNumber: `COMP-${purchaseData.purchaseNumber}-${deliveryId}`,
            cost: originalProduct.unitCost || 0,
            supplierName: purchaseData.supplier,
            tags: ['compra', purchaseData.supplier.replace(/\s+/g, '_').toLowerCase()],
            notes: `Producto de compra ${purchaseData.purchaseNumber}. Entrega: ${delivery.id}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          console.log('Añadiendo producto al inventario:', newProductData); // Debug
          
          // Insertar nuevo producto en inventario
          const productRef = doc(collection(db, 'products'));
          transaction.set(productRef, newProductData);
        }
        
        // Actualizar el estado de la entrega
        const updatedDeliveries = purchaseData.deliveries.map(d => 
          d.id === deliveryId 
            ? { ...d, status: 'completed', completedAt: serverTimestamp() }
            : d
        );
        
        // Recalcular totales
        const totalDelivered = updatedDeliveries
          .filter(delivery => delivery.status === 'completed')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalInTransit = updatedDeliveries
          .filter(delivery => delivery.status === 'in_transit')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalPurchased = purchaseData.products.reduce((sum, product) => sum + product.quantity, 0);
        const totalPending = totalPurchased - totalDelivered - totalInTransit;
        
        const totalFreightPaid = updatedDeliveries
          .filter(delivery => delivery.status === 'completed')
          .reduce((sum, delivery) => sum + (delivery.freight || 0), 0);
        
        // Determinar nuevo estado de la compra
        let newStatus = purchaseData.status;
        if (totalDelivered === totalPurchased) {
          newStatus = 'completed';
        } else if (totalDelivered > 0) {
          newStatus = 'partial_delivered';
        }
        
        // Actualizar compra
        transaction.update(purchaseRef, {
          deliveries: updatedDeliveries,
          totalDelivered: totalDelivered,
          totalPending: totalPending,
          totalFreightPaid: totalFreightPaid,
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        
        console.log('Entrega completada exitosamente'); // Debug
      });
      
      // Recargar compras
      await loadPurchases();
      
      return true;
    } catch (error) {
      console.error(`Error al completar entrega ${deliveryId}:`, error);
      setError('Error al completar entrega: ' + error.message);
      throw error;
    }
  }, [loadPurchases]);

  // Cancelar una entrega
  const cancelDelivery = useCallback(async (purchaseId, deliveryId, reason = '') => {
    try {
      setError('');
      
      await runTransaction(db, async (transaction) => {
        const purchaseRef = doc(db, 'purchases', purchaseId);
        const purchaseDoc = await transaction.get(purchaseRef);
        
        if (!purchaseDoc.exists()) {
          throw new Error('La compra no existe');
        }
        
        const purchaseData = purchaseDoc.data();
        
        // Actualizar el estado de la entrega
        const updatedDeliveries = purchaseData.deliveries.map(d => 
          d.id === deliveryId 
            ? { ...d, status: 'cancelled', cancelledAt: serverTimestamp(), cancellationReason: reason }
            : d
        );
        
        // Recalcular totales
        const totalDelivered = updatedDeliveries
          .filter(delivery => delivery.status === 'completed')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalInTransit = updatedDeliveries
          .filter(delivery => delivery.status === 'in_transit')
          .reduce((sum, delivery) => {
            return sum + delivery.products.reduce((prodSum, product) => prodSum + product.quantity, 0);
          }, 0);
        
        const totalPurchased = purchaseData.products.reduce((sum, product) => sum + product.quantity, 0);
        const totalPending = totalPurchased - totalDelivered - totalInTransit;
        
        // Determinar nuevo estado
        let newStatus = 'approved';
        if (totalDelivered === totalPurchased) {
          newStatus = 'completed';
        } else if (totalDelivered > 0) {
          newStatus = 'partial_delivered';
        }
        
        transaction.update(purchaseRef, {
          deliveries: updatedDeliveries,
          totalDelivered: totalDelivered,
          totalPending: totalPending,
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      });
      
      await loadPurchases();
      return true;
    } catch (error) {
      console.error(`Error al cancelar entrega ${deliveryId}:`, error);
      setError('Error al cancelar entrega: ' + error.message);
      throw error;
    }
  }, [loadPurchases]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    console.log('Cargando compras iniciales...'); // Debug
    
    loadPurchases()
      .then(() => {
        console.log('Compras cargadas exitosamente'); // Debug
      })
      .catch(err => {
        console.error('Error al cargar datos iniciales de compras:', err);
        setError('Error al cargar datos: ' + err.message);
      });
  }, [currentUser, loadPurchases]);

  // Valor que se proporcionará a través del contexto
  const value = {
    purchases,
    loading,
    error,
    setError,
    loadPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    createDelivery,
    completeDelivery,
    cancelDelivery,
    generatePurchaseNumber
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export default PurchaseContext;