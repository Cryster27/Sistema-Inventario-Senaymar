/**
 * config.js
 * Configuración global de la aplicación
 */

// URL de la API
const API_URL = 'http://localhost:3000/api';

// Nombre de la tienda
const STORE_NAME = 'Mercería Los Hilos';

// Configuración de paginación
const ITEMS_PER_PAGE = 20;

// Roles de usuario
const ROLES = {
  ADMIN: 'admin',
  CAJERO: 'cajero',
  VENDEDOR: 'vendedor'
};

// Unidades de medida
const UNIDADES = [
  { value: 'metro', label: 'Metro' },
  { value: 'centimetro', label: 'Centímetro' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'docena', label: 'Docena' },
  { value: 'otro', label: 'Otro' }
];

// Formatear moneda
function formatCurrency(amount) {
  return `S/ ${parseFloat(amount).toFixed(2)}`;
}

// Formatear fecha
function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatear cantidad con unidad
function formatQuantity(quantity, unit) {
  const unitLabels = {
    metro: 'm',
    centimetro: 'cm',
    unidad: quantity === 1 ? 'unidad' : 'unidades',
    docena: quantity === 1 ? 'docena' : 'docenas',
    otro: ''
  };
  
  return `${quantity} ${unitLabels[unit] || unit}`;
}

// Obtener usuario actual
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Verificar si tiene rol
function hasRole(role) {
  const user = getCurrentUser();
  return user && user.rol === role;
}

// Verificar si es admin
function isAdmin() {
  return hasRole(ROLES.ADMIN);
}

// Verificar si puede gestionar (admin o cajero)
function canManage() {
  const user = getCurrentUser();
  return user && (user.rol === ROLES.ADMIN || user.rol === ROLES.CAJERO);
}