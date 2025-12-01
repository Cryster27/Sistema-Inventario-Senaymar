/**
 * database.js
 * Configuración de conexión a MySQL usando mysql2/promise
 */

const mysql = require('mysql2/promise');

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'merceria_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Función para probar la conexión
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('🔌 Probando conexión a MySQL...');
    await connection.query('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error.message);
    throw error;
  }
};

/**
 * Función para ejecutar queries con manejo de errores
 */
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    console.error('   SQL:', sql);
    throw error;
  }
};

/**
 * Función para transacciones
 */
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};