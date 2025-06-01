// src/components/panels/Users/PermissionsDialog.js - Diálogo para gestionar permisos
import React, { useState, useEffect } from 'react';

const PermissionsDialog = ({
  open = false,
  user = null,
  onSave,
  onClose
}) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Configuración de permisos con grupos y descripciones
  const permissionGroups = [
    {
      title: 'Acceso Básico',
      icon: 'fas fa-home',
      permissions: [
        {
          key: 'dashboard',
          label: 'Panel Principal',
          description: 'Ver el panel principal con estadísticas generales',
          icon: 'fas fa-tachometer-alt',
          required: true
        },
        {
          key: 'activities',
          label: 'Historial de Actividades',
          description: 'Ver el registro de actividades del sistema',
          icon: 'fas fa-history',
          required: true
        }
      ]
    },
    {
      title: 'Gestión de Inventario',
      icon: 'fas fa-boxes',
      permissions: [
        {
          key: 'products',
          label: 'Productos',
          description: 'Gestionar el inventario de productos',
          icon: 'fas fa-box'
        },
        {
          key: 'transfers',
          label: 'Transferencias',
          description: 'Crear y gestionar transferencias entre almacenes',
          icon: 'fas fa-exchange-alt'
        },
        {
          key: 'purchases',
          label: 'Compras',
          description: 'Registrar y gestionar compras a proveedores',
          icon: 'fas fa-shopping-cart'
        },
        {
          key: 'expenses',
          label: 'Gastos',
          description: 'Registrar gastos y ventas de productos',
          icon: 'fas fa-receipt'
        }
      ]
    },
    {
      title: 'Gestión de Producción',
      icon: 'fas fa-seedling',
      permissions: [
        {
          key: 'fumigations',
          label: 'Fumigaciones',
          description: 'Programar y gestionar aplicaciones fitosanitarias',
          icon: 'fas fa-spray-can'
        },
        {
          key: 'harvests',
          label: 'Cosechas',
          description: 'Planificar y registrar cosechas',
          icon: 'fas fa-tractor'
        },
        {
          key: 'fields',
          label: 'Campos',
          description: 'Gestionar campos y lotes agrícolas',
          icon: 'fas fa-seedling'
        }
      ]
    },
    {
      title: 'Administración',
      icon: 'fas fa-cogs',
      permissions: [
        {
          key: 'warehouses',
          label: 'Almacenes',
          description: 'Gestionar almacenes y ubicaciones',
          icon: 'fas fa-warehouse'
        },
        {
          key: 'reports',
          label: 'Reportes',
          description: 'Generar y descargar reportes del sistema',
          icon: 'fas fa-chart-bar'
        },
        {
          key: 'users',
          label: 'Gestión de Usuarios',
          description: 'Crear y gestionar usuarios y permisos',
          icon: 'fas fa-users',
          dangerous: true
        },
        {
          key: 'admin',
          label: 'Acceso Administrativo',
          description: 'Acceso completo a todas las funciones del sistema',
          icon: 'fas fa-crown',
          dangerous: true
        }
      ]
    }
  ];

  // Cargar permisos del usuario
  useEffect(() => {
    if (user && open) {
      const initialPermissions = {
        dashboard: true,
        activities: true,
        ...user.permissions
      };
      setPermissions(initialPermissions);
      setHasChanges(false);
    }
  }, [user, open]);

  const handlePermissionChange = (permissionKey, value) => {
    setPermissions(prev => {
      const newPermissions = {
        ...prev,
        [permissionKey]: value
      };
      
      // Si se desactiva admin, asegurar que otros permisos se mantengan
      if (permissionKey === 'admin' && !value) {
        // Mantener permisos básicos
        newPermissions.dashboard = true;
        newPermissions.activities = true;
      }
      
      // Si se activa admin, activar todos los permisos
      if (permissionKey === 'admin' && value) {
        permissionGroups.forEach(group => {
          group.permissions.forEach(permission => {
            newPermissions[permission.key] = true;
          });
        });
      }
      
      return newPermissions;
    });
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const allPermissions = {};
    permissionGroups.forEach(group => {
      group.permissions.forEach(permission => {
        allPermissions[permission.key] = true;
      });
    });
    setPermissions(allPermissions);
    setHasChanges(true);
  };

  const handleClearAll = () => {
    const basicPermissions = {
      dashboard: true,
      activities: true
    };
    setPermissions(basicPermissions);
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      await onSave(permissions);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivePermissionsCount = () => {
    return Object.values(permissions).filter(p => p === true).length;
  };

  const getTotalPermissionsCount = () => {
    return permissionGroups.reduce((total, group) => total + group.permissions.length, 0);
  };

  const isPermissionDisabled = (permission) => {
    // Los permisos requeridos no se pueden desactivar
    if (permission.required) return true;
    
    // Si el usuario tiene admin, no puede quitar admin desde aquí
    return false;
  };

  if (!open || !user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title-section">
              <h3 className="modal-title">
                <i className="fas fa-key"></i>
                Gestionar Permisos
              </h3>
              <p className="modal-subtitle">
                Usuario: <strong>{user.displayName || user.username}</strong>
                <span className="permissions-summary">
                  ({getActivePermissionsCount()} de {getTotalPermissionsCount()} permisos activos)
                </span>
              </p>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body permissions-modal-body">
              {/* Controles rápidos */}
              <div className="permissions-quick-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleSelectAll}
                  disabled={loading}
                >
                  <i className="fas fa-check-double"></i>
                  Seleccionar todo
                </button>
                
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleClearAll}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                  Limpiar (básicos)
                </button>
              </div>

              {/* Grupos de permisos */}
              <div className="permissions-groups">
                {permissionGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="permission-group">
                    <div className="permission-group-header">
                      <i className={group.icon}></i>
                      <h4>{group.title}</h4>
                    </div>
                    
                    <div className="permission-group-content">
                      {group.permissions.map((permission) => (
                        <div 
                          key={permission.key} 
                          className={`permission-card ${permissions[permission.key] ? 'active' : ''} ${permission.dangerous ? 'dangerous' : ''} ${permission.required ? 'required' : ''}`}
                        >
                          <label className="permission-card-label">
                            <div className="permission-card-header">
                              <div className="permission-card-icon">
                                <i className={permission.icon}></i>
                              </div>
                              
                              <div className="permission-card-info">
                                <div className="permission-card-title">
                                  {permission.label}
                                  {permission.required && (
                                    <span className="required-badge">Requerido</span>
                                  )}
                                  {permission.dangerous && (
                                    <span className="dangerous-badge">Crítico</span>
                                  )}
                                </div>
                                <div className="permission-card-description">
                                  {permission.description}
                                </div>
                              </div>
                            </div>
                            
                            <div className="permission-card-toggle">
                              <input
                                type="checkbox"
                                checked={permissions[permission.key] || false}
                                onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                                disabled={isPermissionDisabled(permission) || loading}
                                className="permission-checkbox"
                              />
                              <span className="permission-toggle-slider"></span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Advertencias */}
              {permissions.admin && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <strong>Acceso Administrativo:</strong> Este usuario tendrá acceso completo a todas las funciones del sistema, incluyendo la gestión de otros usuarios.
                </div>
              )}
              
              {permissions.users && !permissions.admin && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle"></i>
                  <strong>Gestión de Usuarios:</strong> Este usuario podrá crear y gestionar otros usuarios del sistema.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-footer-info">
                <span className="permissions-count">
                  {getActivePermissionsCount()} de {getTotalPermissionsCount()} permisos seleccionados
                </span>
                {hasChanges && (
                  <span className="changes-indicator">
                    <i className="fas fa-circle text-warning"></i>
                    Cambios sin guardar
                  </span>
                )}
              </div>
              
              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar Permisos
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDialog;