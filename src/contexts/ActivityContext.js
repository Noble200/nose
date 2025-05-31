// src/contexts/ActivityContext.js - CORREGIDO: Manejo correcto de fechas
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

// Función para convertir timestamp de Firebase a Date de manera segura
const convertFirebaseTimestamp = (timestamp) => {
  try {
    if (!timestamp) {
      return new Date(); // Fecha actual si no hay timestamp
    }
    
    // Si ya es un objeto Date válido
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      return timestamp;
    }
    
    // Si es un timestamp de Firebase con propiedad seconds
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Si es un timestamp de Firebase con método toDate
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Si es un string de fecha
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Si es un número (timestamp en milisegundos)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    console.warn('Formato de timestamp no reconocido:', timestamp);
    return new Date(); // Fecha actual como fallback
    
  } catch (error) {
    console.error('Error al convertir timestamp:', error);
    return new Date(); // Fecha actual como fallback
  }
};

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
  
  // Usar useRef para evitar bucles infinitos
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Cargar actividades con paginación - CORREGIDO: Manejo de fechas
  const loadActivities = useCallback(async (limitCount = 50, reset = true) => {
    if (isLoadingRef.current) {
      return [];
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError('');
      
      console.log('Cargando actividades...'); // Debug
      
      const activitiesQuery = query(
        collection(db, 'activities'), 
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activitiesData = [];
      
      querySnapshot.forEach((doc) => {
        const activityData = doc.data();
        
        console.log('Actividad raw data:', activityData); // Debug
        
        // CORREGIDO: Convertir la fecha correctamente
        const convertedActivity = {
          id: doc.id,
          type: activityData.type || 'unknown',
          entity: activityData.entity || 'unknown',
          entityId: activityData.entityId || '',
          entityName: activityData.entityName || '',
          action: activityData.action || '',
          description: activityData.description || '',
          metadata: activityData.metadata || {},
          userId: activityData.userId || '',
          userName: activityData.userName || 'Usuario desconocido',
          userEmail: activityData.userEmail || '',
          createdAt: convertFirebaseTimestamp(activityData.createdAt) // CORREGIDO
        };
        
        console.log('Actividad procesada:', convertedActivity); // Debug
        
        activitiesData.push(convertedActivity);
      });
      
      console.log(`Total actividades cargadas: ${activitiesData.length}`); // Debug
      
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

  // Cargar más actividades (paginación) - CORREGIDO: Manejo de fechas
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
        
        // CORREGIDO: Convertir la fecha correctamente
        const convertedActivity = {
          id: doc.id,
          type: activityData.type || 'unknown',
          entity: activityData.entity || 'unknown',
          entityId: activityData.entityId || '',
          entityName: activityData.entityName || '',
          action: activityData.action || '',
          description: activityData.description || '',
          metadata: activityData.metadata || {},
          userId: activityData.userId || '',
          userName: activityData.userName || 'Usuario desconocido',
          userEmail: activityData.userEmail || '',
          createdAt: convertFirebaseTimestamp(activityData.createdAt) // CORREGIDO
        };
        
        activitiesData.push(convertedActivity);
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
        console.warn('No hay usuario autenticado para registrar actividad');
        return;
      }

      console.log('Registrando nueva actividad:', activityData); // Debug

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
        createdAt: serverTimestamp() // Usar serverTimestamp para consistencia
      });

      // Validar que los datos requeridos estén presentes
      if (!cleanedActivityData.type || !cleanedActivityData.entity) {
        console.warn('Datos insuficientes para registrar actividad:', cleanedActivityData);
        return;
      }

      console.log('Datos limpios para Firestore:', cleanedActivityData); // Debug

      // Insertar en Firestore
      const docRef = await addDoc(collection(db, 'activities'), cleanedActivityData);
      
      console.log('Actividad registrada con ID:', docRef.id); // Debug
      
      // CORREGIDO: Actualizar las actividades locales con fecha correcta
      const newActivity = {
        id: docRef.id,
        ...cleanedActivityData,
        createdAt: new Date() // Usar fecha actual para la visualización inmediata
      };

      setActivities(prev => [newActivity, ...prev]);

      return docRef.id;

    } catch (error) {
      console.error('Error al registrar actividad:', error);
      setError('Error al registrar actividad: ' + error.message);
    }
  }, [currentUser]);

  // Cargar actividades por tipo de entidad - CORREGIDO: Manejo de fechas
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
        
        // CORREGIDO: Convertir la fecha correctamente
        const convertedActivity = {
          id: doc.id,
          type: activityData.type || 'unknown',
          entity: activityData.entity || 'unknown',
          entityId: activityData.entityId || '',
          entityName: activityData.entityName || '',
          action: activityData.action || '',
          description: activityData.description || '',
          metadata: activityData.metadata || {},
          userId: activityData.userId || '',
          userName: activityData.userName || 'Usuario desconocido',
          userEmail: activityData.userEmail || '',
          createdAt: convertFirebaseTimestamp(activityData.createdAt) // CORREGIDO
        };
        
        activitiesData.push(convertedActivity);
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

  // Cargar actividades por usuario - CORREGIDO: Manejo de fechas
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
        
        // CORREGIDO: Convertir la fecha correctamente
        const convertedActivity = {
          id: doc.id,
          type: activityData.type || 'unknown',
          entity: activityData.entity || 'unknown',
          entityId: activityData.entityId || '',
          entityName: activityData.entityName || '',
          action: activityData.action || '',
          description: activityData.description || '',
          metadata: activityData.metadata || {},
          userId: activityData.userId || '',
          userName: activityData.userName || 'Usuario desconocido',
          userEmail: activityData.userEmail || '',
          createdAt: convertFirebaseTimestamp(activityData.createdAt) // CORREGIDO
        };
        
        activitiesData.push(convertedActivity);
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

  // Cargar actividades solo una vez al inicializar
  useEffect(() => {
    if (currentUser && !hasInitializedRef.current && !isLoadingRef.current) {
      console.log('Inicializando actividades para usuario:', currentUser.email); // Debug
      hasInitializedRef.current = true;
      loadActivities(50);
    } else if (!currentUser) {
      console.log('Limpiando actividades - no hay usuario'); // Debug
      setActivities([]);
      hasInitializedRef.current = false;
    }
  }, [currentUser]);

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