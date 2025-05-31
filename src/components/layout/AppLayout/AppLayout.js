import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import './appLayout.css';

// Mapeo de rutas a títulos
const routeTitles = {
  '/dashboard': 'Panel Principal',
  '/productos': 'Productos',
  '/transferencias': 'Transferencias',
  '/compras': 'Compras',
  '/gastos': 'Gastos',
  '/fumigaciones': 'Fumigaciones',
  '/campos': 'Campos',
  '/almacenes': 'Almacenes',
  '/usuarios': 'Usuarios',
  '/cosechas': 'Cosechas',
  '/actividades': 'Historial de Actividades', // NUEVO
  '/reportes': 'Reportes'
};

const AppLayout = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [title, setTitle] = useState('');

  // Actualizar título según la ruta actual
  useEffect(() => {
    setTitle(routeTitles[location.pathname] || 'AgroGestión');
    
    // En dispositivos móviles, cerrar el sidebar al cambiar de ruta
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  // Alternar estado del sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Alternar sidebar en dispositivos móviles
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        mobileOpen={mobileOpen}
      />
      
      {/* Overlay para dispositivos móviles */}
      <div 
        className={`app-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Contenido principal */}
      <main className={`app-layout-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          title={title} 
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          mobileSidebar={toggleMobileSidebar}
        />
        <div className="app-layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;