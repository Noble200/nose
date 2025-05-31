// src/contexts/ActivityContext.js - Contexto para el historial de actividades
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp
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

  // Cargar actividades recientes
  const loadActivities = useCallback(async (limitCount = 50) => {
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
      
      setActivities(activitiesData);
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar actividades: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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
      setActivities(prev => [
        {
          id: Date.now().toString(), // ID temporal
          ...activity,
          createdAt: new Date()
        },
        ...prev.slice(0, 49) // Mantener solo las 50 más recientes
      ]);

    } catch (error) {
      console.error('Error al registrar actividad:', error);
      // No lanzamos el error para que no interrumpa la operación principal
    }
  }, [currentUser]);

  // Cargar actividades por tipo de entidad
  const loadActivitiesByEntity = useCallback(async (entity, entityId = null) => {
    try {
      setLoading(true);
      
      let activitiesQuery = query(
        collection(db, 'activities'),
        where('entity', '==', entity),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      if (entityId) {
        activitiesQuery = query(
          collection(db, 'activities'),
          where('entity', '==', entity),
          where('entityId', '==', entityId),
          orderBy('createdAt', 'desc'),
          limit(20)
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
      
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades por entidad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar actividades por usuario
  const loadActivitiesByUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(30)
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
      
      return activitiesData;
    } catch (error) {
      console.error('Error al cargar actividades por usuario:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar actividades al inicializar
  useEffect(() => {
    if (currentUser) {
      loadActivities();
    }
  }, [currentUser, loadActivities]);

  const value = {
    activities,
    loading,
    error,
    logActivity,
    loadActivities,
    loadActivitiesByEntity,
    loadActivitiesByUser
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}