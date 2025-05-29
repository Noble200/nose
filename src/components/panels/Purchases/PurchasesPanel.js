// src/components/panels/Purchases/PurchasesPanel.js - Panel principal para gestión de compras
import React from 'react';
import './purchases.css';
import PurchaseDialog from './PurchaseDialog';
import PurchaseDetailDialog from './PurchaseDetailDialog';
import DeliveryDialog from './DeliveryDialog';
import DeliveryDetailDialog from './DeliveryDetailDialog';

const PurchasesPanel = ({
  purchases,
  warehouses,
  loading,
  error,
  selectedPurchase,
  selectedDelivery,
  dialogOpen,
  dialogType,
  filterOptions,
  statistics,
  onAddPurchase,
  onEditPurchase,
  onViewPurchase,
  onAddDelivery,
  onViewDelivery,
  onDeletePurchase,
  onSavePurchase,
  onCreateDelivery,
  onCompleteDelivery,
  onCancelDelivery,
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

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
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
      case 'partial_delivered':
        chipClass = 'chip-primary';
        statusText = 'Entrega parcial';
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

  // Función para renderizar el estado de entrega
  const renderDeliveryStatus = (status) => {
    let chipClass = '';
    let statusText = '';

    switch (status) {
      case 'in_transit':
        chipClass = 'chip-primary';
        statusText = 'En camino';
        break;
      case 'completed':
        chipClass = 'chip-success';
        statusText = 'Entregado';
        break;
      case 'cancelled':
        chipClass = 'chip-danger';
        statusText = 'Cancelado';
        break;
      default:
        chipClass = 'chip-warning';
        statusText = status || 'Desconocido';
    }

    return <span className={`chip ${chipClass}`}>{statusText}</span>;
  };

  // Función para calcular el progreso de entrega
  const calculateProgress = (purchase) => {
    const totalPurchased = purchase.products.reduce((sum, product) => sum + product.quantity, 0);
    const totalDelivered = purchase.totalDelivered || 0;
    
    if (totalPurchased === 0) return 0;
    return Math.round((totalDelivered / totalPurchased) * 100);
  };

  // Función para obtener información de productos
  const getProductsSummary = (products) => {
    if (!products || products.length === 0) {
      return { count: 0, totalQuantity: 0 };
    }

    const count = products.length;
    const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);

    return { count, totalQuantity };
  };

  // Función para obtener información de entregas
  const getDeliveriesSummary = (deliveries) => {
    if (!deliveries || deliveries.length === 0) {
      return { total: 0, completed: 0, inTransit: 0, cancelled: 0 };
    }

    return {
      total: deliveries.length,
      completed: deliveries.filter(d => d.status === 'completed').length,
      inTransit: deliveries.filter(d => d.status === 'in_transit').length,
      cancelled: deliveries.filter(d => d.status === 'cancelled').length
    };
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando compras...</p>
      </div>
    );
  }

  return (
    <div className="purchases-container">
      {/* Encabezado */}
      <div className="purchases-header">
        <h1 className="purchases-title">Gestión de Compras</h1>
        <div className="purchases-actions">
          <button
            className="btn btn-primary"
            onClick={onAddPurchase}
          >
            <i className="fas fa-plus"></i> Nueva Compra
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

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon primary">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Total Compras</h3>
              <div className="stat-value">{statistics.totalPurchases}</div>
              <p className="stat-description">Compras registradas</p>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon success">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Monto Total</h3>
              <div className="stat-value">{formatCurrency(statistics.totalAmount)}</div>
              <p className="stat-description">Valor total comprado</p>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon warning">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Pendientes</h3>
              <div className="stat-value">{statistics.pendingPurchases}</div>
              <p className="stat-description">Compras por aprobar</p>
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon info">
              <i className="fas fa-truck"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Flete Pagado</h3>
              <div className="stat-value">{formatCurrency(statistics.totalFreightPaid)}</div>
              <p className="stat-description">Costos de transporte</p>
            </div>
          </div>
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
            <label htmlFor="supplierFilter">Proveedor:</label>
            <select
              id="supplierFilter"
              className="form-control"
              onChange={(e) => onFilterChange('supplier', e.target.value)}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="">Todos los proveedores</option>
              {filterOptions.suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item date-range">
            <label>Fecha de compra:</label>
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
              placeholder="Buscar compras..."
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

      {/* Grid de compras */}
      {purchases.length > 0 ? (
        <div className="purchases-grid">
          {purchases.map((purchase) => {
            const productsSummary = getProductsSummary(purchase.products);
            const deliveriesSummary = getDeliveriesSummary(purchase.deliveries);
            const progress = calculateProgress(purchase);
            
            return (
              <div key={purchase.id} className={`purchase-card ${purchase.status}`}>
                <div className="purchase-header">
                  <div className="purchase-title-container">
                    <div className="purchase-icon">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="purchase-info">
                      <h3 className="purchase-title">
                        {purchase.purchaseNumber || `Compra ${purchase.id.substring(0, 8)}`}
                      </h3>
                      <div className="purchase-subtitle">
                        {purchase.supplier || 'Proveedor no especificado'}
                      </div>
                    </div>
                  </div>
                  {renderStatusChip(purchase.status)}
                </div>
                
                <div className="purchase-content">
                  <div className="purchase-details">
                    <div className="purchase-detail">
                      <span className="detail-label">Fecha</span>
                      <span className="detail-value">{formatDate(purchase.purchaseDate)}</span>
                    </div>
                    
                    <div className="purchase-detail">
                      <span className="detail-label">Productos</span>
                      <span className="detail-value">
                        {productsSummary.count} producto{productsSummary.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="purchase-detail">
                      <span className="detail-label">Monto total</span>
                      <span className="detail-value">{formatCurrency(purchase.totalAmount)}</span>
                    </div>
                    
                    <div className="purchase-detail">
                      <span className="detail-label">Entregas</span>
                      <span className="detail-value">
                        {deliveriesSummary.completed}/{deliveriesSummary.total}
                      </span>
                    </div>
                  </div>

                  {/* Progreso de entregas */}
                  <div className="delivery-progress">
                    <div className="progress-info">
                      <span className="progress-label">Progreso de entrega</span>
                      <span className="progress-percentage">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: progress === 100 ? '#4caf50' : '#2196f3'
                        }}
                      ></div>
                    </div>
                    <div className="progress-details">
                      <span>Entregado: {purchase.totalDelivered || 0}</span>
                      <span>Pendiente: {purchase.totalPending || 0}</span>
                    </div>
                  </div>

                  {/* Lista de entregas recientes */}
                  {purchase.deliveries && purchase.deliveries.length > 0 && (
                    <div className="recent-deliveries">
                      <h4 className="deliveries-title">Entregas recientes</h4>
                      <div className="deliveries-list">
                        {purchase.deliveries.slice(-3).map((delivery, index) => {
                          const warehouseName = warehouses.find(w => w.id === delivery.warehouseId)?.name || 'Almacén desconocido';
                          
                          return (
                            <div key={delivery.id} className="delivery-item">
                              <div className="delivery-info">
                                <span className="delivery-warehouse">{warehouseName}</span>
                                <span className="delivery-date">{formatDate(delivery.deliveryDate)}</span>
                              </div>
                              <div className="delivery-status-container">
                                {renderDeliveryStatus(delivery.status)}
                                <button
                                  className="btn-icon btn-icon-sm"
                                  onClick={() => onViewDelivery(purchase, delivery)}
                                  title="Ver detalles de entrega"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Acciones */}
                  <div className="purchase-actions">
                    {(purchase.status === 'approved' || purchase.status === 'partial_delivered') && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onAddDelivery(purchase)}
                      >
                        <i className="fas fa-plus"></i> Nueva Entrega
                      </button>
                    )}
                    
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onViewPurchase(purchase)}
                    >
                      <i className="fas fa-eye"></i> Detalles
                    </button>
                    
                    {purchase.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onEditPurchase(purchase)}
                      >
                        <i className="fas fa-edit"></i> Editar
                      </button>
                    )}
                    
                    <button
                      className="btn-icon btn-icon-sm btn-icon-danger"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.')) {
                          onDeletePurchase(purchase.id);
                        }
                      }}
                      title="Eliminar compra"
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
            <i className="fas fa-shopping-cart"></i>
          </div>
          <h2 className="empty-title">No hay compras registradas</h2>
          <p className="empty-description">
            Comienza registrando una nueva compra para gestionar tus adquisiciones y entregas.
          </p>
          <button className="btn btn-primary" onClick={onAddPurchase}>
            <i className="fas fa-plus"></i> Añadir compra
          </button>
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-purchase' || dialogType === 'edit-purchase' ? (
            <PurchaseDialog
              purchase={selectedPurchase}
              isNew={dialogType === 'add-purchase'}
              onSave={onSavePurchase}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-purchase' ? (
            <PurchaseDetailDialog
              purchase={selectedPurchase}
              warehouses={warehouses}
              onClose={onCloseDialog}
              onEdit={onEditPurchase}
              onAddDelivery={onAddDelivery}
              onViewDelivery={onViewDelivery}
              onCompleteDelivery={onCompleteDelivery}
              onCancelDelivery={onCancelDelivery}
              onDelete={onDeletePurchase}
            />
          ) : dialogType === 'add-delivery' ? (
            <DeliveryDialog
              purchase={selectedPurchase}
              warehouses={warehouses}
              onSave={onCreateDelivery}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-delivery' ? (
            <DeliveryDetailDialog
              purchase={selectedPurchase}
              delivery={selectedDelivery}
              warehouses={warehouses}
              onClose={onCloseDialog}
              onComplete={onCompleteDelivery}
              onCancel={onCancelDelivery}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PurchasesPanel;