// src/components/panels/Purchases/PurchaseDialog.js - Diálogo para crear/editar compras
import React, { useState, useEffect } from 'react';

const PurchaseDialog = ({
  purchase,
  isNew,
  onSave,
  onClose
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    purchaseNumber: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    products: [],
    freight: 0,
    taxes: 0,
    notes: '',
    status: 'pending'
  });
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'insumo',
    unit: 'kg',
    quantity: 0,
    unitCost: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos si es edición
  useEffect(() => {
    if (!isNew && purchase) {
      const purchaseDate = purchase.purchaseDate
        ? new Date(purchase.purchaseDate.seconds ? purchase.purchaseDate.seconds * 1000 : purchase.purchaseDate)
        : new Date();
      
      setFormData({
        purchaseNumber: purchase.purchaseNumber || '',
        supplier: purchase.supplier || '',
        purchaseDate: purchaseDate.toISOString().split('T')[0],
        products: purchase.products || [],
        freight: purchase.freight || 0,
        taxes: purchase.taxes || 0,
        notes: purchase.notes || '',
        status: purchase.status || 'pending'
      });
    }
  }, [purchase, isNew]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Manejar cambios en el nuevo producto
  const handleProductChange = (e) => {
    const { name, value, type } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Agregar producto a la lista
  const handleAddProduct = () => {
    if (!newProduct.name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    
    if (newProduct.quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (newProduct.unitCost <= 0) {
      setError('El costo unitario debe ser mayor a 0');
      return;
    }

    const productToAdd = {
      ...newProduct,
      id: Date.now().toString(), // ID temporal
      totalCost: newProduct.quantity * newProduct.unitCost
    };

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, productToAdd]
    }));

    // Resetear formulario de producto
    setNewProduct({
      name: '',
      category: 'insumo',
      unit: 'kg',
      quantity: 0,
      unitCost: 0
    });
    
    setError('');
  };

  // Eliminar producto de la lista
  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = formData.products.reduce((sum, product) => 
      sum + (product.quantity * product.unitCost), 0
    );
    const total = subtotal + formData.freight + formData.taxes;
    
    return { subtotal, total };
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (!formData.supplier.trim()) {
      setError('El proveedor es obligatorio');
      return;
    }
    
    if (formData.products.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }
    
    if (!formData.purchaseDate) {
      setError('La fecha de compra es obligatoria');
      return;
    }

    try {
      setLoading(true);
      
      const purchaseData = {
        ...formData,
        purchaseDate: new Date(formData.purchaseDate)
      };
      
      await onSave(purchaseData);
    } catch (err) {
      setError('Error al guardar la compra: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="dialog-content">
      <div className="dialog-header">
        <h2 className="dialog-title">
          {isNew ? 'Nueva Compra' : 'Editar Compra'}
        </h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dialog-body">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Información básica */}
        <div className="form-section">
          <h3 className="section-title">Información de la Compra</h3>
          
          <div className="form-row">
            <div className="form-col">
              <label htmlFor="purchaseNumber" className="form-label">
                Número de Compra
              </label>
              <input
                type="text"
                id="purchaseNumber"
                name="purchaseNumber"
                className="form-control"
                value={formData.purchaseNumber}
                onChange={handleChange}
                placeholder="Se generará automáticamente"
              />
            </div>
            
            <div className="form-col">
              <label htmlFor="purchaseDate" className="form-label required">
                Fecha de Compra
              </label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                className="form-control"
                value={formData.purchaseDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="supplier" className="form-label required">
              Proveedor
            </label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              className="form-control"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Estado
            </label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Productos */}
        <div className="form-section">
          <h3 className="section-title">Productos</h3>
          
          {/* Formulario para agregar producto */}
          <div className="product-form">
            <div className="form-row">
              <div className="form-col">
                <label htmlFor="productName" className="form-label">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  id="productName"
                  name="name"
                  className="form-control"
                  value={newProduct.name}
                  onChange={handleProductChange}
                  placeholder="Nombre del producto"
                />
              </div>
              
              <div className="form-col">
                <label htmlFor="productCategory" className="form-label">
                  Categoría
                </label>
                <select
                  id="productCategory"
                  name="category"
                  className="form-control"
                  value={newProduct.category}
                  onChange={handleProductChange}
                >
                  <option value="insumo">Insumo</option>
                  <option value="herramienta">Herramienta</option>
                  <option value="semilla">Semilla</option>
                  <option value="fertilizante">Fertilizante</option>
                  <option value="pesticida">Pesticida</option>
                  <option value="combustible">Combustible</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col">
                <label htmlFor="productUnit" className="form-label">
                  Unidad
                </label>
                <select
                  id="productUnit"
                  name="unit"
                  className="form-control"
                  value={newProduct.unit}
                  onChange={handleProductChange}
                >
                  <option value="kg">Kilogramos</option>
                  <option value="L">Litros</option>
                  <option value="unidad">Unidades</option>
                  <option value="ton">Toneladas</option>
                  <option value="bolsa">Bolsas</option>
                </select>
              </div>
              
              <div className="form-col">
                <label htmlFor="productQuantity" className="form-label">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="productQuantity"
                  name="quantity"
                  className="form-control"
                  value={newProduct.quantity}
                  onChange={handleProductChange}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-col">
                <label htmlFor="productUnitCost" className="form-label">
                  Costo Unitario ($)
                </label>
                <input
                  type="number"
                  id="productUnitCost"
                  name="unitCost"
                  className="form-control"
                  value={newProduct.unitCost}
                  onChange={handleProductChange}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-col">
                <label className="form-label">&nbsp;</label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddProduct}
                  style={{ width: '100%' }}
                >
                  <i className="fas fa-plus"></i> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          {formData.products.length > 0 && (
            <div className="products-list">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                    <th>Costo Unit.</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.quantity} {product.unit}</td>
                      <td>${product.unitCost.toFixed(2)}</td>
                      <td>${(product.quantity * product.unitCost).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => handleRemoveProduct(index)}
                          title="Eliminar producto"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Costos adicionales */}
        <div className="form-section">
          <h3 className="section-title">Costos Adicionales</h3>
          
          <div className="form-row">
            <div className="form-col">
              <label htmlFor="freight" className="form-label">
                Flete ($)
              </label>
              <input
                type="number"
                id="freight"
                name="freight"
                className="form-control"
                value={formData.freight}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="form-col">
              <label htmlFor="taxes" className="form-label">
                Impuestos ($)
              </label>
              <input
                type="number"
                id="taxes"
                name="taxes"
                className="form-control"
                value={formData.taxes}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Resumen de totales */}
        <div className="form-section">
          <div className="totals-summary">
            <div className="total-row">
              <span>Subtotal productos:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Flete:</span>
              <span>${formData.freight.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Impuestos:</span>
              <span>${formData.taxes.toFixed(2)}</span>
            </div>
            <div className="total-row total-final">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre la compra..."
            />
          </div>
        </div>
      </form>

      <div className="dialog-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {isNew ? 'Crear Compra' : 'Guardar Cambios'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PurchaseDialog;