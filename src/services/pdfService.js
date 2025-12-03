/**
 * pdfService.js
 * Servicio para generación de boletas en PDF
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatCurrency } = require('../utils/calculations');

class PDFService {
  /**
   * Generar boleta de venta en PDF
   * @param {Object} sale - Datos de la venta
   * @param {string} outputPath - Ruta donde guardar el PDF
   * @returns {Promise<string>} - Path del archivo generado
   */
  static async generateReceipt(sale, outputPath = null) {
    return new Promise((resolve, reject) => {
      try {
        // Crear documento PDF
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          bufferPages: true
        });

        // Definir ruta de salida
        const fileName = `boleta_${sale.id}_${Date.now()}.pdf`;
        const filePath = outputPath || path.join(
          process.cwd(), 
          'pdfs', 
          fileName
        );

        // Crear carpeta si no existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Stream de escritura
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ========================================
        // ENCABEZADO
        // ========================================
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(process.env.NOMBRE_TIENDA || 'Mercería Los Hilos', { align: 'center' });

        doc.fontSize(10)
           .font('Helvetica')
           .moveDown(0.5);
           
        if (process.env.DIRECCION_TIENDA) {
          doc.text(process.env.DIRECCION_TIENDA, { align: 'center' });
        }
        
        if (process.env.TELEFONO_TIENDA) {
          doc.text(`Tel: ${process.env.TELEFONO_TIENDA}`, { align: 'center' });
        }
        
        if (process.env.RUC_TIENDA) {
          doc.text(`RUC: ${process.env.RUC_TIENDA}`, { align: 'center' });
        }

        doc.moveDown(1);
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('BOLETA DE VENTA', { align: 'center' });

        // ========================================
        // INFORMACIÓN DE LA VENTA
        // ========================================
        doc.moveDown(1);
        doc.fontSize(10)
           .font('Helvetica')
           .text(`N° de Venta: ${sale.id}`, 50, doc.y, { align: 'left' });
           
        const fecha = new Date(sale.fecha);
        const fechaFormateada = fecha.toLocaleString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        doc.text(`Fecha: ${fechaFormateada}`, 50, doc.y);

        if (sale.observaciones) {
          doc.text(`Observaciones: ${sale.observaciones}`, 50, doc.y);
        }

        doc.moveDown(1.5);

        // ========================================
        // TABLA DE PRODUCTOS
        // ========================================
        const tableTop = doc.y;
        const col1 = 50;   // Código
        const col2 = 120;  // Producto
        const col3 = 300;  // Cantidad
        const col4 = 380;  // P. Unit
        const col5 = 480;  // Subtotal

        // Encabezado de tabla
        doc.fontSize(10)
           .font('Helvetica-Bold');

        doc.text('Código', col1, tableTop);
        doc.text('Producto', col2, tableTop);
        doc.text('Cantidad', col3, tableTop);
        doc.text('P. Unit', col4, tableTop);
        doc.text('Subtotal', col5, tableTop);

        // Línea separadora
        doc.moveTo(50, tableTop + 15)
           .lineTo(545, tableTop + 15)
           .stroke();

        // Items de la venta
        let yPosition = tableTop + 25;
        doc.font('Helvetica');

        // Verificar que hay items
        if (!sale.items || sale.items.length === 0) {
          doc.fontSize(10)
             .text('No hay productos en esta venta', col1, yPosition);
        } else {
          sale.items.forEach((item) => {
            // Verificar si necesitamos nueva página
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }

            doc.fontSize(9);
            
            // Código
            doc.text(item.codigo || '-', col1, yPosition, { width: 60 });
            
            // Nombre del producto
            doc.text(item.nombre || '-', col2, yPosition, { width: 170 });
            
            // Cantidad con unidad
            const cantidadTexto = `${item.cantidad} ${item.unidad || ''}`;
            doc.text(cantidadTexto, col3, yPosition, { width: 70 });
            
            // Precio unitario
            const precioTexto = formatCurrency(item.precio_unitario || 0);
            doc.text(precioTexto, col4, yPosition, { width: 90 });
            
            // Subtotal
            const subtotalTexto = formatCurrency(item.subtotal || 0);
            doc.text(subtotalTexto, col5, yPosition, { width: 65 });

            // Indicador de precio especial
            if (item.precio_especial) {
              yPosition += 12;
              doc.fontSize(7)
                 .fillColor('red')
                 .text('* Precio especial', col2, yPosition);
              doc.fillColor('black');
            }

            yPosition += 20;
          });
        }

        // Línea separadora final
        doc.moveTo(50, yPosition)
           .lineTo(545, yPosition)
           .stroke();

        // ========================================
        // TOTALES
        // ========================================
        yPosition += 15;
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('TOTAL:', col4 - 30, yPosition)
           .text(formatCurrency(sale.total || 0), col5, yPosition, { width: 65 });

        // ========================================
        // PIE DE PÁGINA
        // ========================================
        doc.moveDown(3);
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('gray')
           .text('¡Gracias por su compra!', { align: 'center' })
           .text('Este documento es una boleta de venta', { align: 'center' })
           .moveDown(0.5);
           
        const generado = new Date().toLocaleString('es-PE');
        doc.text(`Generado: ${generado}`, { align: 'center' });

        // Finalizar documento
        doc.end();

        // Esperar a que termine de escribir
        stream.on('finish', () => {
          console.log(`✅ PDF generado: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          console.error('❌ Error en stream:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Error generando PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generar reporte de ventas en PDF
   * @param {Array} sales - Array de ventas
   * @param {Object} options - Opciones del reporte
   */
  static async generateSalesReport(sales, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          bufferPages: true
        });

        const fileName = `reporte_ventas_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'pdfs', fileName);

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Encabezado
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('REPORTE DE VENTAS', { align: 'center' });

        doc.fontSize(10)
           .font('Helvetica')
           .moveDown(0.5);
           
        if (process.env.NOMBRE_TIENDA) {
          doc.text(process.env.NOMBRE_TIENDA, { align: 'center' });
        }

        if (options.dateRange) {
          doc.text(`Período: ${options.dateRange.start} - ${options.dateRange.end}`, { align: 'center' });
        }

        doc.moveDown(2);

        // Tabla de ventas
        const tableTop = doc.y;
        let yPosition = tableTop;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('N°', 50, yPosition);
        doc.text('Fecha', 100, yPosition);
        doc.text('Total', 450, yPosition);

        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();
        yPosition += 10;

        doc.font('Helvetica');
        let totalGeneral = 0;

        sales.forEach((sale) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          const fecha = new Date(sale.fecha).toLocaleString('es-PE');

          doc.fontSize(9)
             .text(sale.id, 50, yPosition)
             .text(fecha, 100, yPosition)
             .text(formatCurrency(sale.total || 0), 450, yPosition);

          totalGeneral += parseFloat(sale.total || 0);
          yPosition += 20;
        });

        // Total general
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(545, yPosition).stroke();
        yPosition += 15;

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TOTAL GENERAL:', 320, yPosition)
           .text(formatCurrency(totalGeneral), 450, yPosition);

        doc.end();

        stream.on('finish', () => {
          console.log(`✅ Reporte generado: ${filePath}`);
          resolve(filePath);
        });
        
        stream.on('error', reject);

      } catch (error) {
        console.error('❌ Error generando reporte:', error);
        reject(error);
      }
    });
  }
}

module.exports = PDFService;