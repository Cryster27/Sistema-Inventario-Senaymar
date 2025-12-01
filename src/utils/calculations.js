/**
 * calculations.js
 * Funciones utilitarias para cálculos de venta
 */

/**
 * Calcular subtotal de un item
 * @param {number} cantidad - Cantidad del producto
 * @param {number} precioUnitario - Precio por unidad
 * @returns {number} - Subtotal redondeado a 2 decimales
 */
const calculateSubtotal = (cantidad, precioUnitario) => {
  const subtotal = cantidad * precioUnitario;
  return Math.round(subtotal * 100) / 100;
};

/**
 * Calcular total de una venta
 * @param {Array} items - Array de items con cantidad y precio_unitario
 * @returns {number} - Total redondeado a 2 decimales
 */
const calculateTotal = (items) => {
  const total = items.reduce((sum, item) => {
    const precio = item.precio_unitario || item.precio_especial || 0;
    return sum + (item.cantidad * precio);
  }, 0);
  
  return Math.round(total * 100) / 100;
};

/**
 * Calcular descuento
 * @param {number} subtotal - Subtotal del item
 * @param {number} porcentajeDescuento - Porcentaje de descuento (0-100)
 * @returns {number} - Monto de descuento
 */
const calculateDiscount = (subtotal, porcentajeDescuento) => {
  if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
    throw new Error('Porcentaje de descuento inválido (debe estar entre 0 y 100)');
  }
  
  const descuento = subtotal * (porcentajeDescuento / 100);
  return Math.round(descuento * 100) / 100;
};

/**
 * Aplicar descuento a un subtotal
 * @param {number} subtotal - Subtotal del item
 * @param {number} porcentajeDescuento - Porcentaje de descuento
 * @returns {number} - Subtotal con descuento aplicado
 */
const applyDiscount = (subtotal, porcentajeDescuento) => {
  const descuento = calculateDiscount(subtotal, porcentajeDescuento);
  return Math.round((subtotal - descuento) * 100) / 100;
};

/**
 * Calcular IGV (impuesto)
 * @param {number} subtotal - Subtotal sin impuesto
 * @param {number} porcentajeIGV - Porcentaje de IGV (default 18%)
 * @returns {number} - Monto de IGV
 */
const calculateIGV = (subtotal, porcentajeIGV = 18) => {
  const igv = subtotal * (porcentajeIGV / 100);
  return Math.round(igv * 100) / 100;
};

/**
 * Formatear número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Símbolo de moneda (default 'S/')
 * @returns {string} - Cantidad formateada
 */
const formatCurrency = (amount, currency = 'S/') => {
  return `${currency} ${amount.toFixed(2)}`;
};

/**
 * Redondear a 2 decimales
 * @param {number} value - Valor a redondear
 * @returns {number} - Valor redondeado
 */
const roundToTwo = (value) => {
  return Math.round(value * 100) / 100;
};

/**
 * Calcular cambio
 * @param {number} total - Total de la venta
 * @param {number} montoPagado - Monto pagado por el cliente
 * @returns {number} - Cambio a devolver
 */
const calculateChange = (total, montoPagado) => {
  if (montoPagado < total) {
    throw new Error('El monto pagado es menor al total de la venta');
  }
  
  return roundToTwo(montoPagado - total);
};

module.exports = {
  calculateSubtotal,
  calculateTotal,
  calculateDiscount,
  applyDiscount,
  calculateIGV,
  formatCurrency,
  roundToTwo,
  calculateChange
};