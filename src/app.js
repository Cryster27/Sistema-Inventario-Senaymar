/**
 * app.js
 * Configuración principal de Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');

const app = express();

// ========================================
// MIDDLEWARES GLOBALES
// ========================================

// Seguridad - Configurar CSP para permitir recursos locales
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS - Permitir peticiones desde otros dominios
app.use(cors());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Parser de JSON
app.use(express.json());

// Parser de URL encoded
app.use(express.urlencoded({ extended: true }));

// Middleware para logging simple (opcional)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// RUTAS
// ========================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🏪 Sistema de Inventario y Ventas - Semaymar E.I.R.L.',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      sales: '/api/sales'
    }
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

// ========================================
// MANEJO DE ERRORES
// ========================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejador global de errores
app.use(errorHandler);

module.exports = app;