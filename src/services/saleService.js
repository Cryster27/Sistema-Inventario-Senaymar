/**
 * saleService.js
 * Servicio para lógica de negocio de ventas
 */

const { transaction } = require('../config/database');
const Sale = require('../models/Sale');
const SaleDetail = require('../models/SaleDetail');
const Product = require('../models/Product');
const InventoryService = require('./inventoryService');
const { calculateSubtotal, calculateTotal } = require('../utils/calculations');

class SaleService {
  /**
   * Procesar una venta completa (con transacción)
   * @param {Object} saleData - Datos de la venta
   * @param {number} userId - ID del usuario que registra la venta
   * @returns {Object} - Venta procesada
   */
  static async processSale(saleData, userId = null) {
    const { items, observaciones } = saleData;

    // Validar que hay items
    if (!items || items.length === 0) {
      throw new Error('La venta debe contener al menos un producto');
    }

    // Validar stock disponible
    const stockValidation = await InventoryService.validateStock(items);
    if (!stockValidation.valid) {
      const error = new Error('Stock insuficiente para algunos productos');
      error.stockErrors = stockValidation.errors;
      throw error;
    }

    // Calcular total de la venta - CORREGIDO
    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.id_producto);
      const precioUnitario = item.precio_especial || product.precio;
      const subtotal = calculateSubtotal(item.cantidad, precioUnitario);
      total += subtotal;
    }
    
    console.log('Total calculado:', total); // Debug

    // Procesar venta en transacción
    const result = await transaction(async (connection) => {
      // 1. Crear la venta
      const saleResult = await connection.execute(
        'INSERT INTO sales (total, observaciones, id_usuario) VALUES (?, ?, ?)',
        [total, observaciones || null, userId]
      );

      const saleId = saleResult[0].insertId;

      // 2. Crear detalles de venta
      const detailsPromises = items.map(async (item) => {
        const product = await Product.findById(item.id_producto);
        
        // Determinar precio (especial o normal)
        const precioUnitario = item.precio_especial || product.precio;
        const subtotal = calculateSubtotal(item.cantidad, precioUnitario);

        return connection.execute(
          `INSERT INTO sales_details 
           (id_sale, id_producto, cantidad, precio_unitario, subtotal, precio_especial)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.id_producto,
            item.cantidad,
            precioUnitario,
            subtotal,
            item.precio_especial ? true : false
          ]
        );
      });

      await Promise.all(detailsPromises);

      // 3. Descontar stock
      const stockPromises = items.map((item) => 
        connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.cantidad, item.id_producto]
        )
      );

      await Promise.all(stockPromises);

      return saleId;
    });

    // Obtener la venta completa
    const sale = await this.getSaleWithDetails(result);
    return sale;
  }

  /**
   * Obtener venta con sus detalles
   * @param {number} saleId - ID de la venta
   */
  static async getSaleWithDetails(saleId) {
    const sale = await Sale.findById(saleId);
    
    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    const details = await SaleDetail.findBySaleId(saleId);

    return {
      ...sale,
      items: details
    };
  }

  /**
   * Validar carrito antes de procesar venta
   * @param {Array} items - Items del carrito
   */
  static async validateCart(items) {
    const errors = [];

    // Validar que hay items
    if (!items || items.length === 0) {
      errors.push({ general: 'El carrito está vacío' });
      return { valid: false, errors };
    }

    // Validar cada item
    for (const item of items) {
      // Validar estructura
      if (!item.id_producto || !item.cantidad) {
        errors.push({
          item,
          error: 'Item inválido: falta id_producto o cantidad'
        });
        continue;
      }

      // Validar cantidad positiva
      if (item.cantidad <= 0) {
        errors.push({
          id_producto: item.id_producto,
          error: 'La cantidad debe ser mayor a 0'
        });
        continue;
      }

      // Validar que el producto existe
      const product = await Product.findById(item.id_producto);
      if (!product) {
        errors.push({
          id_producto: item.id_producto,
          error: 'Producto no encontrado'
        });
        continue;
      }

      // Validar precio especial si existe
      if (item.precio_especial !== undefined) {
        if (item.precio_especial <= 0) {
          errors.push({
            id_producto: item.id_producto,
            codigo: product.codigo,
            error: 'El precio especial debe ser mayor a 0'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcular preview de venta (sin guardar)
   * @param {Array} items - Items del carrito
   */
  static async previewSale(items) {
    const validation = await this.validateCart(items);
    
    if (!validation.valid) {
      throw new Error('Carrito inválido');
    }

    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.id_producto);
        const precioUnitario = item.precio_especial || product.precio;
        const subtotal = calculateSubtotal(item.cantidad, precioUnitario);

        return {
          id_producto: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          unidad: product.unidad,
          cantidad: item.cantidad,
          precio_unitario: precioUnitario,
          precio_original: product.precio,
          precio_especial: item.precio_especial ? true : false,
          subtotal
        };
      })
    );

    const total = calculateTotal(items.map((item, index) => ({
      cantidad: item.cantidad,
      precio_unitario: itemsWithDetails[index].precio_unitario
    })));

    return {
      items: itemsWithDetails,
      total,
      cantidad_productos: items.length,
      cantidad_items: items.reduce((sum, item) => sum + item.cantidad, 0)
    };
  }

  /**
   * Cancelar venta (restaurar stock)
   * @param {number} saleId - ID de la venta
   */
  static async cancelSale(saleId) {
    const sale = await Sale.findById(saleId);
    
    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    const details = await SaleDetail.findBySaleId(saleId);

    // Restaurar stock
    const items = details.map(d => ({
      id_producto: d.id_producto,
      cantidad: d.cantidad
    }));

    await InventoryService.restoreStock(items);

    // Eliminar venta
    await Sale.delete(saleId);

    return true;
  }
}

module.exports = SaleService;