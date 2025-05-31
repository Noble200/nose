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
    handleFilterChange,
    handleSearch,
    handleRefresh,
    clearFilters
  } = useActivitiesController();

  return (
    <ActivitiesPanel
      activities={activities}
      loading={loading}
      error={error}
      filters={filters}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onRefresh={handleRefresh}
      onClearFilters={clearFilters}
    />
  );
};

export default Activities;