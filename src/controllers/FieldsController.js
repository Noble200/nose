import { useState, useEffect, useCallback } from 'react';
import { useStock } from '../contexts/StockContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../api/firebase';

const useFieldsController = () => {
  const { 
    fields, 
    loading: stockLoading, 
    error: stockError, 
    loadFields
  } = useStock();
  
  // Estados locales
  const [selectedField, setSelectedField] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add-field', 'edit-field', 'view-field', 'add-lot', 'edit-lot'
  const [filters, setFilters] = useState({
    status: 'all',
    soilType: 'all',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredFieldsList, setFilteredFieldsList] = useState([]);
  
  // Función para añadir un campo
  const addField = useCallback(async (fieldData) => {
    try {
      // Añadir documento a la colección 'fields'
      const fieldRef = await addDoc(collection(db, 'fields'), {
        ...fieldData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Recargar campos
      await loadFields();
      
      return fieldRef.id;
    } catch (error) {
      console.error('Error al añadir campo:', error);
      setError('Error al añadir campo: ' + error.message);
      throw error;
    }
  }, [loadFields]);
  
  // Función para actualizar un campo
  const updateField = useCallback(async (fieldId, fieldData) => {
    try {
      // Actualizar el documento en la colección 'fields'
      await updateDoc(doc(db, 'fields', fieldId), {
        ...fieldData,
        updatedAt: serverTimestamp()
      });
      
      // Recargar campos
      await loadFields();
      
      return fieldId;
    } catch (error) {
      console.error(`Error al actualizar campo ${fieldId}:`, error);
      setError('Error al actualizar campo: ' + error.message);
      throw error;
    }
  }, [loadFields]);
  
  // Función para eliminar un campo
  const deleteField = useCallback(async (fieldId) => {
    try {
      // Eliminar el documento de la colección 'fields'
      await deleteDoc(doc(db, 'fields', fieldId));
      
      // Recargar campos
      await loadFields();
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar campo ${fieldId}:`, error);
      setError('Error al eliminar campo: ' + error.message);
      throw error;
    }
  }, [loadFields]);
  
  // Función para cargar campos
  const loadData = useCallback(async () => {
    try {
      setError('');
      await loadFields();
    } catch (err) {
      console.error('Error al cargar campos:', err);
      setError('Error al cargar campos: ' + err.message);
    }
  }, [loadFields, setError]);
  
  // Actualizar estado de carga y error
  useEffect(() => {
    setLoading(stockLoading);
    if (stockError) {
      setError(stockError);
    }
  }, [stockLoading, stockError, setError]);
  
  // Cargar campos al iniciar
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filtrar campos según filtros aplicados
  const getFilteredFields = useCallback(() => {
    if (!fields || fields.length === 0) return [];
    
    return fields.filter(field => {
      // Filtro por estado
      if (filters.status !== 'all' && field.status !== filters.status) {
        return false;
      }
      
      // Filtro por tipo de suelo
      if (filters.soilType !== 'all' && field.soilType !== filters.soilType) {
        return false;
      }
      
      // Búsqueda por texto
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          field.name.toLowerCase().includes(term) ||
          (field.location && field.location.toLowerCase().includes(term)) ||
          (field.owner && field.owner.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [fields, filters]);
  
  // Actualizar campos filtrados cuando cambian los filtros o los campos
  useEffect(() => {
    setFilteredFieldsList(getFilteredFields());
  }, [getFilteredFields]);
  
  // Convertir datos antiguos a formato nuevo al cargar campos
  useEffect(() => {
    // Si hay campos con currentCrop pero sin crops, convertirlos
    if (fields && fields.length > 0) {
      fields.forEach(field => {
        if (field.currentCrop && (!field.crops || field.crops.length === 0)) {
          // Este efecto no modifica el estado, solo adapta la visualización
          field.crops = [field.currentCrop];
        }
      });
    }
  }, [fields]);
  
  // Abrir diálogo para añadir campo
  const handleAddField = useCallback(() => {
    setSelectedField(null);
    setDialogType('add-field');
    setDialogOpen(true);
  }, []);
  
  // Abrir diálogo para editar campo
  const handleEditField = useCallback((field) => {
    setSelectedField(field);
    setDialogType('edit-field');
    setDialogOpen(true);
  }, []);
  
  // Abrir diálogo para ver detalles de un campo
  const handleViewField = useCallback((field) => {
    setSelectedField(field);
    setDialogType('view-field');
    setDialogOpen(true);
  }, []);
  
  // Abrir diálogo para añadir lote a un campo
  const handleAddLot = useCallback((field) => {
    setSelectedField(field);
    setSelectedLot(null);
    setDialogType('add-lot');
    setDialogOpen(true);
  }, []);
  
  // Abrir diálogo para editar lote
  const handleEditLot = useCallback((field, lot) => {
    setSelectedField(field);
    setSelectedLot(lot);
    setDialogType('edit-lot');
    setDialogOpen(true);
  }, []);
  
  // Confirmar eliminación de campo
  const handleDeleteField = useCallback(async (fieldId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este campo? Esta acción no se puede deshacer.')) {
      try {
        await deleteField(fieldId);
        // Cerrar el diálogo si estaba abierto para este campo
        if (selectedField && selectedField.id === fieldId) {
          setDialogOpen(false);
        }
      } catch (err) {
        console.error('Error al eliminar campo:', err);
        setError('Error al eliminar campo: ' + err.message);
      }
    }
  }, [deleteField, selectedField, setError]);
  
  // Guardar nuevo campo
  const handleSaveField = useCallback(async (fieldData) => {
    try {
      if (dialogType === 'add-field') {
        await addField(fieldData);
      } else if (dialogType === 'edit-field' && selectedField) {
        await updateField(selectedField.id, fieldData);
      }
      
      setDialogOpen(false);
      await loadData();
      return true; // Indicar éxito para desactivar animación de carga
    } catch (err) {
      console.error('Error al guardar campo:', err);
      setError('Error al guardar campo: ' + err.message);
      throw err; // Propagar error para que el componente sepa que falló
    }
  }, [dialogType, selectedField, addField, updateField, loadData, setError]);
  
  // Guardar lote (añadir o actualizar lote en un campo)
  const handleSaveLot = useCallback(async (lotData) => {
    try {
      if (!selectedField) return;
      
      // Obtener lotes actuales del campo
      const currentLots = selectedField.lots || [];
      
      let updatedLots = [];
      
      if (dialogType === 'add-lot') {
        // Añadir nuevo lote con ID generado
        const newLot = {
          ...lotData,
          id: Date.now().toString(), // ID simple basado en timestamp
          createdAt: new Date()
        };
        updatedLots = [...currentLots, newLot];
      } else if (dialogType === 'edit-lot' && selectedLot) {
        // Actualizar lote existente
        updatedLots = currentLots.map(lot => 
          lot.id === selectedLot.id 
            ? { ...lot, ...lotData, updatedAt: new Date() } 
            : lot
        );
      }
      
      // Actualizar campo con los nuevos lotes
      await updateField(selectedField.id, {
        ...selectedField,
        lots: updatedLots
      });
      
      setDialogOpen(false);
      await loadData();
      return true; // Indicar éxito para desactivar animación de carga
    } catch (err) {
      console.error('Error al guardar lote:', err);
      setError('Error al guardar lote: ' + err.message);
      throw err; // Propagar error para que el componente sepa que falló
    }
  }, [dialogType, selectedField, selectedLot, updateField, loadData, setError]);
  
  // Eliminar lote de un campo
  const handleDeleteLot = useCallback(async (fieldId, lotId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este lote? Esta acción no se puede deshacer.')) {
      try {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;
        
        // Filtrar lotes para eliminar el deseado
        const updatedLots = field.lots.filter(lot => lot.id !== lotId);
        
        // Actualizar campo sin el lote eliminado
        await updateField(fieldId, {
          ...field,
          lots: updatedLots
        });
        
        // Si estamos viendo ese lote, cerrar el diálogo
        if (selectedLot && selectedLot.id === lotId) {
          setDialogOpen(false);
        }
        
        await loadData();
      } catch (err) {
        console.error('Error al eliminar lote:', err);
        setError('Error al eliminar lote: ' + err.message);
      }
    }
  }, [fields, selectedLot, updateField, loadData, setError]);
  
  // Cambiar filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);
  
  // Buscar por texto
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  }, []);
  
  // Cerrar diálogo
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedField(null);
    setSelectedLot(null);
  }, []);
  
  // Opciones para filtros
  const filterOptions = {
    status: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
      { value: 'prepared', label: 'Preparado' },
      { value: 'sown', label: 'Sembrado' },
      { value: 'fallow', label: 'En barbecho' }
    ],
    soilType: [
      { value: 'all', label: 'Todos los tipos' },
      { value: 'sandy', label: 'Arenoso' },
      { value: 'clay', label: 'Arcilloso' },
      { value: 'loam', label: 'Franco' },
      { value: 'silt', label: 'Limoso' },
      { value: 'chalky', label: 'Calcáreo' },
      { value: 'peat', label: 'Turboso' }
    ]
  };
  
  return {
    fields: filteredFieldsList,
    loading,
    error,
    selectedField,
    selectedLot,
    dialogOpen,
    dialogType,
    filterOptions,
    handleAddField,
    handleEditField,
    handleViewField,
    handleDeleteField,
    handleAddLot,
    handleEditLot,
    handleDeleteLot,
    handleSaveField,
    handleSaveLot,
    handleFilterChange,
    handleSearch,
    handleCloseDialog,
    refreshData: loadData
  };
};

export default useFieldsController;