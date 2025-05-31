// src/hooks/useActivityLogger.js - Hook mejorado con manejo correcto de fechas
import { useCallback } from 'react';
import { useActivities } from '../contexts/ActivityContext';

// Mapeo de acciones a descripciones en español
const actionDescriptions = {
  // Productos
  'product-create': 'Creó un nuevo producto',
  'product-update': 'Actualizó un producto',
  'product-delete': 'Eliminó un producto',
  'product-stock-adjust': 'Ajustó el stock de un producto',
  'product-move': 'Trasladó un producto',
  
  // Transferencias
  'transfer-create': 'Creó una nueva transferencia',
  'transfer-update': 'Actualizó una transferencia',
  'transfer-approve': 'Aprobó una transferencia',
  'transfer-reject': 'Rechazó una transferencia',
  'transfer-ship': 'Envió una transferencia',
  'transfer-receive': 'Recibió una transferencia',
  'transfer-cancel': 'Canceló una transferencia',
  'transfer-delete': 'Eliminó una transferencia',
  
  // Fumigaciones
  'fumigation-create': 'Programó una nueva fumigación',
  'fumigation-update': 'Actualizó una fumigación',
  'fumigation-complete': 'Completó una fumigación',
  'fumigation-cancel': 'Canceló una fumigación',
  'fumigation-delete': 'Eliminó una fumigación',
  'fumigation-schedule': 'Reprogramó una fumigación',
  
  // Cosechas
  'harvest-create': 'Programó una nueva cosecha',
  'harvest-update': 'Actualizó una cosecha',
  'harvest-complete': 'Completó una cosecha',
  'harvest-cancel': 'Canceló una cosecha',
  'harvest-delete': 'Eliminó una cosecha',
  'harvest-schedule': 'Reprogramó una cosecha',
  
  // Compras
  'purchase-create': 'Registró una nueva compra',
  'purchase-update': 'Actualizó una compra',
  'purchase-delete': 'Eliminó una compra',
  'purchase-approve': 'Aprobó una compra',
  'purchase-delivery-create': 'Creó una entrega de compra',
  'purchase-delivery-complete': 'Completó una entrega de compra',
  'purchase-delivery-cancel': 'Canceló una entrega de compra',
  
  // Gastos
  'expense-create': 'Registró un nuevo gasto',
  'expense-update': 'Actualizó un gasto',
  'expense-delete': 'Eliminó un gasto',
  'expense-product-sale': 'Registró venta de producto',
  'expense-misc': 'Registró gasto varios',
  
  // Campos
  'field-create': 'Creó un nuevo campo',
  'field-update': 'Actualizó un campo',
  'field-delete': 'Eliminó un campo',
  'field-lot-add': 'Añadió un lote al campo',
  'field-lot-update': 'Actualizó un lote del campo',
  'field-lot-delete': 'Eliminó un lote del campo',
  
  // Almacenes
  'warehouse-create': 'Creó un nuevo almacén',
  'warehouse-update': 'Actualizó un almacén',
  'warehouse-delete': 'Eliminó un almacén',
  'warehouse-activate': 'Activó un almacén',
  'warehouse-deactivate': 'Desactivó un almacén',
  
  // Usuarios
  'user-create': 'Creó un nuevo usuario',
  'user-update': 'Actualizó un usuario',
  'user-delete': 'Eliminó un usuario',
  'user-permissions-update': 'Actualizó permisos de usuario',
  'user-login': 'Inició sesión',
  'user-logout': 'Cerró sesión',
  
  // Sistema
  'system-backup': 'Realizó respaldo del sistema',
  'system-restore': 'Restauró respaldo del sistema',
  'system-maintenance': 'Realizó mantenimiento del sistema'
};

// Mapeo de iconos por tipo de entidad
const entityIcons = {
  'product': 'fas fa-box',
  'transfer': 'fas fa-exchange-alt',
  'fumigation': 'fas fa-spray-can',
  'harvest': 'fas fa-tractor',
  'purchase': 'fas fa-shopping-cart',
  'expense': 'fas fa-receipt',
  'field': 'fas fa-seedling',
  'warehouse': 'fas fa-warehouse',
  'user': 'fas fa-user',
  'system': 'fas fa-cog'
};

export const useActivityLogger = () => {
  const { logActivity } = useActivities();

  // Función principal para registrar actividades
  const log = useCallback(async (action, entityData, additionalData = {}) => {
    try {
      console.log('🔄 ActivityLogger - Registrando actividad:', action, entityData);
      
      // Extraer el tipo de entidad y acción del string de acción
      const [entity, actionType] = action.split('-');
      
      // Validar datos mínimos
      if (!entity || !actionType) {
        console.warn('⚠️ ActivityLogger - Acción malformada:', action);
        return;
      }
      
      // Construir el objeto de actividad con datos limpios
      const activityData = {
        type: actionType, // 'create', 'update', 'delete', etc.
        entity: entity, // 'product', 'transfer', etc.
        entityId: getEntityId(entityData),
        entityName: getEntityName(entityData),
        action: actionDescriptions[action] || `${actionType} ${entity}`,
        description: generateDescription(action, entityData, additionalData),
        metadata: cleanMetadata({
          ...additionalData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          originalData: sanitizeEntityData(entityData)
        })
      };

      console.log('✅ ActivityLogger - Datos de actividad preparados:', activityData);
      
      await logActivity(activityData);
      console.log('🎉 ActivityLogger - Actividad registrada exitosamente');
      
    } catch (error) {
      console.error('❌ ActivityLogger - Error al registrar actividad:', error);
      // No interrumpir la operación principal
    }
  }, [logActivity]);

  // Métodos específicos para cada tipo de entidad
  const logProduct = useCallback((action, product, additionalData = {}) => {
    return log(`product-${action}`, product, {
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      warehouseId: product.warehouseId,
      fieldId: product.fieldId,
      cost: product.cost,
      ...additionalData
    });
  }, [log]);

  const logTransfer = useCallback((action, transfer, additionalData = {}) => {
    return log(`transfer-${action}`, transfer, {
      transferNumber: transfer.transferNumber,
      sourceWarehouse: transfer.sourceWarehouse?.name,
      targetWarehouse: transfer.targetWarehouse?.name,
      sourceWarehouseId: transfer.sourceWarehouseId,
      targetWarehouseId: transfer.targetWarehouseId,
      productsCount: transfer.products?.length || 0,
      totalValue: calculateTransferValue(transfer.products),
      status: transfer.status,
      requestedBy: transfer.requestedBy,
      ...additionalData
    });
  }, [log]);

  const logFumigation = useCallback((action, fumigation, additionalData = {}) => {
    return log(`fumigation-${action}`, fumigation, {
      orderNumber: fumigation.orderNumber,
      establishment: fumigation.establishment,
      crop: fumigation.crop,
      surface: fumigation.totalSurface,
      surfaceUnit: fumigation.surfaceUnit,
      applicator: fumigation.applicator,
      applicationDate: formatSafeDate(fumigation.applicationDate),
      productsUsed: fumigation.selectedProducts?.length || 0,
      status: fumigation.status,
      ...additionalData
    });
  }, [log]);

  const logHarvest = useCallback((action, harvest, additionalData = {}) => {
    return log(`harvest-${action}`, harvest, {
      field: harvest.field?.name,
      fieldId: harvest.fieldId,
      crop: harvest.crop,
      area: harvest.totalArea,
      areaUnit: harvest.areaUnit,
      estimatedYield: harvest.estimatedYield,
      actualYield: harvest.actualYield,
      yieldUnit: harvest.yieldUnit,
      plannedDate: formatSafeDate(harvest.plannedDate),
      harvestDate: formatSafeDate(harvest.harvestDate),
      status: harvest.status,
      harvestMethod: harvest.harvestMethod,
      ...additionalData
    });
  }, [log]);

  const logPurchase = useCallback((action, purchase, additionalData = {}) => {
    return log(`purchase-${action}`, purchase, {
      purchaseNumber: purchase.purchaseNumber,
      supplier: purchase.supplier,
      totalAmount: purchase.totalAmount,
      productsCount: purchase.products?.length || 0,
      status: purchase.status,
      purchaseDate: formatSafeDate(purchase.purchaseDate),
      createdBy: purchase.createdBy,
      deliveriesCount: purchase.deliveries?.length || 0,
      ...additionalData
    });
  }, [log]);

  const logExpense = useCallback((action, expense, additionalData = {}) => {
    return log(`expense-${action}`, expense, {
      expenseNumber: expense.expenseNumber,
      type: expense.type,
      amount: expense.amount || expense.totalAmount,
      category: expense.category || expense.productCategory,
      productName: expense.productName,
      quantitySold: expense.quantitySold,
      supplier: expense.supplier,
      date: formatSafeDate(expense.date),
      ...additionalData
    });
  }, [log]);

  const logField = useCallback((action, field, additionalData = {}) => {
    return log(`field-${action}`, field, {
      location: field.location,
      area: field.area,
      areaUnit: field.areaUnit,
      owner: field.owner,
      lotsCount: field.lots?.length || 0,
      status: field.status,
      soilType: field.soilType,
      ...additionalData
    });
  }, [log]);

  const logWarehouse = useCallback((action, warehouse, additionalData = {}) => {
    return log(`warehouse-${action}`, warehouse, {
      type: warehouse.type,
      location: warehouse.location,
      capacity: warehouse.capacity,
      capacityUnit: warehouse.capacityUnit,
      fieldId: warehouse.fieldId,
      status: warehouse.status,
      storageCondition: warehouse.storageCondition,
      supervisor: warehouse.supervisor,
      ...additionalData
    });
  }, [log]);

  const logUser = useCallback((action, user, additionalData = {}) => {
    return log(`user-${action}`, user, {
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions ? Object.keys(user.permissions) : [],
      displayName: user.displayName,
      ...additionalData
    });
  }, [log]);

  // Método para registrar actividades del sistema
  const logSystem = useCallback((action, data = {}, additionalData = {}) => {
    return log(`system-${action}`, {
      id: `system-${Date.now()}`,
      name: `Sistema - ${action}`
    }, {
      ...data,
      ...additionalData
    });
  }, [log]);

  // Métodos de conveniencia para acciones comunes
  const logBulkAction = useCallback(async (action, entities, additionalData = {}) => {
    try {
      for (const entity of entities) {
        await log(action, entity, {
          ...additionalData,
          bulkOperation: true,
          totalItems: entities.length
        });
      }
    } catch (error) {
      console.error('Error en operación masiva:', error);
    }
  }, [log]);

  const logStockMovement = useCallback((product, oldStock, newStock, reason = '') => {
    const difference = newStock - oldStock;
    const action = difference > 0 ? 'stock-increase' : 'stock-decrease';
    
    return logProduct('stock-adjust', product, {
      oldStock,
      newStock,
      difference: Math.abs(difference),
      reason,
      movementType: action
    });
  }, [logProduct]);

  const logStatusChange = useCallback((entity, entityType, oldStatus, newStatus, reason = '') => {
    return log(`${entityType}-update`, entity, {
      oldStatus,
      newStatus,
      statusChange: true,
      reason,
      changeType: 'status'
    });
  }, [log]);

  return {
    // Método principal
    log,
    
    // Métodos por entidad
    logProduct,
    logTransfer,
    logFumigation,
    logHarvest,
    logPurchase,
    logExpense,
    logField,
    logWarehouse,
    logUser,
    logSystem,
    
    // Métodos de conveniencia
    logBulkAction,
    logStockMovement,
    logStatusChange
  };
};

// Funciones auxiliares

// CORREGIDO: Obtener ID de entidad de manera más robusta
function getEntityId(entityData) {
  return entityData?.id || 
         entityData?._id || 
         entityData?.uid ||
         entityData?.transferNumber ||
         entityData?.orderNumber ||
         entityData?.expenseNumber ||
         entityData?.purchaseNumber ||
         `temp-${Date.now()}`;
}

function getEntityName(entityData) {
  return entityData?.name || 
         entityData?.transferNumber || 
         entityData?.orderNumber || 
         entityData?.expenseNumber || 
         entityData?.purchaseNumber ||
         entityData?.username ||
         entityData?.displayName ||
         entityData?.title ||
         entityData?.description ||
         `Elemento ${getEntityId(entityData).substring(0, 8)}` ||
         'Entidad sin nombre';
}

// CORREGIDO: Limpiar metadata para evitar valores undefined
function cleanMetadata(metadata) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null && value !== '') {
      // Convertir fechas a strings para evitar problemas de serialización
      if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      } else if (typeof value === 'object' && value.seconds) {
        // Timestamp de Firebase
        cleaned[key] = new Date(value.seconds * 1000).toISOString();
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Objetos anidados - recursivo pero limitado
        const nestedCleaned = cleanMetadata(value);
        if (Object.keys(nestedCleaned).length > 0) {
          cleaned[key] = nestedCleaned;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

function sanitizeEntityData(entityData) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
  const sanitized = { ...entityData };
  
  // Eliminar campos sensibles
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  
  // Limitar el tamaño del objeto para evitar problemas de almacenamiento
  const jsonString = JSON.stringify(sanitized);
  if (jsonString.length > 3000) {
    return {
      id: getEntityId(sanitized),
      name: getEntityName(sanitized),
      type: sanitized.type || sanitized.category,
      note: 'Datos truncados por tamaño'
    };
  }
  
  return cleanMetadata(sanitized);
}

function calculateTransferValue(products = []) {
  return products.reduce((total, product) => {
    const quantity = product.quantity || 0;
    const cost = product.cost || product.unitCost || 0;
    return total + (quantity * cost);
  }, 0);
}

// CORREGIDO: Función para formatear fechas de manera completamente segura
function formatSafeDate(dateInput) {
  try {
    if (!dateInput) return null;
    
    let date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput?.seconds) {
      // Timestamp de Firebase
      date = new Date(dateInput.seconds * 1000);
    } else if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
      // Timestamp object con método toDate
      date = dateInput.toDate();
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return null;
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error al formatear fecha:', error);
    return null;
  }
}

function generateDescription(action, entityData, additionalData) {
  const [entity, actionType] = action.split('-');
  
  try {
    switch (entity) {
      case 'product':
        return generateProductDescription(actionType, entityData, additionalData);
      case 'transfer':
        return generateTransferDescription(actionType, entityData, additionalData);
      case 'fumigation':
        return generateFumigationDescription(actionType, entityData, additionalData);
      case 'harvest':
        return generateHarvestDescription(actionType, entityData, additionalData);
      case 'purchase':
        return generatePurchaseDescription(actionType, entityData, additionalData);
      case 'expense':
        return generateExpenseDescription(actionType, entityData, additionalData);
      case 'field':
        return generateFieldDescription(actionType, entityData, additionalData);
      case 'warehouse':
        return generateWarehouseDescription(actionType, entityData, additionalData);
      case 'user':
        return generateUserDescription(actionType, entityData, additionalData);
      default:
        return actionDescriptions[action] || `${actionType} ${entity}`;
    }
  } catch (error) {
    console.warn('Error generando descripción:', error);
    return actionDescriptions[action] || `${actionType} ${entity}`;
  }
}

function generateProductDescription(actionType, product, data) {
  const name = product.name || 'producto';
  
  switch (actionType) {
    case 'create':
      return `Creó el producto "${name}" en la categoría ${data.category || 'sin categoría'} con stock inicial de ${data.initialStock || data.stock || 0} ${data.unit || 'unidades'}`;
    case 'update':
      if (data.changes && data.changes.length > 0) {
        const changesList = data.changes.map(change => {
          switch (change.type) {
            case 'increase':
              return `${change.label}: ${change.oldValue} → ${change.newValue} ⬆️`;
            case 'decrease':
              return `${change.label}: ${change.oldValue} → ${change.newValue} ⬇️`;
            case 'location':
              return `${change.label}: ${change.oldValue} → ${change.newValue} 📍`;
            default:
              return `${change.label}: ${change.oldValue} → ${change.newValue}`;
          }
        }).join(', ');
        
        return `Actualizó "${name}" - Cambios: ${changesList}`;
      }
      return `Actualizó el producto "${name}" - Stock actual: ${data.stock || 0} ${data.unit || 'unidades'}`;
    case 'delete':
      return `Eliminó el producto "${name}" de la categoría ${data.category || 'sin categoría'}${data.finalStock ? ` (stock final: ${data.finalStock} ${data.unit || 'unidades'})` : ''}`;
    case 'stock-adjust':
      const movement = data.difference > 0 ? 'aumentó' : 'disminuyó';
      return `${movement.charAt(0).toUpperCase() + movement.slice(1)} el stock de "${name}" en ${Math.abs(data.difference || 0)} ${data.unit || 'unidades'}. ${data.reason ? `Razón: ${data.reason}` : ''}`;
    default:
      return `${actionType} producto "${name}"`;
  }
}

function generateTransferDescription(actionType, transfer, data) {
  const number = data.transferNumber || transfer.transferNumber || transfer.id?.substring(0, 8) || 'S/N';
  
  switch (actionType) {
    case 'create':
      return `Creó transferencia ${number} de ${data.sourceWarehouse || 'origen'} hacia ${data.targetWarehouse || 'destino'} con ${data.productsCount || 0} productos`;
    case 'approve':
      return `Aprobó la transferencia ${number}`;
    case 'reject':
      return `Rechazó la transferencia ${number}${data.reason ? `. Motivo: ${data.reason}` : ''}`;
    case 'ship':
      return `Envió la transferencia ${number} desde ${data.sourceWarehouse || 'origen'}`;
    case 'receive':
      return `Recibió la transferencia ${number} en ${data.targetWarehouse || 'destino'}`;
    case 'cancel':
      return `Canceló la transferencia ${number}${data.reason ? `. Motivo: ${data.reason}` : ''}`;
    default:
      return `${actionType} transferencia ${number}`;
  }
}

function generateFumigationDescription(actionType, fumigation, data) {
  const order = data.orderNumber || fumigation.orderNumber || fumigation.id?.substring(0, 8) || 'S/N';
  
  switch (actionType) {
    case 'create':
      return `Programó fumigación ${order} para ${data.establishment || 'establecimiento'} - ${data.crop || 'cultivo'} (${data.surface || 0} ${data.surfaceUnit || 'ha'})`;
    case 'complete':
      return `Completó fumigación ${order} en ${data.surface || 0} ${data.surfaceUnit || 'ha'} aplicada por ${data.applicator || 'aplicador no especificado'}`;
    case 'cancel':
      return `Canceló fumigación ${order}${data.reason ? `. Motivo: ${data.reason}` : ''}`;
    default:
      return `${actionType} fumigación ${order}`;
  }
}

function generateHarvestDescription(actionType, harvest, data) {
  const crop = data.crop || harvest.crop || 'cultivo';
  const field = data.field || harvest.field?.name || 'campo';
  
  switch (actionType) {
    case 'create':
      return `Programó cosecha de ${crop} en ${field} (${data.area || 0} ${data.areaUnit || 'ha'})`;
    case 'complete':
      return `Completó cosecha de ${crop} en ${field} - Rendimiento: ${data.actualYield || 0} ${data.yieldUnit || 'kg/ha'}`;
    case 'cancel':
      return `Canceló cosecha de ${crop} en ${field}`;
    default:
      return `${actionType} cosecha de ${crop}`;
  }
}

function generatePurchaseDescription(actionType, purchase, data) {
  const number = data.purchaseNumber || purchase.purchaseNumber || 'S/N';
  
  switch (actionType) {
    case 'create':
      return `Registró compra ${number} a ${data.supplier || 'proveedor'} por $${(data.totalAmount || 0).toLocaleString()}`;
    case 'delivery-create':
      return `Creó entrega para compra ${number}`;
    case 'delivery-complete':
      return `Completó entrega de compra ${number}`;
    default:
      return `${actionType} compra ${number}`;
  }
}

function generateExpenseDescription(actionType, expense, data) {
  const number = data.expenseNumber || expense.expenseNumber || 'S/N';
  
  switch (actionType) {
    case 'create':
      const type = data.type === 'product' ? 'venta' : 'gasto';
      return `Registró ${type} ${number} por $${(data.amount || 0).toLocaleString()}`;
    default:
      return `${actionType} gasto ${number}`;
  }
}

function generateFieldDescription(actionType, field, data) {
  const name = field.name || 'campo';
  
  switch (actionType) {
    case 'create':
      return `Creó campo "${name}" (${data.area || 0} ${data.areaUnit || 'ha'})`;
    case 'lot-add':
      return `Añadió lote al campo "${name}"`;
    default:
      return `${actionType} campo "${name}"`;
  }
}

function generateWarehouseDescription(actionType, warehouse, data) {
  const name = warehouse.name || 'almacén';
  
  switch (actionType) {
    case 'create':
      return `Creó ${data.type || 'almacén'} "${name}"`;
    case 'activate':
      return `Activó almacén "${name}"`;
    case 'deactivate':
      return `Desactivó almacén "${name}"`;
    default:
      return `${actionType} almacén "${name}"`;
  }
}

function generateUserDescription(actionType, user, data) {
  const name = user.displayName || user.username || user.email || 'usuario';
  
  switch (actionType) {
    case 'create':
      return `Creó usuario "${name}" con rol ${data.role || 'usuario'}`;
    case 'login':
      return `Usuario "${name}" inició sesión`;
    case 'logout':
      return `Usuario "${name}" cerró sesión`;
    default:
      return `${actionType} usuario "${name}"`;
  }
}

export default useActivityLogger;