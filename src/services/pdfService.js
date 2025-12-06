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
 * Generar boleta de venta en PDF estilo ticket
 * @param {Object} sale - Datos de la venta
 * @param {string} outputPath - Ruta donde guardar el PDF
 * @returns {Promise<string>} - Path del archivo generado
 */
static async generateReceipt(sale, outputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF tamaño ticket (80mm de ancho)
      const doc = new PDFDocument({ 
        size: [226.77, 841.89], // 80mm x 297mm (tamaño ticket térmico)
        margins: { top: 20, bottom: 20, left: 15, right: 15 }
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
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(process.env.NOMBRE_TIENDA || 'SEMAYMAR E.I.R.L.', { align: 'center' });

      doc.fontSize(9)
         .font('Helvetica')
         .text('Hilos y Artículos', { align: 'center' });
         
      if (process.env.RUC_TIENDA) {
        doc.text(`RUC: ${process.env.RUC_TIENDA}`, { align: 'center' });
      }
      
      if (process.env.DIRECCION_TIENDA) {
        doc.fontSize(7)
           .text(process.env.DIRECCION_TIENDA, { align: 'center' });
      }
      
      if (process.env.TELEFONO_TIENDA) {
        doc.text(`Tel: ${process.env.TELEFONO_TIENDA}`, { align: 'center' });
      }

      doc.moveDown(0.5);

      // Línea separadora
      doc.fontSize(10)
         .text('=============================', { align: 'center' });

      // ========================================
      // INFORMACIÓN DE LA VENTA
      // ========================================
      doc.moveDown(0.3);
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('BOLETA DE VENTA', { align: 'center' });

      doc.fontSize(10)
         .text(`N° ${String(sale.id).padStart(8, '0')}`, { align: 'center' });

      doc.moveDown(0.5);
      
      doc.fontSize(8)
         .font('Helvetica');

      // Fecha
      const fecha = new Date(sale.fecha);
      const fechaFormateada = fecha.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Fecha: ${fechaFormateada}`, 15, doc.y);

      // Método de Pago con emoji
      const metodosEmoji = {
        'efectivo': 'Efectivo',
        'yape': 'Yape',
        'transferencia': 'Transferencia',
        'tarjeta': 'Tarjeta'
      };
      const metodoLabel = metodosEmoji[sale.metodo_pago] || sale.metodo_pago || '💵 Efectivo';
      doc.text(`Método de Pago: ${metodoLabel}`, 15, doc.y);

      // Cliente (si hay observaciones)
      if (sale.observaciones) {
        doc.moveDown(0.3);
        const obs = sale.observaciones.substring(0, 50);
        doc.fontSize(7).text(`${obs}`, 15, doc.y, { width: 196.77 });
      }

      doc.moveDown(0.5);

      // Línea separadora
      doc.fontSize(8)
         .text('------------------------------', { align: 'center' });

      // ========================================
      // ENCABEZADO DE TABLA
      // ========================================
      doc.moveDown(0.3);
      doc.fontSize(7)
         .font('Helvetica-Bold');

      const headerY = doc.y;
      doc.text('DESCRIPCION', 15, headerY, { width: 90 });
      doc.text('CANT.', 105, headerY, { width: 30, align: 'right' });
      doc.text('P.U.', 135, headerY, { width: 35, align: 'right' });
      doc.text('SUBT.', 170, headerY, { width: 41.77, align: 'right' });

      doc.moveDown(0.3);

      // Línea separadora
      doc.fontSize(8)
         .text('------------------------------');

      doc.moveDown(0.3);

      // ========================================
      // ITEMS DE LA VENTA
      // ========================================
      doc.font('Helvetica').fontSize(7);

      if (!sale.items || sale.items.length === 0) {
        doc.text('No hay productos', 15, doc.y);
      } else {
        sale.items.forEach((item) => {
          const y = doc.y;
          
          // Nombre del producto (máximo 2 líneas)
          const nombre = item.nombre.length > 25 ? item.nombre.substring(0, 22) + '...' : item.nombre;
          doc.text(nombre, 15, y, { width: 90 });
          
          // Cantidad con unidad
          const cantidadTexto = `${item.cantidad}${item.unidad === 'metro' ? 'm' : item.unidad === 'centimetro' ? 'cm' : item.unidad === 'unidad' ? 'u' : ''}`;
          doc.text(cantidadTexto, 105, y, { width: 30, align: 'right' });
          
          // Precio unitario
          doc.text(parseFloat(item.precio_unitario).toFixed(2), 135, y, { width: 35, align: 'right' });
          
          // Subtotal
          doc.text(parseFloat(item.subtotal).toFixed(2), 170, y, { width: 41.77, align: 'right' });

          doc.moveDown(0.7);

          // Indicador de precio especial
          if (item.precio_especial) {
            doc.fontSize(6)
               .fillColor('#999999')
               .text('* Precio especial', 15, doc.y);
            doc.fillColor('#000000').fontSize(7);
            doc.moveDown(0.3);
          }
        });
      }

      doc.moveDown(0.3);

      // Línea separadora
      doc.fontSize(8)
         .text('-----------------------------', { align: 'center' });

      doc.moveDown(0.5);

      // ========================================
      // TOTALES CON IGV
      // ========================================
      doc.fontSize(8).font('Helvetica');

      // Subtotal (Base imponible)
      let y = doc.y;
      doc.text('SUBTOTAL:', 15, y, { width: 145, align: 'left' });
      doc.font('Helvetica-Bold').text(formatCurrency(sale.subtotal || 0).replace('S/ ', 'S/ '), 160, y, { width: 51.77, align: 'right' });
      doc.moveDown(0.3);

      // IGV
      y = doc.y;
      doc.font('Helvetica').text('IGV (18%):', 15, y, { width: 145, align: 'left' });
      doc.font('Helvetica-Bold').text(formatCurrency(sale.igv || 0).replace('S/ ', 'S/ '), 160, y, { width: 51.77, align: 'right' });
      doc.moveDown(0.5);

      // Línea separadora
      doc.fontSize(8)
         .text('-----------------------------', { align: 'center' });

      doc.moveDown(0.5);

      // TOTAL FINAL
      y = doc.y;
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL:', 15, y, { width: 145, align: 'right' });
      doc.fontSize(12).text(formatCurrency(sale.total || 0).replace('S/ ', 'S/ '), 160, y, { width: 51.77, align: 'right' });

      doc.moveDown(0.5);

      // Línea separadora final
      doc.fontSize(9)
         .text('=============================', { align: 'center' });

      doc.moveDown(0.8);

      // ========================================
      // PIE DE PÁGINA
      // ========================================
      doc.fontSize(8)
         .font('Helvetica')
         .text('¡Gracias por su compra!', { align: 'center' });
      
      doc.fontSize(7)
         .text('Conserve su boleta', { align: 'center' });
      
      doc.moveDown(0.3);
      
      doc.fontSize(6)
         .fillColor('#666666')
         .text('Este documento no tiene validez tributaria', { align: 'center' });
      
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