// src/contexts/ActivityContext.js - CORREGIDO: Sin bucles infinitos ni logs excesivos
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de actividades
const ActivityContext = createContext();

export function useActivities() {
  return useContext(ActivityContext);
}

// Limpiar valores undefined de un objeto recursivamente
const cleanUndefinedValues = (obj) => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues).filter(item => item !== undefined && item !== null);
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        const cleanedValue = cleanUndefinedValues(value);
        if (cleanedValue !== undefined && cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }
  
  return obj;
};

export function ActivityProvider({ children }) {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  
  // CORREGIDO: Usar useRef para evitar bucles infinitos
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Cargar actividades con paginación
  const loadActivities = useCallback(async (limitCount = 50, reset = true) => {
    // CORREGIDO: Evitar múltiples cargas simultáneas
    if (isLoadingRef.current) {
      return [];
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      const activitiesQuery = query(
        collection(db, 'activities'), 
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesData = [];
      
      querySnapshot.forEach((doc) => {
        const activityData = doc.data();
        activitiesData.push({
          id: doc.id,
          ...activityData,
          createdAt: activityData.createdAt ? new Date(activityData.createdAt.seconds * 1000) : new Date()
        });
      });
      
      if (reset) {
        setActivities(activitiesData);
      } else {
        setActivities(prev => [...prev, ...activitiesData]);
      }
      
      // Guardar el último documento para paginación
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Cargar más actividades (paginación)
  const loadMoreActivities = useCallback(async (limitCount = 20) => {
    if (!lastVisible || isLoadingRef.current) return [];
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesData = [];
      
      querySnapshot.forEach((doc) => {
        const activityData = doc.data();
        activitiesData.push({
          id: doc.id,
          ...activityData,
          createdAt: activityData.createdAt ? new Date(activityData.createdAt.seconds * 1000) : new Date()
        });
      });
      
      // Agregar a las actividades existentes
      setActivities(prev => [...prev, ...activitiesData]);
      
      // Actualizar el último documento visible
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar más actividades:', error);
      setError('Error al cargar más actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [lastVisible]);

  // Registrar una nueva actividad con limpieza de valores undefined
  const logActivity = useCallback(async (activityData) => {
    try {
      if (!currentUser) {
        return;
      }

      // Limpiar valores undefined antes de enviar a Firestore
      const cleanedActivityData = cleanUndefinedValues({
        type: activityData.type || 'unknown',
        entity: activityData.entity || 'unknown',
        entityId: activityData.entityId || '',
        entityName: activityData.entityName || '',
        action: activityData.action || '',
        description: activityData.description || '',
        metadata: activityData.metadata || {},
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Usuario desconocido',
        userEmail: currentUser.email || '',
        createdAt: serverTimestamp()
      });

      // Validar que los datos requeridos estén presentes
      if (!cleanedActivityData.type || !cleanedActivityData.entity) {
        return;
      }

      // Insertar en Firestore
      const docRef = await addDoc(collection(db, 'activities'), cleanedActivityData);
      
      // Actualizar las actividades locales agregando la nueva al principio
      const newActivity = {
        id: docRef.id,
        ...cleanedActivityData,
        createdAt: new Date()
      };

      setActivities(prev => [newActivity, ...prev]);

      return docRef.id;

    } catch (error) {
      console.error('Error al registrar actividad:', error);
      // No lanzamos el error para que no interrumpa la operación principal
      setError('Error al registrar actividad: ' + error.message);
    }
  }, [currentUser]);

  // Cargar actividades por tipo de entidad
  const loadActivitiesByEntity = useCallback(async (entity, entityId = null) => {
    if (isLoadingRef.current) return [];
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      let activitiesQuery = query(
        collection(db, 'activities'),
        where('entity', '==', entity),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      if (entityId) {
        activitiesQuery = query(
          collection(db, 'activities'),
          where('entity', '==', entity),
          where('entityId', '==', entityId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesData = [];
      
      querySnapshot.forEach((doc) => {
        const activityData = doc.data();
        activitiesData.push({
          id: doc.id,
          ...activityData,
          createdAt: activityData.createdAt ? new Date(activityData.createdAt.seconds * 1000) : new Date()
        });
      });
      
      setActivities(activitiesData);
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades por entidad:', error);
      setError('Error al cargar actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Cargar actividades por usuario
  const loadActivitiesByUser = useCallback(async (userId) => {
    if (isLoadingRef.current) return [];
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesData = [];
      
      querySnapshot.forEach((doc) => {
        const activityData = doc.data();
        activitiesData.push({
          id: doc.id,
          ...activityData,
          createdAt: activityData.createdAt ? new Date(activityData.createdAt.seconds * 1000) : new Date()
        });
      });
      
      setActivities(activitiesData);
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades por usuario:', error);
      setError('Error al cargar actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Obtener actividades recientes para el dashboard (últimas 10)
  const getRecentActivities = useCallback(() => {
    return activities.slice(0, 10);
  }, [activities]);

  // CORREGIDO: Cargar actividades solo una vez al inicializar
  useEffect(() => {
    // Solo cargar si hay usuario y no se ha inicializado antes
    if (currentUser && !hasInitializedRef.current && !isLoadingRef.current) {
      hasInitializedRef.current = true;
      loadActivities(50);
    } else if (!currentUser) {
      // Limpiar actividades si no hay usuario
      setActivities([]);
      hasInitializedRef.current = false;
    }
  }, [currentUser]); // CORREGIDO: Remover loadActivities de las dependencias

  const value = {
    activities,
    loading,
    error,
    logActivity,
    loadActivities,
    loadMoreActivities,
    loadActivitiesByEntity,
    loadActivitiesByUser,
    getRecentActivities
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}