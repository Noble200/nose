// src/utils/fumigationPdfGenerator.js - Generador de PDF para fumigaciones
import jsPDF from 'jspdf';
import 'jspdf-autotable';

class FumigationPDFGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  // Función principal para generar PDF de fumigación
  async generateFumigationOrder(fumigation, products = [], mapImage = null) {
    try {
      this.doc = new jsPDF();
      this.currentY = this.margin;
      
      // Encabezado principal
      this.addMainHeader(fumigation);
      
      // Información del establecimiento
      this.addEstablishmentInfo(fumigation);
      
      // Tabla de productos
      this.addProductsTable(fumigation, products);
      
      // Sección de tiempos y observaciones
      this.addTimesAndObservations(fumigation);
      
      // Mapa de aplicación si se proporciona
      if (mapImage) {
        await this.addMapImage(mapImage);
      }
      
      return this.doc;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw new Error('Error al generar el PDF de fumigación');
    }
  }

  // Encabezado principal
  addMainHeader(fumigation) {
    // Título principal en tabla
    this.doc.autoTable({
      startY: this.currentY,
      head: [['ORDEN DE APLICACIÓN', `N° ${fumigation.orderNumber || 'SIN ASIGNAR'}`]],
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 14,
        halign: 'center',
        lineWidth: 1,
        lineColor: [0, 0, 0]
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid'
    });
    
    this.currentY = this.doc.lastAutoTable.finalY;
  }

  // Información del establecimiento
  addEstablishmentInfo(fumigation) {
    const establishmentData = [
      ['FECHA:', this.formatDate(fumigation.applicationDate)],
      ['ESTABLECIMIENTO:', fumigation.establishment || 'No especificado'],
      ['APLICADOR:', fumigation.applicator || 'No especificado']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: establishmentData,
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 11,
        cellPadding: 3,
        lineWidth: 1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 60 },
        1: { halign: 'left', cellWidth: this.contentWidth - 60 }
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid'
    });
    
    this.currentY = this.doc.lastAutoTable.finalY;
  }

  // Tabla de productos principal
  addProductsTable(fumigation, products) {
    // Encabezado de la tabla de productos
    const headers = [['CULTIVO', 'LOTE', 'SUPERFICIE', 'PRODUCTO', 'DOSIS / HA', 'TOTAL\nPRODUCTO']];
    
    // Preparar datos de productos
    const productRows = this.prepareProductRows(fumigation, products);
    
    this.doc.autoTable({
      startY: this.currentY,
      head: headers,
      body: productRows,
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        lineWidth: 1,
        lineColor: [0, 0, 0],
        cellPadding: 3
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 }, // CULTIVO
        1: { 
          halign: 'center', 
          cellWidth: 35,
          fillColor: [144, 238, 144] // Verde claro para lotes
        }, // LOTE
        2: { halign: 'center', cellWidth: 25 }, // SUPERFICIE
        3: { halign: 'left', cellWidth: 50 }, // PRODUCTO
        4: { halign: 'center', cellWidth: 25 }, // DOSIS
        5: { halign: 'center', cellWidth: 20 } // TOTAL
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid'
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 5;
  }

  // Preparar filas de productos
  prepareProductRows(fumigation, products) {
    const rows = [];
    
    if (!fumigation.selectedProducts || fumigation.selectedProducts.length === 0) {
      // Fila vacía si no hay productos
      rows.push([
        fumigation.crop || '',
        this.getLotsText(fumigation),
        fumigation.totalSurface || '',
        'Sin productos',
        '',
        ''
      ]);
      return rows;
    }

    // Primera fila con información del cultivo y lotes
    const firstProduct = fumigation.selectedProducts[0];
    const productInfo = products.find(p => p.id === firstProduct.productId);
    
    rows.push([
      fumigation.crop || '',
      this.getLotsText(fumigation),
      fumigation.totalSurface || '',
      productInfo ? productInfo.name : 'Producto desconocido',
      this.formatDose(firstProduct),
      this.formatTotal(firstProduct)
    ]);

    // Filas adicionales para otros productos (sin repetir cultivo y lote)
    for (let i = 1; i < fumigation.selectedProducts.length; i++) {
      const product = fumigation.selectedProducts[i];
      const productInfo = products.find(p => p.id === product.productId);
      
      rows.push([
        '', // Cultivo vacío
        '', // Lote vacío
        '', // Superficie vacía
        productInfo ? productInfo.name : 'Producto desconocido',
        this.formatDose(product),
        this.formatTotal(product)
      ]);
    }

    return rows;
  }

  // Sección de tiempos y observaciones
  addTimesAndObservations(fumigation) {
    // Tabla de fechas de inicio y fin
    const timeData = [
      ['FECHA Y HORA DE INICIO', ''],
      ['FECHA Y HORA DE FIN', '']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: timeData,
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 11,
        cellPadding: 8,
        lineWidth: 1,
        lineColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: this.contentWidth / 2 },
        1: { halign: 'left', cellWidth: this.contentWidth / 2 }
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid'
    });
    
    this.currentY = this.doc.lastAutoTable.finalY;

    // Sección de observaciones
    this.addObservationsSection(fumigation);
  }

  // Sección de observaciones
  addObservationsSection(fumigation) {
    // Encabezado de observaciones
    this.doc.autoTable({
      startY: this.currentY,
      body: [['OBSERVACIONES:']],
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 11,
        cellPadding: 3,
        lineWidth: 1,
        lineColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid'
    });
    
    this.currentY = this.doc.lastAutoTable.finalY;

    // Observaciones predeterminadas y personalizadas
    const observations = this.getObservations(fumigation);
    
    observations.forEach((obs, index) => {
      this.doc.autoTable({
        startY: this.currentY,
        body: [[obs.text]],
        bodyStyles: {
          fillColor: obs.color || [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 10,
          cellPadding: 3,
          lineWidth: 1,
          lineColor: [0, 0, 0],
          halign: 'center'
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 1,
        margin: { left: this.margin, right: this.margin },
        theme: 'grid'
      });
      
      this.currentY = this.doc.lastAutoTable.finalY;
    });
  }

  // Agregar imagen del mapa
  async addMapImage(imageFile) {
    try {
      const imageDataUrl = await this.fileToDataURL(imageFile);
      
      // Calcular dimensiones para la imagen
      const maxWidth = this.contentWidth;
      const maxHeight = 120; // Altura máxima para el mapa
      
      // Agregar un poco de espacio antes de la imagen
      this.currentY += 5;
      
      // Verificar si hay espacio suficiente, si no, nueva página
      if (this.currentY + maxHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      
      // Agregar la imagen
      this.doc.addImage(
        imageDataUrl,
        'JPEG',
        this.margin,
        this.currentY,
        maxWidth,
        maxHeight,
        undefined,
        'FAST'
      );
      
      this.currentY += maxHeight + 5;
      
    } catch (error) {
      console.error('Error al agregar imagen del mapa:', error);
      // Continuar sin la imagen si hay error
    }
  }

  // Convertir archivo a Data URL
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Obtener observaciones
  getObservations(fumigation) {
    const observations = [];
    
    // Observación sobre el caudal
    observations.push({
      text: `Mantener caudal mayor a ${fumigation.flowRate || 80} lts de caldo por hectárea.`,
      color: [255, 255, 255]
    });
    
    // Observación sobre condiciones climáticas
    observations.push({
      text: 'No aplicar con alta insolación ni rocío',
      color: [255, 255, 255]
    });
    
    // Observaciones sobre aplicación por colores
    observations.push({
      text: 'La aplicación en color verde es para hacer en todo el lote',
      color: [144, 238, 144] // Verde claro
    });
    
    observations.push({
      text: 'La aplicación en celeste es para hacer en cabeceras, la superficie es aproximada',
      color: [173, 216, 230] // Azul claro
    });
    
    // Observaciones personalizadas
    if (fumigation.observations) {
      observations.push({
        text: fumigation.observations,
        color: [255, 255, 255]
      });
    }
    
    return observations;
  }

  // Obtener texto de lotes
  getLotsText(fumigation) {
    if (!fumigation.lots || fumigation.lots.length === 0) {
      return 'Sin lotes';
    }
    
    return fumigation.lots.map(lot => lot.name).join(' y ');
  }

  // Formatear dosis
  formatDose(product) {
    return `${product.dosePerHa} ${product.doseUnit}`;
  }

  // Formatear total del producto
  formatTotal(product) {
    const total = product.totalQuantity || 0;
    const unit = product.unit || 'L';
    
    // Formatear según la unidad
    if (unit === 'ml' || unit === 'cc') {
      // Convertir a litros si es más de 1000ml
      if (total >= 1000) {
        return `${(total / 1000).toFixed(2)} Lts`;
      } else {
        return `${total.toFixed(0)} ${unit}`;
      }
    } else if (unit === 'L') {
      return `${total.toFixed(2)} Lts`;
    } else if (unit === 'kg') {
      return `${total.toFixed(2)} Kg`;
    } else if (unit === 'g') {
      // Convertir a kg si es más de 1000g
      if (total >= 1000) {
        return `${(total / 1000).toFixed(2)} Kg`;
      } else {
        return `${total.toFixed(0)} g`;
      }
    }
    
    return `${total.toFixed(2)} ${unit}`;
  }

  // Formatear fecha
  formatDate(date) {
    if (!date) return 'No especificada';
    
    const d = date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Obtener texto del estado
  getStatusText(status) {
    const statusMap = {
      'pending': 'Pendiente',
      'scheduled': 'Programada',
      'in_progress': 'En Proceso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    
    return statusMap[status] || status || 'Pendiente';
  }

  // Descargar PDF
  downloadPDF(fumigation, filename = null) {
    if (!this.doc) {
      throw new Error('No hay documento PDF generado');
    }
    
    const defaultFilename = `Orden_Fumigacion_${fumigation.orderNumber || 'SIN_NUMERO'}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename || defaultFilename);
  }

  // Obtener blob del PDF para preview
  getPDFBlob() {
    if (!this.doc) {
      throw new Error('No hay documento PDF generado');
    }
    
    return this.doc.output('blob');
  }

  // Obtener data URL del PDF
  getPDFDataURL() {
    if (!this.doc) {
      throw new Error('No hay documento PDF generado');
    }
    
    return this.doc.output('dataurlstring');
  }
}

// Función de utilidad para generar PDF de fumigación
export const generateFumigationPDF = async (fumigation, products = [], mapImage = null) => {
  const generator = new FumigationPDFGenerator();
  await generator.generateFumigationOrder(fumigation, products, mapImage);
  return generator;
};

// Función para descargar directamente
export const downloadFumigationPDF = async (fumigation, products = [], mapImage = null, filename = null) => {
  const generator = await generateFumigationPDF(fumigation, products, mapImage);
  generator.downloadPDF(fumigation, filename);
};

export default FumigationPDFGenerator;