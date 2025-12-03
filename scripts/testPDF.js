/**
 * testPDF.js
 * Script para probar la generación de PDFs
 */

require('dotenv').config();
const PDFService = require('../src/services/pdfService');
const SaleService = require('../src/services/saleService');

async function testPDF() {
  try {
    console.log('🧪 Probando generación de PDF...\n');

    // Obtener la última venta
    const Sale = require('../src/models/Sale');
    const sales = await Sale.findAll(1, 0);
    
    if (sales.length === 0) {
      console.log('❌ No hay ventas en la base de datos');
      process.exit(1);
    }

    const lastSale = sales[0];
    console.log(`📋 Obteniendo venta #${lastSale.id}`);

    // Obtener detalles completos
    const saleWithDetails = await SaleService.getSaleWithDetails(lastSale.id);
    
    console.log('📝 Datos de la venta:');
    console.log(`   ID: ${saleWithDetails.id}`);
    console.log(`   Total: ${saleWithDetails.total}`);
    console.log(`   Items: ${saleWithDetails.items.length}`);
    console.log('');

    // Generar PDF
    console.log('🔨 Generando PDF...');
    const pdfPath = await PDFService.generateReceipt(saleWithDetails);
    
    console.log(`✅ PDF generado exitosamente!`);
    console.log(`📄 Ubicación: ${pdfPath}`);
    console.log('\n💡 Intenta abrir el archivo PDF para verificar que funciona correctamente.');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPDF();