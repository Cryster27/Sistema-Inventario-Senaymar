/**
 * authController.js
 * Controlador de autenticación
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Buscar usuario
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario está activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await User.updateLastAccess(user.id);

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nombre_completo: user.nombre_completo,
          email: user.email,
          rol: user.rol
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña del usuario autenticado
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Obtener usuario con contraseña
    const user = await User.findByUsername(req.user.username);

    // Verificar contraseña actual
    const isValidPassword = await User.verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Cambiar contraseña
    await User.changePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar si el token es válido
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
};

module.exports = {
  login,
  getProfile,
  changePassword,
  verifyToken
};