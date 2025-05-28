// src/components/panels/Transfers/TransfersPanel.js - Panel principal para gestión de transferencias
import React from 'react';
import './transfers.css';
import TransferDialog from './TransferDialog';
import TransferDetailDialog from './TransferDetailDialog';
import ApproveTransferDialog from './ApproveTransferDialog';
import ReceiveTransferDialog from './ReceiveTransferDialog';

const TransfersPanel = ({
  transfers,
  warehouses,
  products,
  loading,
  error,
  selectedTransfer,
  dialogOpen,
  dialogType,
  filterOptions,
  onAddTransfer,
  onEditTransfer,
  onViewTransfer,
  onApproveTransfer,
  onReceiveTransfer,
  onDeleteTransfer,
  onSaveTransfer,
  onApproveTransferSubmit,
  onShipTransfer,
  onReceiveTransferSubmit,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh
}) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para obtener el nombre del almacén
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return 'No asignado';
    
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  };

  // Función para renderizar el estado como chip
  const renderStatusChip = (status) => {
    let chipClass = '';
    let statusText = '';

    switch (status) {
      case 'pending':
        chipClass = 'chip-warning';
        statusText = 'Pendiente';
        break;
      case 'approved':
        chipClass = 'chip-info';
        statusText = 'Aprobada';
        break;
      case 'rejected':
        chipClass = 'chip-danger';
        statusText = 'Rechazada';
        break;
      case 'shipped':
        chipClass = 'chip-primary';
        statusText = 'Enviada';
        break;
      case 'completed':
        chipClass = 'chip-success';
        statusText = 'Completada';
        break;
      case 'cancelled':
        chipClass = 'chip-danger';
        statusText = 'Cancelada';
        break;
      default:
        chipClass = 'chip-warning';
        statusText = status || 'Pendiente';
    }

    return <span className={`chip ${chipClass}`}>{statusText}</span>;
  };

  // Función para formatear costo
  const formatCost = (cost) => {
    if (!cost && cost !== 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cost);
  };

  // Función para formatear distancia
  const formatDistance = (distance, unit = 'km') => {
    if (!distance && distance !== 0) return '0 km';
    return `${distance} ${unit}`;
  };

  // Función para obtener información de productos
  const getProductsInfo = (transferProducts) => {
    if (!transferProducts || transferProducts.length === 0) {
      return { count: 0, totalQuantity: 0 };
    }

    const count = transferProducts.length;
    const totalQuantity = transferProducts.reduce((sum, item) => sum + (item.quantity || 0), 0);

    return { count, totalQuantity };
  };

  // Función para obtener el color del progreso según el estado
  const getProgressColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#2196f3';
      case 'shipped': return '#9c27b0';
      case 'completed': return '#4caf50';
      case 'rejected': 
      case 'cancelled': return '#f44336';
      default: return '#ff9800';
    }
  };

  // Función para calcular el progreso
  const calculateProgress = (status) => {
    switch (status) {
      case 'pending': return 20;
      case 'approved': return 40;
      case 'shipped': return 70;
      case 'completed': return 100;
      case 'rejected':
      case 'cancelled': return 0;
      default: return 20;
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando transferencias...</p>
      </div>
    );
  }

  return (
    <div className="transfers-container">
      {/* Encabezado */}
      <div className="transfers-header">
        <h1 className="transfers-title">Gestión de Transferencias</h1>
        <div className="transfers-actions">
          <button
            className="btn btn-primary"
            onClick={onAddTransfer}
          >
            <i className="fas fa-plus"></i> Nueva Transferencia
          </button>
          <button
            className="btn btn-icon"
            onClick={onRefresh}
            title="Actualizar datos"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="statusFilter">Estado:</label>
            <select
              id="statusFilter"
              className="form-control"
              onChange={(e) => onFilterChange('status', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="sourceWarehouseFilter">Almacén origen:</label>
            <select
              id="sourceWarehouseFilter"
              className="form-control"
              onChange={(e) => onFilterChange('sourceWarehouse', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="all">Todos los almacenes</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="targetWarehouseFilter">Almacén destino:</label>
            <select
              id="targetWarehouseFilter"
              className="form-control"
              onChange={(e) => onFilterChange('targetWarehouse', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="all">Todos los almacenes</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item date-range">
            <label>Fecha de solicitud:</label>
            <div className="date-inputs">
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...filterOptions.dateRange, 
                  start: e.target.value || null 
                })}
                style={{ height: 'auto', minHeight: '40px' }}
              />
              <span>a</span>
              <input
                type="date"
                className="form-control"
                onChange={(e) => onFilterChange('dateRange', { 
                  ...filterOptions.dateRange, 
                  end: e.target.value || null 
                })}
                style={{ height: 'auto', minHeight: '40px' }}
              />
            </div>
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar transferencias..."
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de error si existe */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button className="btn btn-sm" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
      )}

      {/* Grid de transferencias */}
      {transfers.length > 0 ? (
        <div className="transfers-grid">
          {transfers.map((transfer) => {
            const productsInfo = getProductsInfo(transfer.products);
            const progress = calculateProgress(transfer.status);
            const progressColor = getProgressColor(transfer.status);
            
            return (
              <div key={transfer.id} className={`transfer-card ${transfer.status}`}>
                <div className="transfer-header">
                  <div className="transfer-title-container">
                    <div className="transfer-icon">
                      <i className="fas fa-exchange-alt"></i>
                    </div>
                    <div className="transfer-info">
                      <h3 className="transfer-title">
                        {transfer.transferNumber || `Transferencia ${transfer.id.substring(0, 8)}`}
                      </h3>
                      <div className="transfer-subtitle">
                        {getWarehouseName(transfer.sourceWarehouseId)} → {getWarehouseName(transfer.targetWarehouseId)}
                      </div>
                    </div>
                  </div>
                  {renderStatusChip(transfer.status)}
                </div>
                
                <div className="transfer-content">
                  <div className="transfer-details">
                    <div className="transfer-detail">
                      <span className="detail-label">Solicitado por</span>
                      <span className="detail-value">{transfer.requestedBy || 'No especificado'}</span>
                    </div>
                    
                    <div className="transfer-detail">
                      <span className="detail-label">Fecha solicitud</span>
                      <span className="detail-value">{formatDate(transfer.requestDate)}</span>
                    </div>
                    
                    <div className="transfer-detail">
                      <span className="detail-label">Productos</span>
                      <span className="detail-value">
                        {productsInfo.count} producto{productsInfo.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="transfer-detail">
                      <span className="detail-label">Distancia</span>
                      <span className="detail-value">{formatDistance(transfer.distance, transfer.distanceUnit)}</span>
                    </div>
                    
                    <div className="transfer-detail">
                      <span className="detail-label">Costo total</span>
                      <span className="detail-value">{formatCost(transfer.transferCost)}</span>
                    </div>
                    
                    {transfer.costPerUnit > 0 && (
                      <div className="transfer-detail">
                        <span className="detail-label">Costo por {transfer.distanceUnit || 'km'}</span>
                        <span className="detail-value cost-per-unit">
                          {formatCost(transfer.costPerUnit)}/{transfer.distanceUnit || 'km'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="transfer-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: progressColor
                        }}
                      ></div>
                    </div>
                    <div className="progress-steps">
                      <div className={`progress-step ${progress >= 20 ? 'completed' : ''}`}>
                        <span>Solicitada</span>
                      </div>
                      <div className={`progress-step ${progress >= 40 ? 'completed' : ''}`}>
                        <span>Aprobada</span>
                      </div>
                      <div className={`progress-step ${progress >= 70 ? 'completed' : ''}`}>
                        <span>Enviada</span>
                      </div>
                      <div className={`progress-step ${progress >= 100 ? 'completed' : ''}`}>
                        <span>Recibida</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="transfer-actions">
                    {transfer.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => onApproveTransfer(transfer)}
                      >
                        <i className="fas fa-check"></i> Aprobar/Rechazar
                      </button>
                    )}
                    
                    {transfer.status === 'approved' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onShipTransfer(transfer.id)}
                      >
                        <i className="fas fa-shipping-fast"></i> Enviar
                      </button>
                    )}
                    
                    {transfer.status === 'shipped' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => onReceiveTransfer(transfer)}
                      >
                        <i className="fas fa-inbox"></i> Recibir
                      </button>
                    )}
                    
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onViewTransfer(transfer)}
                    >
                      <i className="fas fa-eye"></i> Detalles
                    </button>
                    
                    {(transfer.status === 'pending' || transfer.status === 'approved') && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onEditTransfer(transfer)}
                      >
                        <i className="fas fa-edit"></i> Editar
                      </button>
                    )}
                    
                    <button
                      className="btn-icon btn-icon-sm btn-icon-danger"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta transferencia? Esta acción no se puede deshacer.')) {
                          onDeleteTransfer(transfer.id);
                        }
                      }}
                      title="Eliminar transferencia"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <h2 className="empty-title">No hay transferencias registradas</h2>
          <p className="empty-description">
            Comienza añadiendo una nueva transferencia para mover productos entre almacenes.
          </p>
          <button className="btn btn-primary" onClick={onAddTransfer}>
            <i className="fas fa-plus"></i> Añadir transferencia
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-transfer' || dialogType === 'edit-transfer' ? (
            <TransferDialog
              transfer={selectedTransfer}
              warehouses={warehouses}
              products={products}
              isNew={dialogType === 'add-transfer'}
              onSave={onSaveTransfer}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-transfer' ? (
            <TransferDetailDialog
              transfer={selectedTransfer}
              warehouses={warehouses}
              products={products}
              onClose={onCloseDialog}
              onEdit={onEditTransfer}
              onApprove={onApproveTransfer}
              onShip={onShipTransfer}
              onReceive={onReceiveTransfer}
              onDelete={onDeleteTransfer}
            />
          ) : dialogType === 'approve-transfer' ? (
            <ApproveTransferDialog
              transfer={selectedTransfer}
              warehouses={warehouses}
              products={products}
              onSubmit={onApproveTransferSubmit}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'receive-transfer' ? (
            <ReceiveTransferDialog
              transfer={selectedTransfer}
              warehouses={warehouses}
              products={products}
              onSubmit={onReceiveTransferSubmit}
              onClose={onCloseDialog}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TransfersPanel;