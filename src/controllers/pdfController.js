/**
 * pdfController.js
 * Controlador para generación de PDFs
 */

const SaleService = require('../services/saleService');
const PDFService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

/**
 * Generar y descargar boleta de venta en PDF
 * GET /api/sales/:id/pdf
 */
const generateSaleReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener venta con detalles
    const sale = await SaleService.getSaleWithDetails(id);

    // Generar PDF
    const pdfPath = await PDFService.generateReceipt(sale);

    // Enviar archivo
    res.download(pdfPath, `boleta_${id}.pdf`, (err) => {
      if (err) {
        console.error('Error al enviar PDF:', err);
        return next(err);
      }

      // Opcional: Eliminar archivo después de enviarlo
      // fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    if (error.message === 'Venta no encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * Ver PDF en el navegador (sin descargar)
 * GET /api/sales/:id/pdf/view
 */
const viewSaleReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await SaleService.getSaleWithDetails(id);
    const pdfPath = await PDFService.generateReceipt(sale);

    // Leer archivo
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Configurar headers para visualización
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="boleta_${id}.pdf"`);
    
    res.send(pdfBuffer);

  } catch (error) {
    if (error.message === 'Venta no encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * Generar reporte de ventas en PDF
 * POST /api/sales/report/pdf
 */
const generateSalesReport = async (req, res, next) => {
  try {
    const { start, end } = req.body;

    let sales;
    const options = {};

    if (start && end) {
      const Sale = require('../models/Sale');
      sales = await Sale.findByDateRange(start, end);
      options.dateRange = { start, end };
    } else {
      const Sale = require('../models/Sale');
      sales = await Sale.findToday();
      options.dateRange = { 
        start: new Date().toLocaleDateString(), 
        end: new Date().toLocaleDateString() 
      };
    }

    const pdfPath = await PDFService.generateSalesReport(sales, options);

    res.download(pdfPath, `reporte_ventas.pdf`, (err) => {
      if (err) {
        return next(err);
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSaleReceipt,
  viewSaleReceipt,
  generateSalesReport
};