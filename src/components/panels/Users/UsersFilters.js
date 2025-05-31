// src/components/panels/Users/UsersFilters.js - Filtros para usuarios
import React, { useState } from 'react';

const UsersFilters = ({
  filterOptions = {},
  onFilterChange,
  onSearch,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Búsqueda en tiempo real con debounce
    if (value === '') {
      onSearch('');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="users-filters">
      <div className="filters-row">
        {/* Búsqueda */}
        <div className="filter-group search-group">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={disabled}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={clearSearch}
                  title="Limpiar búsqueda"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              <button
                type="submit"
                className="search-submit"
                disabled={disabled}
                title="Buscar"
              >
                <i className="fas fa-search"></i>
              </button>
            </div>
          </form>
        </div>

        {/* Filtro por rol */}
        <div className="filter-group">
          <label className="filter-label">Rol:</label>
          <select
            className="form-control filter-select"
            onChange={(e) => onFilterChange('role', e.target.value)}
            disabled={disabled}
          >
            {filterOptions.roles?.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por estado */}
        <div className="filter-group">
          <label className="filter-label">Estado:</label>
          <select
            className="form-control filter-select"
            onChange={(e) => onFilterChange('status', e.target.value)}
            disabled={disabled}
          >
            {filterOptions.statuses?.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="filter-group">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              clearSearch();
              onFilterChange('role', 'all');
              onFilterChange('status', 'all');
            }}
            disabled={disabled}
            title="Limpiar todos los filtros"
          >
            <i className="fas fa-times"></i>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersFilters;