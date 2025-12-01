/**
 * errorHandler.js
 * Middleware global para manejo de errores
 */

const errorHandler = (err, req, res, next) => {
  // Log del error en consola
  console.error('❌ Error capturado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error de MySQL
  if (err.code) {
    // Clave duplicada
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'El registro ya existe',
        details: 'Código de producto duplicado'
      });
    }

    // Violación de clave foránea
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        error: 'Referencia inválida',
        details: 'El producto o venta referenciado no existe'
      });
    }

    // Error de conexión
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Error de conexión a la base de datos',
        details: 'No se pudo conectar con MySQL'
      });
    }
  }

  // Error genérico del servidor
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;