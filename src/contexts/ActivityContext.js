// src/contexts/ActivityContext.js - Contexto actualizado con paginación
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

  // Registrar una nueva actividad
  const logActivity = useCallback(async (activityData) => {
    try {
      if (!currentUser) return;

      const activity = {
        type: activityData.type, // 'create', 'update', 'delete'
        entity: activityData.entity, // 'product', 'transfer', 'fumigation', etc.
        entityId: activityData.entityId,
        entityName: activityData.entityName || '',
        action: activityData.action, // 'Creó producto', 'Completó transferencia', etc.
        description: activityData.description || '',
        metadata: activityData.metadata || {}, // Datos adicionales específicos
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'activities'), activity);
      
      // Actualizar las actividades locales agregando la nueva al principio
      const newActivity = {
        id: Date.now().toString(), // ID temporal
        ...activity,
        createdAt: new Date()
      };

      setActivities(prev => [newActivity, ...prev]);

    } catch (error) {
      console.error('Error al registrar actividad:', error);
      // No lanzamos el error para que no interrumpa la operación principal
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
      loadActivities(50);
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

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}