// src/components/panels/Expenses/ExpenseDialog.js - Diálogo para crear/editar gastos
import React, { useState, useEffect } from 'react';

const ExpenseDialog = ({ expense, products, isNew, onSave, onClose }) => {
  // Estado inicial para el formulario
  const [formData, setFormData] = useState({
    expenseNumber: '',
    type: 'product', // 'product' o 'misc'
    date: '',
    // Datos para gastos de productos (ventas)
    productId: '',
    quantitySold: '',
    unitPrice: '',
    totalAmount: '',
    saleReason: '',
    // Datos para gastos varios
    description: '',
    category: '',
    amount: '',
    supplier: '',
    // Datos comunes
    notes: ''
  });

  // Estados adicionales
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cargar datos del gasto si estamos editando
  useEffect(() => {
    if (expense && !isNew) {
      console.log('Cargando gasto para editar:', expense); // Debug
      
      setFormData({
        expenseNumber: expense.expenseNumber || '',
        type: expense.type || 'product',
        date: formatDateForInput(expense.date),
        // Datos para gastos de productos
        productId: expense.productId || '',
        quantitySold: expense.quantitySold ? String(expense.quantitySold) : '',
        unitPrice: expense.unitPrice ? String(expense.unitPrice) : '',
        totalAmount: expense.totalAmount ? String(expense.totalAmount) : '',
        saleReason: expense.saleReason || '',
        // Datos para gastos varios
        description: expense.description || '',
        category: expense.category || '',
        amount: expense.amount ? String(expense.amount) : '',
        supplier: expense.supplier || '',
        // Datos comunes
        notes: expense.notes || ''
      });

      // Si hay un producto seleccionado, buscarlo
      if (expense.productId) {
        const product = products.find(p => p.id === expense.productId);
        setSelectedProduct(product || null);
      }
    } else {
      // Para gastos nuevos, establecer fecha actual
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [expense, isNew, products]);

  // Formatear fecha para input de tipo date
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toISOString().split('T')[0];
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Campo ${name} cambió a:`, value); // Debug
    
    // Limpiar errores al modificar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Lógica especial para el tipo de gasto
    if (name === 'type') {
      // Limpiar campos según el tipo
      setFormData(prev => ({
        ...prev,
        type: value,
        // Limpiar campos de producto si cambia a misc
        ...(value === 'misc' ? {
          productId: '',
          quantitySold: '',
          unitPrice: '',
          totalAmount: '',
          saleReason: ''
        } : {}),
        // Limpiar campos de misc si cambia a product
        ...(value === 'product' ? {
          description: '',
          category: '',
          amount: '',
          supplier: ''
        } : {})
      }));
      setSelectedProduct(null);
    }
    
    // Lógica especial para selección de producto
    if (name === 'productId') {
      const product = products.find(p => p.id === value);
      setSelectedProduct(product || null);
      
      // Si selecciona un producto, limpiar campos de cantidad y precio
      if (product) {
        setFormData(prev => ({
          ...prev,
          productId: value,
          quantitySold: '',
          unitPrice: '',
          totalAmount: ''
        }));
      }
    }
  };

  // Manejar cambios en cantidad o precio unitario (cálculo automático)
  const handleQuantityOrPriceChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calcular automáticamente el total
      const quantity = parseFloat(newData.quantitySold) || 0;
      const unitPrice = parseFloat(newData.unitPrice) || 0;
      
      if (quantity > 0 && unitPrice > 0) {
        newData.totalAmount = (quantity * unitPrice).toFixed(2);
      } else if (name === 'totalAmount' && quantity > 0) {
        // Si se modifica el total, calcular precio unitario
        const total = parseFloat(value) || 0;
        newData.unitPrice = total > 0 ? (total / quantity).toFixed(2) : '';
      }
      
      return newData;
    });
    
    // Limpiar errores
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Filtrar productos disponibles con stock > 0
  const getAvailableProducts = () => {
    return products.filter(product => (product.stock || 0) > 0);
  };

  // Validar formulario antes de guardar
  const validateForm = () => {
    const newErrors = {};
    
    // Validaciones comunes
    if (!formData.type) {
      newErrors.type = 'El tipo de gasto es obligatorio';
    }
    
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }
    
    // Validaciones específicas para gastos de productos
    if (formData.type === 'product') {
      if (!formData.productId) {
        newErrors.productId = 'Debe seleccionar un producto';
      }
      
      if (!formData.quantitySold || parseFloat(formData.quantitySold) <= 0) {
        newErrors.quantitySold = 'La cantidad debe ser mayor a 0';
      }
      
      if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
        newErrors.unitPrice = 'El precio unitario debe ser mayor a 0';
      }
      
      // Verificar que hay suficiente stock
      if (selectedProduct && formData.quantitySold) {
        const quantityToSell = parseFloat(formData.quantitySold);
        const availableStock = selectedProduct.stock || 0;
        
        if (quantityToSell > availableStock) {
          newErrors.quantitySold = `Stock insuficiente. Disponible: ${availableStock}`;
        }
      }
    }
    
    // Validaciones específicas para gastos varios
    if (formData.type === 'misc') {
      if (!formData.description.trim()) {
        newErrors.description = 'La descripción es obligatoria';
      }
      
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'El importe debe ser mayor a 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('handleSubmit - Datos del formulario:', formData); // Debug
    
    if (validateForm()) {
      setSubmitting(true);
      
      // Preparar datos para guardar
      const expenseData = {
        ...formData,
        // Convertir números
        ...(formData.type === 'product' ? {
          quantitySold: parseFloat(formData.quantitySold) || 0,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          totalAmount: parseFloat(formData.totalAmount) || 0
        } : {
          amount: parseFloat(formData.amount) || 0
        })
      };
      
      console.log('handleSubmit - Datos a enviar:', expenseData); // Debug
      
      // Convertir fecha
      if (expenseData.date) {
        expenseData.date = new Date(expenseData.date);
      }
      
      onSave(expenseData)
        .then(() => {
          console.log('Gasto guardado exitosamente'); // Debug
        })
        .catch(error => {
          console.error("Error al guardar gasto:", error);
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  return (
    <div className="dialog expense-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Registrar nuevo gasto' : 'Editar gasto'}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* Información básica */}
            <div className="form-section">
              <h3 className="section-title">Información básica</h3>
              
              <div className="form-grid">
                {/* Tipo de gasto */}
                <div className="form-group">
                  <label htmlFor="type" className="form-label required">Tipo de gasto</label>
                  <select
                    id="type"
                    name="type"
                    className={`form-control ${errors.type ? 'is-invalid' : ''}`}
                    value={formData.type}
                    onChange={handleChange}
                    disabled={submitting}
                    style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                  >
                    <option value="product">Venta de producto</option>
                    <option value="misc">Gasto varios</option>
                  </select>
                  {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                </div>
                
                {/* Fecha */}
                <div className="form-group">
                  <label htmlFor="date" className="form-label required">Fecha</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                    value={formData.date}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                </div>
              </div>
            </div>
            
            {/* Datos específicos según el tipo */}
            {formData.type === 'product' ? (
              <div className="form-section">
                <h3 className="section-title">Venta de producto</h3>
                
                <div className="form-grid">
                  {/* Selección de producto */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="productId" className="form-label required">Producto</label>
                    <select
                      id="productId"
                      name="productId"
                      className={`form-control ${errors.productId ? 'is-invalid' : ''}`}
                      value={formData.productId}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    >
                      <option value="">Seleccionar producto...</option>
                      {getAvailableProducts().map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock} {product.unit})
                        </option>
                      ))}
                    </select>
                    {errors.productId && <div className="invalid-feedback">{errors.productId}</div>}
                  </div>
                  
                  {/* Información del producto seleccionado */}
                  {selectedProduct && (
                    <div className="product-info" style={{ gridColumn: '1 / -1' }}>
                      <div className="product-info-card">
                        <h4>Información del producto</h4>
                        <p><strong>Categoría:</strong> {selectedProduct.category}</p>
                        <p><strong>Stock disponible:</strong> {selectedProduct.stock} {selectedProduct.unit}</p>
                        {selectedProduct.cost && (
                          <p><strong>Costo unitario:</strong> ${selectedProduct.cost}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Cantidad vendida */}
                  <div className="form-group">
                    <label htmlFor="quantitySold" className="form-label required">Cantidad vendida</label>
                    <input
                      type="number"
                      id="quantitySold"
                      name="quantitySold"
                      className={`form-control ${errors.quantitySold ? 'is-invalid' : ''}`}
                      value={formData.quantitySold}
                      onChange={handleQuantityOrPriceChange}
                      placeholder="Cantidad"
                      min="0"
                      step="0.01"
                      disabled={submitting || !selectedProduct}
                    />
                    {errors.quantitySold && <div className="invalid-feedback">{errors.quantitySold}</div>}
                  </div>
                  
                  {/* Precio unitario */}
                  <div className="form-group">
                    <label htmlFor="unitPrice" className="form-label required">Precio unitario</label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      className={`form-control ${errors.unitPrice ? 'is-invalid' : ''}`}
                      value={formData.unitPrice}
                      onChange={handleQuantityOrPriceChange}
                      placeholder="Precio por unidad"
                      min="0"
                      step="0.01"
                      disabled={submitting}
                    />
                    {errors.unitPrice && <div className="invalid-feedback">{errors.unitPrice}</div>}
                  </div>
                  
                  {/* Total */}
                  <div className="form-group">
                    <label htmlFor="totalAmount" className="form-label">Total</label>
                    <input
                      type="number"
                      id="totalAmount"
                      name="totalAmount"
                      className="form-control"
                      value={formData.totalAmount}
                      onChange={handleQuantityOrPriceChange}
                      placeholder="Total de la venta"
                      min="0"
                      step="0.01"
                      disabled={submitting}
                    />
                  </div>
                  
                  {/* Motivo de la venta */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="saleReason" className="form-label">Motivo de la venta</label>
                    <input
                      type="text"
                      id="saleReason"
                      name="saleReason"
                      className="form-control"
                      value={formData.saleReason}
                      onChange={handleChange}
                      placeholder="Ej: Venta al cliente Juan Pérez"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-section">
                <h3 className="section-title">Gasto varios</h3>
                
                <div className="form-grid">
                  {/* Descripción */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="description" className="form-label required">Descripción</label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Descripción del gasto"
                      disabled={submitting}
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>
                  
                  {/* Categoría */}
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">Categoría</label>
                    <select
                      id="category"
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{ height: 'auto', minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                    >
                      <option value="">Seleccionar categoría...</option>
                      <option value="combustible">Combustible</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="servicios">Servicios</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="impuestos">Impuestos</option>
                      <option value="personal">Personal</option>
                      <option value="transporte">Transporte</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                  
                  {/* Importe */}
                  <div className="form-group">
                    <label htmlFor="amount" className="form-label required">Importe</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Importe del gasto"
                      min="0"
                      step="0.01"
                      disabled={submitting}
                    />
                    {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                  </div>
                  
                  {/* Proveedor */}
                  <div className="form-group">
                    <label htmlFor="supplier" className="form-label">Proveedor</label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      className="form-control"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="Nombre del proveedor"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Notas adicionales */}
            <div className="form-section">
              <h3 className="section-title">Información adicional</h3>
              
              <div className="form-group">
                <label htmlFor="notes" className="form-label">Notas</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notas adicionales sobre el gasto"
                  rows={3}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              {isNew ? 'Registrando...' : 'Guardando...'}
            </>
          ) : (
            isNew ? 'Registrar gasto' : 'Guardar cambios'
          )}
        </button>
      </div>
    </div>
  );
};

export default ExpenseDialog;