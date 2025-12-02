/**
 * productos.js
 * Lógica de gestión de productos
 */

let allProducts = [];
let editingProductId = null;

// Cargar productos
async function loadProducts() {
  try {
    const response = await ProductAPI.getAll(true);
    allProducts = response.data;
    renderProducts(allProducts);
    updateProductCount();
  } catch (error) {
    console.error('Error cargando productos:', error);
    showNotification('Error al cargar productos', 'error');
  }
}

// Renderizar tabla de productos
function renderProducts(products) {
  const container = document.getElementById('productsTable');
  
  if (products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No se encontraron productos</p>';
    return;
  }
  
  const html = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr ${!p.activo ? 'style="opacity: 0.5; background: #f9fafb;"' : ''}>
            <td><strong>${p.codigo}</strong></td>
            <td>${p.nombre}</td>
            <td>${p.unidad}</td>
            <td class="${getStockClass(p.stock)}">
              ${p.stock} ${p.unidad}
            </td>
            <td><strong>${formatCurrency(p.precio)}</strong></td>
            <td>
              ${p.activo 
                ? '<span class="badge badge-success">Activo</span>' 
                : '<span class="badge badge-danger">Inactivo</span>'}
            </td>
            <td>
              <div class="table-actions">
                <button class="btn btn-primary btn-sm" onclick="editProduct(${p.id})">✏️ Editar</button>
                <button class="btn btn-secondary btn-sm" onclick="showStockModal(${p.id})">📦 Stock</button>
                ${p.activo 
                  ? `<button class="btn btn-danger btn-sm" onclick="deactivateProduct(${p.id})">🚫 Desactivar</button>`
                  : `<button class="btn btn-success btn-sm" onclick="activateProduct(${p.id})">✅ Activar</button>`
                }
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Clase de color según stock
function getStockClass(stock) {
  if (stock === 0) return 'stock-danger';
  if (stock <= 10) return 'stock-warning';
  return 'stock-ok';
}

// Actualizar contador
function updateProductCount() {
  const active = allProducts.filter(p => p.activo).length;
  document.getElementById('totalProducts').textContent = `${allProducts.length} productos (${active} activos)`;
}

// Filtros
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterUnidad').addEventListener('change', applyFilters);
document.getElementById('filterStock').addEventListener('change', applyFilters);

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const unidad = document.getElementById('filterUnidad').value;
  const stock = document.getElementById('filterStock').value;
  
  let filtered = allProducts;
  
  // Filtrar por búsqueda
  if (search) {
    filtered = filtered.filter(p => 
      p.codigo.toLowerCase().includes(search) || 
      p.nombre.toLowerCase().includes(search)
    );
  }
  
  // Filtrar por unidad
  if (unidad) {
    filtered = filtered.filter(p => p.unidad === unidad);
  }
  
  // Filtrar por stock
  if (stock === 'bajo') {
    filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
  } else if (stock === 'disponible') {
    filtered = filtered.filter(p => p.stock > 0);
  } else if (stock === 'agotado') {
    filtered = filtered.filter(p => p.stock === 0);
  }
  
  renderProducts(filtered);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterUnidad').value = '';
  document.getElementById('filterStock').value = '';
  renderProducts(allProducts);
}

// Mostrar modal de crear
function showCreateModal() {
  editingProductId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Producto';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModal').classList.add('active');
}

// Mostrar modal de editar
async function editProduct(id) {
  try {
    const response = await ProductAPI.getById(id);
    const product = response.data;
    
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = product.id;
    document.getElementById('codigo').value = product.codigo;
    document.getElementById('codigo').disabled = true; // No permitir cambiar código
    document.getElementById('nombre').value = product.nombre;
    document.getElementById('unidad').value = product.unidad;
    document.getElementById('stock').value = product.stock;
    document.getElementById('precio').value = product.precio;
    document.getElementById('descripcion').value = product.descripcion || '';
    
    document.getElementById('productModal').classList.add('active');
  } catch (error) {
    console.error('Error cargando producto:', error);
    showNotification('Error al cargar producto', 'error');
  }
}

// Cerrar modal
function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  document.getElementById('codigo').disabled = false;
  editingProductId = null;
}

// Guardar producto
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btnSave = document.getElementById('btnSave');
  btnSave.disabled = true;
  btnSave.textContent = 'Guardando...';
  
  try {
    const productData = {
      codigo: document.getElementById('codigo').value,
      nombre: document.getElementById('nombre').value,
      unidad: document.getElementById('unidad').value,
      stock: parseFloat(document.getElementById('stock').value),
      precio: parseFloat(document.getElementById('precio').value),
      descripcion: document.getElementById('descripcion').value
    };
    
    if (editingProductId) {
      // Actualizar
      await ProductAPI.update(editingProductId, productData);
      showNotification('Producto actualizado exitosamente', 'success');
    } else {
      // Crear
      await ProductAPI.create(productData);
      showNotification('Producto creado exitosamente', 'success');
    }
    
    closeProductModal();
    loadProducts();
    
  } catch (error) {
    console.error('Error guardando producto:', error);
    showNotification(error.message || 'Error al guardar producto', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Guardar Producto';
  }
});

// Desactivar producto
async function deactivateProduct(id) {
  if (!confirm('¿Desactivar este producto?')) return;
  
  try {
    await ProductAPI.update(id, { activo: false });
    showNotification('Producto desactivado', 'success');
    loadProducts();
  } catch (error) {
    console.error('Error desactivando producto:', error);
    showNotification('Error al desactivar producto', 'error');
  }
}

// Activar producto
async function activateProduct(id) {
  try {
    await ProductAPI.update(id, { activo: true });
    showNotification('Producto activado', 'success');
    loadProducts();
  } catch (error) {
    console.error('Error activando producto:', error);
    showNotification('Error al activar producto', 'error');
  }
}

// Modal de ajuste de stock
async function showStockModal(id) {
  try {
    const response = await ProductAPI.getById(id);
    const product = response.data;
    
    document.getElementById('stockProductId').value = product.id;
    document.getElementById('stockProductInfo').innerHTML = `
      <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">
        <strong>${product.nombre}</strong><br>
        <small>Stock actual: ${product.stock} ${product.unidad}</small>
      </div>
    `;
    
    document.getElementById('stockForm').reset();
    document.getElementById('stockModal').classList.add('active');
    
  } catch (error) {
    console.error('Error cargando producto:', error);
    showNotification('Error al cargar producto', 'error');
  }
}

function closeStockModal() {
  document.getElementById('stockModal').classList.remove('active');
}

// Ajustar stock
document.getElementById('stockForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('stockProductId').value;
  const cantidad = parseFloat(document.getElementById('stockCantidad').value);
  const motivo = document.getElementById('stockMotivo').value;
  
  try {
    await fetch(`${API_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ cantidad, motivo })
    }).then(handleResponse);
    
    showNotification('Stock ajustado exitosamente', 'success');
    closeStockModal();
    loadProducts();
    
  } catch (error) {
    console.error('Error ajustando stock:', error);
    showNotification(error.message || 'Error al ajustar stock', 'error');
  }
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadProducts();
});