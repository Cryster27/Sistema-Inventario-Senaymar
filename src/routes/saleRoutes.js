/**
 * saleRoutes.js
 * Rutas para el módulo de ventas
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const pdfController = require('../controllers/pdfController');
const { verifyToken, requireAdminOrCajero } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// ========================================
// VALIDACIONES
// ========================================

const validateCreateSale = [
  body('items')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
    .custom((items) => {
      for (const item of items) {
        if (!item.id_producto || !item.cantidad) {
          throw new Error('Cada item debe tener id_producto y cantidad');
        }
        if (item.cantidad <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }
        if (item.precio_especial !== undefined && item.precio_especial <= 0) {
          throw new Error('El precio especial debe ser mayor a 0');
        }
      }
      return true;
    }),
  
  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres')
];

const validateSaleId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de venta inválido')
    .toInt()
];

// ========================================
// RUTAS DE CONSULTA
// ========================================

/**
 * GET /api/sales
 * Obtener todas las ventas
 * Query params: ?limit=100&offset=0
 * Requiere: Autenticación
 */
router.get('/', verifyToken, saleController.getAllSales);

/**
 * GET /api/sales/stats
 * Obtener estadísticas generales de ventas
 * IMPORTANTE: Esta ruta debe ir ANTES de /api/sales/:id
 * Requiere: Autenticación
 */
router.get('/stats', verifyToken, saleController.getStats);

/**
 * GET /api/sales/today
 * Obtener ventas del día actual
 * Requiere: Autenticación
 */
router.get('/today', verifyToken, saleController.getTodaySales);

/**
 * GET /api/sales/top-products
 * Obtener productos más vendidos
 * Query params: ?limit=10
 * Requiere: Autenticación
 */
router.get('/top-products', verifyToken, saleController.getTopProducts);

/**
 * GET /api/sales/range
 * Obtener ventas por rango de fechas
 * Query params: ?start=2025-01-01&end=2025-01-31
 * Requiere: Autenticación
 */
router.get('/range', verifyToken, saleController.getSalesByDateRange);

/**
 * GET /api/sales/:id
 * Obtener una venta específica con sus detalles
 * Requiere: Autenticación
 */
router.get('/:id', verifyToken, validateSaleId, saleController.getSaleById);

// ========================================
// RUTAS DE PDF
// ========================================

/**
 * GET /api/sales/:id/pdf
 * Descargar boleta en PDF
 * Requiere: Autenticación
 */
router.get('/:id/pdf', verifyToken, validateSaleId, pdfController.generateSaleReceipt);

/**
 * GET /api/sales/:id/pdf/view
 * Ver boleta en el navegador
 * Requiere: Autenticación
 */
router.get('/:id/pdf/view', verifyToken, validateSaleId, pdfController.viewSaleReceipt);

/**
 * POST /api/sales/report/pdf
 * Generar reporte de ventas en PDF
 * Body: { start?: '2025-01-01', end?: '2025-01-31' }
 * Requiere: Autenticación
 */
router.post('/report/pdf', verifyToken, pdfController.generateSalesReport);

// ========================================
// RUTAS DE CREACIÓN
// ========================================

/**
 * POST /api/sales/preview
 * Preview de venta (calcular sin guardar)
 * Body: { items: [{id_producto, cantidad, precio_especial?}] }
 * Requiere: Autenticación
 */
router.post('/preview', verifyToken, validateCreateSale, saleController.previewSale);

/**
 * POST /api/sales
 * Crear nueva venta
 * Body: { 
 *   items: [{id_producto, cantidad, precio_especial?}],
 *   observaciones?: string 
 * }
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.post('/', verifyToken, requireAdminOrCajero, validateCreateSale, saleController.createSale);

// ========================================
// RUTAS DE ELIMINACIÓN
// ========================================

/**
 * DELETE /api/sales/:id
 * Cancelar venta y restaurar stock
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.delete('/:id', verifyToken, requireAdminOrCajero, validateSaleId, saleController.cancelSale);

module.exports = router;