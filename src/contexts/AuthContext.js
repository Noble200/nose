// src/contexts/AuthContext.js - ACTUALIZADO: Incluir permiso 'activities' en permisos por defecto
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import usersService from '../api/usersService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para crear permisos por defecto actualizados
  const createDefaultPermissions = (role = 'user') => {
    const basePermissions = {
      dashboard: true,
      activities: true // NUEVO: Todos pueden ver actividades por defecto
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
          activities: true, // CONFIRMADO: Los admins pueden ver actividades
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
          activities: true // Los managers pueden ver actividades
        };
      
      case 'operator':
        return {
          ...basePermissions,
          products: true,
          transfers: true,
          fumigations: true,
          harvests: true,
          activities: true // Los operadores pueden ver actividades
        };
      
      case 'viewer':
        return {
          ...basePermissions,
          products: true,
          activities: true // Los viewers pueden ver actividades (solo lectura)
        };
      
      default: // 'user'
        return {
          ...basePermissions,
          products: true,
          activities: true // Los usuarios básicos pueden ver actividades
        };
    }
  };

  async function login(email, password) {
    try {
      setError('');
      const userData = await usersService.login(email, password);
      return userData;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Error al iniciar sesión: ' + error.message);
      throw error;
    }
  }

  async function loginWithUsername(username, password) {
    try {
      setError('');
      const userData = await usersService.loginWithUsername(username, password);
      return userData;
    } catch (error) {
      console.error('Error al iniciar sesión con nombre de usuario:', error);
      setError('Error al iniciar sesión: ' + error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      setError('');
      await usersService.logout();
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión: ' + error.message);
      throw error;
    }
  }

  // ACTUALIZADO: Verificar permisos incluyendo el nuevo permiso 'activities'
  function hasPermission(permission) {
    if (!currentUser || !currentUser.permissions) return false;
    
    // Los administradores tienen todos los permisos
    if (currentUser.role === 'admin' || currentUser.permissions.admin) {
      return true;
    }
    
    // Verificación específica para el permiso 'activities'
    if (permission === 'activities') {
      return currentUser.permissions.activities === true;
    }
    
    // Verificar permiso específico
    return currentUser.permissions[permission] === true;
  }

  useEffect(() => {
    setLoading(true);
    console.log('Inicializando contexto de autenticación...');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log('Usuario autenticado detectado:', user.email);
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          let userData = {};
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
          
          // ACTUALIZADO: Asegurar que los permisos incluyan 'activities'
          let permissions = userData.permissions || createDefaultPermissions(userData.role || 'user');
          
          // Si no tiene el permiso de actividades, añadirlo
          if (!permissions.hasOwnProperty('activities')) {
            permissions.activities = true; // Por defecto, todos pueden ver actividades
            
            // Actualizar en Firestore si es necesario
            try {
              await setDoc(doc(db, 'users', user.uid), { 
                ...userData, 
                permissions 
              }, { merge: true });
            } catch (updateError) {
              console.warn('No se pudo actualizar permisos automáticamente:', updateError);
            }
          }
          
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            username: userData.username || user.email.split('@')[0],
            displayName: userData.displayName || userData.username || user.email.split('@')[0],
            emailVerified: user.emailVerified,
            role: userData.role || 'user',
            permissions: permissions // ACTUALIZADO: Usar permisos actualizados
          });
        } else {
          console.log('No hay usuario autenticado, limpiando estado');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error al procesar cambio de autenticación:', error);
        setError('Error al obtener datos completos del usuario: ' + error.message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Limpiando suscripciones de autenticación');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    login,
    loginWithUsername,
    logout,
    hasPermission, // ACTUALIZADO: Incluye verificación del permiso 'activities'
    error,
    setError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;