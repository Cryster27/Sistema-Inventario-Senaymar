/**
 * pos.js
 * Lógica del Punto de Venta - VISOR PDF CORREGIDO
 */

// Carrito de compras
let cart = [];
let allProducts = [];

// [... Todo el código anterior se mantiene igual hasta finalizeSale ...]

// Cargar productos disponibles
async function loadAvailableProducts() {
  try {
    const response = await ProductAPI.getAll();
    allProducts = response.data
      .filter(p => p.activo && p.stock > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
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

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-section')) {
    searchResults.classList.remove('active');
  }
});

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

async function addToCart(productId, productCode) {
  try {
    searchResults.classList.remove('active');
    searchInput.value = '';
    
    const response = await ProductAPI.getById(productId);
    const product = response.data;
    
    const existingItem = cart.find(item => item.id_producto === productId);
    
    if (existingItem) {
      existingItem.cantidad++;
      updateCart();
      showNotification(`${product.nombre} agregado (${existingItem.cantidad})`, 'success');
      return;
    }
    
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
    loadAvailableProducts();
    showNotification(`${product.nombre} agregado al carrito`, 'success');
    
  } catch (error) {
    console.error('Error agregando producto:', error);
    showNotification('Error al agregar producto', 'error');
  }
}

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

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario));
  }, 0);
  
  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('total').textContent = formatCurrency(subtotal);
}

function increaseQuantity(index) {
  const item = cart[index];
  const increment = (item.unidad === 'unidad' || item.unidad === 'docena') ? 1 : 0.5;
  cart[index].cantidad += increment;
  updateCart();
}

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

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
  showNotification('Producto eliminado', 'success');
}

function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('¿Estás seguro de limpiar todo el carrito?')) {
    cart = [];
    updateCart();
    showNotification('Carrito limpiado', 'success');
  }
}

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

function showConfirmSaleModal() {
  if (cart.length === 0) return;
  
  document.getElementById('clientDoc').value = '';
  document.getElementById('clientName').value = 'Usuario Final';
  document.getElementById('saleObservations').value = '';
  
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
  
  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  document.getElementById('confirmSubtotal').textContent = formatCurrency(total);
  document.getElementById('confirmTotal').textContent = formatCurrency(total);
  
  document.getElementById('confirmSaleModal').classList.add('active');
}

function closeConfirmSaleModal() {
  const modal = document.getElementById('confirmSaleModal');
  modal.classList.add('closing');
  
  setTimeout(() => {
    modal.classList.remove('active');
    modal.classList.remove('closing');
  }, 200);
}

async function searchClient() {
  const docInput = document.getElementById('clientDoc');
  const nameInput = document.getElementById('clientName');
  const btnSearch = document.getElementById('btnSearchClient');
  
  const docNumber = docInput.value.trim();
  
  if (!docNumber) {
    showNotification('Ingrese un DNI o RUC', 'error');
    return;
  }
  
  if (!/^\d+$/.test(docNumber)) {
    showNotification('El documento debe contener solo números', 'error');
    return;
  }
  
  if (docNumber.length !== 8 && docNumber.length !== 11) {
    showNotification('DNI debe tener 8 dígitos o RUC 11 dígitos', 'error');
    return;
  }
  
  btnSearch.disabled = true;
  btnSearch.textContent = '🔍 Buscando...';
  nameInput.value = 'Consultando...';
  
  try {
    const result = await consultarDocumento(docNumber);
    
    if (result.success) {
      nameInput.value = result.nombreCompleto;
      showNotification(`✅ Cliente encontrado: ${result.nombreCompleto}`, 'success');
      
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

// ========================================
// FINALIZAR VENTA - VISOR PDF CORREGIDO
// ========================================

async function finalizeSale() {
  if (cart.length === 0) return;
  
  const btnFinalize = document.getElementById('btnFinalizeSale');
  btnFinalize.disabled = true;
  btnFinalize.textContent = '⏳ Procesando...';
  
  try {
    const clientDoc = document.getElementById('clientDoc').value.trim();
    const clientName = document.getElementById('clientName').value.trim();
    const observations = document.getElementById('saleObservations').value.trim();
    
    const items = cart.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_especial: item.precio_especial ? item.precio_unitario : undefined
    }));
    
    let finalObservations = '';
    if (clientDoc && clientName !== 'Usuario Final') {
      finalObservations += `Cliente: ${clientName} (${clientDoc})`;
    } else {
      finalObservations += 'Cliente: Usuario Final';
    }
    if (observations) {
      finalObservations += ` | ${observations}`;
    }
    
    const response = await SaleAPI.create({ 
      items, 
      observaciones: finalObservations 
    });
    const sale = response.data;
    
    showNotification('✅ Venta registrada exitosamente', 'success');
    closeConfirmSaleModal();
    
    cart = [];
    updateCart();
    loadAvailableProducts();
    
    // ========================================
    // ABRIR PDF EN VENTANA EMERGENTE
    // ========================================
    setTimeout(() => {
      openPDFViewer(sale.id);
    }, 500);
    
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

/**
 * Abrir el PDF del servidor en una ventana emergente
 * Igual que en ventas.js pero con visor integrado
 */
async function openPDFViewer(saleId) {
  try {
    const token = getToken();
    
    showNotification('📄 Generando boleta...', 'info');
    
    // Obtener el PDF como blob desde el servidor
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
    const pdfUrl = URL.createObjectURL(blob);
    
    // Abrir ventana emergente con el visor
    const ventana = window.open('', '_blank', 'width=900,height=700,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes');
    
    if (!ventana) {
      showNotification('⚠️ Por favor habilite ventanas emergentes', 'error');
      
      // Fallback: descargar directamente
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `boleta_${saleId}.pdf`;
      link.click();
      URL.revokeObjectURL(pdfUrl);
      return;
    }
    
    // Escribir HTML del visor en la ventana
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta de Venta #${saleId} - Semaymar E.I.R.L.</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header h1 {
            font-size: 22px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .header-actions {
            display: flex;
            gap: 12px;
          }
          
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .btn-primary {
            background: white;
            color: #10b981;
          }
          
          .btn-primary:hover {
            background: #f0fdf4;
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          }
          
          .btn-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
          }
          
          .btn-secondary:hover {
            background: rgba(255,255,255,0.35);
            border-color: rgba(255,255,255,0.5);
          }
          
          .btn:active {
            transform: translateY(0);
          }
          
          .pdf-container {
            flex: 1;
            padding: 0;
            background: #e5e7eb;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          embed {
            width: 100%;
            height: 100%;
            border: none;
          }
          
          .footer {
            background: white;
            padding: 16px 30px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
          }
          
          @media print {
            .header, .footer {
              display: none;
            }
            .pdf-container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧾 Boleta de Venta #${saleId}</h1>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="window.print()">
              🖨️ Imprimir
            </button>
            <button class="btn btn-primary" onclick="descargarPDF()">
              📥 Descargar
            </button>
            <button class="btn btn-secondary" onclick="window.close()">
              ✕ Cerrar
            </button>
          </div>
        </div>
        
        <div class="pdf-container">
          <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%" />
        </div>
        
        <div class="footer">
          📄 Boleta generada automáticamente - Semaymar E.I.R.L. - ${new Date().toLocaleString('es-PE')}
        </div>
        
        <script>
          function descargarPDF() {
            const link = document.createElement('a');
            link.href = "${pdfUrl}";
            link.download = "boleta_${saleId}.pdf";
            link.click();
          }
          
          // Auto-imprimir al cargar (opcional)
          // window.addEventListener('load', () => {
          //   setTimeout(() => window.print(), 1000);
          // });
        </script>
      </body>
      </html>
    `);
    
    ventana.document.close();
    
    showNotification('✅ Boleta abierta en nueva ventana', 'success');
    
  } catch (error) {
    console.error('Error abriendo visor de PDF:', error);
    showNotification('❌ Error al abrir visor de PDF', 'error');
    
    // Fallback: descargar usando la API directamente
    SaleAPI.downloadPDF(saleId);
  }
}

async function completeSale() {
  showConfirmSaleModal();
}

// Inicializar POS
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  
  loadAvailableProducts();
  searchInput.focus();
  
  const clientDocInput = document.getElementById('clientDoc');
  if (clientDocInput) {
    clientDocInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchClient();
      }
    });
    
    clientDocInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length === 8 || value.length === 11) {
        clearTimeout(clientDocInput.autoSearchTimeout);
        clientDocInput.autoSearchTimeout = setTimeout(() => {
          searchClient();
        }, 500);
      }
    });
  }
});