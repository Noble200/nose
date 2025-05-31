// src/controllers/UsersController.js - Controlador para gestión de usuarios
import { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { useActivityLogger } from '../hooks/useActivityLogger';

const useUsersController = () => {
  const {
    users,
    loading: usersLoading,
    error: usersError,
    loadUsers,
    addUser,
    updateUser,
    deleteUser,
    updateUserPermissions
  } = useUsers();

  const { logUser } = useActivityLogger();

  // Estados locales
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-user', 'edit-user', 'view-user', 'permissions'
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredUsersList, setFilteredUsersList] = useState([]);

  // Actualizar estado de carga y error
  useEffect(() => {
    setLoading(usersLoading);
    if (usersError) {
      setError(usersError);
    } else {
      setError('');
    }
  }, [usersLoading, usersError]);

  // Cargar usuarios al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setError('');
      await loadUsers();
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios: ' + err.message);
    }
  }, [loadUsers]);

  // Filtrar usuarios según filtros aplicados
  const getFilteredUsers = useCallback(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    
    return users.filter(user => {
      // Filtro por rol
      if (filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }
      
      // Filtro por estado (activo/inactivo basado en la fecha de última actividad)
      if (filters.status !== 'all') {
        const isActive = user.lastLoginAt ? 
          (new Date() - new Date(user.lastLoginAt)) < (30 * 24 * 60 * 60 * 1000) : // 30 días
          false;
        
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          (user.displayName && user.displayName.toLowerCase().includes(term)) ||
          (user.username && user.username.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [users, filters]);

  // Actualizar usuarios filtrados cuando cambian los filtros o usuarios
  useEffect(() => {
    setFilteredUsersList(getFilteredUsers());
  }, [getFilteredUsers]);

  // Abrir diálogo para añadir usuario
  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setDialogType('add-user');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para editar usuario
  const handleEditUser = useCallback((user) => {
    setSelectedUser(user);
    setDialogType('edit-user');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para ver detalles de usuario
  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
    setDialogType('view-user');
    setDialogOpen(true);
  }, []);

  // Abrir diálogo para gestionar permisos
  const handleManagePermissions = useCallback((user) => {
    setSelectedUser(user);
    setDialogType('permissions');
    setDialogOpen(true);
  }, []);

  // Confirmar eliminación de usuario
  const handleDeleteUser = useCallback(async (userId) => {
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      setError('Usuario no encontrado');
      return;
    }

    const confirmMessage = `¿Estás seguro de que deseas eliminar al usuario "${user.displayName || user.username}"? Esta acción no se puede deshacer.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteUser(userId);
        
        // Registrar actividad
        await logUser('delete', user, {
          deletedBy: 'admin',
          reason: 'Eliminación manual desde panel de usuarios'
        });
        
        // Cerrar el diálogo si estaba abierto para este usuario
        if (selectedUser && selectedUser.id === userId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar usuario:', err);
        setError('Error al eliminar usuario: ' + err.message);
      }
    }
  }, [deleteUser, selectedUser, users, logUser]);

  // Guardar usuario (nuevo o editado)
  const handleSaveUser = useCallback(async (userData) => {
    try {
      if (dialogType === 'add-user') {
        // Crear nuevo usuario
        const userId = await addUser(userData);
        
        // Registrar actividad
        await logUser('create', {
          id: userId,
          ...userData
        }, {
          role: userData.role,
          permissions: Object.keys(userData.permissions || {})
        });
        
      } else if (dialogType === 'edit-user' && selectedUser) {
        // Actualizar usuario existente
        await updateUser(selectedUser.id, userData);
        
        // Registrar actividad
        await logUser('update', {
          id: selectedUser.id,
          ...userData
        }, {
          previousRole: selectedUser.role,
          newRole: userData.role,
          changedFields: getChangedFields(selectedUser, userData)
        });
      }
      
      setDialogOpen(false);
      await loadUsers();
      return true;
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      setError('Error al guardar usuario: ' + err.message);
      throw err;
    }
  }, [dialogType, selectedUser, addUser, updateUser, loadUsers, logUser]);

  // Actualizar permisos de usuario
  const handleSavePermissions = useCallback(async (permissions) => {
    try {
      if (!selectedUser) return;
      
      await updateUserPermissions(selectedUser.id, permissions);
      
      // Registrar actividad
      await logUser('permissions-update', selectedUser, {
        previousPermissions: Object.keys(selectedUser.permissions || {}),
        newPermissions: Object.keys(permissions),
        permissionsAdded: getAddedPermissions(selectedUser.permissions, permissions),
        permissionsRemoved: getRemovedPermissions(selectedUser.permissions, permissions)
      });
      
      setDialogOpen(false);
      await loadUsers();
      return true;
    } catch (err) {
      console.error('Error al actualizar permisos:', err);
      setError('Error al actualizar permisos: ' + err.message);
      throw err;
    }
  }, [selectedUser, updateUserPermissions, loadUsers, logUser]);

  // Cambiar filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Buscar por texto
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  }, []);

  // Cerrar diálogo
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedUser(null);
  }, []);

  // Obtener estadísticas de usuarios
  const getStatistics = useCallback(() => {
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const managerUsers = users.filter(u => u.role === 'manager').length;
    const operatorUsers = users.filter(u => u.role === 'operator').length;
    const viewerUsers = users.filter(u => u.role === 'viewer').length;
    const basicUsers = users.filter(u => u.role === 'user').length;
    
    // Usuarios activos (que se conectaron en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = users.filter(u => 
      u.lastLoginAt && new Date(u.lastLoginAt) > thirtyDaysAgo
    ).length;
    
    return {
      totalUsers,
      adminUsers,
      managerUsers,
      operatorUsers,
      viewerUsers,
      basicUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };
  }, [users]);

  // Opciones para filtros
  const filterOptions = {
    roles: [
      { value: 'all', label: 'Todos los roles' },
      { value: 'admin', label: 'Administrador' },
      { value: 'manager', label: 'Gerente' },
      { value: 'operator', label: 'Operador' },
      { value: 'viewer', label: 'Visualizador' },
      { value: 'user', label: 'Usuario básico' }
    ],
    statuses: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'active', label: 'Activos' },
      { value: 'inactive', label: 'Inactivos' }
    ]
  };

  return {
    users: filteredUsersList,
    loading,
    error,
    selectedUser,
    dialogOpen,
    dialogType,
    filterOptions,
    statistics: getStatistics(),
    handleAddUser,
    handleEditUser,
    handleViewUser,
    handleManagePermissions,
    handleDeleteUser,
    handleSaveUser,
    handleSavePermissions,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

// Funciones auxiliares
function getChangedFields(oldUser, newUser) {
  const changes = [];
  const fieldsToCheck = ['displayName', 'username', 'email', 'role'];
  
  fieldsToCheck.forEach(field => {
    if (oldUser[field] !== newUser[field]) {
      changes.push(`${field}: ${oldUser[field]} → ${newUser[field]}`);
    }
  });
  
  return changes;
}

function getAddedPermissions(oldPermissions = {}, newPermissions = {}) {
  const added = [];
  
  Object.keys(newPermissions).forEach(permission => {
    if (newPermissions[permission] && !oldPermissions[permission]) {
      added.push(permission);
    }
  });
  
  return added;
}

function getRemovedPermissions(oldPermissions = {}, newPermissions = {}) {
  const removed = [];
  
  Object.keys(oldPermissions).forEach(permission => {
    if (oldPermissions[permission] && !newPermissions[permission]) {
      removed.push(permission);
    }
  });
  
  return removed;
}

export default useUsersController;