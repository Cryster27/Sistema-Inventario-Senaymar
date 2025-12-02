/**
 * usuarios.js
 * Lógica de gestión de usuarios (solo admin)
 */

let allUsers = [];
let editingUserId = null;

// Verificar que sea admin
if (!isAdmin()) {
  alert('No tienes permisos para acceder a esta página');
  window.location.href = '/dashboard.html';
}

// Cargar usuarios
async function loadUsers() {
  try {
    const response = await UserAPI.getAll();
    allUsers = response.data;
    renderUsers(allUsers);
    updateUserCount();
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    showNotification('Error al cargar usuarios', 'error');
  }
}

// Renderizar tabla
function renderUsers(users) {
  const container = document.getElementById('usersTable');
  const currentUser = getCurrentUser();
  
  if (users.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No hay usuarios registrados</p>';
    return;
  }
  
  const roleLabels = {
    admin: 'Administrador',
    cajero: 'Cajero',
    vendedor: 'Vendedor'
  };
  
  const html = `
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Último Acceso</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr ${!u.activo ? 'style="opacity: 0.5; background: #f9fafb;"' : ''}>
            <td><strong>${u.username}</strong></td>
            <td>${u.nombre_completo}</td>
            <td>${u.email || '-'}</td>
            <td><span class="role-badge role-${u.rol}">${roleLabels[u.rol]}</span></td>
            <td class="last-access">
              ${u.ultimo_acceso ? formatDate(u.ultimo_acceso) : 'Nunca'}
            </td>
            <td>
              ${u.activo 
                ? '<span class="badge badge-success">Activo</span>' 
                : '<span class="badge badge-danger">Inactivo</span>'}
            </td>
            <td>
              <div class="table-actions">
                ${currentUser.id !== u.id ? `
                  <button class="btn btn-primary btn-sm" onclick="editUser(${u.id})">✏️ Editar</button>
                  <button class="btn btn-secondary btn-sm" onclick="showPasswordModal(${u.id}, '${u.username.replace(/'/g, "\\'")}')">🔑 Contraseña</button>
                  ${u.activo 
                    ? `<button class="btn btn-danger btn-sm" onclick="deactivateUser(${u.id})">🚫 Desactivar</button>`
                    : `<button class="btn btn-success btn-sm" onclick="activateUser(${u.id})">✅ Activar</button>`
                  }
                ` : '<span class="text-muted">Tu usuario</span>'}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Actualizar contador
function updateUserCount() {
  const active = allUsers.filter(u => u.activo).length;
  document.getElementById('totalUsers').textContent = `${allUsers.length} usuarios (${active} activos)`;
}

// Mostrar modal crear
function showCreateModal() {
  editingUserId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('username').disabled = false;
  document.getElementById('password').required = true;
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('userModal').classList.add('active');
}

// Editar usuario
async function editUser(id) {
  try {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;
    
    editingUserId = id;
    document.getElementById('modalTitle').textContent = 'Editar Usuario';
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('username').disabled = true;
    document.getElementById('nombre_completo').value = user.nombre_completo;
    document.getElementById('email').value = user.email || '';
    document.getElementById('rol').value = user.rol;
    document.getElementById('password').required = false;
    document.getElementById('passwordGroup').style.display = 'none';
    
    document.getElementById('userModal').classList.add('active');
  } catch (error) {
    console.error('Error cargando usuario:', error);
    showNotification('Error al cargar usuario', 'error');
  }
}

// Cerrar modal
function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
  document.getElementById('username').disabled = false;
  editingUserId = null;
}

// Guardar usuario
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btnSave = document.getElementById('btnSave');
  btnSave.disabled = true;
  btnSave.textContent = 'Guardando...';
  
  try {
    const userData = {
      username: document.getElementById('username').value,
      nombre_completo: document.getElementById('nombre_completo').value,
      email: document.getElementById('email').value || null,
      rol: document.getElementById('rol').value
    };
    
    if (editingUserId) {
      // Actualizar
      await UserAPI.update(editingUserId, userData);
      showNotification('Usuario actualizado exitosamente', 'success');
    } else {
      // Crear
      userData.password = document.getElementById('password').value;
      await UserAPI.create(userData);
      showNotification('Usuario creado exitosamente', 'success');
    }
    
    closeUserModal();
    loadUsers();
    
  } catch (error) {
    console.error('Error guardando usuario:', error);
    showNotification(error.message || 'Error al guardar usuario', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Guardar Usuario';
  }
});

// Desactivar usuario
async function deactivateUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (!confirm(`¿Desactivar al usuario "${user.username}"?`)) return;
  
  try {
    await UserAPI.deactivate(id);
    showNotification('Usuario desactivado', 'success');
    loadUsers();
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    showNotification('Error al desactivar usuario', 'error');
  }
}

// Activar usuario
async function activateUser(id) {
  try {
    await UserAPI.update(id, { activo: true });
    showNotification('Usuario activado', 'success');
    loadUsers();
  } catch (error) {
    console.error('Error activando usuario:', error);
    showNotification('Error al activar usuario', 'error');
  }
}

// Modal cambiar contraseña
function showPasswordModal(id, username) {
  document.getElementById('passwordUserId').value = id;
  document.getElementById('passwordUserInfo').innerHTML = `
    <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">
      <strong>Usuario:</strong> ${username}<br>
      <small>Se cambiará la contraseña de este usuario</small>
    </div>
  `;
  document.getElementById('passwordForm').reset();
  document.getElementById('passwordModal').classList.add('active');
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.remove('active');
}

// Cambiar contraseña
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('passwordUserId').value;
  const newPassword = document.getElementById('newPassword').value;
  
  try {
    await fetch(`${API_URL}/users/${id}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword })
    }).then(handleResponse);
    
    showNotification('Contraseña actualizada exitosamente', 'success');
    closePasswordModal();
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    showNotification(error.message || 'Error al cambiar contraseña', 'error');
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
  loadUsers();
});