// src/components/panels/Users/UsersTable.js - Tabla de usuarios
import React from 'react';

const UsersTable = ({
  users = [],
  loading = false,
  onView,
  onEdit,
  onManagePermissions,
  onDelete
}) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return 'Nunca';
    
    try {
      const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el badge del rol
  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: 'Administrador', class: 'badge-danger', icon: 'fas fa-crown' },
      manager: { label: 'Gerente', class: 'badge-primary', icon: 'fas fa-user-tie' },
      operator: { label: 'Operador', class: 'badge-info', icon: 'fas fa-user-cog' },
      viewer: { label: 'Visualizador', class: 'badge-warning', icon: 'fas fa-eye' },
      user: { label: 'Usuario', class: 'badge-secondary', icon: 'fas fa-user' }
    };

    const config = roleConfig[role] || roleConfig.user;
    
    return (
      <span className={`badge ${config.class}`}>
        <i className={config.icon}></i>
        {config.label}
      </span>
    );
  };

  // Función para obtener el estado del usuario
  const getUserStatus = (user) => {
    if (user.isActive === false) {
      return <span className="badge badge-danger">Desactivado</span>;
    }
    
    // Verificar última conexión (30 días)
    if (user.lastLoginAt) {
      const lastLogin = user.lastLoginAt.seconds ? 
        new Date(user.lastLoginAt.seconds * 1000) : 
        new Date(user.lastLoginAt);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (lastLogin > thirtyDaysAgo) {
        return <span className="badge badge-success">Activo</span>;
      } else {
        return <span className="badge badge-warning">Inactivo</span>;
      }
    }
    
    return <span className="badge badge-secondary">Sin conexión</span>;
  };

  // Función para obtener la inicial del avatar
  const getInitials = (user) => {
    const name = user.displayName || user.username || user.email;
    return name.charAt(0).toUpperCase();
  };

  // Función para contar permisos activos
  const getActivePermissions = (permissions = {}) => {
    return Object.values(permissions).filter(p => p === true).length;
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-message">
          <i className="fas fa-users"></i>
          <p>No se encontraron usuarios</p>
          <small>Los usuarios aparecerán aquí una vez que sean creados</small>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Permisos</th>
            <th>Última conexión</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-info">
                  <div className="user-avatar">
                    {getInitials(user)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.displayName || user.username}
                    </div>
                    <div className="user-username">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span className="user-email">{user.email}</span>
              </td>
              <td>
                {getRoleBadge(user.role)}
              </td>
              <td>
                {getUserStatus(user)}
              </td>
              <td>
                <div className="permissions-info">
                  <span className="permissions-count">
                    {getActivePermissions(user.permissions)} permisos
                  </span>
                  <button
                    className="btn-text permissions-detail"
                    onClick={() => onManagePermissions(user)}
                    title="Gestionar permisos"
                  >
                    <i className="fas fa-key"></i>
                    Gestionar
                  </button>
                </div>
              </td>
              <td>
                <span className="last-login" title={formatDate(user.lastLoginAt)}>
                  {formatDate(user.lastLoginAt)}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="btn-icon btn-icon-primary"
                    onClick={() => onView(user)}
                    title="Ver detalles"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  
                  <button
                    className="btn-icon"
                    onClick={() => onEdit(user)}
                    title="Editar usuario"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  
                  <button
                    className="btn-icon btn-icon-warning"
                    onClick={() => onManagePermissions(user)}
                    title="Gestionar permisos"
                  >
                    <i className="fas fa-key"></i>
                  </button>
                  
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => onDelete(user.id)}
                    title="Eliminar usuario"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;