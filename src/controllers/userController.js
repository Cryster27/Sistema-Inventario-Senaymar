/**
 * userController.js
 * Controlador de gestión de usuarios (solo admin)
 */

const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Obtener todos los usuarios
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario por ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

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
 * Crear nuevo usuario
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password, nombre_completo, email, rol } = req.body;

    // Verificar que el username no existe
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Crear usuario
    const newUser = await User.create({
      username,
      password,
      nombre_completo,
      email,
      rol
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, activo } = req.body;

    // Verificar que el usuario existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // No permitir que el usuario se desactive a sí mismo
    if (parseInt(id) === req.user.id && activo === false) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Actualizar usuario
    const updatedUser = await User.update(id, {
      nombre_completo: nombre_completo || existingUser.nombre_completo,
      email: email !== undefined ? email : existingUser.email,
      rol: rol || existingUser.rol,
      activo: activo !== undefined ? activo : existingUser.activo
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña de un usuario (admin)
 * PUT /api/users/:id/password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    await User.changePassword(id, newPassword);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Desactivar usuario
 * DELETE /api/users/:id
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // No permitir que el usuario se desactive a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    await User.deactivate(id);

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deactivateUser
};