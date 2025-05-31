// src/components/panels/Users/UsersStats.js - Estadísticas de usuarios
import React from 'react';

const UsersStats = ({ statistics = {} }) => {
  const statCards = [
    {
      title: 'Total Usuarios',
      value: statistics.totalUsers || 0,
      icon: 'fas fa-users',
      color: 'primary',
      description: 'usuarios registrados'
    },
    {
      title: 'Administradores',
      value: statistics.adminUsers || 0,
      icon: 'fas fa-crown',
      color: 'danger',
      description: 'con acceso completo'
    },
    {
      title: 'Gerentes',
      value: statistics.managerUsers || 0,
      icon: 'fas fa-user-tie',
      color: 'info',
      description: 'con permisos de gestión'
    },
    {
      title: 'Operadores',
      value: statistics.operatorUsers || 0,
      icon: 'fas fa-user-cog',
      color: 'success',
      description: 'operativos'
    },
    {
      title: 'Usuarios Activos',
      value: statistics.activeUsers || 0,
      icon: 'fas fa-user-check',
      color: 'success',
      description: 'conectados recientemente'
    },
    {
      title: 'Usuarios Inactivos',
      value: statistics.inactiveUsers || 0,
      icon: 'fas fa-user-clock',
      color: 'warning',
      description: 'sin actividad reciente'
    }
  ];

  return (
    <div className="users-stats">
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="stats-summary">
        <div className="summary-item">
          <strong>Distribución por roles:</strong>
          <span className="role-distribution">
            Admin: {statistics.adminUsers || 0} | 
            Gerentes: {statistics.managerUsers || 0} | 
            Operadores: {statistics.operatorUsers || 0} | 
            Visualizadores: {statistics.viewerUsers || 0} | 
            Básicos: {statistics.basicUsers || 0}
          </span>
        </div>
        
        <div className="summary-item">
          <strong>Estado de actividad:</strong>
          <span className="activity-summary">
            {statistics.activeUsers || 0} activos de {statistics.totalUsers || 0} total 
            ({statistics.totalUsers > 0 ? Math.round(((statistics.activeUsers || 0) / statistics.totalUsers) * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default UsersStats;