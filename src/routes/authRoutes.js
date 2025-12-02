/**
 * authRoutes.js
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { body } = require('express-validator');

// Validaciones
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),
  
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

/**
 * POST /api/auth/login
 * Login de usuario
 * Body: { username, password }
 */
router.post('/login', validateLogin, authController.login);

/**
 * GET /api/auth/verify
 * Verificar si el token es válido
 * Requiere: Token JWT en header Authorization
 */
router.get('/verify', verifyToken, authController.verifyToken);

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 * Requiere: Token JWT
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 * Body: { currentPassword, newPassword }
 * Requiere: Token JWT
 */
router.put('/change-password', verifyToken, validateChangePassword, authController.changePassword);

module.exports = router;