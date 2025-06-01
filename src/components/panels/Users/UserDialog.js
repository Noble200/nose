// src/components/panels/Users/UserDialog.js - Diálogo para crear/editar usuarios
import React, { useState, useEffect } from 'react';

const UserDialog = ({
  open = false,
  type = 'add-user', // 'add-user', 'edit-user', 'view-user'
  user = null,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    permissions: {
      dashboard: true,
      activities: true,
      products: false,
      transfers: false,
      purchases: false,
      expenses: false,
      fumigations: false,
      harvests: false,
      fields: false,
      warehouses: false,
      reports: false,
      users: false,
      admin: false
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isViewMode = type === 'view-user';
  const isEditMode = type === 'edit-user';
  const isAddMode = type === 'add-user';

  // Cargar datos del usuario al editar o ver
  useEffect(() => {
    if (user && (isEditMode || isViewMode)) {
      setFormData({
        email: user.email || '',
        username: user.username || '',
        displayName: user.displayName || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'user',
        permissions: {
          dashboard: true,
          activities: true,
          products: false,
          transfers: false,
          purchases: false,
          expenses: false,
          fumigations: false,
          harvests: false,
          fields: false,
          warehouses: false,
          reports: false,
          users: false,
          admin: false,
          ...user.permissions
        }
      });
    } else if (isAddMode) {
      // Resetear formulario para nuevo usuario
      setFormData({
        email: '',
        username: '',
        displayName: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        permissions: {
          dashboard: true,
          activities: true,
          products: false,
          transfers: false,
          purchases: false,
          expenses: false,
          fumigations: false,
          harvests: false,
          fields: false,
          warehouses: false,
          reports: false,
          users: false,
          admin: false
        }
      });
    }
    setErrors({});
  }, [user, type, isEditMode, isViewMode, isAddMode]);

  // Actualizar permisos según el rol seleccionado
  useEffect(() => {
    const rolePermissions = getRolePermissions(formData.role);
    setFormData(prev => ({
      ...prev,
      permissions: rolePermissions
    }));
  }, [formData.role]);

  // Función para obtener permisos según el rol
  const getRolePermissions = (role) => {
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
          reports: true
        };
      
      case 'operator':
        return {
          ...basePermissions,
          products: true,
          transfers: true,
          fumigations: true,
          harvests: true
        };
      
      case 'viewer':
        return {
          ...basePermissions,
          products: true
        };
      
      default: // 'user'
        return {
          ...basePermissions,
          products: true
        };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Validar username
    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es obligatorio';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    // Validar displayName
    if (!formData.displayName) {
      newErrors.displayName = 'El nombre para mostrar es obligatorio';
    }

    // Validar contraseña (solo para nuevos usuarios)
    if (isAddMode) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma la contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Validar que tenga al menos un permiso
    const hasPermissions = Object.values(formData.permissions).some(p => p === true);
    if (!hasPermissions) {
      newErrors.permissions = 'El usuario debe tener al menos un permiso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const submitData = { ...formData };
      
      // Para edición, no incluir contraseña vacía
      if (isEditMode && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }
      
      await onSave(submitData);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'add-user':
        return 'Nuevo Usuario';
      case 'edit-user':
        return 'Editar Usuario';
      case 'view-user':
        return 'Detalles del Usuario';
      default:
        return 'Usuario';
    }
  };

  const roleOptions = [
    { value: 'user', label: 'Usuario básico' },
    { value: 'viewer', label: 'Visualizador' },
    { value: 'operator', label: 'Operador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'admin', label: 'Administrador' }
  ];

  const permissionLabels = {
    dashboard: 'Panel Principal',
    activities: 'Historial de Actividades',
    products: 'Productos',
    transfers: 'Transferencias',
    purchases: 'Compras',
    expenses: 'Gastos',
    fumigations: 'Fumigaciones',
    harvests: 'Cosechas',
    fields: 'Campos',
    warehouses: 'Almacenes',
    reports: 'Reportes',
    users: 'Gestión de Usuarios',
    admin: 'Acceso Administrativo'
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <i className="fas fa-user"></i>
              {getDialogTitle()}
            </h3>
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
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.submit}
                </div>
              )}

              <div className="form-row">
                {/* Email */}
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label required">Email</label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isViewMode || loading}
                      placeholder="usuario@empresa.com"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label required">Nombre de usuario</label>
                    <input
                      type="text"
                      name="username"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={isViewMode || loading}
                      placeholder="nombreusuario"
                    />
                    {errors.username && (
                      <div className="invalid-feedback">{errors.username}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                {/* Display Name */}
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label required">Nombre para mostrar</label>
                    <input
                      type="text"
                      name="displayName"
                      className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                      value={formData.displayName}
                      onChange={handleInputChange}
                      disabled={isViewMode || loading}
                      placeholder="Nombre Apellido"
                    />
                    {errors.displayName && (
                      <div className="invalid-feedback">{errors.displayName}</div>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select
                      name="role"
                      className="form-control"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={isViewMode || loading}
                    >
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contraseñas (solo para nuevos usuarios) */}
              {isAddMode && (
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label required">Contraseña</label>
                      <input
                        type="password"
                        name="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label required">Confirmar contraseña</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="Repetir contraseña"
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Permisos */}
              <div className="form-group">
                <label className="form-label">Permisos</label>
                {errors.permissions && (
                  <div className="text-danger mb-2">{errors.permissions}</div>
                )}
                
                <div className="permissions-grid">
                  {Object.entries(permissionLabels).map(([permission, label]) => (
                    <div key={permission} className="permission-item">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.permissions[permission] || false}
                          onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          disabled={isViewMode || loading || formData.role === 'admin'}
                        />
                        <span className="form-check-label">{label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                {formData.role === 'admin' && (
                  <div className="form-text">
                    <i className="fas fa-info-circle"></i>
                    Los administradores tienen acceso completo automáticamente
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                {isViewMode ? 'Cerrar' : 'Cancelar'}
              </button>
              
              {!isViewMode && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      {isAddMode ? 'Crear Usuario' : 'Guardar Cambios'}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserDialog;