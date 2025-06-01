// src/App.js - Actualizado con UsersProvider y panel de usuarios completo
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import { HarvestProvider } from './contexts/HarvestContext';
import { FumigationProvider } from './contexts/FumigationContext';
import { TransferProvider } from './contexts/TransferContext';
import { PurchaseProvider } from './contexts/PurchaseContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { UsersProvider } from './contexts/UsersContext'; // NUEVO
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
import Users from './pages/Users'; // ACTUALIZADO
import Harvests from './pages/Harvests';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Activities from './pages/Activities';
import './App.css';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ActivityProvider>
            <UsersProvider> {/* NUEVO: Proveedor de usuarios */}
              <StockProvider>
                <HarvestProvider>
                  <FumigationProvider>
                    <TransferProvider>
                      <PurchaseProvider>
                        <ExpenseProvider>
                          <ReportsProvider>
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
                                <Route path="compras" element={<Purchases />} />
                                <Route path="gastos" element={<Expenses />} />
                                <Route path="fumigaciones" element={<Fumigations />} />
                                <Route path="campos" element={<Fields />} />
                                <Route path="almacenes" element={<Warehouses />} />
                                <Route path="usuarios" element={<Users />} /> {/* ACTUALIZADO */}
                                <Route path="cosechas" element={<Harvests />} />
                                <Route path="reportes" element={<Reports />} />
                                <Route path="actividades" element={<Activities />} />
                              </Route>
                              
                              {/* Redirección para rutas no encontradas */}
                              <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                          </ReportsProvider>
                        </ExpenseProvider>
                      </PurchaseProvider>
                    </TransferProvider>
                  </FumigationProvider>
                </HarvestProvider>
              </StockProvider>
            </UsersProvider>
          </ActivityProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;