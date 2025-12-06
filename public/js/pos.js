/**
 * pos.js
 * Lógica del Punto de Venta - COMPLETO CON TODAS LAS FUNCIONES
 */

// Carrito de compras
let cart = [];
let allProducts = [];

// ========================================
// FUNCIONES DE UTILIDAD (FALTABAN ESTAS)
// ========================================

/**
 * Mostrar notificación temporal
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 15px;
    font-weight: 600;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Agregar animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100px); }
    }
  `;
  if (!document.getElementById('notification-styles')) {
    style.id = 'notification-styles';
    document.head.appendChild(style);
  }
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Mostrar modal simple
 */
function showModal(title, content) {
  let modal = document.getElementById('simpleModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'simpleModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(3px);
    `;
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; max-width: 800px; width: 90%; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 70px rgba(0,0,0,0.4);">
      <div style="padding: 24px; border-bottom: 3px solid #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 20px;">${title}</h2>
        <button onclick="closeSimpleModal()" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; color: white; cursor: pointer; padding: 4px 12px; border-radius: 8px;">×</button>
      </div>
      <div style="padding: 24px; overflow-y: auto; max-height: calc(90vh - 100px);">
        ${content}
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

/**
 * Cerrar modal simple
 */
function closeSimpleModal() {
  const modal = document.getElementById('simpleModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ========================================
// FUNCIONES DEL POS
// ========================================

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
      <div class="product-info">Stock: ${p.stock} ${p.unidad}</div>
      <div class="product-price">${formatCurrency(p.precio)}</div>
    </div>
  `).join('');
  
  grid.innerHTML = html;
}

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
        <div><span class="product-code">${p.codigo}</span> - ${p.nombre}</div>
        <div class="product-stock">Stock: ${p.stock} ${p.unidad} | ${formatCurrency(p.precio)}</div>
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
          <input type="number" class="qty-input" value="${item.cantidad}" 
            onchange="updateQuantity(${index}, this.value)" min="0.01"
            step="${item.unidad === 'unidad' || item.unidad === 'docena' ? '1' : '0.01'}">
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
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align: right; font-size: 20px; margin-top: 20px;">
        <strong>TOTAL: ${formatCurrency(preview.total)}</strong>
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
  document.getElementById('paymentMethod').value = 'efectivo'; // AGREGAR ESTA LÍNEA
  
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
  
  // CALCULAR IGV - AGREGAR ESTAS LÍNEAS
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  
  document.getElementById('confirmSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('confirmIGV').textContent = formatCurrency(igv);
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
    } else {
      nameInput.value = 'Usuario Final';
      showNotification(`⚠️ ${result.error || 'No se encontró el documento'}`, 'error');
    }
    
  } catch (error) {
    console.error('Error buscando cliente:', error);
    nameInput.value = 'Usuario Final';
    showNotification('❌ Error al buscar cliente', 'error');
  } finally {
    btnSearch.disabled = false;
    btnSearch.textContent = '🔍 Buscar';
  }
}

// ========================================
// FINALIZAR VENTA Y ABRIR PDF
// ========================================

async function finalizeSale() {
  console.log('🚀 Iniciando finalización de venta');
  
  if (cart.length === 0) {
    console.log('❌ Carrito vacío');
    return;
  }
  
  const btnFinalize = document.getElementById('btnFinalizeSale');
  btnFinalize.disabled = true;
  btnFinalize.textContent = '⏳ Procesando...';
  
  try {
    const clientDoc = document.getElementById('clientDoc').value.trim();
    const clientName = document.getElementById('clientName').value.trim();
    const observations = document.getElementById('saleObservations').value.trim();
    
    // ✅ VERIFICAR QUE ESTA LÍNEA ESTÉ CORRECTA
    const metodoPago = document.getElementById('paymentMethod').value;
    
    console.log('📋 Método de pago seleccionado:', metodoPago); // DEBUG
    
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
    
    console.log('📡 Enviando venta al servidor...');
    console.log('Datos a enviar:', { items, observaciones: finalObservations, metodo_pago: metodoPago }); // DEBUG
    
    // ✅ VERIFICAR QUE SE ENVÍE metodo_pago
    const response = await SaleAPI.create({ 
      items, 
      observaciones: finalObservations,
      metodo_pago: metodoPago
    });
    const sale = response.data;
    
    console.log('✅ Venta creada:', sale); // DEBUG
    
    showNotification('✅ Venta registrada exitosamente', 'success');
    closeConfirmSaleModal();
    
    cart = [];
    updateCart();
    loadAvailableProducts();
    
    console.log('📄 Abriendo visor de PDF...');
    setTimeout(() => {
      openPDFViewer(sale.id);
    }, 500);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    
    if (error.message && error.message.includes('Stock insuficiente')) {
      showNotification('❌ Stock insuficiente', 'error');
    } else {
      showNotification('❌ Error: ' + error.message, 'error');
    }
  } finally {
    btnFinalize.disabled = false;
    btnFinalize.textContent = '🧾 Finalizar Venta';
  }
}

async function openPDFViewer(saleId) {
  console.log('========================================');
  console.log('📄 ABRIENDO PDF - ID:', saleId);
  console.log('========================================');
  
  try {
    const token = getToken();
    const url = `${API_URL}/sales/${saleId}/pdf`;
    
    console.log('URL:', url);
    console.log('Token:', token ? 'OK' : 'FALTA');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    });
    
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor:', errorText);
      throw new Error(`Error ${response.status}`);
    }
    
    const pdfBlob = await response.blob();
    console.log('Blob size:', pdfBlob.size, 'bytes');
    
    if (pdfBlob.size === 0) {
      throw new Error('PDF vacío');
    }
    
    const pdfUrl = URL.createObjectURL(pdfBlob);
    console.log('Blob URL:', pdfUrl);
    
    // Calcular posición centrada
    const width = 900;
    const height = 700;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    // Abrir ventana centrada
    const ventana = window.open('', '_blank', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`);
    
    if (!ventana) {
      console.error('Ventana bloqueada');
      showNotification('⚠️ Habilite ventanas emergentes', 'error');
      
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `boleta_${saleId}.pdf`;
      link.click();
      URL.revokeObjectURL(pdfUrl);
      return;
    }
    
    console.log('✅ Ventana abierta, escribiendo HTML...');
    
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta #${saleId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .header h2 {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }
          
          .header-actions {
            display: flex;
            gap: 8px;
          }
          
          .btn {
            background: white;
            color: #10b981;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .btn:hover {
            background: #f0fdf4;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .btn:active {
            transform: translateY(0);
          }
          
          .pdf-container {
            width: 100%;
            height: calc(100vh - 48px);
            background: #e5e7eb;
          }
          
          embed {
            width: 100%;
            height: 100%;
            border: none;
          }
          
          @media print {
            .header {
              display: none;
            }
            .pdf-container {
              height: 100vh;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🧾 Boleta de Venta #${saleId}</h2>
          <div class="header-actions">
            <button class="btn" onclick="window.print()" title="Imprimir">
              🖨️ Imprimir
            </button>
            <button class="btn" onclick="descargar()" title="Descargar">
              📥 Descargar
            </button>
            <button class="btn" onclick="window.close()" title="Cerrar">
              ✕ Cerrar
            </button>
          </div>
        </div>
        <div class="pdf-container">
          <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%" />
        </div>
        <script>
          function descargar() {
            const link = document.createElement('a');
            link.href = '${pdfUrl}';
            link.download = 'boleta_${saleId}.pdf';
            link.click();
          }
          
          // Cerrar con Escape
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              window.close();
            }
          });
          
          console.log('✅ PDF cargado correctamente');
        </script>
      </body>
      </html>
    `);
    
    ventana.document.close();
    
    console.log('✅ PDF ABIERTO CORRECTAMENTE');
    console.log('========================================');
    
    showNotification('✅ Boleta abierta', 'success');
    
  } catch (error) {
    console.error('❌ ERROR AL ABRIR PDF:', error);
    showNotification('❌ Error al abrir PDF: ' + error.message, 'error');
    
    try {
      SaleAPI.downloadPDF(saleId);
      showNotification('📥 Descargando PDF...', 'info');
    } catch (e) {
      console.error('Fallback falló:', e);
    }
  }
}

async function completeSale() {
  showConfirmSaleModal();
}

// Inicializar POS
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  
  console.log('✅ POS Inicializado');
  console.log('API URL:', API_URL);
  
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