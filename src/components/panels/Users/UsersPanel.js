// src/components/panels/Users/UsersPanel.js - Panel principal de gestión de usuarios
import React from 'react';
import UsersTable from './UsersTable';
import UsersFilters from './UsersFilters';
import UsersStats from './UsersStats';
import UserDialog from './UserDialog';
import PermissionsDialog from './PermissionsDialog';
import './users.css';

const UsersPanel = ({
  users = [],
  loading = false,
  error = '',
  selectedUser = null,
  dialogOpen = false,
  dialogType = '',
  filterOptions = {},
  statistics = {},
  onAddUser,
  onEditUser,
  onViewUser,
  onManagePermissions,
  onDeleteUser,
  onSaveUser,
  onSavePermissions,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh
}) => {
  return (
    <div className="users-panel">
      {/* Encabezado con estadísticas */}
      <div className="users-header">
        <div className="users-header-content">
          <div className="users-title-section">
            <h1 className="users-title">
              <i className="fas fa-users"></i>
              Gestión de Usuarios
            </h1>
            <p className="users-subtitle">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
          
          <div className="users-actions">
            <button 
              className="btn btn-outline"
              onClick={onRefresh}
              disabled={loading}
              title="Actualizar lista"
            >
              <i className="fas fa-sync-alt"></i>
              Actualizar
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={onAddUser}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <UsersStats statistics={statistics} />
      </div>

      {/* Filtros */}
      <UsersFilters
        filterOptions={filterOptions}
        onFilterChange={onFilterChange}
        onSearch={onSearch}
        disabled={loading}
      />

      {/* Mensaje de error */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="users-content">
        <UsersTable
          users={users}
          loading={loading}
          onView={onViewUser}
          onEdit={onEditUser}
          onManagePermissions={onManagePermissions}
          onDelete={onDeleteUser}
        />
      </div>

      {/* Diálogos */}
      {dialogOpen && (dialogType === 'add-user' || dialogType === 'edit-user' || dialogType === 'view-user') && (
        <UserDialog
          open={dialogOpen}
          type={dialogType}
          user={selectedUser}
          onSave={onSaveUser}
          onClose={onCloseDialog}
        />
      )}

      {dialogOpen && dialogType === 'permissions' && (
        <PermissionsDialog
          open={dialogOpen}
          user={selectedUser}
          onSave={onSavePermissions}
          onClose={onCloseDialog}
        />
      )}
    </div>
  );
};

export default UsersPanel;