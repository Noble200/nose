import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Redirigir al login si no hay usuario autenticado
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si todo está bien, mostrar el contenido
  return children;
};

export default PrivateRoute;