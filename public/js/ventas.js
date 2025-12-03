/**
 * ventas.js
 * Lógica de historial de ventas
 */

let allSales = [];
let filteredSales = [];

// Cargar ventas
async function loadSales() {
  try {
    const response = await SaleAPI.getAll(500, 0); // Últimas 500 ventas
    allSales = response.data.reverse(); // Más recientes primero
    filteredSales = allSales;
    renderSales(filteredSales);
    updateStats(filteredSales);
  } catch (error) {
    console.error('Error cargando ventas:', error);
    showNotification('Error al cargar ventas', 'error');
  }
}

// Renderizar tabla
function renderSales(sales) {
  const container = document.getElementById('salesTable');
  
  if (sales.length === 0) { 
    container.innerHTML = '<p class="text-muted text-center">No se encontraron ventas</p>';
    return;
  }
  
  const html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Observaciones</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${sales.map(s => `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td>${formatDate(s.fecha)}</td>
            <td><strong>${formatCurrency(s.total)}</strong></td>
            <td>${s.observaciones || '-'}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-primary btn-sm" onclick="viewSaleDetail(${s.id})">👁️ Ver</button>
                <button class="btn btn-secondary btn-sm" onclick="downloadPDF(${s.id})">📄 PDF</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Actualizar estadísticas
function updateStats(sales) {
  const total = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const count = sales.length;
  const average = count > 0 ? total / count : 0;
  
  document.getElementById('totalVentas').textContent = count;
  document.getElementById('totalIngresos').textContent = formatCurrency(total);
  document.getElementById('promedioVenta').textContent = formatCurrency(average);
}

// Filtros por fecha
function applyFilters() {
  const fechaInicio = document.getElementById('filterFechaInicio').value;
  const fechaFin = document.getElementById('filterFechaFin').value;
  
  if (!fechaInicio || !fechaFin) {
    showNotification('Selecciona ambas fechas', 'error');
    return;
  }
  
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T23:59:59');
  
  filteredSales = allSales.filter(s => {
    const fecha = new Date(s.fecha);
    return fecha >= inicio && fecha <= fin;
  });
  
  renderSales(filteredSales);
  updateStats(filteredSales);
}

function showToday() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterFechaInicio').value = today;
  document.getElementById('filterFechaFin').value = today;
  applyFilters();
}

function showThisMonth() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  document.getElementById('filterFechaInicio').value = firstDay.toISOString().split('T')[0];
  document.getElementById('filterFechaFin').value = lastDay.toISOString().split('T')[0];
  applyFilters();
}

function clearFilters() {
  document.getElementById('filterFechaInicio').value = '';
  document.getElementById('filterFechaFin').value = '';
  filteredSales = allSales;
  renderSales(filteredSales);
  updateStats(filteredSales);
}

// Ver detalle de venta
async function viewSaleDetail(id) {
  try {
    const response = await SaleAPI.getById(id);
    const sale = response.data;
    
    document.getElementById('saleDetailTitle').textContent = `Venta #${sale.id}`;
    
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.codigo}</td>
        <td>${item.nombre}</td>
        <td>${formatQuantity(item.cantidad, item.unidad)}</td>
        <td>${formatCurrency(item.precio_unitario)}${item.precio_especial ? ' <span style="color: #f59e0b;">★</span>' : ''}</td>
        <td><strong>${formatCurrency(item.subtotal)}</strong></td>
      </tr>
    `).join('');
    
    const content = `
      <div class="detail-info">
        <p><strong>Fecha:</strong> ${formatDate(sale.fecha)}</p>
        ${sale.observaciones ? `<p><strong>Observaciones:</strong> ${sale.observaciones}</p>` : ''}
        <p><strong>Total:</strong> <span style="font-size: 20px; color: var(--primary-color);">${formatCurrency(sale.total)}</span></p>
      </div>
      
      <h3>Productos</h3>
      <table class="detail-table">
        <thead>
          <tr>
            <th>Código</th>
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
      
      <div class="detail-actions">
        <button class="btn btn-secondary" onclick="closeSaleDetailModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="downloadPDF(${sale.id})">📄 Descargar PDF</button>
      </div>
    `;
    
    document.getElementById('saleDetailContent').innerHTML = content;
    document.getElementById('saleDetailModal').classList.add('active');
    
  } catch (error) {
    console.error('Error cargando venta:', error);
    showNotification('Error al cargar detalle de venta', 'error');
  }
}

function closeSaleDetailModal() {
  const modal = document.getElementById('saleDetailModal');
  modal.classList.add('closing');
  
  setTimeout(() => {
    modal.classList.remove('active');
    modal.classList.remove('closing');
  }, 200);
}

function downloadPDF(id) {
  SaleAPI.downloadPDF(id);
  showNotification('Descargando boleta...', 'success');
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadSales();
  showToday(); // Mostrar ventas de hoy por defecto
});