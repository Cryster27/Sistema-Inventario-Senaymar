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
          margin: 50 
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
           .moveDown(0.5)
           .text(process.env.DIRECCION_TIENDA || '', { align: 'center' })
           .text(`Tel: ${process.env.TELEFONO_TIENDA || ''}`, { align: 'center' })
           .text(`RUC: ${process.env.RUC_TIENDA || ''}`, { align: 'center' });

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
           .text(`Nº de Venta: ${sale.id}`, { align: 'left' })
           .text(`Fecha: ${new Date(sale.fecha).toLocaleString('es-PE')}`, { align: 'left' });

        if (sale.observaciones) {
          doc.text(`Observaciones: ${sale.observaciones}`);
        }

        doc.moveDown(1.5);

        // ========================================
        // TABLA DE PRODUCTOS
        // ========================================
        const tableTop = doc.y;
        const itemCodeX = 50;
        const itemNameX = 120;
        const quantityX = 300;
        const priceX = 360;
        const amountX = 450;

        // Encabezado de tabla
        doc.fontSize(10)
           .font('Helvetica-Bold');

        doc.text('Código', itemCodeX, tableTop);
        doc.text('Producto', itemNameX, tableTop);
        doc.text('Cant.', quantityX, tableTop);
        doc.text('P. Unit', priceX, tableTop);
        doc.text('Subtotal', amountX, tableTop);

        // Línea separadora
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        // Items de la venta
        let yPosition = tableTop + 25;
        doc.font('Helvetica');

        sale.items.forEach((item) => {
          // Verificar si necesitamos nueva página
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(9)
             .text(item.codigo, itemCodeX, yPosition, { width: 60 })
             .text(item.nombre, itemNameX, yPosition, { width: 170 })
             .text(`${item.cantidad} ${item.unidad}`, quantityX, yPosition, { width: 50 })
             .text(formatCurrency(item.precio_unitario), priceX, yPosition, { width: 80 })
             .text(formatCurrency(item.subtotal), amountX, yPosition, { width: 80 });

          // Indicador de precio especial
          if (item.precio_especial) {
            yPosition += 12;
            doc.fontSize(7)
               .fillColor('red')
               .text('* Precio especial', itemNameX, yPosition);
            doc.fillColor('black');
          }

          yPosition += 20;
        });

        // Línea separadora final
        doc.moveTo(50, yPosition)
           .lineTo(550, yPosition)
           .stroke();

        // ========================================
        // TOTALES
        // ========================================
        yPosition += 15;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TOTAL:', amountX - 80, yPosition)
           .text(formatCurrency(sale.total), amountX, yPosition, { width: 80 });

        // ========================================
        // PIE DE PÁGINA
        // ========================================
        doc.moveDown(3);
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('gray')
           .text('¡Gracias por su compra!', { align: 'center' })
           .text('Este documento es una boleta de venta', { align: 'center' })
           .moveDown(0.5)
           .text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

        // Finalizar documento
        doc.end();

        // Esperar a que termine de escribir
        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
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
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

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
           .moveDown(0.5)
           .text(process.env.NOMBRE_TIENDA || '', { align: 'center' });

        if (options.dateRange) {
          doc.text(`Período: ${options.dateRange.start} - ${options.dateRange.end}`, { align: 'center' });
        }

        doc.moveDown(2);

        // Tabla de ventas
        const tableTop = doc.y;
        let yPosition = tableTop;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Nº', 50, yPosition);
        doc.text('Fecha', 100, yPosition);
        doc.text('Total', 450, yPosition);

        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        doc.font('Helvetica');
        let totalGeneral = 0;

        sales.forEach((sale) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(9)
             .text(sale.id, 50, yPosition)
             .text(new Date(sale.fecha).toLocaleString('es-PE'), 100, yPosition)
             .text(formatCurrency(sale.total), 450, yPosition);

          totalGeneral += sale.total;
          yPosition += 20;
        });

        // Total general
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('TOTAL GENERAL:', 350, yPosition)
           .text(formatCurrency(totalGeneral), 450, yPosition);

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;