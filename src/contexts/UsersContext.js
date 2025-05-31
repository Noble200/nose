// src/contexts/UsersContext.js - Contexto para gestión de usuarios
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
  serverTimestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { auth, db } from '../api/firebase';
import { useAuth } from './AuthContext';

// Crear el contexto de usuarios
const UsersContext = createContext();

export function useUsers() {
  return useContext(UsersContext);
}

// Función para crear permisos por defecto
const createDefaultPermissions = (role = 'user') => {
  const basePermissions = {
    dashboard: true,
    activities: true
  };

  switch (role) {
    case 'admin':
      return {
        ...basePermissions,
        admin: true,
        products: true,
        transfers: true,
        purchases: true,
        expenses: true,
        fumigations: true,
        harvests: true,
        fields: true,
        warehouses: true,
        reports: true,
        activities: true,
        users: true
      };
    
    case 'manager':
      return {
        ...basePermissions,
        products: true,
        transfers: true,
        purchases: true,
        expenses: true,
        fumigations: true,
        harvests: true,
        fields: true,
        warehouses: true,
        reports: true,
        activities: true
      };
    
    case 'operator':
      return {
        ...basePermissions,
        products: true,
        transfers: true,
        fumigations: true,
        harvests: true,
        activities: true
      };
    
    case 'viewer':
      return {
        ...basePermissions,
        products: true,
        activities: true
      };
    
    default: // 'user'
      return {
        ...basePermissions,
        products: true,
        activities: true
      };
  }
};

export function UsersProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Cargando usuarios desde Firestore...'); // Debug
      
      // Crear consulta para obtener todos los usuarios
      const usersQuery = query(collection(db, 'users'), orderBy('displayName'));
      const querySnapshot = await getDocs(usersQuery);
      
      // Mapear documentos a objetos de usuarios
      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          email: userData.email || '',
          username: userData.username || '',
          displayName: userData.displayName || '',
          role: userData.role || 'user',
          permissions: userData.permissions || createDefaultPermissions(userData.role || 'user'),
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLoginAt: userData.lastLoginAt || null,
          isActive: userData.isActive !== false // Por defecto activo
        });
      });
      
      console.log('Total usuarios cargados:', usersData.length); // Debug
      
      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Añadir un usuario
  const addUser = useCallback(async (userData) => {
    try {
      setError('');
      
      console.log('Creando usuario:', userData); // Debug
      
      // Verificar que el email y password estén presentes
      if (!userData.email || !userData.password) {
        throw new Error('Email y contraseña son obligatorios');
      }
      
      // Verificar si el nombre de usuario ya existe
      if (userData.username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', userData.username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Preparar datos para Firestore (sin la contraseña)
      const userDataForDB = {
        id: user.uid,
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        displayName: userData.displayName || userData.username || userData.email.split('@')[0],
        role: userData.role || 'user',
        permissions: userData.permissions || createDefaultPermissions(userData.role || 'user'),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'system'
      };
      
      console.log('Datos a guardar en Firestore:', userDataForDB); // Debug
      
      // Guardar en Firestore
      await addDoc(collection(db, 'users'), userDataForDB);
      
      console.log('Usuario creado exitosamente con ID:', user.uid); // Debug
      
      // Recargar usuarios
      await loadUsers();
      
      return user.uid;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setError('Error al crear usuario: ' + error.message);
      throw error;
    }
  }, [loadUsers, currentUser]);

  // Actualizar un usuario
  const updateUser = useCallback(async (userId, userData) => {
    try {
      setError('');
      
      console.log('Actualizando usuario:', userId, userData); // Debug
      
      // Verificar si el nombre de usuario ya existe (excluyendo el usuario actual)
      if (userData.username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', userData.username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }
      
      // Preparar datos para actualizar (excluir campos sensibles)
      const { password, id, uid, createdAt, createdBy, ...updateData } = userData;
      
      const finalUpdateData = {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || 'system'
      };
      
      // Asegurar que los permisos estén completos
      if (finalUpdateData.permissions && !finalUpdateData.permissions.hasOwnProperty('activities')) {
        finalUpdateData.permissions.activities = true;
      }
      
      console.log('Datos finales de actualización:', finalUpdateData); // Debug
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', userId), finalUpdateData);
      
      console.log('Usuario actualizado exitosamente'); // Debug
      
      // Recargar usuarios
      await loadUsers();
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar usuario ${userId}:`, error);
      setError('Error al actualizar usuario: ' + error.message);
      throw error;
    }
  }, [loadUsers, currentUser]);

  // Eliminar un usuario
  const deleteUser = useCallback(async (userId) => {
    try {
      setError('');
      
      console.log('Eliminando usuario:', userId); // Debug
      
      // Verificar que no se esté eliminando el usuario actual
      if (userId === currentUser?.uid) {
        throw new Error('No puedes eliminar tu propia cuenta');
      }
      
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      console.log('Usuario eliminado de Firestore'); // Debug
      
      // Nota: La eliminación del usuario de Firebase Auth requiere que el usuario esté 
      // autenticado, lo cual es complejo desde el admin. Se podría implementar con 
      // Firebase Admin SDK en el backend, pero por ahora solo eliminamos de Firestore.
      
      // Recargar usuarios
      await loadUsers();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar usuario ${userId}:`, error);
      setError('Error al eliminar usuario: ' + error.message);
      throw error;
    }
  }, [loadUsers, currentUser]);

  // Actualizar permisos de un usuario
  const updateUserPermissions = useCallback(async (userId, permissions) => {
    try {
      setError('');
      
      console.log('Actualizando permisos del usuario:', userId, permissions); // Debug
      
      // Asegurar que el permiso 'activities' esté incluido
      const finalPermissions = {
        activities: true,
        ...permissions
      };
      
      const updateData = {
        permissions: finalPermissions,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || 'system'
      };
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', userId), updateData);
      
      console.log('Permisos actualizados exitosamente'); // Debug
      
      // Recargar usuarios
      await loadUsers();
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar permisos del usuario ${userId}:`, error);
      setError('Error al actualizar permisos: ' + error.message);
      throw error;
    }
  }, [loadUsers, currentUser]);

  // Desactivar/activar usuario
  const toggleUserStatus = useCallback(async (userId, isActive) => {
    try {
      setError('');
      
      const updateData = {
        isActive: isActive,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || 'system'
      };
      
      await updateDoc(doc(db, 'users', userId), updateData);
      
      // Recargar usuarios
      await loadUsers();
      
      return userId;
    } catch (error) {
      console.error(`Error al cambiar estado del usuario ${userId}:`, error);
      setError('Error al cambiar estado del usuario: ' + error.message);
      throw error;
    }
  }, [loadUsers, currentUser]);

  // Registrar último login (se puede llamar desde el AuthContext)
  const updateLastLogin = useCallback(async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Error al actualizar último login:', error);
      // No lanzar error para no interrumpir el flujo de login
    }
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Solo cargar usuarios si el usuario actual tiene permisos de administración
    if (currentUser.permissions?.users || currentUser.permissions?.admin) {
      console.log('Cargando usuarios iniciales...'); // Debug
      
      loadUsers()
        .then(() => {
          console.log('Usuarios cargados exitosamente'); // Debug
        })
        .catch(err => {
          console.error('Error al cargar datos iniciales de usuarios:', err);
          setError('Error al cargar datos: ' + err.message);
        });
    } else {
      console.log('Usuario sin permisos para gestionar usuarios'); // Debug
      setUsers([]);
      setLoading(false);
    }
  }, [currentUser, loadUsers]);

  // Valor que se proporcionará a través del contexto
  const value = {
    users,
    loading,
    error,
    setError,
    loadUsers,
    addUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    toggleUserStatus,
    updateLastLogin,
    createDefaultPermissions
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
}

export default UsersContext;