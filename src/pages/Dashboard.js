import React from 'react';
import DashboardPanel from '../components/panels/Dashboard/DashboardPanel';
import useDashboardController from '../controllers/DashboardController';

// Página principal que conecta el controlador con el componente visual
const Dashboard = () => {
  // Usar el controlador para obtener datos y funciones
  const {
    stats,
    lowStockProducts,
    expiringSoonProducts,
    pendingTransfers,
    pendingFumigations,
    recentActivities,
    loading,
    error,
    refreshData
  } = useDashboardController();

  // Renderizar el componente visual con los datos del controlador
  return (
    <DashboardPanel
      stats={stats}
      lowStockProducts={lowStockProducts}
      expiringSoonProducts={expiringSoonProducts}
      pendingTransfers={pendingTransfers}
      pendingFumigations={pendingFumigations}
      recentActivities={recentActivities}
      loading={loading}
      error={error}
      onRefresh={refreshData}
    />
  );
};

export default Dashboard;