/**
 * saleController.js
 * Controlador para operaciones de ventas
 */

const Sale = require('../models/Sale');
const SaleDetail = require('../models/SaleDetail');
const SaleService = require('../services/saleService');
const { validationResult } = require('express-validator');

/**
 * Obtener todas las ventas
 * GET /api/sales
 */
const getAllSales = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const sales = await Sale.findAll(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una venta por ID con sus detalles
 * GET /api/sales/:id
 */
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await SaleService.getSaleWithDetails(id);

    res.json({
      success: true,
      data: sale
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
 * Obtener ventas del día
 * GET /api/sales/today
 */
const getTodaySales = async (req, res, next) => {
  try {
    const sales = await Sale.findToday();
    const stats = await Sale.getTodayStats();
    
    res.json({
      success: true,
      count: sales.length,
      stats,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas generales
 * GET /api/sales/stats
 */
const getStats = async (req, res, next) => {
  try {
    const generalStats = await Sale.getStats();
    const todayStats = await Sale.getTodayStats();
    const monthStats = await Sale.getMonthStats();
    
    res.json({
      success: true,
      data: {
        general: generalStats,
        hoy: todayStats,
        mes_actual: monthStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview de venta (calcular sin guardar)
 * POST /api/sales/preview
 */
const previewSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { items } = req.body;
    const preview = await SaleService.previewSale(items);
    
    // Calcular IGV
    const { subtotal, igv } = Sale.calcularIGV(preview.total);

    res.json({
      success: true,
      data: {
        ...preview,
        subtotal,
        igv
      }
    });
  } catch (error) {
    if (error.message === 'Carrito inválido') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * Crear nueva venta
 * POST /api/sales
 */
const createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // ✅ ASEGURARSE DE EXTRAER metodo_pago
    const { items, observaciones, metodo_pago = 'efectivo' } = req.body;
    
    console.log('📥 Datos recibidos en controller:', { items: items.length, observaciones, metodo_pago }); // DEBUG

    // ✅ PASAR metodo_pago al servicio
    const sale = await SaleService.processSale({ 
      items, 
      observaciones,
      metodo_pago 
    }, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: sale
    });
  } catch (error) {
    if (error.stockErrors) {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: error.stockErrors
      });
    }

    if (error.message.includes('debe contener') || error.message.includes('inválid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
};

/**
 * Obtener productos más vendidos
 * GET /api/sales/top-products
 */
const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const products = await SaleDetail.getTopProducts(parseInt(limit));
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener ventas por rango de fechas
 * GET /api/sales/range?start=2025-01-01&end=2025-01-31
 */
const getSalesByDateRange = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar fechas de inicio y fin'
      });
    }

    const sales = await Sale.findByDateRange(start, end);
    
    res.json({
      success: true,
      count: sales.length,
      range: { start, end },
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar venta
 * DELETE /api/sales/:id
 */
const cancelSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await SaleService.cancelSale(id);

    res.json({
      success: true,
      message: 'Venta cancelada y stock restaurado'
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

module.exports = {
  getAllSales,
  getSaleById,
  getTodaySales,
  getStats,
  previewSale,
  createSale,
  getTopProducts,
  getSalesByDateRange,
  cancelSale
};