/**
 * SaleDetail.js
 * Modelo para gestión de detalles de venta
 */

const { query } = require('../config/database');

class SaleDetail {
  /**
   * Obtener todos los detalles de una venta
   * @param {number} idSale - ID de la venta
   */
  static async findBySaleId(idSale) {
    const sql = `
      SELECT 
        sd.*,
        p.codigo,
        p.nombre,
        p.unidad
      FROM sales_details sd
      INNER JOIN products p ON sd.id_producto = p.id
      WHERE sd.id_sale = ?
      ORDER BY sd.id
    `;
    const results = await query(sql, [idSale]);
    
    // Asegurar que los valores numéricos sean números
    return results.map(item => ({
      ...item,
      cantidad: parseFloat(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario),
      subtotal: parseFloat(item.subtotal),
      precio_especial: Boolean(item.precio_especial)
    }));
  }

  /**
   * Crear detalle de venta
   * @param {object} detailData - Datos del detalle
   */
  static async create(detailData) {
    const { 
      id_sale, 
      id_producto, 
      cantidad, 
      precio_unitario, 
      subtotal, 
      precio_especial 
    } = detailData;
    
    const sql = `
      INSERT INTO sales_details 
      (id_sale, id_producto, cantidad, precio_unitario, subtotal, precio_especial)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      id_sale,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal,
      precio_especial || false
    ]);

    return {
      id: result.insertId,
      ...detailData
    };
  }

  /**
   * Crear múltiples detalles de venta (batch)
   * @param {Array} details - Array de detalles
   */
  static async createBatch(details) {
    if (!details || details.length === 0) {
      throw new Error('No hay detalles para crear');
    }

    const sql = `
      INSERT INTO sales_details 
      (id_sale, id_producto, cantidad, precio_unitario, subtotal, precio_especial)
      VALUES ?
    `;

    const values = details.map(d => [
      d.id_sale,
      d.id_producto,
      d.cantidad,
      d.precio_unitario,
      d.subtotal,
      d.precio_especial || false
    ]);

    await query(sql, [values]);
    return true;
  }

  /**
   * Obtener productos más vendidos
   * @param {number} limit - Límite de resultados
   */
  static async getTopProducts(limit = 10) {
    const sql = `
      SELECT 
        p.id,
        p.codigo,
        p.nombre,
        p.unidad,
        SUM(sd.cantidad) as cantidad_vendida,
        COUNT(sd.id) as veces_vendido,
        SUM(sd.subtotal) as total_ingresos
      FROM sales_details sd
      INNER JOIN products p ON sd.id_producto = p.id
      GROUP BY p.id, p.codigo, p.nombre, p.unidad
      ORDER BY cantidad_vendida DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }

  /**
   * Obtener resumen de ventas por producto
   * @param {number} idProducto - ID del producto
   */
  static async getProductSummary(idProducto) {
    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(cantidad) as cantidad_total_vendida,
        SUM(subtotal) as ingresos_totales,
        AVG(precio_unitario) as precio_promedio
      FROM sales_details
      WHERE id_producto = ?
    `;
    const results = await query(sql, [idProducto]);
    return results[0];
  }

  /**
   * Eliminar detalles de una venta
   * @param {number} idSale - ID de la venta
   */
  static async deleteBySaleId(idSale) {
    const sql = 'DELETE FROM sales_details WHERE id_sale = ?';
    await query(sql, [idSale]);
    return true;
  }
}

module.exports = SaleDetail;