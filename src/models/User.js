/**
 * User.js
 * Modelo para gestión de usuarios
 */

const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Buscar usuario por username
   * @param {string} username
   */
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const results = await query(sql, [username]);
    return results[0] || null;
  }

  /**
   * Buscar usuario por ID
   * @param {number} id
   */
  static async findById(id) {
    const sql = 'SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, fecha_creacion FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Obtener todos los usuarios (sin contraseñas)
   */
  static async findAll() {
    const sql = 'SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, fecha_creacion FROM users ORDER BY nombre_completo';
    return await query(sql);
  }

  /**
   * Crear nuevo usuario
   * @param {object} userData
   */
  static async create(userData) {
    const { username, password, nombre_completo, email, rol } = userData;
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = `
      INSERT INTO users (username, password, nombre_completo, email, rol)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      username,
      hashedPassword,
      nombre_completo,
      email || null,
      rol || 'cajero'
    ]);

    return {
      id: result.insertId,
      username,
      nombre_completo,
      email,
      rol
    };
  }

  /**
   * Actualizar usuario
   * @param {number} id
   * @param {object} userData
   */
  static async update(id, userData) {
    const { nombre_completo, email, rol, activo } = userData;
    
    const sql = `
      UPDATE users 
      SET nombre_completo = ?,
          email = ?,
          rol = ?,
          activo = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      nombre_completo,
      email || null,
      rol,
      activo !== undefined ? activo : true,
      id
    ]);

    return await this.findById(id);
  }

  /**
   * Cambiar contraseña
   * @param {number} id
   * @param {string} newPassword
   */
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    await query(sql, [hashedPassword, id]);
    
    return true;
  }

  /**
   * Verificar contraseña
   * @param {string} plainPassword
   * @param {string} hashedPassword
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Actualizar último acceso
   * @param {number} id
   */
  static async updateLastAccess(id) {
    const sql = 'UPDATE users SET ultimo_acceso = NOW() WHERE id = ?';
    await query(sql, [id]);
  }

  /**
   * Desactivar usuario
   * @param {number} id
   */
  static async deactivate(id) {
    const sql = 'UPDATE users SET activo = FALSE WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  /**
   * Eliminar usuario
   * @param {number} id
   */
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = User;