/**
 * server.js
 * Punto de entrada principal de la aplicación
 */

require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏪 Tienda: ${process.env.NOMBRE_TIENDA}`);
      console.log('========================================');
      console.log('\n📋 Rutas disponibles:');
      console.log(`   GET  http://localhost:${PORT}/api/products`);
      console.log(`   POST http://localhost:${PORT}/api/products`);
      console.log(`   GET  http://localhost:${PORT}/api/sales`);
      console.log(`   POST http://localhost:${PORT}/api/sales`);
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

// Iniciar servidor
startServer();