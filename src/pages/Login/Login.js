import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithUsername, currentUser, error: authError, setError: setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  // Mostrar error del contexto de autenticación
  useEffect(() => {
    if (authError) {
      setError(authError);
      setAuthError('');
    }
  }, [authError, setAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await loginWithUsername(username, password);
      // No es necesario navegar aquí, el useEffect se encargará
    } catch (err) {
      // Manejar error específico de Firebase
      if (err.code === 'auth/invalid-email' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Usuario o contraseña incorrectos');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde.');
      } else if (err.code === 'username-not-found') {
        setError('Nombre de usuario no encontrado');
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <i className="fas fa-leaf"></i>
            </div>
            <h1 className="login-title">AgroGestión</h1>
            <p className="login-subtitle">Sistema de Gestión Agrícola</p>
          </div>
          
          <div className="login-body">
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Nombre de usuario</label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder="Ingresa tu nombre de usuario"
                  autoComplete="username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={handlePasswordVisibility}
                  >
                    <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    Iniciando sesión...
                  </>
                ) : 'Iniciar Sesión'}
              </button>
            </form>
            
            <div className="login-help">
              <a href="#forgot-password">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
          
          <div className="login-footer">
            <p className="login-footer-text">
              © {new Date().getFullYear()} AgroGestión. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;