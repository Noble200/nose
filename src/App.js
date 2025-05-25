import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import { HarvestProvider } from './contexts/HarvestContext';
import PrivateRoute from './components/ui/PrivateRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLayout from './components/layout/AppLayout/AppLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transfers from './pages/Transfers';
import Fumigations from './pages/Fumigations';
import Fields from './pages/Fields';
import Warehouses from './pages/Warehouses';
import Users from './pages/Users';
import Harvests from './pages/Harvests';
import './App.css';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <StockProvider>
            <HarvestProvider>
              <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas */}
                <Route path="/" element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="productos" element={<Products />} />
                  <Route path="transferencias" element={<Transfers />} />
                  <Route path="fumigaciones" element={<Fumigations />} />
                  <Route path="campos" element={<Fields />} />
                  <Route path="almacenes" element={<Warehouses />} />
                  <Route path="usuarios" element={<Users />} />
                  <Route path="cosechas" element={<Harvests />} />
                </Route>
                
                {/* Redirección para rutas no encontradas */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </HarvestProvider>
          </StockProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;