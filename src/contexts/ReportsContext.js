// src/contexts/ReportsContext.js - Contexto para gestión de reportes
import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de reportes
const ReportsContext = createContext();

export function useReports() {
  return useContext(ReportsContext);
}

export function ReportsProvider({ children }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para obtener datos de productos con filtros
  const getProductsReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Generando reporte de productos con filtros:', filters);
      
      let productsQuery = query(collection(db, 'products'), orderBy('name'));
      
      // Aplicar filtros de fecha si existen
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        productsQuery = query(
          collection(db, 'products'),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(productsQuery);
      const products = [];
      
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        products.push({
          id: doc.id,
          ...productData,
          // Convertir timestamps a fechas
          createdAt: productData.createdAt ? new Date(productData.createdAt.seconds * 1000) : null,
          updatedAt: productData.updatedAt ? new Date(productData.updatedAt.seconds * 1000) : null,
          expiryDate: productData.expiryDate ? new Date(productData.expiryDate.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredProducts = products;
      
      if (filters.category && filters.category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      
      if (filters.stockStatus && filters.stockStatus !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const currentStock = p.stock || 0;
          const minStock = p.minStock || 0;
          
          switch (filters.stockStatus) {
            case 'low': return currentStock <= minStock && minStock > 0;
            case 'empty': return currentStock === 0;
            case 'ok': return currentStock > minStock;
            default: return true;
          }
        });
      }
      
      if (filters.fieldId && filters.fieldId !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.fieldId === filters.fieldId);
      }
      
      return filteredProducts;
    } catch (error) {
      console.error('Error al generar reporte de productos:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos de transferencias
  const getTransfersReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      let transfersQuery = query(collection(db, 'transfers'), orderBy('createdAt', 'desc'));
      
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        transfersQuery = query(
          collection(db, 'transfers'),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(transfersQuery);
      const transfers = [];
      
      querySnapshot.forEach((doc) => {
        const transferData = doc.data();
        transfers.push({
          id: doc.id,
          ...transferData,
          createdAt: transferData.createdAt ? new Date(transferData.createdAt.seconds * 1000) : null,
          requestDate: transferData.requestDate ? new Date(transferData.requestDate.seconds * 1000) : null,
          approvedDate: transferData.approvedDate ? new Date(transferData.approvedDate.seconds * 1000) : null,
          shippedDate: transferData.shippedDate ? new Date(transferData.shippedDate.seconds * 1000) : null,
          receivedDate: transferData.receivedDate ? new Date(transferData.receivedDate.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredTransfers = transfers;
      
      if (filters.status && filters.status !== 'all') {
        filteredTransfers = filteredTransfers.filter(t => t.status === filters.status);
      }
      
      if (filters.sourceWarehouse && filters.sourceWarehouse !== 'all') {
        filteredTransfers = filteredTransfers.filter(t => t.sourceWarehouseId === filters.sourceWarehouse);
      }
      
      if (filters.targetWarehouse && filters.targetWarehouse !== 'all') {
        filteredTransfers = filteredTransfers.filter(t => t.targetWarehouseId === filters.targetWarehouse);
      }
      
      return filteredTransfers;
    } catch (error) {
      console.error('Error al generar reporte de transferencias:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos de fumigaciones
  const getFumigationsReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      let fumigationsQuery = query(collection(db, 'fumigations'), orderBy('applicationDate', 'desc'));
      
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        fumigationsQuery = query(
          collection(db, 'fumigations'),
          where('applicationDate', '>=', startDate),
          where('applicationDate', '<=', endDate),
          orderBy('applicationDate', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(fumigationsQuery);
      const fumigations = [];
      
      querySnapshot.forEach((doc) => {
        const fumigationData = doc.data();
        fumigations.push({
          id: doc.id,
          ...fumigationData,
          applicationDate: fumigationData.applicationDate ? new Date(fumigationData.applicationDate.seconds * 1000) : null,
          createdAt: fumigationData.createdAt ? new Date(fumigationData.createdAt.seconds * 1000) : null,
          startDateTime: fumigationData.startDateTime ? new Date(fumigationData.startDateTime.seconds * 1000) : null,
          endDateTime: fumigationData.endDateTime ? new Date(fumigationData.endDateTime.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredFumigations = fumigations;
      
      if (filters.status && filters.status !== 'all') {
        filteredFumigations = filteredFumigations.filter(f => f.status === filters.status);
      }
      
      if (filters.crop && filters.crop !== 'all') {
        filteredFumigations = filteredFumigations.filter(f => f.crop === filters.crop);
      }
      
      if (filters.field && filters.field !== 'all') {
        filteredFumigations = filteredFumigations.filter(f => f.fieldId === filters.field);
      }
      
      return filteredFumigations;
    } catch (error) {
      console.error('Error al generar reporte de fumigaciones:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos de cosechas
  const getHarvestsReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      let harvestsQuery = query(collection(db, 'harvests'), orderBy('plannedDate', 'desc'));
      
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        harvestsQuery = query(
          collection(db, 'harvests'),
          where('plannedDate', '>=', startDate),
          where('plannedDate', '<=', endDate),
          orderBy('plannedDate', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(harvestsQuery);
      const harvests = [];
      
      querySnapshot.forEach((doc) => {
        const harvestData = doc.data();
        harvests.push({
          id: doc.id,
          ...harvestData,
          plannedDate: harvestData.plannedDate ? new Date(harvestData.plannedDate.seconds * 1000) : null,
          harvestDate: harvestData.harvestDate ? new Date(harvestData.harvestDate.seconds * 1000) : null,
          createdAt: harvestData.createdAt ? new Date(harvestData.createdAt.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredHarvests = harvests;
      
      if (filters.status && filters.status !== 'all') {
        filteredHarvests = filteredHarvests.filter(h => h.status === filters.status);
      }
      
      if (filters.crop && filters.crop !== 'all') {
        filteredHarvests = filteredHarvests.filter(h => h.crop === filters.crop);
      }
      
      if (filters.field && filters.field !== 'all') {
        filteredHarvests = filteredHarvests.filter(h => h.fieldId === filters.field);
      }
      
      return filteredHarvests;
    } catch (error) {
      console.error('Error al generar reporte de cosechas:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos de compras
  const getPurchasesReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      let purchasesQuery = query(collection(db, 'purchases'), orderBy('createdAt', 'desc'));
      
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        purchasesQuery = query(
          collection(db, 'purchases'),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(purchasesQuery);
      const purchases = [];
      
      querySnapshot.forEach((doc) => {
        const purchaseData = doc.data();
        purchases.push({
          id: doc.id,
          ...purchaseData,
          purchaseDate: purchaseData.purchaseDate ? new Date(purchaseData.purchaseDate.seconds * 1000) : null,
          createdAt: purchaseData.createdAt ? new Date(purchaseData.createdAt.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredPurchases = purchases;
      
      if (filters.status && filters.status !== 'all') {
        filteredPurchases = filteredPurchases.filter(p => p.status === filters.status);
      }
      
      if (filters.supplier && filters.supplier !== 'all') {
        filteredPurchases = filteredPurchases.filter(p => p.supplier === filters.supplier);
      }
      
      return filteredPurchases;
    } catch (error) {
      console.error('Error al generar reporte de compras:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos de gastos
  const getExpensesReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      let expensesQuery = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      
      if (filters.startDate && filters.endDate) {
        const startDate = Timestamp.fromDate(new Date(filters.startDate));
        const endDate = Timestamp.fromDate(new Date(filters.endDate));
        
        expensesQuery = query(
          collection(db, 'expenses'),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(expensesQuery);
      const expenses = [];
      
      querySnapshot.forEach((doc) => {
        const expenseData = doc.data();
        expenses.push({
          id: doc.id,
          ...expenseData,
          date: expenseData.date ? new Date(expenseData.date.seconds * 1000) : null,
          createdAt: expenseData.createdAt ? new Date(expenseData.createdAt.seconds * 1000) : null
        });
      });
      
      // Aplicar filtros adicionales
      let filteredExpenses = expenses;
      
      if (filters.type && filters.type !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.type === filters.type);
      }
      
      if (filters.category && filters.category !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => 
          e.category === filters.category || e.productCategory === filters.category
        );
      }
      
      return filteredExpenses;
    } catch (error) {
      console.error('Error al generar reporte de gastos:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener reporte de actividades generales
  const getActivitiesReport = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Generando reporte de actividades con filtros:', filters);
      
      const activities = [];
      
      // Obtener transferencias
      const transfers = await getTransfersReport(filters);
      transfers.forEach(transfer => {
        activities.push({
          id: transfer.id,
          type: 'transfer',
          title: `Transferencia ${transfer.transferNumber || transfer.id}`,
          description: `Transferencia de ${transfer.products?.length || 0} productos`,
          date: transfer.requestDate || transfer.createdAt,
          status: transfer.status,
          details: {
            from: transfer.sourceWarehouse?.name || 'Origen desconocido',
            to: transfer.targetWarehouse?.name || 'Destino desconocido',
            products: transfer.products?.length || 0,
            requestedBy: transfer.requestedBy
          }
        });
      });
      
      // Obtener fumigaciones
      const fumigations = await getFumigationsReport(filters);
      fumigations.forEach(fumigation => {
        activities.push({
          id: fumigation.id,
          type: 'fumigation',
          title: `Fumigación ${fumigation.orderNumber || fumigation.id}`,
          description: `Fumigación en ${fumigation.establishment} - ${fumigation.crop}`,
          date: fumigation.applicationDate || fumigation.createdAt,
          status: fumigation.status,
          details: {
            establishment: fumigation.establishment,
            crop: fumigation.crop,
            surface: fumigation.totalSurface,
            applicator: fumigation.applicator,
            products: fumigation.selectedProducts?.length || 0
          }
        });
      });
      
      // Obtener cosechas
      const harvests = await getHarvestsReport(filters);
      harvests.forEach(harvest => {
        activities.push({
          id: harvest.id,
          type: 'harvest',
          title: `Cosecha de ${harvest.crop || 'cultivo'}`,
          description: `Cosecha en ${harvest.field?.name || 'campo'} - ${harvest.totalArea || 0} ha`,
          date: harvest.plannedDate || harvest.createdAt,
          status: harvest.status,
          details: {
            field: harvest.field?.name || 'Campo desconocido',
            crop: harvest.crop,
            area: harvest.totalArea,
            estimatedYield: harvest.estimatedYield,
            actualYield: harvest.actualYield
          }
        });
      });
      
      // Obtener compras
      const purchases = await getPurchasesReport(filters);
      purchases.forEach(purchase => {
        activities.push({
          id: purchase.id,
          type: 'purchase',
          title: `Compra ${purchase.purchaseNumber || purchase.id}`,
          description: `Compra a ${purchase.supplier} - ${purchase.products?.length || 0} productos`,
          date: purchase.purchaseDate || purchase.createdAt,
          status: purchase.status,
          details: {
            supplier: purchase.supplier,
            products: purchase.products?.length || 0,
            totalAmount: purchase.totalAmount,
            createdBy: purchase.createdBy
          }
        });
      });
      
      // Obtener gastos
      const expenses = await getExpensesReport(filters);
      expenses.forEach(expense => {
        activities.push({
          id: expense.id,
          type: 'expense',
          title: `Gasto ${expense.expenseNumber || expense.id}`,
          description: expense.type === 'product' 
            ? `Venta de ${expense.productName}` 
            : expense.description,
          date: expense.date || expense.createdAt,
          status: 'completed',
          details: {
            type: expense.type,
            amount: expense.type === 'product' ? expense.totalAmount : expense.amount,
            category: expense.category || expense.productCategory,
            createdBy: expense.createdBy
          }
        });
      });
      
      // Ordenar actividades por fecha descendente
      activities.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
      
      return activities;
    } catch (error) {
      console.error('Error al generar reporte de actividades:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getTransfersReport, getFumigationsReport, getHarvestsReport, getPurchasesReport, getExpensesReport]);

  // Función para obtener datos de campos y almacenes
  const getInventoryReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener campos
      const fieldsSnapshot = await getDocs(query(collection(db, 'fields'), orderBy('name')));
      const fields = [];
      fieldsSnapshot.forEach(doc => {
        fields.push({ id: doc.id, ...doc.data() });
      });
      
      // Obtener almacenes
      const warehousesSnapshot = await getDocs(query(collection(db, 'warehouses'), orderBy('name')));
      const warehouses = [];
      warehousesSnapshot.forEach(doc => {
        warehouses.push({ id: doc.id, ...doc.data() });
      });
      
      return { fields, warehouses };
    } catch (error) {
      console.error('Error al generar reporte de inventario:', error);
      setError('Error al generar reporte: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Valor que se proporcionará a través del contexto
  const value = {
    loading,
    error,
    setError,
    getProductsReport,
    getTransfersReport,
    getFumigationsReport,
    getHarvestsReport,
    getPurchasesReport,
    getExpensesReport,
    getActivitiesReport,
    getInventoryReport
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

export default ReportsContext;