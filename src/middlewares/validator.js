/**
 * validator.js
 * Middleware de validaciones usando express-validator
 */

const { body, param, query } = require('express-validator');

/**
 * Validaciones para crear producto
 */
const validateCreateProduct = [
  body('codigo')
    .trim()
    .notEmpty().withMessage('El código es obligatorio')
    .isLength({ max: 50 }).withMessage('El código no puede tener más de 50 caracteres'),
  
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 200 }).withMessage('El nombre no puede tener más de 200 caracteres'),
  
  body('unidad')
    .notEmpty().withMessage('La unidad es obligatoria')
    .isIn(['metro', 'centimetro', 'unidad', 'docena', 'otro'])
    .withMessage('Unidad inválida. Valores permitidos: metro, centimetro, unidad, docena, otro'),
  
  body('stock')
    .optional()
    .isFloat({ min: 0 }).withMessage('El stock debe ser un número mayor o igual a 0')
    .toFloat(),
  
  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede tener más de 1000 caracteres')
];

/**
 * Validaciones para actualizar producto
 */
const validateUpdateProduct = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido')
    .toInt(),
  
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 200 }).withMessage('El nombre no puede tener más de 200 caracteres'),
  
  body('unidad')
    .optional()
    .isIn(['metro', 'centimetro', 'unidad', 'docena', 'otro'])
    .withMessage('Unidad inválida'),
  
  body('stock')
    .optional()
    .isFloat({ min: 0 }).withMessage('El stock debe ser un número mayor o igual a 0')
    .toFloat(),
  
  body('precio')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0')
    .toFloat(),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede tener más de 1000 caracteres'),
  
  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser true o false')
    .toBoolean()
];

/**
 * Validación para ID en parámetros
 */
const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido')
    .toInt()
];

/**
 * Validación para código en parámetros
 */
const validateCodigo = [
  param('codigo')
    .trim()
    .notEmpty().withMessage('El código es obligatorio')
];

/**
 * Validación para búsqueda
 */
const validateSearch = [
  query('q')
    .trim()
    .notEmpty().withMessage('Debe proporcionar un término de búsqueda')
    .isLength({ min: 1, max: 100 }).withMessage('La búsqueda debe tener entre 1 y 100 caracteres')
];

/**
 * Validación para actualizar stock
 */
const validateUpdateStock = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido')
    .toInt(),
  
  body('cantidad')
    .notEmpty().withMessage('La cantidad es obligatoria')
    .isFloat().withMessage('La cantidad debe ser un número')
    .toFloat(),
  
  body('motivo')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('El motivo no puede tener más de 255 caracteres')
];

/**
 * Validación para stock bajo
 */
const validateLowStock = [
  query('min')
    .optional()
    .isFloat({ min: 0 }).withMessage('El mínimo debe ser un número mayor o igual a 0')
    .toFloat()
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateId,
  validateCodigo,
  validateSearch,
  validateUpdateStock,
  validateLowStock
};