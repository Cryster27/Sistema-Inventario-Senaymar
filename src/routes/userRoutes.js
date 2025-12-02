/**
 * userRoutes.js
 * Rutas de gestión de usuarios (solo admin)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { body, param } = require('express-validator');

// Aplicar autenticación y verificación de admin a todas las rutas
router.use(verifyToken, requireAdmin);

// Validaciones
const validateCreateUser = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('nombre_completo')
    .trim()
    .notEmpty().withMessage('El nombre completo es obligatorio')
    .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido'),
  
  body('rol')
    .optional()
    .isIn(['admin', 'cajero', 'vendedor']).withMessage('Rol inválido')
];

const validateUpdateUser = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido')
    .toInt(),
  
  body('nombre_completo')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido'),
  
  body('rol')
    .optional()
    .isIn(['admin', 'cajero', 'vendedor']).withMessage('Rol inválido'),
  
  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser true o false')
    .toBoolean()
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido')
    .toInt()
];

/**
 * GET /api/users
 * Obtener todos los usuarios
 */
router.get('/', userController.getAllUsers);

/**
 * GET /api/users/:id
 * Obtener un usuario específico
 */
router.get('/:id', validateUserId, userController.getUserById);

/**
 * POST /api/users
 * Crear nuevo usuario
 * Body: { username, password, nombre_completo, email?, rol? }
 */
router.post('/', validateCreateUser, userController.createUser);

/**
 * PUT /api/users/:id
 * Actualizar usuario
 * Body: { nombre_completo?, email?, rol?, activo? }
 */
router.put('/:id', validateUpdateUser, userController.updateUser);

/**
 * PUT /api/users/:id/password
 * Restablecer contraseña de un usuario (admin)
 * Body: { newPassword }
 */
router.put('/:id/password', validateUserId, userController.resetPassword);

/**
 * DELETE /api/users/:id
 * Desactivar usuario
 */
router.delete('/:id', validateUserId, userController.deactivateUser);

module.exports = router;