// src/contexts/ExpenseContext.js - Contexto para gestión de gastos
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

// Crear el contexto de gastos
const ExpenseContext = createContext();

export function useExpenses() {
  return useContext(ExpenseContext);
}

export function ExpenseProvider({ children }) {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar gastos
  const loadExpenses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando gastos desde Firestore...'); // Debug
      
      // Crear consulta base
      const expensesQuery = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(expensesQuery);
      
      // Mapear documentos a objetos de gastos
      let expensesData = [];
      querySnapshot.forEach((doc) => {
        const expenseData = doc.data();
        expensesData.push({
          id: doc.id,
          expenseNumber: expenseData.expenseNumber || '',
          type: expenseData.type || 'product', // 'product' o 'misc'
          date: expenseData.date,
          // Datos para gastos de productos
          productId: expenseData.productId || null,
          productName: expenseData.productName || '',
          productCategory: expenseData.productCategory || '',
          quantitySold: expenseData.quantitySold || 0,
          unitPrice: expenseData.unitPrice || 0,
          totalAmount: expenseData.totalAmount || 0,
          saleReason: expenseData.saleReason || '',
          // Datos para gastos varios
          description: expenseData.description || '',
          category: expenseData.category || '',
          amount: expenseData.amount || 0,
          supplier: expenseData.supplier || '',
          // Datos comunes
          notes: expenseData.notes || '',
          createdBy: expenseData.createdBy || '',
          createdAt: expenseData.createdAt,
          updatedAt: expenseData.updatedAt
        });
      });
      
      console.log('Total gastos cargados:', expensesData.length); // Debug
      
      // Aplicar filtros si se proporcionan
      if (filters.type) {
        expensesData = expensesData.filter(expense => expense.type === filters.type);
      }
      
      if (filters.category) {
        expensesData = expensesData.filter(expense => 
          expense.category === filters.category || expense.productCategory === filters.category
        );
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        expensesData = expensesData.filter(expense => {
          const expenseDate = expense.date
            ? new Date(expense.date.seconds ? expense.date.seconds * 1000 : expense.date)
            : null;
          
          if (!expenseDate) return false;
          
          return (!start || expenseDate >= new Date(start)) && 
                 (!end || expenseDate <= new Date(end));
        });
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        expensesData = expensesData.filter(expense => 
          (expense.expenseNumber && expense.expenseNumber.toLowerCase().includes(term)) ||
          (expense.productName && expense.productName.toLowerCase().includes(term)) ||
          (expense.description && expense.description.toLowerCase().includes(term)) ||
          (expense.supplier && expense.supplier.toLowerCase().includes(term))
        );
      }
      
      setExpenses(expensesData);
      return expensesData;
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      setError('Error al cargar gastos: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar número de gasto automático
  const generateExpenseNumber = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('expenseNumber', '>=', `GAST-${currentYear}-`),
        where('expenseNumber', '<', `GAST-${currentYear + 1}-`),
        orderBy('expenseNumber', 'desc')
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      
      let nextNumber = 1;
      if (!querySnapshot.empty) {
        const lastExpense = querySnapshot.docs[0].data().expenseNumber;
        const lastNumber = parseInt(lastExpense.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `GAST-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error al generar número de gasto:', error);
      return `GAST-${new Date().getFullYear()}-0001`;
    }
  }, []);

  // Añadir un gasto con descuento de stock automático
  const addExpense = useCallback(async (expenseData) => {
    try {
      setError('');
      
      console.log('Añadiendo gasto con datos:', expenseData); // Debug
      
      // Generar número de gasto si no se proporciona
      if (!expenseData.expenseNumber) {
        expenseData.expenseNumber = await generateExpenseNumber();
      }
      
      // Usar transacción para asegurar consistencia
      const expenseId = await runTransaction(db, async (transaction) => {
        // Si es un gasto de producto, verificar y descontar stock
        if (expenseData.type === 'product' && expenseData.productId && expenseData.quantitySold > 0) {
          console.log('Procesando gasto de producto...'); // Debug
          
          const productRef = doc(db, 'products', expenseData.productId);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`El producto con ID ${expenseData.productId} no existe`);
          }
          
          const productData = productDoc.data();
          const currentStock = productData.stock || 0;
          const quantityToDeduct = expenseData.quantitySold || 0;
          
          console.log(`Producto: ${productData.name}, Stock actual: ${currentStock}, Cantidad a descontar: ${quantityToDeduct}`); // Debug
          
          // Verificar que hay suficiente stock
          if (currentStock < quantityToDeduct) {
            throw new Error(`No hay suficiente stock del producto ${productData.name}. Stock disponible: ${currentStock}, requerido: ${quantityToDeduct}`);
          }
          
          // Descontar del stock
          const newStock = currentStock - quantityToDeduct;
          console.log(`Actualizando stock de ${productData.name} de ${currentStock} a ${newStock}`); // Debug
          
          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp()
          });
          
          // Añadir datos del producto al gasto
          expenseData.productName = productData.name;
          expenseData.productCategory = productData.category;
        }
        
        // Preparar datos para Firestore
        const dbExpenseData = {
          expenseNumber: expenseData.expenseNumber,
          type: expenseData.type || 'product',
          // Datos para gastos de productos
          productId: expenseData.productId || null,
          productName: expenseData.productName || '',
          productCategory: expenseData.productCategory || '',
          quantitySold: expenseData.quantitySold || 0,
          unitPrice: expenseData.unitPrice || 0,
          totalAmount: expenseData.totalAmount || 0,
          saleReason: expenseData.saleReason || '',
          // Datos para gastos varios
          description: expenseData.description || '',
          category: expenseData.category || '',
          amount: expenseData.amount || 0,
          supplier: expenseData.supplier || '',
          // Datos comunes
          notes: expenseData.notes || '',
          createdBy: currentUser?.displayName || currentUser?.email || 'Usuario desconocido',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Convertir fecha si existe
        if (expenseData.date) {
          if (expenseData.date instanceof Date) {
            dbExpenseData.date = Timestamp.fromDate(expenseData.date);
          }
        } else {
          dbExpenseData.date = serverTimestamp();
        }
        
        // Insertar gasto en Firestore
        const expenseRef = doc(collection(db, 'expenses'));
        transaction.set(expenseRef, dbExpenseData);
        
        return expenseRef.id;
      });
      
      console.log('Gasto creado con ID:', expenseId); // Debug
      
      // Recargar gastos
      await loadExpenses();
      
      return expenseId;
    } catch (error) {
      console.error('Error al añadir gasto:', error);
      setError('Error al añadir gasto: ' + error.message);
      throw error;
    }
  }, [loadExpenses, generateExpenseNumber, currentUser]);

  // Actualizar un gasto
  const updateExpense = useCallback(async (expenseId, expenseData) => {
    try {
      setError('');
      
      console.log('Actualizando gasto:', expenseId, expenseData); // Debug
      
      // Preparar datos para actualizar
      const updateData = {
        ...expenseData,
        updatedAt: serverTimestamp()
      };
      
      // Convertir fecha si existe
      if (expenseData.date) {
        if (expenseData.date instanceof Date) {
          updateData.date = Timestamp.fromDate(expenseData.date);
        }
      }
      
      // Actualizar gasto en Firestore
      await updateDoc(doc(db, 'expenses', expenseId), updateData);
      
      console.log('Gasto actualizado:', expenseId); // Debug
      
      // Recargar gastos
      await loadExpenses();
      
      return expenseId;
    } catch (error) {
      console.error(`Error al actualizar gasto ${expenseId}:`, error);
      setError('Error al actualizar gasto: ' + error.message);
      throw error;
    }
  }, [loadExpenses]);

  // Eliminar un gasto
  const deleteExpense = useCallback(async (expenseId) => {
    try {
      setError('');
      
      console.log('Eliminando gasto:', expenseId); // Debug
      
      // Eliminar gasto de Firestore
      await deleteDoc(doc(db, 'expenses', expenseId));
      
      console.log('Gasto eliminado:', expenseId); // Debug
      
      // Recargar gastos
      await loadExpenses();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar gasto ${expenseId}:`, error);
      setError('Error al eliminar gasto: ' + error.message);
      throw error;
    }
  }, [loadExpenses]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    console.log('Cargando gastos iniciales...'); // Debug
    
    loadExpenses()
      .then(() => {
        console.log('Gastos cargados exitosamente'); // Debug
      })
      .catch(err => {
        console.error('Error al cargar datos iniciales de gastos:', err);
        setError('Error al cargar datos: ' + err.message);
      });
  }, [currentUser, loadExpenses]);

  // Valor que se proporcionará a través del contexto
  const value = {
    expenses,
    loading,
    error,
    setError,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    generateExpenseNumber
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export default ExpenseContext;