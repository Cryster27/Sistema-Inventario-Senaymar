/**
 * auth.js
 * Middleware de autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verificar token JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Agregar usuario al request
    req.user = {
      id: user.id,
      username: user.username,
      nombre_completo: user.nombre_completo,
      rol: user.rol
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    next(error);
  }
};

/**
 * Verificar rol de usuario
 * @param {Array} roles - Roles permitidos
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción',
        rol_requerido: roles,
        tu_rol: req.user.rol
      });
    }

    next();
  };
};

/**
 * Verificar que es admin
 */
const requireAdmin = requireRole('admin');

/**
 * Verificar que es admin o cajero
 */
const requireAdminOrCajero = requireRole('admin', 'cajero');

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireAdminOrCajero
};