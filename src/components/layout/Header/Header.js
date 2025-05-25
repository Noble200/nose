import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './header.css';

const Header = ({ title, sidebarCollapsed, toggleSidebar, mobileSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener la primera letra del nombre del usuario
  const getInitials = () => {
    if (!currentUser) return 'U';
    return currentUser.displayName?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || 'U';
  };

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        {/* Botón de menú para móviles */}
        <button className="mobile-menu-button" onClick={mobileSidebar}>
          <i className="fas fa-bars"></i>
        </button>

        {/* Título de la página */}
        <h1 className="header-title">{title}</h1>
      </div>

      {/* Acciones de usuario */}
      <div className="header-actions">
        {/* Botón de notificaciones */}
        <div className="notifications-menu" ref={notificationsRef}>
          <button 
            className="btn-icon" 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notificaciones"
          >
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
          
          {/* Dropdown de notificaciones */}
          <div className={`notifications-dropdown ${notificationsOpen ? 'open' : ''}`}>
            <div className="notifications-header">
              <h4>Notificaciones</h4>
              <button className="btn-text">Marcar todas como leídas</button>
            </div>
            
            <div className="notifications-list">
              <div className="notification-item unread">
                <div className="notification-icon warning">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-text">Producto "Fertilizante N-P-K" está bajo el stock mínimo</div>
                  <div className="notification-time">Hace 30 minutos</div>
                </div>
              </div>
              
              <div className="notification-item unread">
                <div className="notification-icon info">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-text">Nueva transferencia pendiente de aprobación</div>
                  <div className="notification-time">Hace 2 horas</div>
                </div>
              </div>
              
              <div className="notification-item unread">
                <div className="notification-icon success">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="notification-content">
                  <div className="notification-text">Fumigación programada para mañana</div>
                  <div className="notification-time">Hace 5 horas</div>
                </div>
              </div>
            </div>
            
            <div className="notifications-footer">
              <button className="btn-text">Ver todas las notificaciones</button>
            </div>
          </div>
        </div>

        {/* Menú de usuario */}
        <div className="user-menu" ref={userMenuRef}>
          <button className="user-button" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-info">
              <div className="user-name">{currentUser?.displayName}</div>
              <div className="user-email">{currentUser?.email}</div>
            </div>
            <i className={`fas fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
          </button>

          {/* Menú desplegable de usuario */}
          <div className={`user-menu-dropdown ${userMenuOpen ? 'open' : ''}`}>
            <a href="#profile" className="dropdown-item">
              <i className="fas fa-user"></i>
              <span>Mi Perfil</span>
            </a>
            <a href="#settings" className="dropdown-item">
              <i className="fas fa-cog"></i>
              <span>Configuración</span>
            </a>
            <a href="#help" className="dropdown-item">
              <i className="fas fa-question-circle"></i>
              <span>Ayuda</span>
            </a>
            <div className="dropdown-divider"></div>
            <a 
              href="#logout" 
              className="dropdown-item" 
              onClick={(e) => { 
                e.preventDefault(); 
                handleLogout(); 
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Cerrar Sesión</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;