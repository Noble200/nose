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

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  return useContext(AuthContext);
}

// Proveedor del contexto de autenticación
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para iniciar sesión con email
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

  // Función para iniciar sesión con nombre de usuario
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

  // Función para cerrar sesión
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

  // Verificar si un usuario tiene un permiso específico
  function hasPermission(permission) {
    if (!currentUser || !currentUser.permissions) return false;
    
    // Los administradores tienen todos los permisos
    if (currentUser.role === 'admin' || currentUser.permissions.admin) {
      return true;
    }
    
    // Verificar permiso específico
    return currentUser.permissions[permission] === true;
  }

  // Efecto para monitorear cambios en la autenticación
  useEffect(() => {
    setLoading(true);
    console.log('Inicializando contexto de autenticación...');

    // Suscripción a cambios en la autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log('Usuario autenticado detectado:', user.email);
          
          // Obtener datos adicionales del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          let userData = {};
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
          
          // Combinar datos de autenticación con datos de Firestore
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            username: userData.username || user.email.split('@')[0],
            displayName: userData.displayName || userData.username || user.email.split('@')[0],
            emailVerified: user.emailVerified,
            role: userData.role || 'user',
            permissions: userData.permissions || { dashboard: true }
          });
        } else {
          // Reiniciar estados si no hay usuario autenticado
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

    // Limpiar suscripción al desmontar
    return () => {
      console.log('Limpiando suscripciones de autenticación');
      unsubscribe();
    };
  }, []);

  // Valor que se proporcionará a través del contexto
  const value = {
    currentUser,
    login,
    loginWithUsername,
    logout,
    hasPermission,
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