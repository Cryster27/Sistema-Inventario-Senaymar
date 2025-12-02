/**
 * generateHash.js
 * Script para generar hashes de contraseñas
 */

const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Contraseña: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('---');
}

async function main() {
  console.log('Generando hashes de contraseñas...\n');
  
  await generateHash('admin123');
  await generateHash('cajero123');
  
  console.log('\nCopia estos hashes y actualiza tu base de datos.');
}

main();