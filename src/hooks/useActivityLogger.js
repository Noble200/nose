// src/hooks/useActivityLogger.js - Hook para rastreo automático de actividades
import { useCallback } from 'react';
import { useActivities } from '../contexts/ActivityContext';

// Mapeo de acciones a descripciones en español
const actionDescriptions = {
  // Productos
  'product-create': 'Creó un nuevo producto',
  'product-update': 'Actualizó un producto',
  'product-delete': 'Eliminó un producto',
  
  // Transferencias
  'transfer-create': 'Creó una nueva transferencia',
  'transfer-approve': 'Aprobó una transferencia',
  'transfer-reject': 'Rechazó una transferencia',
  'transfer-ship': 'Envió una transferencia',
  'transfer-receive': 'Recibió una transferencia',
  'transfer-cancel': 'Canceló una transferencia',
  
  // Fumigaciones
  'fumigation-create': 'Programó una nueva fumigación',
  'fumigation-update': 'Actualizó una fumigación',
  'fumigation-complete': 'Completó una fumigación',
  'fumigation-cancel': 'Canceló una fumigación',
  
  // Cosechas
  'harvest-create': 'Programó una nueva cosecha',
  'harvest-update': 'Actualizó una cosecha',
  'harvest-complete': 'Completó una cosecha',
  'harvest-cancel': 'Canceló una cosecha',
  
  // Compras
  'purchase-create': 'Registró una nueva compra',
  'purchase-update': 'Actualizó una compra',
  'purchase-delivery-create': 'Creó una entrega de compra',
  'purchase-delivery-complete': 'Completó una entrega de compra',
  'purchase-delivery-cancel': 'Canceló una entrega de compra',
  
  // Gastos
  'expense-create': 'Registró un nuevo gasto',
  'expense-update': 'Actualizó un gasto',
  'expense-delete': 'Eliminó un gasto',
  
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
  
  // Usuarios
  'user-create': 'Creó un nuevo usuario',
  'user-update': 'Actualizó un usuario',
  'user-delete': 'Eliminó un usuario'
};

export const useActivityLogger = () => {
  const { logActivity } = useActivities();

  // Función principal para registrar actividades
  const log = useCallback(async (action, entityData, additionalData = {}) => {
    try {
      // Extraer el tipo de entidad y acción del string de acción
      const [entity, actionType] = action.split('-');
      
      // Construir el objeto de actividad
      const activityData = {
        type: actionType, // 'create', 'update', 'delete', etc.
        entity: entity, // 'product', 'transfer', etc.
        entityId: entityData.id || '',
        entityName: entityData.name || entityData.transferNumber || entityData.orderNumber || entityData.expenseNumber || entityData.purchaseNumber || 'Sin nombre',
        action: actionDescriptions[action] || action,
        description: generateDescription(action, entityData, additionalData),
        metadata: {
          ...additionalData,
          originalData: entityData
        }
      };

      await logActivity(activityData);
    } catch (error) {
      console.error('Error al registrar actividad:', error);
      // No interrumpir la operación principal
    }
  }, [logActivity]);

  // Métodos específicos para cada tipo de entidad
  const logProduct = useCallback((action, product, additionalData = {}) => {
    return log(`product-${action}`, product, {
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      ...additionalData
    });
  }, [log]);

  const logTransfer = useCallback((action, transfer, additionalData = {}) => {
    return log(`transfer-${action}`, transfer, {
      sourceWarehouse: transfer.sourceWarehouse?.name,
      targetWarehouse: transfer.targetWarehouse?.name,
      productsCount: transfer.products?.length || 0,
      ...additionalData
    });
  }, [log]);

  const logFumigation = useCallback((action, fumigation, additionalData = {}) => {
    return log(`fumigation-${action}`, fumigation, {
      establishment: fumigation.establishment,
      crop: fumigation.crop,
      surface: fumigation.totalSurface,
      applicator: fumigation.applicator,
      ...additionalData
    });
  }, [log]);

  const logHarvest = useCallback((action, harvest, additionalData = {}) => {
    return log(`harvest-${action}`, harvest, {
      field: harvest.field?.name,
      crop: harvest.crop,
      area: harvest.totalArea,
      estimatedYield: harvest.estimatedYield,
      ...additionalData
    });
  }, [log]);

  const logPurchase = useCallback((action, purchase, additionalData = {}) => {
    return log(`purchase-${action}`, purchase, {
      supplier: purchase.supplier,
      totalAmount: purchase.totalAmount,
      productsCount: purchase.products?.length || 0,
      ...additionalData
    });
  }, [log]);

  const logExpense = useCallback((action, expense, additionalData = {}) => {
    return log(`expense-${action}`, expense, {
      type: expense.type,
      amount: expense.amount || expense.totalAmount,
      category: expense.category || expense.productCategory,
      ...additionalData
    });
  }, [log]);

  const logField = useCallback((action, field, additionalData = {}) => {
    return log(`field-${action}`, field, {
      location: field.location,
      area: field.area,
      owner: field.owner,
      lotsCount: field.lots?.length || 0,
      ...additionalData
    });
  }, [log]);

  const logWarehouse = useCallback((action, warehouse, additionalData = {}) => {
    return log(`warehouse-${action}`, warehouse, {
      type: warehouse.type,
      location: warehouse.location,
      capacity: warehouse.capacity,
      fieldId: warehouse.fieldId,
      ...additionalData
    });
  }, [log]);

  return {
    log,
    logProduct,
    logTransfer,
    logFumigation,
    logHarvest,
    logPurchase,
    logExpense,
    logField,
    logWarehouse
  };
};

// Función auxiliar para generar descripciones detalladas
function generateDescription(action, entityData, additionalData) {
  const [entity, actionType] = action.split('-');
  
  switch (entity) {
    case 'product':
      if (actionType === 'create') {
        return `Creó el producto "${entityData.name}" en la categoría ${entityData.category}`;
      } else if (actionType === 'update') {
        return `Actualizó el producto "${entityData.name}" - Stock: ${entityData.stock}`;
      } else if (actionType === 'delete') {
        return `Eliminó el producto "${entityData.name}"`;
      }
      break;
      
    case 'transfer':
      if (actionType === 'create') {
        return `Creó transferencia ${entityData.transferNumber} de ${additionalData.sourceWarehouse} a ${additionalData.targetWarehouse}`;
      } else if (actionType === 'approve') {
        return `Aprobó la transferencia ${entityData.transferNumber}`;
      } else if (actionType === 'ship') {
        return `Envió la transferencia ${entityData.transferNumber}`;
      } else if (actionType === 'receive') {
        return `Recibió la transferencia ${entityData.transferNumber}`;
      }
      break;
      
    case 'fumigation':
      if (actionType === 'create') {
        return `Programó fumigación ${entityData.orderNumber} para ${additionalData.establishment} - ${additionalData.crop}`;
      } else if (actionType === 'complete') {
        return `Completó fumigación ${entityData.orderNumber} en ${additionalData.surface} ha`;
      }
      break;
      
    case 'harvest':
      if (actionType === 'create') {
        return `Programó cosecha de ${additionalData.crop} en ${additionalData.field} (${additionalData.area} ha)`;
      } else if (actionType === 'complete') {
        return `Completó cosecha de ${additionalData.crop} - Rendimiento: ${additionalData.actualYield || 'N/A'}`;
      }
      break;
      
    case 'purchase':
      if (actionType === 'create') {
        return `Registró compra ${entityData.purchaseNumber} a ${additionalData.supplier} por $${additionalData.totalAmount}`;
      } else if (actionType === 'delivery-complete') {
        return `Completó entrega de compra ${entityData.purchaseNumber}`;
      }
      break;
      
    case 'expense':
      if (actionType === 'create') {
        const type = additionalData.type === 'product' ? 'venta' : 'gasto';
        return `Registró ${type} ${entityData.expenseNumber} por $${additionalData.amount}`;
      }
      break;
      
    default:
      return actionDescriptions[action] || action;
  }
  
  return actionDescriptions[action] || action;
}