/**
 * pos.js
 * Lógica del Punto de Venta
 */

// Carrito de compras
let cart = [];
let allProducts = [];

// Cargar productos disponibles
async function loadAvailableProducts() {
  try {
    const response = await ProductAPI.getAll();
    allProducts = response.data
      .filter(p => p.activo && p.stock > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Orden alfabético
    
    renderProductsGrid();
  } catch (error) {
    console.error('Error cargando productos:', error);
    showNotification('Error al cargar productos', 'error');
  }
}

// Renderizar grid de productos
function renderProductsGrid() {
  const grid = document.getElementById('productsGrid');
  
  if (allProducts.length === 0) {
    grid.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">No hay productos disponibles</p>';
    return;
  }
  
  const html = allProducts.map(p => `
    <div class="product-card" onclick="addToCart(${p.id}, '${p.codigo.replace(/'/g, "\\'")}')">
      <div style="color: var(--primary-color); font-size: 12px; margin-bottom: 4px;">
        ${p.codigo}
      </div>
      <h4>${p.nombre}</h4>
      <div class="product-info">
        Stock: ${p.stock} ${p.unidad}
      </div>
      <div class="product-price">${formatCurrency(p.precio)}</div>
    </div>
  `).join('');
  
  grid.innerHTML = html;
}

// Búsqueda de productos
let searchTimeout;
const searchInput = document.getElementById('searchProduct');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  
  if (query.length < 2) {
    searchResults.classList.remove('active');
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    await searchProducts(query);
  }, 300);
});

// Cerrar resultados al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-section')) {
    searchResults.classList.remove('active');
  }
});

// Buscar productos
async function searchProducts(query) {
  try {
    const response = await ProductAPI.search(query);
    const products = response.data;
    
    if (products.length === 0) {
      searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: #9ca3af;">No se encontraron productos</div>';
      searchResults.classList.add('active');
      return;
    }
    
    const html = products.map(p => `
      <div class="search-result-item" onclick="addToCart(${p.id}, '${p.codigo.replace(/'/g, "\\'")}')">
        <div>
          <span class="product-code">${p.codigo}</span> - ${p.nombre}
        </div>
        <div class="product-stock">
          Stock: ${p.stock} ${p.unidad} | ${formatCurrency(p.precio)}
        </div>
      </div>
    `).join('');
    
    searchResults.innerHTML = html;
    searchResults.classList.add('active');
    
  } catch (error) {
    console.error('Error buscando productos:', error);
  }
}

// Agregar producto al carrito
async function addToCart(productId, productCode) {
  try {
    // Cerrar resultados de búsqueda
    searchResults.classList.remove('active');
    searchInput.value = '';
    
    // Obtener producto
    const response = await ProductAPI.getById(productId);
    const product = response.data;
    
    // Verificar si ya está en el carrito
    const existingItem = cart.find(item => item.id_producto === productId);
    
    if (existingItem) {
      // Incrementar cantidad
      existingItem.cantidad++;
      updateCart();
      showNotification(`${product.nombre} agregado (${existingItem.cantidad})`, 'success');
      return;
    }
    
    // Agregar nuevo item
    cart.push({
      id_producto: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      unidad: product.unidad,
      cantidad: 1,
      precio_unitario: product.precio,
      precio_original: product.precio,
      stock: product.stock
    });
    
    updateCart();
    
    // Actualizar la lista de productos disponibles
    loadAvailableProducts();
    
    showNotification(`${product.nombre} agregado al carrito`, 'success');
    
  } catch (error) {
    console.error('Error agregando producto:', error);
    showNotification('Error al agregar producto', 'error');
  }
}

// Actualizar carrito
function updateCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const btnPreview = document.getElementById('btnPreview');
  const btnComplete = document.getElementById('btnComplete');
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <p>🛒 El carrito está vacío</p>
        <small>Agrega productos para iniciar la venta</small>
      </div>
    `;
    btnPreview.disabled = true;
    btnComplete.disabled = true;
    updateTotals();
    return;
  }
  
  btnPreview.disabled = false;
  btnComplete.disabled = false;
  
  const html = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-header">
        <div class="cart-item-name">
          ${item.nombre}
          <br><small style="color: #6b7280;">${item.codigo}</small>
        </div>
        <button class="btn-remove" onclick="removeFromCart(${index})">✕</button>
      </div>
      <div class="cart-item-details">
        <div class="quantity-control">
          <button class="btn-qty" onclick="decreaseQuantity(${index})">−</button>
          <input 
            type="number" 
            class="qty-input" 
            value="${item.cantidad}" 
            onchange="updateQuantity(${index}, this.value)"
            min="0.01"
            step="${item.unidad === 'unidad' || item.unidad === 'docena' ? '1' : '0.01'}"
          >
          <button class="btn-qty" onclick="increaseQuantity(${index})">+</button>
        </div>
        <span>${item.unidad}</span>
        <span>×</span>
        <span onclick="changePrice(${index})" style="cursor: pointer; text-decoration: underline;">
          ${formatCurrency(item.precio_unitario)}
          ${item.precio_especial ? '<span class="price-special-badge">Especial</span>' : ''}
        </span>
      </div>
      <div style="text-align: right; margin-top: 8px;">
        <span class="item-subtotal">${formatCurrency(item.cantidad * item.precio_unitario)}</span>
      </div>
    </div>
  `).join('');
  
  cartItemsContainer.innerHTML = html;
  updateTotals();
}

// Actualizar totales
function updateTotals() {
  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
  }, 0);
  
  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('total').textContent = formatCurrency(subtotal);
  
  console.log('Carrito actualizado:', cart);
  console.log('Total calculado:', subtotal);
}

// Aumentar cantidad
function increaseQuantity(index) {
  const item = cart[index];
  const increment = (item.unidad === 'unidad' || item.unidad === 'docena') ? 1 : 0.5;
  cart[index].cantidad += increment;
  updateCart();
}

// Disminuir cantidad
function decreaseQuantity(index) {
  const item = cart[index];
  const decrement = (item.unidad === 'unidad' || item.unidad === 'docena') ? 1 : 0.5;
  
  if (item.cantidad - decrement <= 0) {
    if (confirm('¿Eliminar este producto del carrito?')) {
      removeFromCart(index);
    }
    return;
  }
  
  cart[index].cantidad -= decrement;
  updateCart();
}

// Actualizar cantidad manualmente
function updateQuantity(index, value) {
  const cantidad = parseFloat(value);
  
  if (isNaN(cantidad) || cantidad <= 0) {
    showNotification('Cantidad inválida', 'error');
    updateCart();
    return;
  }
  
  cart[index].cantidad = cantidad;
  updateCart();
}

// Cambiar precio (precio especial)
function changePrice(index) {
  const item = cart[index];
  const newPrice = prompt(
    `Precio actual: ${formatCurrency(item.precio_unitario)}\nPrecio original: ${formatCurrency(item.precio_original)}\n\nIngresa el nuevo precio:`,
    item.precio_unitario
  );
  
  if (newPrice === null) return;
  
  const price = parseFloat(newPrice);
  
  if (isNaN(price) || price <= 0) {
    showNotification('Precio inválido', 'error');
    return;
  }
  
  cart[index].precio_unitario = price;
  cart[index].precio_especial = price !== item.precio_original;
  updateCart();
  showNotification('Precio actualizado', 'success');
}

// Eliminar del carrito
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
  showNotification('Producto eliminado', 'success');
}

// Limpiar carrito
function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('¿Estás seguro de limpiar todo el carrito?')) {
    cart = [];
    updateCart();
    showNotification('Carrito limpiado', 'success');
  }
}

// Vista previa de la venta
async function previewSale() {
  if (cart.length === 0) return;
  
  try {
    const items = cart.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_especial: item.precio_especial ? item.precio_unitario : undefined
    }));
    
    const response = await SaleAPI.preview(items);
    const preview = response.data;
    
    const itemsHtml = preview.items.map(item => `
      <tr>
        <td>${item.nombre}</td>
        <td>${formatQuantity(item.cantidad, item.unidad)}</td>
        <td>${formatCurrency(item.precio_unitario)}${item.precio_especial ? ' <span style="color: #f59e0b;">★</span>' : ''}</td>
        <td><strong>${formatCurrency(item.subtotal)}</strong></td>
      </tr>
    `).join('');
    
    const content = `
      <table style="width: 100%; margin-bottom: 20px;">
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
      <div style="text-align: right; font-size: 20px; margin-top: 20px;">
        <strong>TOTAL: ${formatCurrency(preview.total)}</strong>
      </div>
      <div style="margin-top: 20px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
        <small>
          ${preview.cantidad_productos} productos diferentes<br>
          ${preview.cantidad_items} items en total
        </small>
      </div>
    `;
    
    showModal('Vista Previa de Venta', content);
    
  } catch (error) {
    console.error('Error en preview:', error);
    showNotification('Error al generar vista previa', 'error');
  }
}

// Completar venta
async function completeSale() {
  if (cart.length === 0) return;
  
  if (!confirm('¿Confirmar la venta?')) return;
  
  const btnComplete = document.getElementById('btnComplete');
  btnComplete.disabled = true;
  btnComplete.textContent = 'Procesando...';
  
  try {
    const items = cart.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_especial: item.precio_especial ? item.precio_unitario : undefined
    }));
    
    const response = await SaleAPI.create({ items });
    const sale = response.data;
    
    showNotification('¡Venta realizada con éxito!', 'success');
    
    // Preguntar si quiere descargar PDF
    if (confirm('Venta registrada correctamente. ¿Descargar boleta en PDF?')) {
      SaleAPI.downloadPDF(sale.id);
    }
    
    // Limpiar carrito
    cart = [];
    updateCart();
    
  } catch (error) {
    console.error('Error completando venta:', error);
    
    if (error.message.includes('Stock insuficiente')) {
      showNotification('Stock insuficiente para algunos productos', 'error');
    } else {
      showNotification('Error al procesar la venta', 'error');
    }
  } finally {
    btnComplete.disabled = false;
    btnComplete.textContent = '✅ Completar Venta';
  }
}

// Inicializar POS
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  
  // Cargar productos disponibles
  loadAvailableProducts();
  
  // Enfocar búsqueda
  searchInput.focus();
});