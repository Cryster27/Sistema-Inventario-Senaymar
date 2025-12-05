/**
 * saleRoutes.js
 * Rutas para el módulo de ventas - CON SOPORTE DE TOKEN EN QUERY
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const pdfController = require('../controllers/pdfController');
const { verifyToken, requireAdminOrCajero } = require('../middlewares/auth');
const { body, param, query } = require('express-validator');

// ========================================
// MIDDLEWARE ESPECIAL PARA PDF
// ========================================

/**
 * Middleware que permite autenticación por token en query parameter
 * Útil para abrir PDFs en nueva ventana
 */
const verifyTokenOrQuery = async (req, res, next) => {
  // Primero intentar con el header Authorization (normal)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  
  // Si no hay header, buscar token en query
  const queryToken = req.query.token;
  
  if (queryToken) {
    // Agregar el token al header temporalmente
    req.headers.authorization = `Bearer ${queryToken}`;
    return verifyToken(req, res, next);
  }
  
  // Si no hay ni header ni query, error
  return res.status(401).json({
    success: false,
    error: 'Token no proporcionado'
  });
};

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
 */
router.get('/', verifyToken, saleController.getAllSales);

/**
 * GET /api/sales/stats
 * Obtener estadísticas generales de ventas
 */
router.get('/stats', verifyToken, saleController.getStats);

/**
 * GET /api/sales/today
 * Obtener ventas del día actual
 */
router.get('/today', verifyToken, saleController.getTodaySales);

/**
 * GET /api/sales/top-products
 * Obtener productos más vendidos
 */
router.get('/top-products', verifyToken, saleController.getTopProducts);

/**
 * GET /api/sales/range
 * Obtener ventas por rango de fechas
 */
router.get('/range', verifyToken, saleController.getSalesByDateRange);

/**
 * GET /api/sales/:id
 * Obtener una venta específica con sus detalles
 */
router.get('/:id', verifyToken, validateSaleId, saleController.getSaleById);

// ========================================
// RUTAS DE PDF - CON TOKEN EN QUERY
// ========================================

/**
 * GET /api/sales/:id/pdf
 * Descargar boleta en PDF
 * Acepta token en header O en query parameter (?token=...)
 */
router.get('/:id/pdf', verifyTokenOrQuery, validateSaleId, pdfController.generateSaleReceipt);

/**
 * GET /api/sales/:id/pdf/view
 * Ver boleta en el navegador
 * Acepta token en header O en query parameter
 */
router.get('/:id/pdf/view', verifyTokenOrQuery, validateSaleId, pdfController.viewSaleReceipt);

/**
 * POST /api/sales/report/pdf
 * Generar reporte de ventas en PDF
 */
router.post('/report/pdf', verifyToken, pdfController.generateSalesReport);

// ========================================
// RUTAS DE CREACIÓN
// ========================================

/**
 * POST /api/sales/preview
 * Preview de venta (calcular sin guardar)
 */
router.post('/preview', verifyToken, validateCreateSale, saleController.previewSale);

/**
 * POST /api/sales
 * Crear nueva venta
 */
router.post('/', verifyToken, requireAdminOrCajero, validateCreateSale, saleController.createSale);

// ========================================
// RUTAS DE ELIMINACIÓN
// ========================================

/**
 * DELETE /api/sales/:id
 * Cancelar venta y restaurar stock
 */
router.delete('/:id', verifyToken, requireAdminOrCajero, validateSaleId, saleController.cancelSale);

module.exports = router;