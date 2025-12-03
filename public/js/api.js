/**
 * api.js
 * Cliente para llamadas a la API
 */

// Obtener token del localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Headers por defecto
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Manejar respuesta de la API
async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    // Si el token expiró, redirigir al login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Sesión expirada');
    }
    
    throw new Error(data.error || data.message || 'Error en la petición');
  }
  
  return data;
}

// API de Productos
const ProductAPI = {
  // Obtener todos los productos
  getAll: async (includeInactive = false) => {
    const url = `${API_URL}/products${includeInactive ? '?includeInactive=true' : ''}`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Buscar producto por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/products/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Buscar producto por código
  getByCodigo: async (codigo) => {
    const response = await fetch(`${API_URL}/products/codigo/${codigo}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Buscar productos por nombre
  search: async (query) => {
    const response = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Crear producto
  create: async (productData) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(response);
  },
  
  // Actualizar producto
  update: async (id, productData) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(response);
  },
  
  // Eliminar producto
  delete: async (id, permanent = false) => {
    const url = `${API_URL}/products/${id}${permanent ? '?permanent=true' : ''}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  
  // Productos con stock bajo
  getLowStock: async (min = 10) => {
    const response = await fetch(`${API_URL}/products/low-stock?min=${min}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};

// API de Ventas
const SaleAPI = {
  // Obtener todas las ventas
  getAll: async (limit = 100, offset = 0) => {
    const response = await fetch(`${API_URL}/sales?limit=${limit}&offset=${offset}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Obtener venta por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/sales/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Ventas del día
  getToday: async () => {
    const response = await fetch(`${API_URL}/sales/today`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Estadísticas
  getStats: async () => {
    const response = await fetch(`${API_URL}/sales/stats`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Preview de venta
  preview: async (items) => {
    const response = await fetch(`${API_URL}/sales/preview`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items })
    });
    return handleResponse(response);
  },
  
  // Crear venta
  create: async (saleData) => {
    const response = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(saleData)
    });
    return handleResponse(response);
  },
  
  // Descargar PDF
  downloadPDF: async (id) => {
    try {
      const token = getToken();
      const url = `${API_URL}/sales/${id}/pdf`;
      
      // Crear un enlace temporal y hacer clic
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boleta_${id}.pdf`);
      
      // Agregar headers de autenticación
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error descargando PDF:', error);
        throw error;
      });
      
    } catch (error) {
      console.error('Error en downloadPDF:', error);
      throw error;
    }
  },
  
  // Productos más vendidos
  getTopProducts: async (limit = 10) => {
    const response = await fetch(`${API_URL}/sales/top-products?limit=${limit}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};

// API de Usuarios
const UserAPI = {
  // Obtener todos los usuarios
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    return handleResponse(response);
  },
  
  // Crear usuario
  create: async (userData) => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },
  
  // Actualizar usuario
  update: async (id, userData) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },
  
  // Desactivar usuario
  deactivate: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// API de Autenticación
const AuthAPI = {
  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(response);
  },
  
  // Obtener perfil
  getProfile: async () => {
    const response = await fetch(`${API_URL}/auth/profile`, { headers: getHeaders() });
    return handleResponse(response);
  }
};