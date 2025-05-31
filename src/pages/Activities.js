// src/pages/Activities.js - Página de actividades actualizada
import React from 'react';
import ActivitiesPanel from '../components/panels/Activities/ActivitiesPanel';
import useActivitiesController from '../controllers/ActivitiesController';

const Activities = () => {
  const {
    activities,
    loading,
    error,
    filters,
    filterOptions,
    hasMore,
    totalCount,
    handleFilterChange,
    handleSearch,
    handleRefresh,
    handleLoadMore,
    handleClearFilters
  } = useActivitiesController();

  return (
    <ActivitiesPanel
      activities={activities}
      loading={loading}
      error={error}
      filters={filters}
      filterOptions={filterOptions}
      hasMore={hasMore}
      totalCount={totalCount}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
      onClearFilters={handleClearFilters}
    />
  );
};

export default Activities;