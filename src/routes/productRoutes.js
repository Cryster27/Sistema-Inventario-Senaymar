/**
 * productRoutes.js
 * Rutas para el módulo de productos
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireAdminOrCajero } = require('../middlewares/auth');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateId,
  validateCodigo,
  validateSearch,
  validateUpdateStock,
  validateLowStock
} = require('../middlewares/validator');

// ========================================
// RUTAS DE CONSULTA
// ========================================

/**
 * GET /api/products
 * Obtener todos los productos
 * Query params: ?includeInactive=true (opcional)
 * Requiere: Autenticación
 */
router.get('/', verifyToken, productController.getAllProducts);

/**
 * GET /api/products/low-stock
 * Obtener productos con stock bajo
 * Query params: ?min=10 (opcional, default: 10)
 * IMPORTANTE: Esta ruta debe ir ANTES de /api/products/:id
 * Requiere: Autenticación
 */
router.get('/low-stock', verifyToken, validateLowStock, productController.getLowStock);

/**
 * GET /api/products/search
 * Buscar productos por nombre
 * Query params: ?q=texto
 * Requiere: Autenticación
 */
router.get('/search', verifyToken, validateSearch, productController.searchProducts);

/**
 * GET /api/products/codigo/:codigo
 * Obtener producto por código
 * Requiere: Autenticación
 */
router.get('/codigo/:codigo', verifyToken, validateCodigo, productController.getProductByCodigo);

/**
 * GET /api/products/:id
 * Obtener producto por ID
 * Requiere: Autenticación
 */
router.get('/:id', verifyToken, validateId, productController.getProductById);

// ========================================
// RUTAS DE MODIFICACIÓN
// ========================================

/**
 * POST /api/products
 * Crear nuevo producto
 * Body: { codigo, nombre, unidad, stock?, precio, descripcion? }
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.post('/', verifyToken, requireAdminOrCajero, validateCreateProduct, productController.createProduct);

/**
 * PUT /api/products/:id
 * Actualizar producto completo
 * Body: { nombre, unidad, stock, precio, descripcion?, activo? }
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.put('/:id', verifyToken, requireAdminOrCajero, validateUpdateProduct, productController.updateProduct);

/**
 * PATCH /api/products/:id/stock
 * Actualizar solo el stock de un producto
 * Body: { cantidad, motivo? }
 * Ejemplo: { cantidad: -5.5, motivo: "Venta" } para restar 5.5 unidades
 * Ejemplo: { cantidad: 10, motivo: "Reabastecimiento" } para sumar 10 unidades
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.patch('/:id/stock', verifyToken, requireAdminOrCajero, validateUpdateStock, productController.updateStock);

/**
 * DELETE /api/products/:id
 * Eliminar producto (soft delete por defecto)
 * Query params: ?permanent=true (para eliminación permanente)
 * Requiere: Autenticación + Rol Admin o Cajero
 */
router.delete('/:id', verifyToken, requireAdminOrCajero, validateId, productController.deleteProduct);

module.exports = router;