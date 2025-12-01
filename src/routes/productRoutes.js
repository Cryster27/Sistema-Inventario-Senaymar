/**
 * productRoutes.js
 * Rutas para el módulo de productos
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
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
 */
router.get('/', productController.getAllProducts);

/**
 * GET /api/products/low-stock
 * Obtener productos con stock bajo
 * Query params: ?min=10 (opcional, default: 10)
 * IMPORTANTE: Esta ruta debe ir ANTES de /api/products/:id
 */
router.get('/low-stock', validateLowStock, productController.getLowStock);

/**
 * GET /api/products/search
 * Buscar productos por nombre
 * Query params: ?q=texto
 */
router.get('/search', validateSearch, productController.searchProducts);

/**
 * GET /api/products/codigo/:codigo
 * Obtener producto por código
 */
router.get('/codigo/:codigo', validateCodigo, productController.getProductByCodigo);

/**
 * GET /api/products/:id
 * Obtener producto por ID
 */
router.get('/:id', validateId, productController.getProductById);

// ========================================
// RUTAS DE MODIFICACIÓN
// ========================================

/**
 * POST /api/products
 * Crear nuevo producto
 * Body: { codigo, nombre, unidad, stock?, precio, descripcion? }
 */
router.post('/', validateCreateProduct, productController.createProduct);

/**
 * PUT /api/products/:id
 * Actualizar producto completo
 * Body: { nombre, unidad, stock, precio, descripcion?, activo? }
 */
router.put('/:id', validateUpdateProduct, productController.updateProduct);

/**
 * PATCH /api/products/:id/stock
 * Actualizar solo el stock de un producto
 * Body: { cantidad, motivo? }
 * Ejemplo: { cantidad: -5.5, motivo: "Venta" } para restar 5.5 unidades
 * Ejemplo: { cantidad: 10, motivo: "Reabastecimiento" } para sumar 10 unidades
 */
router.patch('/:id/stock', validateUpdateStock, productController.updateStock);

/**
 * DELETE /api/products/:id
 * Eliminar producto (soft delete por defecto)
 * Query params: ?permanent=true (para eliminación permanente)
 */
router.delete('/:id', validateId, productController.deleteProduct);

module.exports = router;