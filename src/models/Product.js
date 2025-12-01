/**
 * Product.js
 * Modelo para gestión de productos
 */

const { query } = require('../config/database');

class Product {
  /**
   * Obtener todos los productos
   * @param {boolean} onlyActive - Solo productos activos
   */
  static async findAll(onlyActive = true) {
    const sql = onlyActive
      ? 'SELECT * FROM products WHERE activo = TRUE ORDER BY nombre'
      : 'SELECT * FROM products ORDER BY nombre';
    
    return await query(sql);
  }

  /**
   * Buscar producto por ID
   * @param {number} id - ID del producto
   */
  static async findById(id) {
    const sql = 'SELECT * FROM products WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Buscar producto por código
   * @param {string} codigo - Código del producto
   */
  static async findByCodigo(codigo) {
    const sql = 'SELECT * FROM products WHERE codigo = ?';
    const results = await query(sql, [codigo]);
    return results[0] || null;
  }

  /**
   * Buscar productos por nombre (búsqueda parcial)
   * @param {string} nombre - Texto a buscar
   */
  static async searchByName(nombre) {
    const sql = 'SELECT * FROM products WHERE nombre LIKE ? AND activo = TRUE ORDER BY nombre';
    return await query(sql, [`%${nombre}%`]);
  }

  /**
   * Crear nuevo producto
   * @param {object} productData - Datos del producto
   */
  static async create(productData) {
    const { codigo, nombre, unidad, stock, precio, descripcion } = productData;
    
    const sql = `
      INSERT INTO products (codigo, nombre, unidad, stock, precio, descripcion)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      codigo,
      nombre,
      unidad,
      stock || 0,
      precio,
      descripcion || null
    ]);

    return {
      id: result.insertId,
      ...productData
    };
  }

  /**
   * Actualizar producto
   * @param {number} id - ID del producto
   * @param {object} productData - Datos a actualizar
   */
  static async update(id, productData) {
    const { nombre, unidad, stock, precio, descripcion, activo } = productData;
    
    const sql = `
      UPDATE products 
      SET nombre = ?,
          unidad = ?,
          stock = ?,
          precio = ?,
          descripcion = ?,
          activo = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      nombre,
      unidad,
      stock,
      precio,
      descripcion || null,
      activo !== undefined ? activo : true,
      id
    ]);

    return await this.findById(id);
  }

  /**
   * Eliminar producto (soft delete)
   * @param {number} id - ID del producto
   */
  static async delete(id) {
    const sql = 'UPDATE products SET activo = FALSE WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  /**
   * Eliminar producto permanentemente
   * @param {number} id - ID del producto
   */
  static async hardDelete(id) {
    const sql = 'DELETE FROM products WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  /**
   * Actualizar stock de un producto
   * @param {number} id - ID del producto
   * @param {number} cantidad - Cantidad a sumar/restar (negativo para restar)
   */
  static async updateStock(id, cantidad) {
    const sql = 'UPDATE products SET stock = stock + ? WHERE id = ?';
    await query(sql, [cantidad, id]);
    return await this.findById(id);
  }

  /**
   * Verificar si hay stock suficiente
   * @param {number} id - ID del producto
   * @param {number} cantidadRequerida - Cantidad que se necesita
   */
  static async hasStock(id, cantidadRequerida) {
    const product = await this.findById(id);
    if (!product) return false;
    return product.stock >= cantidadRequerida;
  }

  /**
   * Obtener productos con stock bajo
   * @param {number} minStock - Stock mínimo considerado bajo
   */
  static async getLowStock(minStock = 10) {
    const sql = `
      SELECT * FROM products 
      WHERE stock <= ? AND activo = TRUE 
      ORDER BY stock ASC
    `;
    return await query(sql, [minStock]);
  }

  /**
   * Validar código único antes de crear/actualizar
   * @param {string} codigo - Código a validar
   * @param {number} excludeId - ID a excluir (para updates)
   */
  static async isCodigoUnique(codigo, excludeId = null) {
    let sql = 'SELECT id FROM products WHERE codigo = ?';
    const params = [codigo];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await query(sql, params);
    return results.length === 0;
  }
}

module.exports = Product;