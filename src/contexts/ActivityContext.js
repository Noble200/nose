// src/contexts/ActivityContext.js - Contexto CORREGIDO con manejo de valores undefined
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// NUEVA FUNCIÓN: Limpiar valores undefined de un objeto recursivamente
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

  // Cargar actividades con paginación
  const loadActivities = useCallback(async (limitCount = 50, reset = true) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 ActivityContext.loadActivities - Cargando actividades...', { limitCount, reset });
      
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
      
      console.log('✅ ActivityContext.loadActivities - Actividades cargadas:', activitiesData.length);
      
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
      console.error('❌ ActivityContext.loadActivities - Error:', error);
      setError('Error al cargar actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar más actividades (paginación)
  const loadMoreActivities = useCallback(async (limitCount = 20) => {
    try {
      if (!lastVisible) return [];
      
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
    }
  }, [lastVisible]);

  // CORREGIDO: Registrar una nueva actividad con limpieza de valores undefined
  const logActivity = useCallback(async (activityData) => {
    try {
      if (!currentUser) {
        console.warn('🔍 ActivityContext.logActivity - No hay usuario autenticado');
        return;
      }

      console.log('🔍 ActivityContext.logActivity - Datos recibidos:', activityData);

      // CORREGIDO: Limpiar valores undefined antes de enviar a Firestore
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

      console.log('🔍 ActivityContext.logActivity - Datos limpiados:', cleanedActivityData);

      // Validar que los datos requeridos estén presentes
      if (!cleanedActivityData.type || !cleanedActivityData.entity) {
        console.error('❌ ActivityContext.logActivity - Datos insuficientes:', cleanedActivityData);
        return;
      }

      // Insertar en Firestore
      const docRef = await addDoc(collection(db, 'activities'), cleanedActivityData);
      console.log('✅ ActivityContext.logActivity - Actividad guardada con ID:', docRef.id);
      
      // Actualizar las actividades locales agregando la nueva al principio
      const newActivity = {
        id: docRef.id,
        ...cleanedActivityData,
        createdAt: new Date()
      };

      setActivities(prev => [newActivity, ...prev]);

      return docRef.id;

    } catch (error) {
      console.error('❌ ActivityContext.logActivity - Error al registrar actividad:', error);
      // No lanzamos el error para que no interrumpa la operación principal
      setError('Error al registrar actividad: ' + error.message);
    }
  }, [currentUser]);

  // Cargar actividades por tipo de entidad
  const loadActivitiesByEntity = useCallback(async (entity, entityId = null) => {
    try {
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
    }
  }, []);

  // Cargar actividades por usuario
  const loadActivitiesByUser = useCallback(async (userId) => {
    try {
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
    }
  }, []);

  // Obtener actividades recientes para el dashboard (últimas 10)
  const getRecentActivities = useCallback(() => {
    return activities.slice(0, 10);
  }, [activities]);

  // Cargar actividades al inicializar
  useEffect(() => {
    if (currentUser) {
      console.log('🔍 ActivityContext - Usuario detectado, cargando actividades...');
      loadActivities(50);
    } else {
      console.log('🔍 ActivityContext - No hay usuario, limpiando actividades...');
      setActivities([]);
    }
  }, [currentUser, loadActivities]);

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

  console.log('🔍 ActivityContext - Valor del contexto:', {
    activitiesCount: activities.length,
    loading,
    error,
    logActivityExists: !!logActivity
  });

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}