/**
 * unitConverter.js
 * Utilidades para conversión de unidades de medida
 */

/**
 * Convertir centímetros a metros
 * @param {number} centimetros
 * @returns {number} - Metros
 */
const cmToMeters = (centimetros) => {
  return centimetros / 100;
};

/**
 * Convertir metros a centímetros
 * @param {number} metros
 * @returns {number} - Centímetros
 */
const metersToCm = (metros) => {
  return metros * 100;
};

/**
 * Convertir docenas a unidades
 * @param {number} docenas
 * @returns {number} - Unidades
 */
const dozenToUnits = (docenas) => {
  return docenas * 12;
};

/**
 * Convertir unidades a docenas
 * @param {number} unidades
 * @returns {number} - Docenas
 */
const unitsToDozen = (unidades) => {
  return unidades / 12;
};

/**
 * Normalizar cantidad según unidad base
 * @param {number} cantidad
 * @param {string} unidad - metro, centimetro, unidad, docena
 * @returns {number} - Cantidad normalizada
 */
const normalizeQuantity = (cantidad, unidad) => {
  switch (unidad) {
    case 'centimetro':
      return cmToMeters(cantidad);
    case 'docena':
      return dozenToUnits(cantidad);
    case 'metro':
    case 'unidad':
    case 'otro':
    default:
      return cantidad;
  }
};

/**
 * Formatear cantidad con su unidad
 * @param {number} cantidad
 * @param {string} unidad
 * @returns {string}
 */
const formatQuantityWithUnit = (cantidad, unidad) => {
  const unidadSingular = {
    metro: 'm',
    centimetro: 'cm',
    unidad: cantidad === 1 ? 'unidad' : 'unidades',
    docena: cantidad === 1 ? 'docena' : 'docenas',
    otro: ''
  };

  return `${cantidad} ${unidadSingular[unidad] || unidad}`;
};

/**
 * Validar si la cantidad es válida según la unidad
 * @param {number} cantidad
 * @param {string} unidad
 * @returns {Object} - {valid: boolean, message: string}
 */
const validateQuantityForUnit = (cantidad, unidad) => {
  // Cantidad debe ser positiva
  if (cantidad <= 0) {
    return {
      valid: false,
      message: 'La cantidad debe ser mayor a 0'
    };
  }

  // Para unidades y docenas, debe ser entero
  if ((unidad === 'unidad' || unidad === 'docena') && !Number.isInteger(cantidad)) {
    return {
      valid: false,
      message: `Para ${unidad}s, la cantidad debe ser un número entero`
    };
  }

  // Para metros y centímetros, permitir decimales
  if ((unidad === 'metro' || unidad === 'centimetro') && cantidad < 0.001) {
    return {
      valid: false,
      message: 'La cantidad es demasiado pequeña'
    };
  }

  return {
    valid: true,
    message: 'Cantidad válida'
  };
};

/**
 * Redondear cantidad según tipo de unidad
 * @param {number} cantidad
 * @param {string} unidad
 * @returns {number}
 */
const roundQuantity = (cantidad, unidad) => {
  if (unidad === 'unidad' || unidad === 'docena') {
    return Math.round(cantidad);
  }
  
  // Para metros y centímetros, redondear a 3 decimales
  return Math.round(cantidad * 1000) / 1000;
};

module.exports = {
  cmToMeters,
  metersToCm,
  dozenToUnits,
  unitsToDozen,
  normalizeQuantity,
  formatQuantityWithUnit,
  validateQuantityForUnit,
  roundQuantity
};