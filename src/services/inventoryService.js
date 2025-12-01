/**
 * inventoryService.js
 * Servicio para lógica de negocio del inventario
 */

const Product = require('../models/Product');

class InventoryService {
  /**
   * Validar disponibilidad de stock para múltiples productos
   * @param {Array} items - Array de {id_producto, cantidad}
   * @returns {Object} - {valid: boolean, errors: []}
   */
  static async validateStock(items) {
    const errors = [];

    for (const item of items) {
      const product = await Product.findById(item.id_producto);

      if (!product) {
        errors.push({
          id_producto: item.id_producto,
          error: 'Producto no encontrado'
        });
        continue;
      }

      if (!product.activo) {
        errors.push({
          id_producto: item.id_producto,
          codigo: product.codigo,
          nombre: product.nombre,
          error: 'Producto inactivo'
        });
        continue;
      }

      if (product.stock < item.cantidad) {
        errors.push({
          id_producto: item.id_producto,
          codigo: product.codigo,
          nombre: product.nombre,
          stock_disponible: product.stock,
          cantidad_requerida: item.cantidad,
          error: `Stock insuficiente. Disponible: ${product.stock}, Requerido: ${item.cantidad}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Descontar stock de múltiples productos (para venta)
   * @param {Array} items - Array de {id_producto, cantidad}
   */
  static async decreaseStock(items) {
    const results = [];

    for (const item of items) {
      const updated = await Product.updateStock(item.id_producto, -item.cantidad);
      results.push({
        id_producto: item.id_producto,
        cantidad_descontada: item.cantidad,
        stock_anterior: updated.stock + item.cantidad,
        stock_nuevo: updated.stock
      });
    }

    return results;
  }

  /**
   * Restaurar stock (en caso de cancelación o devolución)
   * @param {Array} items - Array de {id_producto, cantidad}
   */
  static async restoreStock(items) {
    const results = [];

    for (const item of items) {
      const updated = await Product.updateStock(item.id_producto, item.cantidad);
      results.push({
        id_producto: item.id_producto,
        cantidad_restaurada: item.cantidad,
        stock_nuevo: updated.stock
      });
    }

    return results;
  }

  /**
   * Verificar productos con stock bajo
   * @param {number} threshold - Umbral de stock bajo
   */
  static async checkLowStock(threshold = 10) {
    return await Product.getLowStock(threshold);
  }

  /**
   * Obtener información completa de productos para venta
   * @param {Array} productIds - Array de IDs de productos
   */
  static async getProductsInfo(productIds) {
    const products = [];

    for (const id of productIds) {
      const product = await Product.findById(id);
      if (product) {
        products.push(product);
      }
    }

    return products;
  }
}

module.exports = InventoryService;