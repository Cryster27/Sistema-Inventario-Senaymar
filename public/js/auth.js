/**
 * auth.js
 * Funciones de autenticación y protección de rutas
 */

// Verificar si el usuario está autenticado
function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token && user;
}

// Proteger página (redirigir si no está autenticado)
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/';
    return false;
  }
  return true;
}

// Cerrar sesión
function logout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

// Mostrar información del usuario en el sidebar
function showUserInfo() {
  const user = getCurrentUser();
  if (!user) return;
  
  const userInfoElement = document.getElementById('userInfo');
  if (userInfoElement) {
    const rolLabels = {
      admin: 'Administrador',
      cajero: 'Cajero',
      vendedor: 'Vendedor'
    };
    
    userInfoElement.innerHTML = `
      <strong>${user.nombre_completo}</strong><br>
      <small>${rolLabels[user.rol] || user.rol}</small>
    `;
  }
}

// Mostrar/ocultar elementos según el rol
function updateUIByRole() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Mostrar opción de usuarios solo para admin
  const navUsuarios = document.getElementById('navUsuarios');
  if (navUsuarios && user.rol === 'admin') {
    navUsuarios.style.display = 'block';
  }
}

// Toggle sidebar en móvil
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}

// Mostrar fecha actual
function showCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const today = new Date().toLocaleDateString('es-PE', options);
    dateElement.textContent = today;
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación (excepto en login)
  if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
    if (!requireAuth()) return;
    showUserInfo();
    updateUIByRole();
    showCurrentDate();
  }
});