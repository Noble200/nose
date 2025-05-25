import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

// Componente para mostrar errores
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2 className="error-title">¡Ups! Algo salió mal</h2>
        <p className="error-message">Ha ocurrido un error inesperado en la aplicación.</p>
        
        <div className="error-details">
          <strong>Error:</strong> {error.message}
        </div>
        
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={resetErrorBoundary}
          >
            Intentar de nuevo
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={() => window.location.href = '/'}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

// Función para registrar errores
const logErrorToService = (error, info) => {
  console.error('Error capturado por ErrorBoundary:', error);
  console.error('Información del componente:', info);
  // Aquí podrías enviar el error a un servicio de monitoreo
};

// Componente ErrorBoundary
const ErrorBoundary = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logErrorToService}
      onReset={() => {
        // Acciones adicionales al reiniciar después de un error
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;