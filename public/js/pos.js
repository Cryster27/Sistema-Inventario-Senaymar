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

// Mostrar modal de confirmación de venta
function showConfirmSaleModal() {
  if (cart.length === 0) return;
  
  // Llenar información del cliente por defecto
  document.getElementById('clientDoc').value = '';
  document.getElementById('clientName').value = 'Usuario Final';
  document.getElementById('saleObservations').value = '';
  
  // Llenar items de la venta
  const itemsContainer = document.getElementById('confirmSaleItems');
  const itemsHtml = cart.map(item => `
    <div class="confirm-item">
      <div class="confirm-item-info">
        <div class="confirm-item-name">${item.nombre}</div>
        <div class="confirm-item-details">
          ${item.cantidad} ${item.unidad} × ${formatCurrency(item.precio_unitario)}
          ${item.precio_especial ? '<span style="color: #f59e0b;">★ Precio especial</span>' : ''}
        </div>
      </div>
      <div class="confirm-item-price">
        <div class="confirm-item-subtotal">${formatCurrency(item.cantidad * item.precio_unitario)}</div>
      </div>
    </div>
  `).join('');
  
  itemsContainer.innerHTML = itemsHtml;
  
  // Calcular totales
  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  document.getElementById('confirmSubtotal').textContent = formatCurrency(total);
  document.getElementById('confirmTotal').textContent = formatCurrency(total);
  
  // Mostrar modal
  document.getElementById('confirmSaleModal').classList.add('active');
}

// Cerrar modal de confirmación
function closeConfirmSaleModal() {
  const modal = document.getElementById('confirmSaleModal');
  modal.classList.add('closing');
  
  setTimeout(() => {
    modal.classList.remove('active');
    modal.classList.remove('closing');
  }, 200);
}

// Buscar cliente usando API real
async function searchClient() {
  const docInput = document.getElementById('clientDoc');
  const nameInput = document.getElementById('clientName');
  const btnSearch = document.getElementById('btnSearchClient');
  
  const docNumber = docInput.value.trim();
  
  if (!docNumber) {
    showNotification('Ingrese un DNI o RUC', 'error');
    return;
  }
  
  // Validar que solo sean números
  if (!/^\d+$/.test(docNumber)) {
    showNotification('El documento debe contener solo números', 'error');
    return;
  }
  
  // Validar longitud
  if (docNumber.length !== 8 && docNumber.length !== 11) {
    showNotification('DNI debe tener 8 dígitos o RUC 11 dígitos', 'error');
    return;
  }
  
  btnSearch.disabled = true;
  btnSearch.textContent = '🔍 Buscando...';
  nameInput.value = 'Consultando...';
  
  try {
    // Consultar documento usando la API
    const result = await consultarDocumento(docNumber);
    
    if (result.success) {
      nameInput.value = result.nombreCompleto;
      showNotification(`✅ Cliente encontrado: ${result.nombreCompleto}`, 'success');
      
      // Si es RUC, mostrar información adicional
      if (docNumber.length === 11 && result.direccion) {
        console.log('📍 Dirección:', result.direccion);
        console.log('📊 Estado:', result.estado);
        console.log('📋 Condición:', result.condicion);
      }
    } else {
      nameInput.value = 'Usuario Final';
      showNotification(`⚠️ ${result.error || 'No se encontró el documento'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error buscando cliente:', error);
    nameInput.value = 'Usuario Final';
    showNotification('❌ Error al buscar cliente. Intente nuevamente.', 'error');
  } finally {
    btnSearch.disabled = false;
    btnSearch.textContent = '🔍 Buscar';
  }
}

// Finalizar venta con toda la información
async function finalizeSale() {
  if (cart.length === 0) return;
  
  const btnFinalize = document.getElementById('btnFinalizeSale');
  btnFinalize.disabled = true;
  btnFinalize.textContent = '⏳ Procesando...';
  
  try {
    // Obtener datos del cliente
    const clientDoc = document.getElementById('clientDoc').value.trim();
    const clientName = document.getElementById('clientName').value.trim();
    const observations = document.getElementById('saleObservations').value.trim();
    
    // Preparar items
    const items = cart.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_especial: item.precio_especial ? item.precio_unitario : undefined
    }));
    
    // Preparar observaciones completas
    let finalObservations = '';
    if (clientDoc && clientName !== 'Usuario Final') {
      finalObservations += `Cliente: ${clientName} (${clientDoc})`;
    } else {
      finalObservations += 'Cliente: Usuario Final';
    }
    if (observations) {
      finalObservations += ` | ${observations}`;
    }
    
    // Crear la venta
    const response = await SaleAPI.create({ 
      items, 
      observaciones: finalObservations 
    });
    const sale = response.data;
    
    showNotification('✅ Venta registrada exitosamente', 'success');
    
    // Cerrar modal de confirmación
    closeConfirmSaleModal();
    
    // Generar y descargar PDF automáticamente
    setTimeout(() => {
      SaleAPI.downloadPDF(sale.id);
      showNotification('📄 Descargando comprobante...', 'success');
      
      // Intentar imprimir (abrirá el diálogo de impresión del navegador)
      setTimeout(() => {
        printReceipt(sale.id);
      }, 1000);
    }, 500);
    
    // Limpiar carrito
    cart = [];
    updateCart();
    
    // Recargar productos disponibles
    loadAvailableProducts();
    
  } catch (error) {
    console.error('Error finalizando venta:', error);
    
    if (error.message && error.message.includes('Stock insuficiente')) {
      showNotification('❌ Stock insuficiente para algunos productos', 'error');
    } else {
      showNotification('❌ Error al procesar la venta', 'error');
    }
  } finally {
    btnFinalize.disabled = false;
    btnFinalize.textContent = '🧾 Finalizar Venta';
  }
}

// Función para imprimir (abre ventana de vista previa)
async function printReceipt(saleId) {
  try {
    const token = getToken();
    
    showNotification('🖨️ Generando vista previa para impresión...', 'info');
    
    // Obtener el PDF como blob
    const response = await fetch(`${API_URL}/sales/${saleId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener el PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Abrir en nueva ventana para vista previa e impresión
    const printWindow = window.open(url, '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      showNotification('⚠️ Por favor habilite ventanas emergentes', 'error');
      // Si no se puede abrir ventana, descargar directamente
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleta_${saleId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    
    // Esperar a que cargue y luego mostrar diálogo de impresión
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    });
    
    showNotification('✅ Ventana de impresión abierta', 'success');
    
  } catch (error) {
    console.error('Error abriendo vista previa:', error);
    showNotification('❌ Error al abrir vista previa. El PDF se descargó.', 'error');
  }
}

// Completar venta (mantener función antigua por compatibilidad, pero ahora abre el modal)
async function completeSale() {
  showConfirmSaleModal();
}

// Inicializar POS
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  
  // Cargar productos disponibles
  loadAvailableProducts();
  
  // Enfocar búsqueda
  searchInput.focus();
  
  // Agregar listener para Enter en campo de DNI/RUC
  const clientDocInput = document.getElementById('clientDoc');
  if (clientDocInput) {
    clientDocInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchClient();
      }
    });
    
    // Auto-buscar cuando complete 8 u 11 dígitos
    clientDocInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length === 8 || value.length === 11) {
        // Esperar un poco por si sigue escribiendo
        clearTimeout(clientDocInput.autoSearchTimeout);
        clientDocInput.autoSearchTimeout = setTimeout(() => {
          searchClient();
        }, 500);
      }
    });
  }
});