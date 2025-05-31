// src/api/usersService.js - COMPLETO con permiso de actividades
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Función para crear permisos por defecto con el nuevo permiso 'activities'
const createDefaultPermissions = (role = 'user') => {
  const basePermissions = {
    dashboard: true, // Todos pueden ver el dashboard
    activities: true // NUEVO: Todos pueden ver las actividades por defecto
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
        activities: true // NUEVO: Los managers pueden ver actividades
      };
    
    case 'operator':
      return {
        ...basePermissions,
        products: true,
        transfers: true,
        fumigations: true,
        harvests: true,
        activities: true // NUEVO: Los operadores pueden ver actividades
      };
    
    case 'viewer':
      return {
        ...basePermissions,
        products: true,
        activities: true // NUEVO: Los viewers pueden ver actividades (solo lectura)
      };
    
    default: // 'user'
      return {
        ...basePermissions,
        products: true,
        activities: true // NUEVO: Los usuarios básicos pueden ver actividades
      };
  }
};

const usersService = {
  login: async (email, password) => {
    try {
      console.log('Iniciando proceso de login con email...');
      
      // Iniciar sesión con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Login exitoso con ID:', user.uid);

      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Si no existe el usuario en la colección users, crearlo
        const basicUserData = {
          id: user.uid,
          email: user.email,
          username: user.email.split('@')[0],
          displayName: user.email.split('@')[0],
          role: 'user',
          permissions: createDefaultPermissions('user') // ACTUALIZADO: Usar función con nuevos permisos
        };

        await setDoc(doc(db, 'users', user.uid), basicUserData);
        
        return {
          uid: user.uid,
          ...basicUserData,
          emailVerified: user.emailVerified,
          isNewUser: true
        };
      }

      const userData = userDoc.data();
      
      // ACTUALIZADO: Verificar y actualizar permisos si es necesario
      let permissions = userData.permissions || createDefaultPermissions(userData.role || 'user');
      
      // Asegurar que el permiso 'activities' existe
      if (!permissions.hasOwnProperty('activities')) {
        permissions.activities = true; // Por defecto, todos pueden ver actividades
        
        // Actualizar en Firestore si es necesario
        await updateDoc(doc(db, 'users', user.uid), { permissions });
      }
      
      return {
        uid: user.uid,
        email: user.email,
        username: userData.username || user.email.split('@')[0],
        displayName: userData.displayName || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        role: userData.role || 'user',
        permissions: permissions
      };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  },

  loginWithUsername: async (username, password) => {
    try {
      console.log('Iniciando proceso de login con nombre de usuario...');
      
      // Buscar el usuario en Firestore por nombre de usuario
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.error('Nombre de usuario no encontrado:', username);
        throw { code: 'username-not-found', message: 'Nombre de usuario no encontrado' };
      }
      
      // Obtener el email del usuario
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;
      
      if (!email) {
        throw new Error('Usuario sin correo electrónico asociado');
      }
      
      // Iniciar sesión con Firebase usando el email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Login exitoso con ID:', user.uid);
      
      // ACTUALIZADO: Verificar y actualizar permisos si es necesario
      let permissions = userData.permissions || createDefaultPermissions(userData.role || 'user');
      
      // Asegurar que el permiso 'activities' existe
      if (!permissions.hasOwnProperty('activities')) {
        permissions.activities = true;
        
        // Actualizar en Firestore
        await updateDoc(doc(db, 'users', user.uid), { permissions });
      }
      
      return {
        uid: user.uid,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName || userData.username,
        emailVerified: user.emailVerified,
        role: userData.role || 'user',
        permissions: permissions
      };
    } catch (error) {
      console.error('Error al iniciar sesión con nombre de usuario:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('Iniciando proceso de cierre de sesión');
      await signOut(auth);
      console.log('Sesión cerrada correctamente');
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          unsubscribe();
          resolve(user);
        },
        (error) => {
          reject(error);
        }
      );
    });
  },

  isAuthenticated: async () => {
    const user = await usersService.getCurrentUser();
    return user !== null;
  },

  createUser: async (userData) => {
    try {
      if (!userData.email || !userData.password) {
        throw new Error('El correo y la contraseña son obligatorios');
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
        auth, userData.email, userData.password
      );
      
      const user = userCredential.user;
      
      // Datos a guardar en Firestore
      const { password, sendVerification, ...userDataForDB } = userData;
      
      // ACTUALIZADO: Usar función de permisos por defecto actualizada
      const dataWithDefaults = {
        id: user.uid,
        email: user.email,
        username: userData.username || user.email.split('@')[0],
        displayName: userData.displayName || userData.username || user.email.split('@')[0],
        role: userData.role || 'user',
        permissions: userData.permissions || createDefaultPermissions(userData.role || 'user'), // ACTUALIZADO
        createdAt: new Date()
      };
      
      // Guardar datos en Firestore
      await setDoc(doc(db, 'users', user.uid), dataWithDefaults);
      
      return user.uid;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      // Eliminar campos sensibles que no se deben actualizar directamente
      const { password, email, uid, ...updateData } = userData;
      
      // Si se actualiza el nombre de usuario, verificar que no exista ya
      if (updateData.username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', updateData.username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
          throw new Error('El nombre de usuario ya está en uso');
        }
      }
      
      // ACTUALIZADO: Si se están actualizando permisos, asegurar que 'activities' esté incluido
      if (updateData.permissions && !updateData.permissions.hasOwnProperty('activities')) {
        updateData.permissions.activities = true; // Por defecto, mantener acceso a actividades
      }
      
      // Datos para actualizar en Firestore
      const dbUpdateData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', userId), dbUpdateData);
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar usuario ${userId}:`, error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      // Actualizar contraseña en Firebase Auth
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');
      
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },
  
  changeEmail: async (password, newEmail) => {
    try {
      // Actualizar email en Firebase Auth
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');
      
      await updateEmail(user, newEmail);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', user.uid), { 
        email: newEmail, 
        updatedAt: new Date() 
      });
      
      return true;
    } catch (error) {
      console.error('Error al cambiar correo electrónico:', error);
      throw error;
    }
  },
  
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      throw error;
    }
  },
  
  getAllUsers: async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('displayName'));
      const querySnapshot = await getDocs(usersQuery);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },
  
  getUserById: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName,
        role: userData.role,
        permissions: userData.permissions
      };
    } catch (error) {
      console.error(`Error al obtener usuario ${userId}:`, error);
      throw error;
    }
  },
  
  updateUserPermissions: async (userId, permissions) => {
    try {
      // ACTUALIZADO: Asegurar que el permiso 'activities' se mantenga a menos que se especifique lo contrario
      const updatedPermissions = {
        activities: true, // Por defecto mantener acceso
        ...permissions // Los permisos específicos pueden sobrescribir el valor por defecto
      };
      
      await updateDoc(doc(db, 'users', userId), { 
        permissions: updatedPermissions, 
        updatedAt: new Date() 
      });
      
      return userId;
    } catch (error) {
      console.error(`Error al actualizar permisos del usuario ${userId}:`, error);
      throw error;
    }
  },
  
  hasPermission: async (permission) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        return false;
      }
      
      // Obtener datos de permisos desde Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      
      // Los administradores tienen todos los permisos
      if (userData.role === 'admin' || userData.permissions?.admin) {
        return true;
      }
      
      // ACTUALIZADO: Verificación específica para el permiso 'activities'
      if (permission === 'activities') {
        return userData.permissions?.activities === true;
      }
      
      // Verificar permiso específico
      return userData.permissions?.[permission] === true;
    } catch (error) {
      console.error(`Error al verificar permiso ${permission}:`, error);
      return false;
    }
  },

  verifySession: async () => {
    try {
      const user = auth.currentUser;
      return user !== null;
    } catch (error) {
      console.error('Error en verifySession:', error);
      return false;
    }
  }
};

export default usersService;