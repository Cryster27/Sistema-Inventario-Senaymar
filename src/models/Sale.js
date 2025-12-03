/**
 * Sale.js
 * Modelo para gestión de ventas
 */

const { query } = require('../config/database');

class Sale {
  /**
   * Obtener todas las ventas
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Desplazamiento
   */
  static async findAll(limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM sales 
      ORDER BY fecha DESC 
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [limit, offset]);
  }

  /**
   * Buscar venta por ID
   * @param {number} id - ID de la venta
   */
  static async findById(id) {
    const sql = 'SELECT * FROM sales WHERE id = ?';
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    // Asegurar que el total sea un número
    const sale = results[0];
    return {
      ...sale,
      total: parseFloat(sale.total)
    };
  }

  /**
   * Obtener ventas por rango de fechas
   * @param {Date} fechaInicio - Fecha inicial
   * @param {Date} fechaFin - Fecha final
   */
  static async findByDateRange(fechaInicio, fechaFin) {
    const sql = `
      SELECT * FROM sales 
      WHERE fecha BETWEEN ? AND ? 
      ORDER BY fecha DESC
    `;
    return await query(sql, [fechaInicio, fechaFin]);
  }

  /**
   * Obtener ventas del día
   */
  static async findToday() {
    const sql = `
      SELECT * FROM sales 
      WHERE DATE(fecha) = CURDATE() 
      ORDER BY fecha DESC
    `;
    return await query(sql);
  }

  /**
   * Crear nueva venta
   * @param {object} saleData - Datos de la venta
   */
  static async create(saleData) {
    const { total, observaciones } = saleData;
    
    const sql = `
      INSERT INTO sales (total, observaciones)
      VALUES (?, ?)
    `;
    
    const result = await query(sql, [total, observaciones || null]);

    return {
      id: result.insertId,
      fecha: new Date(),
      total,
      observaciones
    };
  }

  /**
   * Obtener estadísticas de ventas
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos,
        AVG(total) as promedio_venta,
        MAX(total) as venta_maxima,
        MIN(total) as venta_minima
      FROM sales
    `;
    const results = await query(sql);
    return results[0];
  }

  /**
   * Obtener estadísticas del día
   */
  static async getTodayStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos,
        AVG(total) as promedio_venta
      FROM sales
      WHERE DATE(fecha) = CURDATE()
    `;
    const results = await query(sql);
    return results[0];
  }

  /**
   * Obtener estadísticas del mes
   */
  static async getMonthStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos,
        AVG(total) as promedio_venta
      FROM sales
      WHERE YEAR(fecha) = YEAR(CURDATE()) 
      AND MONTH(fecha) = MONTH(CURDATE())
    `;
    const results = await query(sql);
    return results[0];
  }

  /**
   * Eliminar venta (solo si no tiene detalles o por necesidad)
   * @param {number} id - ID de la venta
   */
  static async delete(id) {
    const sql = 'DELETE FROM sales WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = Sale;