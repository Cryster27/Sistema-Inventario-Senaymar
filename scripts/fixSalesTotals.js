/**
 * fixSalesTotals.js
 * Script para corregir los totales de ventas existentes
 */

require('dotenv').config();
const { query } = require('../src/config/database');

async function fixSalesTotals() {
  try {
    console.log('🔧 Corrigiendo totales de ventas...\n');

    // Obtener todas las ventas
    const sales = await query('SELECT id FROM sales');
    
    console.log(`📋 Encontradas ${sales.length} ventas\n`);

    for (const sale of sales) {
      // Calcular el total correcto desde los detalles
      const details = await query(
        'SELECT subtotal FROM sales_details WHERE id_sale = ?',
        [sale.id]
      );

      const total = details.reduce((sum, d) => sum + parseFloat(d.subtotal), 0);

      // Actualizar el total
      await query(
        'UPDATE sales SET total = ? WHERE id = ?',
        [total, sale.id]
      );

      console.log(`✅ Venta #${sale.id}: Total corregido a S/ ${total.toFixed(2)}`);
    }

    console.log('\n✅ Totales corregidos exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSalesTotals();