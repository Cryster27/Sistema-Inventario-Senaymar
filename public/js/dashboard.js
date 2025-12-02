/**
 * dashboard.js
 * Lógica del dashboard principal
 */

// Cargar estadísticas
async function loadStats() {
  try {
    // Estadísticas de ventas
    const statsData = await SaleAPI.getStats();
    const stats = statsData.data;
    
    // Ventas de hoy
    document.getElementById('ventasHoy').textContent = formatCurrency(stats.hoy.total_ingresos || 0);
    document.getElementById('cantidadVentasHoy').textContent = `${stats.hoy.total_ventas || 0} ventas`;
    
    // Ventas del mes
    document.getElementById('ventasMes').textContent = formatCurrency(stats.mes_actual.total_ingresos || 0);
    document.getElementById('cantidadVentasMes').textContent = `${stats.mes_actual.total_ventas || 0} ventas`;
    
    // Total de productos
    const productsData = await ProductAPI.getAll();
    const products = productsData.data;
    document.getElementById('totalProductos').textContent = products.length;
    document.getElementById('productosActivos').textContent = `${products.filter(p => p.activo).length} activos`;
    
    // Stock bajo
    const lowStockData = await ProductAPI.getLowStock(10);
    const lowStock = lowStockData.data;
    document.getElementById('stockBajo').textContent = lowStock.length;
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    showNotification('Error al cargar estadísticas', 'error');
  }
}

// Cargar productos con stock bajo
async function loadLowStock() {
  try {
    const response = await ProductAPI.getLowStock(10);
    const products = response.data;
    
    const container = document.getElementById('lowStockList');
    
    if (products.length === 0) {
      container.innerHTML = '<p class="text-muted">✅ No hay productos con stock bajo</p>';
      return;
    }
    
    const html = `
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Unidad</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td><strong>${p.codigo}</strong></td>
              <td>${p.nombre}</td>
              <td><span class="badge badge-danger">${p.stock}</span></td>
              <td>${p.unidad}</td>
              <td>${formatCurrency(p.precio)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando stock bajo:', error);
    document.getElementById('lowStockList').innerHTML = 
      '<p class="text-muted">Error al cargar productos</p>';
  }
}

// Cargar productos más vendidos
async function loadTopProducts() {
  try {
    const response = await SaleAPI.getTopProducts(10);
    const products = response.data;
    
    const container = document.getElementById('topProductsList');
    
    if (products.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay datos de ventas aún</p>';
      return;
    }
    
    const html = `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad Vendida</th>
            <th>Veces Vendido</th>
            <th>Ingresos Totales</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td>
                <strong>${p.nombre}</strong><br>
                <small class="text-muted">${p.codigo}</small>
              </td>
              <td>${formatQuantity(p.cantidad_vendida, p.unidad)}</td>
              <td>${p.veces_vendido} ventas</td>
              <td><strong>${formatCurrency(p.total_ingresos)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando productos más vendidos:', error);
    document.getElementById('topProductsList').innerHTML = 
      '<p class="text-muted">Error al cargar productos</p>';
  }
}

// Cargar últimas ventas
async function loadRecentSales() {
  try {
    const response = await SaleAPI.getToday();
    const sales = response.data;
    
    const container = document.getElementById('recentSalesList');
    
    if (sales.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay ventas registradas hoy</p>';
      return;
    }
    
    // Mostrar solo las últimas 5
    const recentSales = sales.slice(0, 5);
    
    const html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${recentSales.map(s => `
            <tr>
              <td><strong>#${s.id}</strong></td>
              <td>${formatDate(s.fecha)}</td>
              <td><strong>${formatCurrency(s.total)}</strong></td>
              <td>
                <button class="btn-link" onclick="viewSale(${s.id})">Ver</button>
                <button class="btn-link" onclick="downloadPDF(${s.id})">PDF</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando ventas recientes:', error);
    document.getElementById('recentSalesList').innerHTML = 
      '<p class="text-muted">Error al cargar ventas</p>';
  }
}

// Ver detalle de venta
async function viewSale(id) {
  try {
    const response = await SaleAPI.getById(id);
    const sale = response.data;
    
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.nombre}</td>
        <td>${formatQuantity(item.cantidad, item.unidad)}</td>
        <td>${formatCurrency(item.precio_unitario)}</td>
        <td>${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('');
    
    const content = `
      <h3>Venta #${sale.id}</h3>
      <p><strong>Fecha:</strong> ${formatDate(sale.fecha)}</p>
      ${sale.observaciones ? `<p><strong>Observaciones:</strong> ${sale.observaciones}</p>` : ''}
      <table style="margin-top: 20px;">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <h3 style="margin-top: 20px; text-align: right;">Total: ${formatCurrency(sale.total)}</h3>
    `;
    
    showModal('Detalle de Venta', content);
    
  } catch (error) {
    console.error('Error cargando venta:', error);
    alert('Error al cargar la venta');
  }
}

// Descargar PDF
function downloadPDF(id) {
  SaleAPI.downloadPDF(id);
}

// Mostrar modal simple
function showModal(title, content) {
  // Crear modal si no existe
  let modal = document.getElementById('customModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>${title}</h2>
        <button onclick="closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
      </div>
      <div>${content}</div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Cerrar modal
function closeModal() {
  const modal = document.getElementById('customModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Recargar datos cada 30 segundos
function startAutoRefresh() {
  setInterval(() => {
    loadStats();
    loadRecentSales();
  }, 30000);
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  
  // Cargar todos los datos
  await loadStats();
  await loadLowStock();
  await loadTopProducts();
  await loadRecentSales();
  
  // Iniciar actualización automática
  startAutoRefresh();
});