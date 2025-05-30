// src/components/panels/Products/ProductsPanel.js - Panel principal para gestión de productos
import React from 'react';
import './products.css';
import ProductDialog from './ProductDialog';
import ProductDetailDialog from './ProductDetailDialog';

// Componente para mostrar filtros activos
const ActiveFilters = ({ filters, onClearSpecialFilters }) => {
  const hasActiveFilters = filters.expiringSoon || filters.stockStatus === 'low';
  
  if (!hasActiveFilters) return null;
  
  return (
    <div className="active-filters-container">
      <div className="active-filters-header">
        <h4>Filtros activos:</h4>
        <button 
          className="btn btn-text btn-sm" 
          onClick={onClearSpecialFilters}
          title="Limpiar filtros especiales"
        >
          <i className="fas fa-times"></i> Limpiar filtros
        </button>
      </div>
      <div className="active-filters-list">
        {filters.expiringSoon && (
          <span className="filter-chip">
            <i className="fas fa-calendar-alt"></i>
            Próximos a vencer (30 días)
          </span>
        )}
        {filters.stockStatus === 'low' && (
          <span className="filter-chip">
            <i className="fas fa-exclamation-triangle"></i>
            Stock bajo
          </span>
        )}
      </div>
    </div>
  );
};

const ProductsPanel = ({
  products,
  fields,
  warehouses,
  loading,
  error,
  selectedProduct,
  dialogOpen,
  dialogType,
  filterOptions,
  filters, // NUEVO
  onAddProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onSaveProduct,
  onFilterChange,
  onSearch,
  onCloseDialog,
  onRefresh,
  clearSpecialFilters // NUEVO
}) => {
  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return 'Sin vencimiento';
    const d = date.seconds 
      ? new Date(date.seconds * 1000) 
      : new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para obtener el color del stock según el nivel
  const getStockStatus = (product) => {
    const currentStock = product.stock || 0;
    const minStock = product.minStock || 0;
    
    if (currentStock === 0) return 'stock-empty';
    if (currentStock <= minStock) return 'stock-low';
    if (currentStock <= minStock * 1.5) return 'stock-warning';
    return 'stock-ok';
  };

  // Función para renderizar el estado del stock
  const renderStockBadge = (product) => {
    const status = getStockStatus(product);
    const currentStock = product.stock || 0;
    
    return (
      <div className={`stock-badge ${status}`}>
        <span className="stock-value">{currentStock}</span>
        <span className="stock-unit">{product.unit}</span>
      </div>
    );
  };

  // Función para obtener días hasta vencimiento
  const getDaysUntilExpiry = (product) => {
    if (!product.expiryDate) return null;
    
    const expiryDate = product.expiryDate.seconds 
      ? new Date(product.expiryDate.seconds * 1000) 
      : new Date(product.expiryDate);
    
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Encabezado */}
      <div className="products-header">
        <h1 className="products-title">Gestión de Productos</h1>
        <div className="products-actions">
          <button
            className="btn btn-primary"
            onClick={onAddProduct}
          >
            <i className="fas fa-plus"></i> Nuevo Producto
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

      {/* Filtros activos */}
      {filters && clearSpecialFilters && (
        <ActiveFilters 
          filters={filters} 
          onClearSpecialFilters={clearSpecialFilters}
        />
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="categoryFilter">Categoría:</label>
            <select
              id="categoryFilter"
              className="form-control"
              onChange={(e) => onFilterChange('category', e.target.value)}
              value={filters?.category || 'all'}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="stockFilter">Stock:</label>
            <select
              id="stockFilter"
              className="form-control"
              onChange={(e) => onFilterChange('stockStatus', e.target.value)}
              value={filters?.stockStatus || 'all'}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              {filterOptions.stockStatus.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="fieldFilter">Campo:</label>
            <select
              id="fieldFilter"
              className="form-control"
              onChange={(e) => onFilterChange('fieldId', e.target.value)}
              value={filters?.fieldId || 'all'}
              style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="all">Todos los campos</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="search-container">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar productos..."
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

      {/* Tabla de productos */}
      {products.length > 0 ? (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Unidad</th>
                <th>Fecha de Venc.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const daysUntilExpiry = getDaysUntilExpiry(product);
                
                return (
                  <tr key={product.id} className={getStockStatus(product)}>
                    <td>
                      <div className="lot-info">
                        <span className="lot-number">{product.lotNumber || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="product-name-cell">
                        <div className="product-name">{product.name}</div>
                        {product.code && (
                          <div className="product-code">{product.code}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {filterOptions.categories.find(cat => cat.value === product.category)?.label || product.category}
                      </span>
                    </td>
                    <td>
                      {renderStockBadge(product)}
                      {product.minStock > 0 && (
                        <div className="min-stock">
                          Mín: {product.minStock} {product.unit}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="unit-text">{product.unit}</span>
                    </td>
                    <td>
                      <div className="expiry-date">
                        <div>{formatDate(product.expiryDate)}</div>
                        {daysUntilExpiry !== null && (
                          <div className={`expiry-days ${
                            daysUntilExpiry <= 0 ? 'expired' : 
                            daysUntilExpiry <= 7 ? 'urgent' : 
                            daysUntilExpiry <= 15 ? 'warning' : 
                            daysUntilExpiry <= 30 ? 'attention' : 'normal'
                          }`}>
                            {daysUntilExpiry <= 0 ? 'Vencido' : 
                             daysUntilExpiry === 1 ? 'Vence mañana' :
                             daysUntilExpiry <= 30 ? `${daysUntilExpiry} días` : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => onViewProduct(product)}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        <button
                          className="btn-icon btn-icon-sm btn-icon-primary"
                          onClick={() => onEditProduct(product)}
                          title="Editar producto"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        
                        <button
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          title="Eliminar producto"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-boxes"></i>
          </div>
          <h2 className="empty-title">
            {filters?.expiringSoon ? 'No hay productos próximos a vencer' :
             filters?.stockStatus === 'low' ? 'No hay productos con stock bajo' :
             'No hay productos registrados'}
          </h2>
          <p className="empty-description">
            {filters?.expiringSoon ? 'No se encontraron productos que venzan en los próximos 30 días.' :
             filters?.stockStatus === 'low' ? 'No se encontraron productos con stock por debajo del mínimo.' :
             'Comienza añadiendo un nuevo producto para gestionar tu inventario.'}
          </p>
          {!filters?.expiringSoon && !filters?.stockStatus && (
            <button className="btn btn-primary" onClick={onAddProduct}>
              <i className="fas fa-plus"></i> Añadir producto
            </button>
          )}
          {(filters?.expiringSoon || filters?.stockStatus === 'low') && clearSpecialFilters && (
            <button className="btn btn-outline" onClick={clearSpecialFilters}>
              <i className="fas fa-times"></i> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Diálogos */}
      {dialogOpen && (
        <div className="dialog-overlay">
          {dialogType === 'add-product' || dialogType === 'edit-product' ? (
            <ProductDialog
              product={selectedProduct}
              fields={fields}
              warehouses={warehouses}
              isNew={dialogType === 'add-product'}
              onSave={onSaveProduct}
              onClose={onCloseDialog}
            />
          ) : dialogType === 'view-product' ? (
            <ProductDetailDialog
              product={selectedProduct}
              fields={fields}
              warehouses={warehouses}
              onClose={onCloseDialog}
              onEditProduct={onEditProduct}
              onDeleteProduct={onDeleteProduct}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;