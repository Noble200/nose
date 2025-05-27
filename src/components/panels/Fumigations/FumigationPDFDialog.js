// src/components/panels/Fumigations/FumigationPDFDialog.js
import React, { useState, useRef } from 'react';
import { generateFumigationPDF, downloadFumigationPDF } from '../../../utils/fumigationPdfGenerator';

const FumigationPDFDialog = ({ 
  fumigation, 
  fields, 
  products, 
  onClose 
}) => {
  const [mapImage, setMapImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, etc.)');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 10MB.');
        return;
      }
      
      setMapImage(file);
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar imagen seleccionada
  const handleRemoveImage = () => {
    setMapImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generar preview del PDF
  const handleGeneratePreview = async () => {
    try {
      setGenerating(true);
      
      const generator = await generateFumigationPDF(fumigation, products, mapImage);
      const pdfDataUrl = generator.getPDFDataURL();
      
      setPdfPreview(pdfDataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Error al generar preview:', error);
      alert('Error al generar el preview del PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Descargar PDF
  const handleDownloadPDF = async () => {
    try {
      setGenerating(true);
      
      await downloadFumigationPDF(fumigation, products, mapImage);
      
      // Cerrar el diálogo después de descargar
      onClose();
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Obtener nombre del campo
  const getFieldName = () => {
    if (fumigation.field && fumigation.field.name) {
      return fumigation.field.name;
    }
    
    if (fumigation.fieldId) {
      const field = fields.find(f => f.id === fumigation.fieldId);
      return field ? field.name : 'Campo desconocido';
    }
    
    return 'No asignado';
  };

  // Obtener productos seleccionados con nombres
  const getSelectedProducts = () => {
    if (!fumigation.selectedProducts || fumigation.selectedProducts.length === 0) {
      return [];
    }
    
    return fumigation.selectedProducts.map(selectedProduct => {
      const product = products.find(p => p.id === selectedProduct.productId);
      return {
        ...selectedProduct,
        name: product ? product.name : 'Producto desconocido',
        unit: product ? product.unit : ''
      };
    });
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'No especificada';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="dialog fumigation-pdf-dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">Generar PDF de Fumigación</h2>
        <button className="dialog-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="dialog-body">
        {!showPreview ? (
          <div className="pdf-generator-content">
            {/* Resumen de la fumigación */}
            <div className="fumigation-summary-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i> Resumen de la fumigación
              </h3>
              
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Orden N°</span>
                  <span className="summary-value">{fumigation.orderNumber || 'Sin asignar'}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Fecha de aplicación</span>
                  <span className="summary-value">{formatDate(fumigation.applicationDate)}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Establecimiento</span>
                  <span className="summary-value">{fumigation.establishment}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Aplicador</span>
                  <span className="summary-value">{fumigation.applicator}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Campo</span>
                  <span className="summary-value">{getFieldName()}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Cultivo</span>
                  <span className="summary-value">{fumigation.crop}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Superficie</span>
                  <span className="summary-value">{fumigation.totalSurface} {fumigation.surfaceUnit}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Productos</span>
                  <span className="summary-value">{getSelectedProducts().length} productos</span>
                </div>
              </div>
            </div>

            {/* Productos a incluir en el PDF */}
            {getSelectedProducts().length > 0 && (
              <div className="pdf-products-section">
                <h3 className="section-title">
                  <i className="fas fa-flask"></i> Productos incluidos en el PDF
                </h3>
                
                <div className="pdf-products-list">
                  {getSelectedProducts().map((product, index) => (
                    <div key={index} className="pdf-product-item">
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-dose">{product.dosePerHa} {product.doseUnit}</span>
                      </div>
                      <div className="product-total">
                        <span>{product.totalQuantity.toFixed(2)} {product.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección para cargar imagen del mapa */}
            <div className="map-image-section">
              <h3 className="section-title">
                <i className="fas fa-map"></i> Mapa de aplicación (opcional)
              </h3>
              
              <p className="help-text">
                Puedes cargar una imagen del mapa de aplicación que se incluirá en el PDF. 
                La imagen será usada solo para este PDF y no se guardará en la base de datos.
              </p>
              
              {!imagePreview ? (
                <div className="image-upload-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  
                  <div 
                    className="upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="upload-icon">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div className="upload-text">
                      <strong>Haz clic para seleccionar una imagen</strong>
                      <p>JPG, PNG, GIF hasta 10MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview del mapa" />
                  </div>
                  
                  <div className="image-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-sync-alt"></i> Cambiar imagen
                    </button>
                    
                    <button
                      className="btn btn-sm btn-outline btn-danger"
                      onClick={handleRemoveImage}
                    >
                      <i className="fas fa-trash"></i> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preview del PDF */
          <div className="pdf-preview-section">
            <h3 className="section-title">
              <i className="fas fa-file-pdf"></i> Preview del PDF
            </h3>
            
            <div className="pdf-preview-container">
              {pdfPreview ? (
                <iframe
                  src={pdfPreview}
                  width="100%"
                  height="600px"
                  title="Preview del PDF"
                  style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                />
              ) : (
                <div className="pdf-preview-loading">
                  <div className="spinner"></div>
                  <p>Generando preview...</p>
                </div>
              )}
            </div>
            
            <div className="pdf-preview-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowPreview(false)}
              >
                <i className="fas fa-arrow-left"></i> Volver a editar
              </button>
              
              <button
                className="btn btn-primary"
                onClick={handleDownloadPDF}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    Descargando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i> Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="dialog-footer">
        <button className="btn btn-outline" onClick={onClose} disabled={generating}>
          Cancelar
        </button>
        
        {!showPreview && (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleGeneratePreview}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Generando...
                </>
              ) : (
                <>
                  <i className="fas fa-eye"></i> Ver Preview
                </>
              )}
            </button>
            
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Descargando...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> Descargar PDF
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FumigationPDFDialog;